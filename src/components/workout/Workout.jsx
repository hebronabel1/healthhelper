import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const GOALS = [
  { id: 'muscle', label: 'Build Muscle', icon: '💪', desc: 'Pack on lean muscle with a plan built around your schedule and fitness level' },
  { id: 'endurance', label: 'Improve Endurance', icon: '🏃', desc: 'Build the stamina to go longer, feel stronger, and recover faster' },
  { id: 'losefat', label: 'Lose Fat', icon: '🔥', desc: 'Burn fat with a plan that balances cardio, resistance training, and diet' },
  { id: 'sport', label: 'Train for a Sport', icon: '🏅', desc: 'Sport-specific training to improve your performance on the field or court' },
];

const DAYS = ['1','2','3','4','5','6','7'];
const MUSCLE_GOALS_OPTS = ['5–10 lbs','10–20 lbs','20+ lbs'];
const ENDURANCE_REASONS = ['Everyday Activities Feel Easier','General Fitness','Run a 5K / 10K / Marathon','Survive Longer Workouts'];
const CARDIO_OPTS = ['Cycling','Running','Stairmaster','Swimming','Walking'];
const FAT_REASONS = ['Better Mobility & Movement','Health Reasons (heart, diabetes, etc.)','Look Better'];
const DIETARY = ['Gluten-Free','Halal','Keto','Lactose Intolerant','Nuts Allergy','Other','Vegan','Vegetarian'];
const TIMELINE = ['1–3 months','3–6 months','6–12 months','1+ years'];
const SPORTS = ['Basketball','Football','MMA / Boxing','Running / Track','Soccer'];
const ATTRIBUTES = ['Agility & Quickness','Endurance & Stamina','Explosiveness & Power','Flexibility & Mobility','Strength'];

const INITIAL_FORM = {
  level: '', days: '',
  muscleGoal: '',
  enduranceReasons: [], cardio: [],
  fatReasons: [], currentWeight: '', goalWeight: '', weightUnit: 'lbs', dietary: [], timeline: '',
  sport: '', attributes: [],
};

