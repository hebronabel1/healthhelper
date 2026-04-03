import { useState } from 'react';
import ModifyWeight from './ModifyWeight.jsx';
import FeelGood from './FeelGood.jsx';
import CleanseBody from './CleanseBody.jsx';
import EatHealthier from './EatHealthier.jsx';

const GOALS = [
  { id: 'cleanse', label: 'Cleanse Skin & Body', icon: '✨', desc: 'Flush out toxins and support your body through food' },
  { id: 'feelgood', label: 'Feel Good', icon: '😊', desc: 'Eat to support your energy, mood, and how you feel day to day' },
  { id: 'modify', label: 'Modify Weight', icon: '⚖️', desc: 'Lose or gain weight with a practical, realistic approach' },
  { id: 'healthier', label: 'Overall Eat Healthier', icon: '🥦', desc: 'Build better eating habits with a diet that fits your lifestyle' },
];

export default function Diet({ onBack }) {
  const [goal, setGoal] = useState(null);

  if (goal === 'modify') return <ModifyWeight onBack={() => setGoal(null)} />;
  if (goal === 'feelgood') return <FeelGood onBack={() => setGoal(null)} />;
  if (goal === 'cleanse') return <CleanseBody onBack={() => setGoal(null)} />;
  if (goal === 'healthier') return <EatHealthier onBack={() => setGoal(null)} />;

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>
        ← Back
      </button>

      <div style={{ marginBottom: '36px' }}>
        <h1 className="step-heading">Diet</h1>
        <p className="step-sub">What's your diet goal? Pick one to get started.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {GOALS.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            style={{
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              transition: 'all 0.2s ease',
              animation: `fadeUp 0.35s ease ${i * 0.06}s both`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = ''; }}
          >
            <span style={{ fontSize: '28px' }}>{g.icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '16px', marginBottom: '3px' }}>{g.label}</div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{g.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}