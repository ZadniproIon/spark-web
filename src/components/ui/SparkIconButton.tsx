import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface SparkIconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  iconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  size?: number;
  padding?: number;
  isCircular?: boolean;
}

const styles = {
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid transparent',
    transition: 'all 140ms ease-out',
    opacity: 1,
  } as const,
};

export function SparkIconButton({
  icon,
  onClick,
  disabled,
  size = 24,
  padding = 12,
  iconColor,
  backgroundColor,
  borderColor,
  isCircular = false,
  style,
  children,
  ...rest
}: SparkIconButtonProps) {
  const dimension = size + padding * 2;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles.button,
        width: dimension,
        height: dimension,
        borderRadius: isCircular ? '50%' : '14px',
        backgroundColor: disabled ? 'transparent' : (backgroundColor ?? 'transparent'),
        borderColor: borderColor ?? 'transparent',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      {icon && (
        <span style={{ color: iconColor ?? 'var(--text-secondary)', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
