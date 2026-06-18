/**
 * Pure salary-calculation logic for a 4-weekly (13-period) UK pay cycle.
 * No React imports here — everything is a plain function so it can be unit-tested.
 *
 * Method: per-period thresholds (non-cumulative). Each annual threshold is scaled
 * by PERIOD_FRACTION (4/52) and applied to a single 4-weekly period. This is how
 * NI and Student Loan genuinely work each period, and approximates Week1/Month1 PAYE.
 */

import {
  DEFAULT_TAX_CODE,
  INCOME_TAX,
  NATIONAL_INSURANCE,
  PERIOD_FRACTION,
  PERIODS_PER_YEAR,
  STUDENT_LOANS,
  type StudentLoanPlan,
} from './taxConfig';

export interface WeekTime {
  hours: number;
  minutes: number;
}

export interface SalaryInput {
  /** Hours/minutes worked for each of the 4 weeks in the pay period. */
  weeks: WeekTime[];
  /** Pay rate per hour, in £. */
  hourlyRate: number;
  /** Tax code, e.g. "1257L". Used to derive the personal allowance. */
  taxCode: string;
  /** Selected student loan plan, or 'none'. */
  studentLoanPlan: StudentLoanPlan;
  /** Pension contribution as a percentage of gross (e.g. 5 means 5%). */
  pensionRate: number;
  /** If true, pension is via salary sacrifice and also reduces NI / student-loan earnings. */
  salarySacrifice: boolean;
}

export interface AnnualisedTotals {
  gross: number;
  pension: number;
  incomeTax: number;
  nationalInsurance: number;
  studentLoan: number;
  net: number;
}

export interface SalaryBreakdown {
  /** Total decimal hours across the 4 weeks. */
  totalHours: number;
  /** Gross pay for the 4-week period. */
  gross: number;
  /** Pension contribution for the period. */
  pension: number;
  /** Pay subject to income tax (gross minus pension). */
  taxablePay: number;
  /** Income tax for the period. */
  incomeTax: number;
  /** Employee National Insurance for the period. */
  nationalInsurance: number;
  /** Student loan repayment for the period. */
  studentLoan: number;
  /** Take-home pay for the period. */
  net: number;
  /** The same figures multiplied up to a full year (x13). */
  annual: AnnualisedTotals;
}

/** Convert hours + minutes into decimal hours (e.g. 32h 19m -> 32.3167). */
export function timeToDecimalHours({ hours, minutes }: WeekTime): number {
  const h = Number.isFinite(hours) ? hours : 0;
  const m = Number.isFinite(minutes) ? minutes : 0;
  return Math.max(0, h) + Math.max(0, m) / 60;
}

/**
 * Derive the annual personal allowance from a tax code.
 * Standard numeric codes encode allowance/10 (e.g. 1257L -> £12,570).
 * Unrecognised codes (K/BR/D0/NT etc.) fall back to the default code.
 */
export function parseTaxCode(taxCode: string): number {
  const match = String(taxCode).trim().match(/^(\d{1,5})[A-Za-z]?$/);
  if (match) {
    return Number(match[1]) * 10;
  }
  const fallback = DEFAULT_TAX_CODE.match(/^(\d{1,5})/);
  return fallback ? Number(fallback[1]) * 10 : INCOME_TAX.personalAllowance;
}

/**
 * Income tax for one period.
 * @param taxablePay  pay subject to tax this period (gross minus any pre-tax pension)
 * @param annualAllowance  the annual personal allowance from the tax code
 */
export function calculateIncomeTax(taxablePay: number, annualAllowance: number): number {
  if (taxablePay <= 0) return 0;

  // Scale the allowance to one period, then apply the >£100k taper (period-scaled).
  let periodAllowance = annualAllowance * PERIOD_FRACTION;
  const periodTaper = INCOME_TAX.taperThreshold * PERIOD_FRACTION;
  if (taxablePay > periodTaper) {
    periodAllowance = Math.max(0, periodAllowance - (taxablePay - periodTaper) / 2);
  }

  const incomeAboveAllowance = Math.max(0, taxablePay - periodAllowance);
  if (incomeAboveAllowance === 0) return 0;

  let tax = 0;
  let lower = 0;
  for (const band of INCOME_TAX.bands) {
    const cap = band.upTo === Infinity ? Infinity : band.upTo * PERIOD_FRACTION;
    const inBand = Math.max(0, Math.min(incomeAboveAllowance, cap) - lower);
    tax += inBand * band.rate;
    lower = cap;
    if (incomeAboveAllowance <= cap) break;
  }
  return tax;
}

/** Employee National Insurance for one period, on the given NI-able pay. */
export function calculateNI(niablePay: number): number {
  const pt = NATIONAL_INSURANCE.primaryThreshold * PERIOD_FRACTION;
  const uel = NATIONAL_INSURANCE.upperEarningsLimit * PERIOD_FRACTION;
  if (niablePay <= pt) return 0;

  let ni = (Math.min(niablePay, uel) - pt) * NATIONAL_INSURANCE.mainRate;
  if (niablePay > uel) {
    ni += (niablePay - uel) * NATIONAL_INSURANCE.upperRate;
  }
  return ni;
}

/** Student loan repayment for one period, on the given earnings. */
export function calculateStudentLoan(pay: number, plan: StudentLoanPlan): number {
  if (plan === 'none') return 0;
  const { annualThreshold, rate } = STUDENT_LOANS[plan];
  const periodThreshold = annualThreshold * PERIOD_FRACTION;
  return Math.max(0, pay - periodThreshold) * rate;
}

/** Full breakdown for a 4-weekly pay period. */
export function calculateSalary(input: SalaryInput): SalaryBreakdown {
  const totalHours = input.weeks.reduce((sum, w) => sum + timeToDecimalHours(w), 0);
  const rate = Math.max(0, Number.isFinite(input.hourlyRate) ? input.hourlyRate : 0);
  const gross = totalHours * rate;

  const pensionRate = Math.max(0, Number.isFinite(input.pensionRate) ? input.pensionRate : 0);
  const pension = gross * (pensionRate / 100);

  // Pension is always pre-tax (net-pay arrangement). Salary sacrifice additionally
  // reduces the earnings used for NI and student loan.
  const taxablePay = Math.max(0, gross - pension);
  const niablePay = input.salarySacrifice ? Math.max(0, gross - pension) : gross;

  const annualAllowance = parseTaxCode(input.taxCode);
  const incomeTax = calculateIncomeTax(taxablePay, annualAllowance);
  const nationalInsurance = calculateNI(niablePay);
  const studentLoan = calculateStudentLoan(niablePay, input.studentLoanPlan);

  const net = gross - incomeTax - nationalInsurance - studentLoan - pension;

  return {
    totalHours,
    gross,
    pension,
    taxablePay,
    incomeTax,
    nationalInsurance,
    studentLoan,
    net,
    annual: {
      gross: gross * PERIODS_PER_YEAR,
      pension: pension * PERIODS_PER_YEAR,
      incomeTax: incomeTax * PERIODS_PER_YEAR,
      nationalInsurance: nationalInsurance * PERIODS_PER_YEAR,
      studentLoan: studentLoan * PERIODS_PER_YEAR,
      net: net * PERIODS_PER_YEAR,
    },
  };
}
