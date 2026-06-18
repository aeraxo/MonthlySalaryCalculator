import { describe, expect, it } from 'vitest';
import {
  calculateIncomeTax,
  calculateNI,
  calculateSalary,
  calculateStudentLoan,
  parseTaxCode,
  timeToDecimalHours,
  type SalaryInput,
} from './calculateSalary';

const P = 4 / 52; // period fraction (one 4-weekly period = 1/13 of a year)

describe('timeToDecimalHours', () => {
  it('converts hours and minutes to decimal hours', () => {
    expect(timeToDecimalHours({ hours: 32, minutes: 19 })).toBeCloseTo(32 + 19 / 60, 6);
    expect(timeToDecimalHours({ hours: 0, minutes: 30 })).toBe(0.5);
    expect(timeToDecimalHours({ hours: 40, minutes: 0 })).toBe(40);
  });

  it('treats negatives and non-finite values as zero', () => {
    expect(timeToDecimalHours({ hours: -5, minutes: -10 })).toBe(0);
    expect(timeToDecimalHours({ hours: NaN, minutes: 15 })).toBe(0.25);
  });
});

describe('parseTaxCode', () => {
  it('reads the allowance from a standard code', () => {
    expect(parseTaxCode('1257L')).toBe(12570);
    expect(parseTaxCode('1100L')).toBe(11000);
    expect(parseTaxCode(' 1257l ')).toBe(12570);
  });

  it('falls back to the default for unrecognised codes', () => {
    expect(parseTaxCode('BR')).toBe(12570);
    expect(parseTaxCode('')).toBe(12570);
    expect(parseTaxCode('K500')).toBe(12570);
  });
});

describe('calculateIncomeTax (per period)', () => {
  it('charges no tax below the personal allowance', () => {
    expect(calculateIncomeTax(500, 12570)).toBe(0);
  });

  it('charges basic rate above the allowance', () => {
    // taxablePay 2000, allowance 12570/13, all within the basic band
    const expected = (2000 - 12570 * P) * 0.2;
    expect(calculateIncomeTax(2000, 12570)).toBeCloseTo(expected, 6);
  });

  it('charges higher rate once the basic band is exhausted', () => {
    const above = 5000 - 12570 * P;
    const basicWidth = 37700 * P;
    const expected = basicWidth * 0.2 + (above - basicWidth) * 0.4;
    expect(calculateIncomeTax(5000, 12570)).toBeCloseTo(expected, 6);
  });
});

describe('calculateNI (per period)', () => {
  it('charges no NI below the primary threshold', () => {
    expect(calculateNI(500)).toBe(0);
  });

  it('charges the 8% main rate between PT and UEL', () => {
    const expected = (2000 - 12570 * P) * 0.08;
    expect(calculateNI(2000)).toBeCloseTo(expected, 6);
  });

  it('charges 2% above the upper earnings limit', () => {
    const pt = 12570 * P;
    const uel = 50270 * P;
    const pay = 5000;
    const expected = (uel - pt) * 0.08 + (pay - uel) * 0.02;
    expect(calculateNI(pay)).toBeCloseTo(expected, 6);
  });
});

describe('calculateStudentLoan (per period)', () => {
  it('returns 0 when no plan is selected', () => {
    expect(calculateStudentLoan(5000, 'none')).toBe(0);
  });

  it('charges 9% over the Plan 2 threshold', () => {
    const expected = (3000 - 29385 * P) * 0.09;
    expect(calculateStudentLoan(3000, 'plan2')).toBeCloseTo(expected, 6);
  });

  it('charges 6% over the postgraduate threshold', () => {
    const expected = (3000 - 21000 * P) * 0.06;
    expect(calculateStudentLoan(3000, 'postgrad')).toBeCloseTo(expected, 6);
  });

  it('returns 0 when earnings are below the threshold', () => {
    expect(calculateStudentLoan(1000, 'plan2')).toBe(0);
  });
});

describe('calculateSalary (full period)', () => {
  const baseInput: SalaryInput = {
    weeks: [
      { hours: 37, minutes: 30 },
      { hours: 37, minutes: 30 },
      { hours: 37, minutes: 30 },
      { hours: 37, minutes: 30 },
    ],
    hourlyRate: 15,
    taxCode: '1257L',
    studentLoanPlan: 'none',
    pensionRate: 0,
    salarySacrifice: false,
  };

  it('computes total hours and gross', () => {
    const r = calculateSalary(baseInput);
    expect(r.totalHours).toBe(150);
    expect(r.gross).toBe(2250);
  });

  it('nets off tax and NI and annualises by 13', () => {
    const r = calculateSalary(baseInput);
    expect(r.net).toBeCloseTo(r.gross - r.incomeTax - r.nationalInsurance, 6);
    expect(r.annual.gross).toBeCloseTo(2250 * 13, 6);
    expect(r.annual.net).toBeCloseTo(r.net * 13, 6);
  });

  it('applies pension pre-tax and reduces take-home', () => {
    const withPension = calculateSalary({ ...baseInput, pensionRate: 5 });
    expect(withPension.pension).toBeCloseTo(112.5, 6);
    expect(withPension.taxablePay).toBeCloseTo(2250 - 112.5, 6);
    // less taxable pay => less income tax than the no-pension case
    expect(withPension.incomeTax).toBeLessThan(calculateSalary(baseInput).incomeTax);
  });

  it('salary sacrifice also lowers NI', () => {
    const netPay = calculateSalary({ ...baseInput, pensionRate: 5, salarySacrifice: false });
    const sacrifice = calculateSalary({ ...baseInput, pensionRate: 5, salarySacrifice: true });
    expect(sacrifice.nationalInsurance).toBeLessThan(netPay.nationalInsurance);
  });

  it('returns all zeros for no hours worked', () => {
    const r = calculateSalary({
      ...baseInput,
      weeks: baseInput.weeks.map(() => ({ hours: 0, minutes: 0 })),
    });
    expect(r.gross).toBe(0);
    expect(r.incomeTax).toBe(0);
    expect(r.nationalInsurance).toBe(0);
    expect(r.net).toBe(0);
  });
});
