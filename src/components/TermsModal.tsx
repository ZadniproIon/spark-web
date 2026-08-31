import { X, ShieldCheck } from 'lucide-react';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface TermsModalProps {
  onClose: () => void;
}

export function TermsModal({ onClose }: TermsModalProps) {
  const { isClosing, handleClose } = useModalAnimation(onClose);

  return (
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: '24px',
          padding: '28px',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 'var(--radius-button)', background: 'var(--flame-subtle)', color: 'var(--flame)', display: 'grid', placeItems: 'center' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Terms of Service & Privacy</h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>Last updated: August 2026 • Spark v1.0</p>
            </div>
          </div>

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

        {/* Scrollable Terms Content */}
        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            paddingRight: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            fontSize: 13,
            lineHeight: 1.6,
            color: 'var(--text-primary)',
          }}
        >
          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>1. Introduction & Acceptance</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Welcome to Spark. Spark is an independent software project developed and maintained by Ion Zadnipro (&quot;the Developer&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By accessing or using the Spark web application or mobile application (&quot;the Service&quot;), you agree to be bound by these Terms of Service and Privacy Policy. If you do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>2. Eligibility & Account Security</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              You may use Spark anonymously in Guest Mode or by creating an authenticated account using email/password or Google OAuth. You are responsible for safeguarding your login credentials and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>3. Data Privacy & Cloud Architecture</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              We believe in honest and transparent privacy practices:
            </p>
            <ul style={{ color: 'var(--text-secondary)', margin: '6px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using standard Transport Layer Security (HTTPS/TLS).</li>
              <li><strong>Backend Hosting:</strong> User accounts, notes, and audio files are hosted on Supabase cloud infrastructure with Row Level Security (RLS) policies enforcing that users can only access their own notes.</li>
              <li><strong>Administrative Access Disclosure:</strong> As with standard cloud-hosted databases, database administrators have technical access to operational database tables for maintenance and customer support. We will never read, monitor, or access your private notes unless explicitly requested by you for technical support or required by law.</li>
              <li><strong>No Data Monetization:</strong> We do not sell, rent, monetize, or train artificial intelligence models on your notes, text, or voice recordings.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>4. User Content & Intellectual Property</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              You retain 100% intellectual property ownership of all notes, text, audio recordings, and information you create or store in Spark. You grant us only the limited, non-exclusive license necessary to host, synchronize, cache, and display your notes solely to provide the Service to you.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>5. Voice Recordings & Audio Files</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Voice notes recorded within Spark are stored locally and uploaded to private cloud storage buckets for your personal playback. We do not perform speech profiling, voice recognition advertising, or share audio files with third-party advertising networks.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>6. Guest Mode & Offline Caching</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              When using Spark without an account, your notes and preferences reside entirely in your local browser/device storage (IndexedDB / LocalStorage / SQLite). If you clear your browser cache or app data while in Guest Mode, unauthenticated local notes may be permanently lost.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>7. Recycle Bin & Data Retention</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Notes moved to the Recycle Bin are held for 30 days before being automatically purged. You can restore or permanently delete notes at any time prior to expiration.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>8. Acceptable Use Policy</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              You agree not to misuse the Service, including attempting to breach or circumvent server security, reverse engineer backend endpoints, perform denial-of-service attacks, or abuse storage resources with automated scripts.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>9. Third-Party Services</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Spark relies on trusted third-party infrastructure providers including Supabase Inc. (cloud database, authentication, and file storage) and Google LLC (optional Google OAuth sign-in). These providers process data in accordance with their respective privacy and security standards.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>10. Disclaimer of Warranties (&quot;As-Is&quot;)</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. While we take every reasonable measure to ensure reliability and data safety, we cannot guarantee 100% uninterrupted uptime or zero data corruption under all network conditions.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>11. Limitation of Liability</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              To the maximum extent permitted by applicable law, the Developer shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data or profits, arising out of or related to your use of the Service.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>12. Account Deletion & Contact</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              You may permanently delete your account and all associated cloud notes at any time through the Account settings. If you have any questions or feedback regarding these terms, please contact us at: <a href="mailto:zadnipro.ion.187@gmail.com" style={{ color: 'var(--flame)', textDecoration: 'underline' }}>zadnipro.ion.187@gmail.com</a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-button)',
              background: 'var(--flame)',
              border: '1px solid var(--flame)',
              color: '#ffffff',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
