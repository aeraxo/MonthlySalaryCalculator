import type { SalaryBreakdown } from '../lib/calculateSalary';
import { PERIODS_PER_YEAR } from '../lib/taxConfig';

interface ResultsBreakdownProps {
  result: SalaryBreakdown;
}

const gbp = (n: number) =>
  n.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

function Row({
  label,
  value,
  deduction = false,
}: {
  label: string;
  value: number;
  deduction?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span
        className={`font-medium tabular-nums ${
          deduction ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {deduction && value > 0 ? `− ${gbp(value)}` : gbp(value)}
      </span>
    </div>
  );
}

/** Line-by-line breakdown of gross, deductions and net for the 4-week period. */
export function ResultsBreakdown({ result }: ResultsBreakdownProps) {
  const totalHoursLabel = `${Math.floor(result.totalHours)}h ${Math.round(
    (result.totalHours - Math.floor(result.totalHours)) * 60,
  )}m`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        Your 4-week pay
      </h2>

      <div className="mb-2 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>Total hours worked</span>
        <span className="tabular-nums">{totalHoursLabel}</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        <Row label="Gross pay" value={result.gross} />
        <Row label="Income Tax" value={result.incomeTax} deduction />
        <Row label="National Insurance" value={result.nationalInsurance} deduction />
        {result.studentLoan > 0 && (
          <Row label="Student Loan" value={result.studentLoan} deduction />
        )}
        {result.pension > 0 && <Row label="Pension" value={result.pension} deduction />}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-3 dark:bg-emerald-900/30">
        <span className="font-semibold text-emerald-800 dark:text-emerald-200">
          Net take-home
        </span>
        <span className="text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
          {gbp(result.net)}
        </span>
      </div>

      <p className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Annualised (×{PERIODS_PER_YEAR})
      </p>
      <div className="grid grid-cols-2 gap-x-4 text-sm">
        <Row label="Gross / year" value={result.annual.gross} />
        <Row label="Take-home / year" value={result.annual.net} />
      </div>
    </div>
  );
}
