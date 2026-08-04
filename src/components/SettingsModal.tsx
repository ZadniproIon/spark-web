import { useState, useCallback } from 'react';
import { X, Sun, Moon, Monitor, Trash2, LogOut, Mail, Lock, LayoutGrid, Palette, User, Info, MessageCircle, GitFork, Square, Flame, Copy, Check } from 'lucide-react';
import { SparkSelect, type SelectOption } from './ui/SparkSelect';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLayoutMode } from '../hooks/useLayoutMode';
import type { ThemePreference, LayoutMode } from '../types/note';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface SettingsModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

type TabType = 'appearance' | 'account' | 'about';

const themeOptions: SelectOption<ThemePreference>[] = [
  { value: 'system', label: 'Device default', icon: <Monitor size={14} /> },
  { value: 'light', label: 'Light', icon: <Sun size={14} /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
];

const layoutOptions: SelectOption<LayoutMode>[] = [
  { value: '1col', label: '1 Column', icon: <Square size={14} /> },
  { value: 'masonry', label: 'Masonry', icon: <LayoutGrid size={14} /> },
];

function MenuGroup({ children }: { children: React.ReactNode }) {
  return <div className="settings-group">{children}</div>;
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
      type="button"
      className={`settings-item ${destructive ? 'settings-item--destructive' : ''} ${onClick ? 'settings-item--clickable' : ''}`}
      onClick={onClick}
    >
      <span className="settings-item__icon">{icon}</span>
      <div className="settings-item__text">
        <div className="settings-item__label">{label}</div>
        {subtitle && <div className="settings-item__subtitle">{subtitle}</div>}
      </div>
      {trailing}
    </button>
  );
}

export function SettingsModal({ onClose, onOpenAuth }: SettingsModalProps) {
  const { isClosing, handleClose } = useModalAnimation(onClose);
  const { theme, setTheme } = useTheme();
  const { layoutMode, setLayoutMode } = useLayoutMode();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('nutzugt@gmail.com');
    setCopiedEmail(true);
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
      <div className="settings-modal modal-content-animated" onClick={(e) => e.stopPropagation()}>
        {/* Left Sidebar Navigation */}
        <aside className="settings-modal__sidebar">
          <div className="settings-modal__brand">
            <span className="settings-modal__title">Settings</span>
          </div>

          <nav className="settings-modal__nav">
            <button
              type="button"
              className={`settings-modal__tab ${activeTab === 'appearance' ? 'settings-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={18} />
              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`settings-modal__tab ${activeTab === 'account' ? 'settings-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <User size={18} />
              <span>Account</span>
            </button>

            <button
              type="button"
              className={`settings-modal__tab ${activeTab === 'about' ? 'settings-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <Info size={18} />
              <span>About</span>
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="settings-modal__content">
          <header className="settings-modal__content-header">
            <h2>
              {activeTab === 'appearance' && 'Appearance & Display'}
              {activeTab === 'account' && 'Account & Sync'}
              {activeTab === 'about' && 'About Spark'}
            </h2>
            <button className="modal-close-btn" onClick={handleClose} aria-label="Close settings">
              <X size={18} />
            </button>
          </header>

          <div className="settings-modal__body">
            {activeTab === 'appearance' && (
              <>
                <MenuGroup>
                  <MenuItem
                    icon={<Monitor size={16} />}
                    label="Theme"
                    subtitle="Customize app color appearance"
                    trailing={
                      <SparkSelect
                        value={theme}
                        options={themeOptions}
                        onChange={(val) => setTheme(val)}
                      />
                    }
                  />
                  <MenuItem
                    icon={layoutMode === '1col' ? <Square size={16} /> : <LayoutGrid size={16} />}
                    label="Note view layout"
                    subtitle="Switch between 1-column stack and masonry grid"
                    trailing={
                      <SparkSelect
                        value={layoutMode}
                        options={layoutOptions}
                        onChange={(val) => setLayoutMode(val)}
                      />
                    }
                  />
                </MenuGroup>
              </>
            )}

            {activeTab === 'account' && (
              <>
                <MenuGroup>
                  <MenuItem
                    label="Account"
                    icon={<Mail size={16} />}
                    subtitle={user ? user.email ?? 'Signed in' : 'Guest mode (local storage)'}
                  />
                  {!user ? (
                    <MenuItem
                      icon={<LogOut size={16} />}
                      label="Sign in to sync"
                      subtitle="Sync your notes across all your devices"
                      onClick={() => {
                        onOpenAuth();
                      }}
                    />
                  ) : (
                    <>
                      <MenuItem icon={<LogOut size={16} />} label="Sign out" onClick={handleSignOut} />
                      {!showDeleteConfirm ? (
                        <MenuItem
                          icon={<Trash2 size={16} />}
                          label="Delete account"
                          destructive
                          onClick={handleDeleteAccount}
                        />
                      ) : (
                        <div className="settings-delete-warning">
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
                    <MenuItem icon={<Lock size={16} />} label="Change password" subtitle="Update your account password" />
                    <MenuItem icon={<Mail size={16} />} label="Change email" subtitle={user.email ?? ''} />
                  </MenuGroup>
                )}
              </>
            )}

            {activeTab === 'about' && (
              <>
                <div className="settings-about-hero">
                  <div className="settings-about-hero__icon">
                    <Flame size={32} strokeWidth={2} />
                  </div>
                  <h3>Spark Notes</h3>
                  <p>Version 1.0.0</p>
                </div>

                <MenuGroup>
                  <MenuItem
                    icon={<MessageCircle size={16} />}
                    label="Send feedback"
                    subtitle="nutzugt@gmail.com"
                    onClick={() => (window.location.href = 'mailto:nutzugt@gmail.com?subject=Spark%20feedback')}
                    trailing={
                      <button
                        type="button"
                        className="settings-copy-btn"
                        onClick={handleCopyEmail}
                        title="Copy email address"
                      >
                        {copiedEmail ? <Check size={13} /> : <Copy size={13} />}
                        <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                      </button>
                    }
                  />
                  <MenuItem
                    icon={<GitFork size={16} />}
                    label="GitHub repository"
                    subtitle="View source code and contribute"
                    onClick={() => window.open('https://github.com/ZadniproIon/spark-web', '_blank', 'noopener,noreferrer')}
                  />
                </MenuGroup>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
