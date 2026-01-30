import { capitalize } from '../utils';
import './editor.css';

interface ToggleOption<T extends string> {
  value: T;
  label?: string;
}

interface ToggleButtonGroupProps<T extends string> {
  options: readonly T[] | ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  fullWidth?: boolean;
}

export function ToggleButtonGroup<T extends string>({
  options,
  value,
  onChange,
  fullWidth = true,
}: ToggleButtonGroupProps<T>) {
  const normalizedOptions: ToggleOption<T>[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: capitalize(opt) } : opt
  );

  return (
    <div className={`toggle-button-group${fullWidth ? ' full-width' : ''}`}>
      {normalizedOptions.map(opt => (
        <button
          key={opt.value}
          className={`toggle-btn${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
