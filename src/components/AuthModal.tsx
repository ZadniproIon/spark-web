import { useState, useCallback } from 'react';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const { isClosing, handleClose } = useModalAnimation(onClose);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } = useAuth();

  const handleSubmit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (isForgotPassword) {
        await sendPasswordReset(email);
        setResetSent(true);
      } else if (isSignUp) {
        await signUpWithEmail(email, password);
        onClose();
      } else {
        await signInWithEmail(email, password);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [isSignUp, isForgotPassword, email, password, signInWithEmail, signUpWithEmail, sendPasswordReset, onClose]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }, [signInWithGoogle, onClose]);

  return (
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '32px',
          width: 'min(100%, 460px)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {isForgotPassword ? 'Reset password' : isSignUp ? 'Create account' : 'Sign in'}
          </span>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(225,29,72,0.1)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {resetSent ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>Check your email for a password reset link.</p>
            <button onClick={handleClose} style={{ fontSize: 14, color: 'var(--flame)', background: 'none', border: 'none', cursor: 'pointer' }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    outline: 'none',
                  }}
                />
              </div>
              {!isForgotPassword && (
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 40px 12px 40px',
                      fontSize: 14,
                      color: 'var(--text-primary)',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              )}
            </div>

            {!isSignUp && !isForgotPassword && (
              <button
                onClick={() => setIsForgotPassword(true)}
                style={{ fontSize: 13, color: 'var(--flame)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, display: 'block' }}
              >
                Forgot password?
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !email || (!isForgotPassword && !password)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: 'var(--flame)',
                border: 'none',
                borderRadius: 14,
                cursor: loading || !email || (!isForgotPassword && !password) ? 'not-allowed' : 'pointer',
                opacity: loading || !email || (!isForgotPassword && !password) ? 0.6 : 1,
                marginBottom: 12,
              }}
            >
              {loading ? 'Please wait...' : isForgotPassword ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              onClick={handleGoogle}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg> Continue with Google
            </button>

            {!isForgotPassword && (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  style={{ color: 'var(--flame)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
              </div>
            )}

            {isForgotPassword && (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                <button onClick={() => setIsForgotPassword(false)} style={{ color: 'var(--flame)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                  Back to sign in
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
