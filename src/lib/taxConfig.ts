/**
 * UK tax/NI/student-loan rates and thresholds.
 *
 * Tax year: 2026/27 · Region: England, Wales & Northern Ireland (rUK).
 * All figures are ANNUAL unless noted. Source: GOV.UK.
 *   - https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027
 *   - https://www.gov.uk/government/publications/student-loans-a-guide-to-terms-and-conditions/student-loans-a-guide-to-terms-and-conditions-2026-to-2027
 *
 * Keep this file as the single source of truth — to update for a new tax year,
 * only the numbers below should need to change.
 */

export const TAX_YEAR = '2026/27';

/** A 4-weekly pay cycle => 13 pay periods per year. */
export const PERIODS_PER_YEAR = 13;

/** Fraction of an annual threshold that applies to one 4-weekly period. */
export const PERIOD_FRACTION = 4 / 52;

/** Default tax code, used when the entered code can't be parsed. */
export const DEFAULT_TAX_CODE = '1257L';

/** Income Tax — England, Wales & NI. */
export const INCOME_TAX = {
  /** Standard Personal Allowance (also encoded in the 1257L tax code). */
  personalAllowance: 12570,
  /** Personal Allowance is reduced by £1 for every £2 of income above this. */
  taperThreshold: 100000,
  /**
   * Bands expressed as taxable income ABOVE the personal allowance.
   * `upTo` is the cumulative taxable amount at which the band ends (Infinity = no cap).
   */
  bands: [
    { name: 'Basic rate', rate: 0.2, upTo: 37700 },
    { name: 'Higher rate', rate: 0.4, upTo: 125140 - 12570 }, // higher band ends at £125,140 gross income
    { name: 'Additional rate', rate: 0.45, upTo: Infinity },
  ],
} as const;

/** Employee National Insurance — Class 1, category A. */
export const NATIONAL_INSURANCE = {
  /** Primary Threshold: no NI below this. */
  primaryThreshold: 12570,
  /** Upper Earnings Limit: rate drops above this. */
  upperEarningsLimit: 50270,
  /** Main rate between PT and UEL. */
  mainRate: 0.08,
  /** Rate above the UEL. */
  upperRate: 0.02,
} as const;

export type StudentLoanPlan = 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgrad';

export const STUDENT_LOANS: Record<
  Exclude<StudentLoanPlan, 'none'>,
  { label: string; annualThreshold: number; rate: number }
> = {
  plan1: { label: 'Plan 1', annualThreshold: 26900, rate: 0.09 },
  plan2: { label: 'Plan 2', annualThreshold: 29385, rate: 0.09 },
  plan4: { label: 'Plan 4 (Scotland)', annualThreshold: 33795, rate: 0.09 },
  plan5: { label: 'Plan 5', annualThreshold: 25000, rate: 0.09 },
  postgrad: { label: 'Postgraduate Loan', annualThreshold: 21000, rate: 0.06 },
};
