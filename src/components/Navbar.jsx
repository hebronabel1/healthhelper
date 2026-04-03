export default function Navbar({ onLogoClick, darkMode, toggleDark }) {
  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '64px',
      background: 'var(--color-surface)',
      borderBottom: '1.5px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      zIndex: 100,
      boxShadow: 'var(--shadow)',
    }}>
      {/* Logo */}
      <button
        onClick={onLogoClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: '800',
          letterSpacing: '-0.5px',
          padding: 0,
        }}
      >
        <span style={{ color: 'var(--color-text)' }}>Health</span>
        <span style={{ color: 'var(--color-primary)' }}>Helper</span>
      </button>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        style={{
          background: 'var(--color-surface-2)',
          border: '1.5px solid var(--color-border)',
          borderRadius: '99px',
          padding: '7px 16px',
          fontSize: '13px',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>
    </nav>
  );
}