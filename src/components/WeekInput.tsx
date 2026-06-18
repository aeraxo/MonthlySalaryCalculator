import type { WeekTime } from '../lib/calculateSalary';

interface WeekInputProps {
  index: number;
  value: WeekTime;
  onChange: (value: WeekTime) => void;
}

/** Hours + minutes inputs for a single week of the pay period. */
export function WeekInput({ index, value, onChange }: WeekInputProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Week {index + 1}
      </p>
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Hours</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={Number.isFinite(value.hours) ? value.hours : ''}
            onChange={(e) =>
              onChange({ ...value, hours: Math.max(0, Number(e.target.value) || 0) })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Minutes</span>
          <input
            type="number"
            min={0}
            max={59}
            inputMode="numeric"
            value={Number.isFinite(value.minutes) ? value.minutes : ''}
            onChange={(e) =>
              onChange({
                ...value,
                minutes: Math.min(59, Math.max(0, Number(e.target.value) || 0)),
              })
            }
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
      </div>
    </div>
  );
}
