const MODULES = [
  {
    id: 'diet',
    icon: '🥗',
    title: 'Diet',
    desc: 'Get a personalized diet plan based on your goals — lose weight, feel better, cleanse your body, or just eat healthier.',
    color: '#22C55E',
  },
  {
    id: 'workout',
    icon: '💪',
    title: 'Workout Planner',
    desc: 'Build a workout routine tailored to your goals, fitness level, and schedule.',
    color: '#F97316',
  },
  {
    id: 'diagnose',
    icon: '🔍',
    title: 'Diagnose',
    desc: 'Describe what you\'re struggling with and get evidence-backed suggestions on what may help.',
    color: '#3B82F6',
  },
  {
    id: 'supplements',
    icon: '💊',
    title: 'Supplements',
    desc: 'Get supplement recommendations based on your goals, with clear reasoning and dosage guidance.',
    color: '#A855F7',
  },
];

export default function Home({ onNavigate }) {
  return (
    <div className="container" style={{ paddingTop: '48px' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '52px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: '800',
          letterSpacing: '-1px',
          marginBottom: '14px',
          lineHeight: '1.15',
        }}>
          How can I help you?
        </h1>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: '16px',
          maxWidth: '440px',
          margin: '0 auto',
          lineHeight: '1.6',
        }}>
          Choose a category below and answer a few questions. I'll generate a personalized guide just for you.
        </p>
      </div>

      {/* Module cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
      }}>
        {MODULES.map((mod, i) => (
          <button
            key={mod.id}
            onClick={() => onNavigate(mod.id)}
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '28px 24px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              animation: `fadeUp 0.4s ease ${i * 0.07}s both`,
              boxShadow: 'var(--shadow)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = mod.color;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            {/* Icon */}
            <div style={{
              width: '52px', height: '52px',
              borderRadius: '14px',
              background: mod.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
              marginBottom: '16px',
            }}>
              {mod.icon}
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: '700',
              marginBottom: '8px',
              color: 'var(--color-text)',
            }}>
              {mod.title}
            </h2>
            <p style={{
              color: 'var(--color-text-muted)',
              fontSize: '14px',
              lineHeight: '1.6',
            }}>
              {mod.desc}
            </p>

            <div style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: mod.color,
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'var(--font-display)',
            }}>
              Get started <span>→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}