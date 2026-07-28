import { Search, X } from 'lucide-react';

interface SparkSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SparkSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus,
  className = 'sidebar-search-bar',
}: SparkSearchBarProps) {
  return (
    <div className={className}>
      <Search size={20} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--text-secondary)',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
