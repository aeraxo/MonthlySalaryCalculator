import { useMemo, useState } from 'react';
import { WeekInput } from './components/WeekInput';
import { ResultsBreakdown } from './components/ResultsBreakdown';
import { calculateSalary, type SalaryInput, type WeekTime } from './lib/calculateSalary';
import { STUDENT_LOANS, TAX_YEAR, type StudentLoanPlan } from './lib/taxConfig';

const emptyWeek: WeekTime = { hours: 0, minutes: 0 };

const studentLoanOptions: { value: StudentLoanPlan; label: string }[] = [
  { value: 'none', label: 'No student loan' },
  ...(Object.entries(STUDENT_LOANS) as [Exclude<StudentLoanPlan, 'none'>, { label: string }][]).map(
    ([value, { label }]) => ({ value, label }),
  ),
];

const fieldClass =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200';

function App() {
  const [weeks, setWeeks] = useState<WeekTime[]>([
    { ...emptyWeek },
    { ...emptyWeek },
    { ...emptyWeek },
    { ...emptyWeek },
  ]);
  const [hourlyRate, setHourlyRate] = useState(12.21);
  const [taxCode, setTaxCode] = useState('1257L');
  const [studentLoanPlan, setStudentLoanPlan] = useState<StudentLoanPlan>('none');
  const [pensionRate, setPensionRate] = useState(0);
  const [salarySacrifice, setSalarySacrifice] = useState(false);

  const result = useMemo(() => {
    const input: SalaryInput = {
      weeks,
      hourlyRate,
      taxCode,
      studentLoanPlan,
      pensionRate,
      salarySacrifice,
    };
    return calculateSalary(input);
  }, [weeks, hourlyRate, taxCode, studentLoanPlan, pensionRate, salarySacrifice]);

  const setWeek = (i: number, value: WeekTime) =>
    setWeeks((prev) => prev.map((w, idx) => (idx === i ? value : w)));

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-bold sm:text-3xl">UK Hourly Salary Calculator</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Work out your take-home pay for a 4-weekly pay cycle · {TAX_YEAR} · England, Wales &amp;
            NI
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Inputs */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-lg font-semibold">Hours worked</h2>
            <div className="grid grid-cols-2 gap-3">
              {weeks.map((week, i) => (
                <WeekInput key={i} index={i} value={week} onChange={(v) => setWeek(i, v)} />
              ))}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className={labelClass} htmlFor="rate">
                  Pay rate (£ per hour)
                </label>
                <input
                  id="rate"
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  value={Number.isFinite(hourlyRate) ? hourlyRate : ''}
                  onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value) || 0))}
                  className={fieldClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="taxcode">
                    Tax code
                  </label>
                  <input
                    id="taxcode"
                    type="text"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value.toUpperCase())}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="pension">
                    Pension (%)
                  </label>
                  <input
                    id="pension"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    inputMode="decimal"
                    value={Number.isFinite(pensionRate) ? pensionRate : ''}
                    onChange={(e) =>
                      setPensionRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                    }
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="studentloan">
                  Student loan
                </label>
                <select
                  id="studentloan"
                  value={studentLoanPlan}
                  onChange={(e) => setStudentLoanPlan(e.target.value as StudentLoanPlan)}
                  className={fieldClass}
                >
                  {studentLoanOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={salarySacrifice}
                  onChange={(e) => setSalarySacrifice(e.target.checked)}
                  disabled={pensionRate === 0}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Pension via salary sacrifice (also reduces NI)
              </label>
            </div>
          </div>

          {/* Results */}
          <ResultsBreakdown result={result} />
        </div>

        <footer className="mt-6 text-center text-xs text-slate-400">
          <p>
            Estimate only. Calculated on a non-cumulative per-period basis using {TAX_YEAR} rates
            for England, Wales &amp; Northern Ireland. Your actual payslip uses cumulative PAYE and
            your real tax code, so figures may differ.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