export default function Workout({ onBack }) {
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [phase, setPhase] = useState('select');
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const has = (id) => selectedGoals.includes(id);

  const toggleGoal = (id) => {
    setSelectedGoals(prev => {
      if (prev.includes(id)) return prev.filter(g => g !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const toggleArr = (key, val) =>
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const toggleMax2 = (key, val) => {
    setForm(f => {
      if (f[key].includes(val)) return { ...f, [key]: f[key].filter(x => x !== val) };
      if (f[key].length >= 2) return f;
      return { ...f, [key]: [...f[key], val] };
    });
  };

  const validate = () => {
    if (!form.level) return 'Please select your fitness / skill level.';
    if (!form.days) return 'Please select days available per week.';
    if (has('muscle') && !form.muscleGoal) return 'Please select your muscle gain goal.';
    if (has('endurance') && (!form.enduranceReasons.length || !form.cardio.length))
      return 'Please fill in all endurance fields.';
    if (has('losefat') && (!form.fatReasons.length || !form.currentWeight || !form.goalWeight || !form.timeline))
      return 'Please fill in all fat loss fields.';
    if (has('sport') && (!form.sport || !form.attributes.length))
      return 'Please fill in all sport training fields.';
    return null;
  };

  const buildPrompt = () => {
    const goalLabels = selectedGoals.map(id => GOALS.find(g => g.id === id).label).join(' AND ');
    let p = `The user wants to achieve the following workout goal(s): ${goalLabels}.\n\n`;

    if (has('muscle')) {
      p += `Build Muscle details:\n- Fitness level: ${form.level}\n- Days per week: ${form.days}\n- Muscle gain goal: ${form.muscleGoal}\n\n`;
    }
    if (has('endurance')) {
      p += `Improve Endurance details:\n- Goals: ${form.enduranceReasons.join(', ')}\n- Activity level: ${form.level}\n- Days per week: ${form.days}\n- Preferred cardio: ${form.cardio.join(', ')}\n\n`;
    }
    if (has('losefat')) {
      const diet = form.dietary.length ? form.dietary.join(', ') : 'None';
      p += `Lose Fat details:\n- Why: ${form.fatReasons.join(', ')}\n- Current weight: ${form.currentWeight} ${form.weightUnit}\n- Goal weight: ${form.goalWeight} ${form.weightUnit}\n- Days per week: ${form.days}\n- Fitness level: ${form.level}\n- Dietary restrictions: ${diet}\n- Timeline: ${form.timeline}\n\n`;
    }
    if (has('sport')) {
      p += `Train for Sport details:\n- Sport: ${form.sport}\n- Attributes to improve: ${form.attributes.join(', ')}\n- Skill level: ${form.level}\n\n`;
    }

    if (selectedGoals.length === 1 && has('muscle')) {
      p += `Generate a detailed muscle-building guide with these sections:\n1. CALORIE & PROTEIN TARGETS\n2. YOUR WEEKLY WORKOUT SPLIT\n3. WEIGHTLIFTING VS CALISTHENICS\n4. CONSISTENCY IS EVERYTHING`;
    } else if (selectedGoals.length === 1 && has('endurance')) {
      p += `Generate a detailed endurance guide with these sections:\n1. YOUR WEEKLY ROUTINE\n2. STRETCHES THAT HELP\n3. HABITS THAT OPTIMIZE YOUR PERFORMANCE\n4. WHAT TO AVOID`;
    } else if (selectedGoals.length === 1 && has('losefat')) {
      p += `Generate a detailed fat loss guide with these sections:\n1. ENERGY EXPENDITURE VS CALORIE INTAKE\n2. WAYS TO BURN CALORIES\n3. WATCH OUT — AGGRESSIVE TACTICS\n4. FOODS THAT HELP`;
    } else if (selectedGoals.length === 1 && has('sport')) {
      p += `Generate a detailed sport-specific training guide with these sections:\n1. SPORT-SPECIFIC DRILLS & EXERCISES\n2. PLYOMETRICS\n3. WHAT TO EAT TO FUEL YOUR PERFORMANCE\n4. RECOVERY TIPS\n5. WHAT TO AVOID`;
    } else {
      p += `Generate a comprehensive combined guide that addresses ALL of the user's goals. Create clearly labeled sections for each goal's plan. Include a HOW TO COMBINE THEM section that integrates both goals into a single cohesive weekly schedule.`;
    }

    p += `\n\nWrite in plain English. Use simple analogies. Be specific and practical throughout.`;
    return p;
  };

  const handleGenerate = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const result = await callAI({ system: BASE_SYSTEM, prompt: buildPrompt() });
      setOutput(result);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = () => {
    const sections = output.split('\n\n').filter(Boolean).map(block => {
      const lines = block.split('\n');
      return { heading: lines[0].replace(/^#+\s*/, ''), content: lines.slice(1).join('\n').trim() || lines[0] };
    });
    const goalLabels = selectedGoals.map(id => GOALS.find(g => g.id === id).label).join(' + ');
    const doc = generatePDF({
      title: `Workout Plan: ${goalLabels}`,
      subtitle: `${form.level}${form.days ? ' | ' + form.days + ' days/week' : ''}`,
      sections,
    });
    downloadPDF(doc, 'healthhelper-workout.pdf');
  };

  const handleStartOver = () => {
    setOutput('');
    setForm(INITIAL_FORM);
    setSelectedGoals([]);
    setPhase('select');
    setError('');
  };

  // ── Output screen ──
  if (output && !loading) {
    return (
      <OutputDisplay
        output={output}
        onDownloadPDF={handlePDF}
        pdfLabel="Download Workout Plan PDF"
        onBack={() => setOutput('')}
        onStartOver={handleStartOver}
      />
    );
  }

  // ── Goal selection screen ──
  if (phase === 'select') {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
        <h1 className="step-heading">Workout Planner</h1>
        <p className="step-sub">What are your workout goals? Pick up to 2 to get started.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
          {GOALS.map((g, i) => {
            const selected = has(g.id);
            const disabled = !selected && selectedGoals.length >= 2;
            return (
              <button
                key={g.id}
                onClick={() => !disabled && toggleGoal(g.id)}
                style={{
                  background: selected ? 'rgba(34,197,94,0.08)' : 'var(--color-surface)',
                  border: `1.5px solid ${selected ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '20px 24px',
                  textAlign: 'left',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '18px',
                  transition: 'all 0.2s ease',
                  animation: `fadeUp 0.35s ease ${i * 0.06}s both`,
                  opacity: disabled ? 0.45 : 1,
                }}
              >
                <span style={{ fontSize: '28px' }}>{g.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '16px', marginBottom: '3px', color: 'var(--color-text)' }}>{g.label}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{g.desc}</div>
                </div>
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: `2px solid ${selected ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                  background: selected ? 'var(--color-secondary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', flexShrink: 0,
                }}>
                  {selected ? '✓' : ''}
                </span>
              </button>
            );
          })}
        </div>

        <button
          className="btn-green"
          onClick={() => selectedGoals.length > 0 && setPhase('form')}
          disabled={selectedGoals.length === 0}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Continue →
        </button>
      </div>
    );
  }

  // ── Combined form screen ──
  const goalLabels = selectedGoals.map(id => GOALS.find(g => g.id === id).label).join(' + ');

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={() => setPhase('select')} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">{goalLabels}</h1>
      <p className="step-sub">Fill in your details and we'll build your personalized workout plan.</p>

      {/* Fitness / Skill Level */}
      <div className="form-group">
        <label className="form-label">{has('sport') ? 'Skill Level' : 'Fitness Level'}</label>
        <div className="chips">
          {['Beginner','Intermediate','Advanced'].map(l => (
            <button key={l} className={`chip${form.level === l ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, level: l }))}>{l}</button>
          ))}
        </div>
      </div>

      {/* Sport-specific fields */}
      {has('sport') && <>
        <div className="form-group">
          <label className="form-label">Which sport?</label>
          <div className="chips">
            {SPORTS.map(s => (
              <button key={s} className={`chip${form.sport === s ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, sport: s }))}>{s}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">What do you want to improve physically? <span className="optional">(max 2)</span></label>
          <div className="chips">
            {ATTRIBUTES.map(a => (
              <button key={a} className={`chip${form.attributes.includes(a) ? ' selected' : ''}`}
                style={{ opacity: !form.attributes.includes(a) && form.attributes.length >= 2 ? 0.4 : 1 }}
                onClick={() => toggleMax2('attributes', a)}>{a}</button>
            ))}
          </div>
        </div>
      </>}

      {/* Endurance-specific fields */}
      {has('endurance') && <>
        <div className="form-group">
          <label className="form-label">What are you improving endurance for? <span className="optional">(max 2)</span></label>
          <div className="chips">
            {ENDURANCE_REASONS.map(r => (
              <button key={r} className={`chip${form.enduranceReasons.includes(r) ? ' selected' : ''}`}
                style={{ opacity: !form.enduranceReasons.includes(r) && form.enduranceReasons.length >= 2 ? 0.4 : 1 }}
                onClick={() => toggleMax2('enduranceReasons', r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Preferred Method of Cardio <span className="optional">(max 2)</span></label>
          <div className="chips">
            {CARDIO_OPTS.map(c => (
              <button key={c} className={`chip${form.cardio.includes(c) ? ' selected' : ''}`}
                style={{ opacity: !form.cardio.includes(c) && form.cardio.length >= 2 ? 0.4 : 1 }}
                onClick={() => toggleMax2('cardio', c)}>{c}</button>
            ))}
          </div>
        </div>
      </>}

      {/* Fat loss-specific fields */}
      {has('losefat') && <>
        <div className="form-group">
          <label className="form-label">Why do you want to lose fat?</label>
          <div className="chips">
            {FAT_REASONS.map(r => (
              <button key={r} className={`chip${form.fatReasons.includes(r) ? ' selected' : ''}`} onClick={() => toggleArr('fatReasons', r)}>{r}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Current Weight</label>
          <div className="unit-input">
            <input type="number" placeholder="e.g. 200" value={form.currentWeight} onChange={e => setForm(f => ({ ...f, currentWeight: e.target.value }))} />
            <select value={form.weightUnit} onChange={e => setForm(f => ({ ...f, weightUnit: e.target.value }))}>
              <option>lbs</option><option>kg</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Goal Weight</label>
          <div className="unit-input">
            <input type="number" placeholder="e.g. 175" value={form.goalWeight} onChange={e => setForm(f => ({ ...f, goalWeight: e.target.value }))} />
            <select value={form.weightUnit} onChange={e => setForm(f => ({ ...f, weightUnit: e.target.value }))}>
              <option>lbs</option><option>kg</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Dietary Restrictions <span className="optional">(optional)</span></label>
          <div className="chips">
            {DIETARY.map(d => (
              <button key={d} className={`chip${form.dietary.includes(d) ? ' selected' : ''}`} onClick={() => toggleArr('dietary', d)}>{d}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">How soon do you want to reach your goal?</label>
          <div className="chips">
            {TIMELINE.map(t => (
              <button key={t} className={`chip${form.timeline === t ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, timeline: t }))}>{t}</button>
            ))}
          </div>
        </div>
      </>}

      {/* Muscle-specific field */}
      {has('muscle') && (
        <div className="form-group">
          <label className="form-label">How much muscle do you want to gain?</label>
          <div className="chips">
            {MUSCLE_GOALS_OPTS.map(g => (
              <button key={g} className={`chip${form.muscleGoal === g ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, muscleGoal: g }))}>{g}</button>
            ))}
          </div>
        </div>
      )}

      {/* Shared: Days */}
      <div className="form-group">
        <label className="form-label">Days Available Per Week</label>
        <select value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} style={{ maxWidth: '200px' }}>
          <option value="">Select days</option>
          {DAYS.map(d => <option key={d} value={d}>{d} {d === '1' ? 'day' : 'days'}</option>)}
        </select>
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-green" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : '✨ Generate My Workout Plan'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Building your personalized workout plan...</span></div>}
    </div>
  );
}
