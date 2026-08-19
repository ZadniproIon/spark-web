import { useState, useCallback } from 'react';
import { X, Sun, Moon, Monitor, Trash2, LogOut, Mail, LayoutGrid, Square, Flame, Radio, Palette, User, Info, MessageCircle, GitFork, Keyboard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLayoutMode } from '../hooks/useLayoutMode';
import { useStore } from '../lib/store';
import { useModalAnimation } from '../hooks/useModalAnimation';

import { toast } from '../lib/toast';

interface SettingsModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

type TabType = 'appearance' | 'account' | 'about';

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        backgroundColor: checked ? 'var(--flame)' : 'var(--border)',
        border: 'none',
        padding: 3,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 200ms ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: '#fff',
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </button>
  );
}

export function SettingsModal({ onClose, onOpenAuth }: SettingsModalProps) {
  const { isClosing, handleClose } = useModalAnimation(onClose);
  const { theme, setTheme } = useTheme();
  const { layoutMode, setLayoutMode } = useLayoutMode();
  const { state, dispatch } = useStore();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('appearance');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('zadnipro.ion.187@gmail.com');
    setCopiedEmail(true);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

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
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(100%, 520px)',
          maxHeight: '90vh',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header with Title & Close */}
        <div
          style={{
            padding: '20px 24px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Settings
          </h2>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Top Segmented Pill Bar */}
        <div style={{ padding: '0 24px 16px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              background: 'var(--bg)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('appearance')}
              style={{
                padding: '8px 12px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: activeTab === 'appearance' ? 'var(--flame)' : 'transparent',
                color: activeTab === 'appearance' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: activeTab === 'appearance' ? '0 2px 10px rgba(249, 115, 22, 0.3)' : 'none',
                transition: 'all 180ms ease',
              }}
            >
              <Palette size={14} />
              <span>Appearance</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              style={{
                padding: '8px 12px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: activeTab === 'account' ? 'var(--flame)' : 'transparent',
                color: activeTab === 'account' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: activeTab === 'account' ? '0 2px 10px rgba(249, 115, 22, 0.3)' : 'none',
                transition: 'all 180ms ease',
              }}
            >
              <User size={14} />
              <span>Account</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              style={{
                padding: '8px 12px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                background: activeTab === 'about' ? 'var(--flame)' : 'transparent',
                color: activeTab === 'about' ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: activeTab === 'about' ? '0 2px 10px rgba(249, 115, 22, 0.3)' : 'none',
                transition: 'all 180ms ease',
              }}
            >
              <Info size={14} />
              <span>About</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panel (Grid stacked so tallest tab determines height naturally) */}
        <div style={{ flex: 1, padding: '8px 24px 24px', display: 'grid', gridTemplateColumns: '1fr', overflowY: 'auto' }}>
          {/* Appearance Panel */}
          <div
            style={{
              gridArea: '1 / 1 / 2 / 2',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              visibility: activeTab === 'appearance' ? 'visible' : 'hidden',
              opacity: activeTab === 'appearance' ? 1 : 0,
              pointerEvents: activeTab === 'appearance' ? 'auto' : 'none',
              transition: 'opacity 150ms ease',
            }}
          >
            {/* Theme Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Theme Selector</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    style={{
                      padding: '10px',
                      borderRadius: 10,
                      border: theme === t ? '1.5px solid var(--flame)' : '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: theme === t ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 150ms ease',
                    }}
                  >
                    {t === 'dark' && <Moon size={16} color={theme === t ? 'var(--flame)' : undefined} />}
                    {t === 'light' && <Sun size={16} color={theme === t ? 'var(--flame)' : undefined} />}
                    {t === 'system' && <Monitor size={16} color={theme === t ? 'var(--flame)' : undefined} />}
                    <span style={{ textTransform: 'capitalize' }}>{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note View Layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Layout Mode</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setLayoutMode('1col')}
                  style={{
                    padding: '10px',
                    borderRadius: 10,
                    border: layoutMode === '1col' ? '1.5px solid var(--flame)' : '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: layoutMode === '1col' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Square size={16} color={layoutMode === '1col' ? 'var(--flame)' : undefined} />
                  <span>1 Column</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('masonry')}
                  style={{
                    padding: '10px',
                    borderRadius: 10,
                    border: layoutMode === 'masonry' ? '1.5px solid var(--flame)' : '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: layoutMode === 'masonry' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <LayoutGrid size={16} color={layoutMode === 'masonry' ? 'var(--flame)' : undefined} />
                  <span>Masonry Grid</span>
                </button>
              </div>
            </div>

            {/* Interface Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Sync Options</label>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Radio size={16} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Auto-hide green sync dot</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fade green indicator 5s after sync</div>
                  </div>
                </div>
                <ToggleSwitch
                  checked={state.autoHideSyncDot}
                  onChange={(val) => dispatch({ type: 'SET_AUTO_HIDE_SYNC_DOT', payload: val })}
                />
              </div>
            </div>
          </div>

          {/* Account Panel */}
          <div
            style={{
              gridArea: '1 / 1 / 2 / 2',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              visibility: activeTab === 'account' ? 'visible' : 'hidden',
              opacity: activeTab === 'account' ? 1 : 0,
              pointerEvents: activeTab === 'account' ? 'auto' : 'none',
              transition: 'opacity 150ms ease',
            }}
          >
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(249, 115, 22, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--flame)' }}>
                <User size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user ? user.email : 'Guest Session'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {user ? 'Cloud sync active across all devices' : 'Notes stored only on this browser'}
                </div>
              </div>
            </div>

            {!user ? (
              <button
                type="button"
                onClick={onOpenAuth}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  background: 'var(--flame)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Mail size={16} />
                <span>Sign in / Create account</span>
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogOut size={16} color="var(--text-secondary)" />
                    <span>Sign out of account</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(225, 29, 72, 0.08)',
                    border: '1px solid rgba(225, 29, 72, 0.2)',
                    color: 'var(--red)',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Trash2 size={16} />
                    <span>{showDeleteConfirm ? (deleteCountdown > 0 ? `Confirm delete in ${deleteCountdown}s...` : 'Deleting...') : 'Delete account'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* About Panel */}
          <div
            style={{
              gridArea: '1 / 1 / 2 / 2',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              visibility: activeTab === 'about' ? 'visible' : 'hidden',
              opacity: activeTab === 'about' ? 1 : 0,
              pointerEvents: activeTab === 'about' ? 'auto' : 'none',
              transition: 'opacity 150ms ease',
            }}
          >
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(249, 115, 22, 0.12)', color: 'var(--flame)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                <Flame size={32} strokeWidth={2} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Spark</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Version 1.0.0</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={handleCopyEmail}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={16} color="var(--text-secondary)" />
                  <span>Send feedback</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--flame)' }}>{copiedEmail ? 'Copied email!' : 'zadnipro.ion.187@gmail.com'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.open('https://github.com/ZadniproIon/spark-web', '_blank', 'noopener,noreferrer')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GitFork size={16} color="var(--text-secondary)" />
                  <span>GitHub Repository</span>
                </div>
              </button>

              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                  <Keyboard size={14} />
                  <span>KEYBOARD SHORTCUTS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)' }}>New note</span>
                  <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>N</kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Search notes</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>/</kbd>
                    <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Ctrl K</kbd>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Save note</span>
                  <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Ctrl Enter</kbd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-primary)' }}>Close / dismiss</span>
                  <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
