import { useState, useCallback, useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Monitor,
  Trash2,
  LogOut,
  Mail,
  LayoutGrid,
  Square,
  Flame,
  Palette,
  User,
  Info,
  MessageCircle,
  GitFork,
  Keyboard,
  ShieldCheck,
  ChevronRight,
  KeyRound,
  Unlink,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLayoutMode } from '../hooks/useLayoutMode';
import { useStore } from '../lib/store';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { TermsModal } from './TermsModal';
import { toast } from '../lib/toast';

interface SettingsModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

type TabType = 'appearance' | 'account' | 'about';
type AccountSubView = 'main' | 'change_email' | 'change_password' | 'disconnect_google' | 'delete_confirm';

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
  const {
    user,
    signOut,
    updateEmail,
    updatePassword,
    disconnectGoogleIdentity,
    deleteAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [accountSubView, setAccountSubView] = useState<AccountSubView>('main');
  const [showTerms, setShowTerms] = useState(false);

  // Account subview states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Delete account countdown
  const [deleteCountdown, setDeleteCountdown] = useState(10);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const hasGoogleLinked = user?.identities?.some((id) => id.provider === 'google');

  // Handle countdown timer for delete confirmation
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (accountSubView === 'delete_confirm' && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [accountSubView, deleteCountdown]);

  const handleCopyEmail = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('zadnipro.ion.187@gmail.com');
    setCopiedEmail(true);
    toast.success('Email copied to clipboard');
    setTimeout(() => setCopiedEmail(false), 2000);
  }, []);

  const handleChangeEmail = useCallback(async () => {
    if (!newEmail.trim()) {
      setAccountError('Please enter a valid email address');
      return;
    }
    setAccountError(null);
    setAccountActionLoading(true);
    try {
      await updateEmail(newEmail.trim());
      toast.success('Email update requested. Check your inbox to confirm.');
      setAccountSubView('main');
      setNewEmail('');
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setAccountActionLoading(false);
    }
  }, [newEmail, updateEmail]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 8) {
      setAccountError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAccountError('Passwords do not match');
      return;
    }
    setAccountError(null);
    setAccountActionLoading(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password updated successfully');
      setAccountSubView('main');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setAccountActionLoading(false);
    }
  }, [newPassword, confirmPassword, updatePassword]);

  const handleDisconnectGoogle = useCallback(async () => {
    setAccountError(null);
    setAccountActionLoading(true);
    try {
      await disconnectGoogleIdentity();
      toast.info('Google sign-in disconnected');
      setAccountSubView('main');
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to disconnect Google');
    } finally {
      setAccountActionLoading(false);
    }
  }, [disconnectGoogleIdentity]);

  const handleConfirmDeleteAccount = useCallback(async () => {
    if (deleteCountdown > 0) return;
    setAccountActionLoading(true);
    try {
      await deleteAccount();
      handleClose();
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to delete account');
      setAccountActionLoading(false);
    }
  }, [deleteCountdown, deleteAccount, handleClose]);

  return (
    <>
      <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
        <div
          className="modal-content-animated"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 'min(100%, 520px)',
            background: 'var(--bg-card)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Settings</span>
            <button
              onClick={handleClose}
              type="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Top Segmented Tabs Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px',
            }}
          >
            {(
              [
                { id: 'appearance', label: 'Appearance', icon: Palette },
                { id: 'account', label: 'Account', icon: User },
                { id: 'about', label: 'About', icon: Info },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-label={tab.label}
                  title={tab.label}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setAccountSubView('main');
                    setAccountError(null);
                  }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'calc(12px - 4px)',
                    border: 'none',
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    color: isActive ? 'var(--flame)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '13px',
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Icon size={16} />
                  <span className="settings-tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Stacked Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
            {/* Appearance Panel */}
            <div
              style={{
                gridArea: '1 / 1 / 2 / 2',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                visibility: activeTab === 'appearance' ? 'visible' : 'hidden',
                opacity: activeTab === 'appearance' ? 1 : 0,
                pointerEvents: activeTab === 'appearance' ? 'auto' : 'none',
                transition: 'opacity 150ms ease',
              }}
            >
              {/* Theme Section */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Theme</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(
                    [
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'system', label: 'System', icon: Monitor },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const isSelected = theme === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-label={`${item.label} theme`}
                        title={`${item.label} theme`}
                        onClick={() => setTheme(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '10px 8px',
                          borderRadius: 'var(--radius-button)',
                          border: `1px solid ${isSelected ? 'var(--flame)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--flame-subtle)' : 'var(--bg-card)',
                          color: isSelected ? 'var(--flame)' : 'var(--text-secondary)',
                          fontSize: 13,
                          fontFamily: 'var(--font-sans)',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <Icon size={15} />
                        <span className="settings-theme-label">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout Mode */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Layout Mode</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {(
                    [
                      { id: '1col', label: '1 Column', icon: Square },
                      { id: 'masonry', label: 'Masonry', icon: LayoutGrid },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const isSelected = layoutMode === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLayoutMode(item.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '10px 8px',
                          borderRadius: 'var(--radius-button)',
                          border: `1px solid ${isSelected ? 'var(--flame)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--flame-subtle)' : 'var(--bg-card)',
                          color: isSelected ? 'var(--flame)' : 'var(--text-secondary)',
                          fontSize: 13,
                          fontFamily: 'var(--font-sans)',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <Icon size={15} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto-Hide Green Sync Dot */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Auto-hide green dot</span>
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
              {/* Profile Card */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-button)', background: 'var(--flame-subtle)', display: 'grid', placeItems: 'center', color: 'var(--flame)' }}>
                  <User size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--flame)',
                    color: '#ffffff',
                    fontSize: 14,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    border: '1px solid var(--flame)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Mail size={16} />
                  <span>Sign in / Create account</span>
                </button>
              ) : accountSubView === 'change_email' ? (
                /* Subview: Change Email */
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Mail size={16} color="var(--flame)" />
                    <span>Change email address</span>
                  </div>
                  <input
                    type="email"
                    placeholder="New email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                    }}
                  />
                  {accountError && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{accountError}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => { setAccountSubView('main'); setAccountError(null); }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={accountActionLoading}
                      onClick={handleChangeEmail}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--flame)',
                        border: '1px solid var(--flame)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: accountActionLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {accountActionLoading ? 'Sending...' : 'Update Email'}
                    </button>
                  </div>
                </div>
              ) : accountSubView === 'change_password' ? (
                /* Subview: Change Password */
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    <KeyRound size={16} color="var(--flame)" />
                    <span>Change password</span>
                  </div>
                  <input
                    type="password"
                    placeholder="New password (min. 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-input)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                    }}
                  />
                  {accountError && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{accountError}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => { setAccountSubView('main'); setAccountError(null); }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={accountActionLoading}
                      onClick={handleChangePassword}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--flame)',
                        border: '1px solid var(--flame)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: accountActionLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {accountActionLoading ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              ) : accountSubView === 'disconnect_google' ? (
                /* Subview: Disconnect Google */
                <div style={{ background: 'var(--bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>
                    <Unlink size={16} />
                    <span>Disconnect Google sign-in</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    After disconnecting, this account will no longer accept Google authentication. Make sure you have a password set to log in.
                  </p>
                  {accountError && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{accountError}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => { setAccountSubView('main'); setAccountError(null); }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={accountActionLoading}
                      onClick={handleDisconnectGoogle}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--red)',
                        border: '1px solid var(--red)',
                        color: '#ffffff',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: accountActionLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {accountActionLoading ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              ) : accountSubView === 'delete_confirm' ? (
                /* Subview: Delete Account Countdown */
                <div style={{ background: 'var(--bg)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius-card)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>
                    <Trash2 size={16} />
                    <span>Permanent Account Deletion</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    This action is permanent and irreversible. All your cloud notes and audio files will be deleted forever.
                  </p>
                  {accountError && <p style={{ color: 'var(--red)', fontSize: 12, margin: 0 }}>{accountError}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => { setAccountSubView('main'); setDeleteCountdown(10); setAccountError(null); }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deleteCountdown > 0 || accountActionLoading}
                      onClick={handleConfirmDeleteAccount}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: deleteCountdown > 0 ? 'var(--red-subtle)' : 'var(--red)',
                        border: `1px solid ${deleteCountdown > 0 ? 'var(--red-border)' : 'var(--red)'}`,
                        color: deleteCountdown > 0 ? 'var(--red)' : '#ffffff',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: deleteCountdown > 0 || accountActionLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {deleteCountdown > 0 ? `Wait ${deleteCountdown}s` : accountActionLoading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Default Main Account Actions */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => { setAccountSubView('change_email'); setAccountError(null); }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-button)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={16} color="var(--text-secondary)" />
                      <span>Change email</span>
                    </div>
                    <ChevronRight size={15} color="var(--text-secondary)" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAccountSubView('change_password'); setAccountError(null); }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-button)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <KeyRound size={16} color="var(--text-secondary)" />
                      <span>Change password</span>
                    </div>
                    <ChevronRight size={15} color="var(--text-secondary)" />
                  </button>

                  {hasGoogleLinked && (
                    <button
                      type="button"
                      onClick={() => { setAccountSubView('disconnect_google'); setAccountError(null); }}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        fontFamily: 'var(--font-sans)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Unlink size={16} color="var(--text-secondary)" />
                        <span>Disconnect Google sign-in</span>
                      </div>
                      <ChevronRight size={15} color="var(--text-secondary)" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={signOut}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-button)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LogOut size={16} color="var(--text-secondary)" />
                      <span>Sign out</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setAccountSubView('delete_confirm'); setDeleteCountdown(10); setAccountError(null); }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-button)',
                      background: 'var(--red-subtle)',
                      border: '1px solid var(--red-border)',
                      color: 'var(--red)',
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      marginTop: 4,
                      transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Trash2 size={16} />
                      <span>Delete account</span>
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
                <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-card)', background: 'var(--flame-subtle)', border: '1px solid var(--flame-border)', color: 'var(--flame)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                  <Flame size={32} strokeWidth={2} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Spark</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, margin: 0 }}>Version 1.0</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => window.open('mailto:zadnipro.ion.187@gmail.com?subject=Spark%20Feedback')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageCircle size={16} color="var(--text-secondary)" />
                    <span>Send feedback</span>
                  </div>
                  <ChevronRight size={15} color="var(--text-secondary)" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {copiedEmail ? <Check size={16} color="var(--green)" /> : <Copy size={16} color="var(--text-secondary)" />}
                    <span>Copy email address</span>
                  </div>
                  <span
                    className="settings-copy-email-address"
                    style={{
                      fontSize: 12,
                      color: copiedEmail ? 'var(--green)' : 'var(--flame)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {copiedEmail ? 'Copied!' : 'zadnipro.ion.187@gmail.com'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={16} color="var(--text-secondary)" />
                    <span>Terms & Conditions</span>
                  </div>
                  <ChevronRight size={15} color="var(--text-secondary)" />
                </button>

                <button
                  type="button"
                  onClick={() => window.open('https://github.com/ZadniproIon/spark-web', '_blank', 'noopener,noreferrer')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-button)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GitFork size={16} color="var(--text-secondary)" />
                    <span>GitHub Repository</span>
                  </div>
                </button>

                {/* Keyboard Shortcuts reference */}
                <div
                  style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
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
                    <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>N</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Toggle search</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>/</kbd>
                      <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Ctrl K</kbd>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Save note</span>
                    <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Ctrl Enter</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-primary)' }}>Close / dismiss</span>
                    <kbd style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-button)', padding: '2px 7px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </>
  );
}
