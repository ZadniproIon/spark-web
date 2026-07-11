import { Search, X } from 'lucide-react';

interface SparkSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SparkSearchBar({ value, onChange, placeholder = 'Search notes...' }: SparkSearchBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: '18px',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        padding: '8px 14px',
        width: '100%',
      }}
    >
      <Search size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          fontSize: 14,
          color: 'var(--text-primary)',
          background: 'transparent',
          border: 'none',
          outline: 'none',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
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
          <X size={14} />
        </button>
      )}
    </div>
  );
}
