import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SparkSelectProps<T extends string = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function SparkSelect<T extends string = string>({ value, options, onChange }: SparkSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="spark-select" ref={containerRef}>
      <button
        type="button"
        className={`spark-select__trigger ${isOpen ? 'spark-select__trigger--open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="spark-select__label-group">
          {selectedOption?.icon && <span className="spark-select__icon">{selectedOption.icon}</span>}
          <span className="spark-select__label">{selectedOption?.label}</span>
        </span>
        <ChevronDown size={14} className={`spark-select__chevron ${isOpen ? 'spark-select__chevron--open' : ''}`} />
      </button>

      {isOpen && (
        <div className="spark-select__dropdown" role="listbox">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`spark-select__option ${opt.value === value ? 'spark-select__option--selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={opt.value === value}
            >
              {opt.icon && <span className="spark-select__icon">{opt.icon}</span>}
              <span className="spark-select__option-label">{opt.label}</span>
              {opt.value === value && <Check size={14} className="spark-select__check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
