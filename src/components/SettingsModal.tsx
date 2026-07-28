import { useState, useCallback } from 'react';
import { X, Sun, Moon, Monitor, Trash2, LogOut, Mail, Lock, LayoutGrid } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLayoutMode } from '../hooks/useLayoutMode';
import type { ThemePreference, LayoutMode } from '../types/note';

interface SettingsModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

const themeOptions: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'Device default', icon: <Monitor size={16} /> },
  { value: 'light', label: 'Light', icon: <Sun size={16} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
];

function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
      {children}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  onClick,
  destructive,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick?: () => void;
  destructive?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '14px 16px',
        fontSize: 14,
        color: destructive ? 'var(--red)' : 'var(--text-primary)',
        background: 'none',
        border: 'none',
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: '1px solid var(--border)',
        transition: 'background 140ms ease-out',
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = 'var(--bg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
        {icon}
      </span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div>{label}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {trailing}
    </button>
  );
}

export function SettingsModal({ onClose, onOpenAuth }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { layoutMode, setLayoutMode } = useLayoutMode();
  const { user, signOut } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(10);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleDeleteAccount = useCallback(() => {
    setShowDeleteConfirm(true);
    const interval = setInterval(() => {
      setDeleteCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '32px 32px 0 0',
          padding: '24px 32px 40px',
          width: 'min(100%, 460px)',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Settings</span>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <MenuGroup>
          <MenuItem
            icon={<Monitor size={16} />}
            label="Theme"
            trailing={
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ThemePreference)}
                style={{
                  padding: '6px 10px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {themeOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            }
          />
          <MenuItem
            icon={<LayoutGrid size={16} />}
            label="Note view layout"
            trailing={
              <select
                value={layoutMode}
                onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}
                style={{
                  padding: '6px 10px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="1col">1 Column</option>
                <option value="masonry">Masonry</option>
              </select>
            }
          />
        </MenuGroup>

        <MenuGroup>
          <MenuItem label="Account" icon={<Mail size={16} />} subtitle={user ? user.email ?? 'Signed in' : 'Guest'} />
          {!user ? (
            <MenuItem icon={<LogOut size={16} />} label="Sign in to sync" onClick={() => { onOpenAuth(); onClose(); }} />
          ) : (
            <>
              <MenuItem icon={<LogOut size={16} />} label="Sign out" onClick={handleSignOut} />
              {!showDeleteConfirm ? (
                <MenuItem icon={<Trash2 size={16} />} label="Delete account" destructive onClick={handleDeleteAccount} />
              ) : (
                <div style={{ padding: '14px 16px', fontSize: 13, color: 'var(--red)', borderBottom: '1px solid var(--border)' }}>
                  {deleteCountdown > 0
                    ? `Are you sure? Deleting in ${deleteCountdown}...`
                    : 'Deleting account...'}
                </div>
              )}
            </>
          )}
        </MenuGroup>

        {user && (
          <MenuGroup>
            <MenuItem icon={<Lock size={16} />} label="Change password" subtitle="Update your password" />
            <MenuItem icon={<Mail size={16} />} label="Change email" subtitle={user.email ?? ''} />
          </MenuGroup>
        )}
      </div>
    </div>
  );
}
