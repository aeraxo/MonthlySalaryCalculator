export interface WeekTimeInput {
  hours: string;
  minutes: string;
}

interface WeekInputProps {
  index: number;
  value: WeekTimeInput;
  onChange: (value: WeekTimeInput) => void;
}

/** Keep only digits; optionally cap the value. Empty input stays empty. */
function sanitizeInt(raw: string, max?: number): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return '';
  let n = parseInt(digits, 10);
  if (max !== undefined && n > max) n = max;
  return String(n);
}

const inputClass =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

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
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={value.hours}
            onChange={(e) => onChange({ ...value, hours: sanitizeInt(e.target.value) })}
            className={inputClass}
          />
        </label>
        <label className="flex-1">
          <span className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Minutes</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={value.minutes}
            onChange={(e) => onChange({ ...value, minutes: sanitizeInt(e.target.value, 59) })}
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}
