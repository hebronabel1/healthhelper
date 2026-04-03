import { useState } from 'react';

const ACCESS_CODE = 'HealthHelper2026';

export default function PasswordGate({ onUnlock, darkMode, toggleDark }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = () => {
    if (code === ACCESS_CODE) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2500);
      setCode('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        style={{
          position: 'fixed', top: 20, right: 20,
          background: 'var(--color-surface)',
          border: '1.5px solid var(--color-border)',
          borderRadius: '99px',
          padding: '8px 16px',
          fontSize: '13px',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
        }}
      >
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      <div style={{
        animation: shake ? 'shake 0.4s ease' : 'fadeUp 0.4s ease both',
        width: '100%', maxWidth: '420px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: '800',
            letterSpacing: '-1px',
          }}>
            <span style={{ color: 'var(--color-text)' }}>Health</span>
            <span style={{ color: 'var(--color-primary)' }}>Helper</span>
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '6px' }}>
            Your personal AI health guide
          </div>
        </div>

        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
              Enter Access Code
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Enter your code to get started
            </p>
          </div>

          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Access code"
            style={{
              marginBottom: '12px',
              borderColor: error ? 'var(--color-error)' : undefined,
              textAlign: 'center',
              fontSize: '16px',
              letterSpacing: '2px',
            }}
            autoFocus
          />

          {error && (
            <div style={{
              color: 'var(--color-error)',
              fontSize: '13px',
              textAlign: 'center',
              marginBottom: '12px',
              animation: 'fadeIn 0.2s ease',
            }}>
              Incorrect code. Try again.
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center' }}>
            Unlock
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}