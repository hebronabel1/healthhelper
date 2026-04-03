import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const GOALS = [
  'Better Sleep','Bone & Joint Health','Build Muscle','Digestive Health',
  'Energy & Focus','Heart Health','Immune Support','Mental Clarity',
  'Reduce Inflammation','Stress & Anxiety Relief',
];
const DIETARY = ['Gluten-Free','Halal','Keto','Lactose Intolerant','Nuts Allergy','Other','Vegan','Vegetarian'];
const DOSAGE_UNITS = ['g (grams)','IU (International Units)','mcg (micrograms)','mg (milligrams)','tbsp (tablespoon)','tsp (teaspoon)'];

export default function Supplements({ onBack }) {
  const [step, setStep] = useState('yn'); // 'yn' | 'entry' | 'goals' | 'details'
  const [takingSupps, setTakingSupps] = useState(null);
  const [currentSupps, setCurrentSupps] = useState([]); // { name, dosage, unit }
  const [suppInput, setSuppInput] = useState({ name: '', dosage: '', unit: 'mg (milligrams)' });
  const [goals, setGoals] = useState([]);
  const [details, setDetails] = useState({ level: '', age: '', allergies: '', medications: '', dietary: [] });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggleGoal = (g) => {
    setGoals(prev => {
      if (prev.includes(g)) return prev.filter(x => x !== g);
      if (prev.length >= 3) return prev;
      return [...prev, g];
    });
  };

  const toggleDietary = (d) => setDetails(f => ({ ...f, dietary: f.dietary.includes(d) ? f.dietary.filter(x => x !== d) : [...f.dietary, d] }));

  const addSupp = () => {
    if (!suppInput.name.trim()) return;
    setCurrentSupps(s => [...s, { name: suppInput.name.trim(), dosage: suppInput.dosage, unit: suppInput.unit }]);
    setSuppInput({ name: '', dosage: '', unit: 'mg (milligrams)' });
  };

  const removeSupp = (i) => setCurrentSupps(s => s.filter((_, idx) => idx !== i));

  const handleGenerate = async () => {
    if (!goals.length || !details.level || !details.age) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const dietary = details.dietary.length ? details.dietary.join(', ') : 'None';
      const suppsList = currentSupps.length
        ? currentSupps.map(s => `${s.name} (${s.dosage} ${s.unit})`).join(', ')
        : 'None';

      const prompt = `The user wants supplement recommendations. Their details:
- Goals: ${goals.join(', ')}
- Activity level: ${details.level}
- Age: ${details.age}
- Known allergies: ${details.allergies || 'None'}
- Current medications: ${details.medications || 'None'}
- Dietary restrictions: ${dietary}
- Current supplements they take: ${suppsList}

Generate a detailed supplement guide with these sections:

1. YOUR 7 RECOMMENDED SUPPLEMENTS
List exactly 7 supplements (NO brand names — generic supplement names only) that best support their goals: ${goals.join(', ')}.

For EACH supplement, provide all of the following:
- SUPPLEMENT NAME (as a clear heading)
- RECOMMENDED DOSAGE RANGE: Give a specific range (e.g. 200–400mg daily). Explain when to take it.
- WHAT IT DOES: Explain in plain English how it helps their specific goals. Use a simple analogy if helpful. Be specific about the mechanism.
- WHAT TO TAKE IT WITH: Explain what foods, other supplements, or timing boosts absorption and effectiveness.
- FORMS AVAILABLE: List the different forms (capsule, powder, liquid, gummy, etc.) and briefly note if any form is better absorbed than others.

${currentSupps.length > 0 ? `
2. YOUR CURRENT SUPPLEMENTS — WHAT TO KNOW
Analyze their current supplement stack: ${suppsList}.
Explain what each one does, whether the dosage they're taking is within a reasonable range, and how it interacts (positively or negatively) with the 7 recommendations above. Flag any overlaps, redundancies, or potential conflicts.
` : ''}

Write in plain English throughout. If any supplement name or term sounds complicated, explain it right away. Be honest — if something has mixed evidence, say so. Always remind the user to consult a doctor before starting new supplements, especially given their medications: ${details.medications || 'none listed'}.`;

      const result = await callAI({ system: BASE_SYSTEM, prompt });
      setOutput(result);
    } catch (e) {
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
    const doc = generatePDF({
      title: 'Supplement Recommendations',
      subtitle: `Goals: ${goals.join(', ')}`,
      sections,
      disclaimer: 'Always consult a qualified healthcare provider before starting any new supplement, especially if you are on medications.',
    });
    downloadPDF(doc, 'healthhelper-supplements.pdf');
  };

  // ─── Output screen ───
  if (output && !loading) {
    return (
      <OutputDisplay
        output={output}
        onDownloadPDF={handlePDF}
        pdfLabel="Download Supplement Guide PDF"
        onBack={() => setOutput('')}
        onStartOver={() => {
          setOutput(''); setStep('yn'); setTakingSupps(null);
          setCurrentSupps([]); setGoals([]);
          setDetails({ level: '', age: '', allergies: '', medications: '', dietary: [] });
          setError('');
        }}
      />
    );
  }

  // ─── STEP: Yes / No ───
  if (step === 'yn') {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
        <h1 className="step-heading">Supplements</h1>
        <p className="step-sub">Let's personalize your recommendations. First — are you currently taking any supplements?</p>
        <div className="yn-buttons" style={{ maxWidth: '400px' }}>
          <button className={`yn-btn${takingSupps === false ? ' active' : ''}`} onClick={() => { setTakingSupps(false); setStep('goals'); }}>
            No, I'm not
          </button>
          <button className={`yn-btn${takingSupps === true ? ' active' : ''}`} onClick={() => { setTakingSupps(true); setStep('entry'); }}>
            Yes, I am
          </button>
        </div>
      </div>
    );
  }

  // ─── STEP: Supplement Entry ───
  if (step === 'entry') {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <button className="btn-secondary" onClick={() => setStep('yn')} style={{ marginBottom: '28px' }}>← Back</button>
        <h1 className="step-heading">Your Current Supplements</h1>
        <p className="step-sub">Add each supplement you currently take. This helps us tailor recommendations and flag any conflicts.</p>

        {/* Entry form */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Supplement Name</label>
            <input
              type="text"
              placeholder="e.g. Vitamin D, Creatine, Fish Oil..."
              value={suppInput.name}
              onChange={e => setSuppInput(s => ({ ...s, name: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && addSupp()}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Dosage <span className="optional">(optional)</span></label>
            <div className="dosage-row">
              <input
                type="number"
                placeholder="e.g. 500"
                value={suppInput.dosage}
                onChange={e => setSuppInput(s => ({ ...s, dosage: e.target.value }))}
                style={{ width: '100px' }}
              />
              <select value={suppInput.unit} onChange={e => setSuppInput(s => ({ ...s, unit: e.target.value }))}>
                {DOSAGE_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <button
            className="btn-green"
            onClick={addSupp}
            disabled={!suppInput.name.trim()}
          >
            + Add Supplement
          </button>
        </div>

        {/* Added supplements list */}
        {currentSupps.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div className="form-label" style={{ marginBottom: '10px' }}>Added ({currentSupps.length}):</div>
            {currentSupps.map((s, i) => (
              <div key={i} className="supp-entry">
                <span>
                  <strong>{s.name}</strong>
                  {s.dosage && <span style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginLeft: '8px' }}>{s.dosage} {s.unit}</span>}
                </span>
                <button className="remove-btn" onClick={() => removeSupp(i)}>×</button>
              </div>
            ))}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={() => setStep('goals')}
          disabled={currentSupps.length === 0}
        >
          Continue →
        </button>
      </div>
    );
  }

  // ─── STEP: Goals ───
  if (step === 'goals') {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <button className="btn-secondary" onClick={() => setStep(takingSupps ? 'entry' : 'yn')} style={{ marginBottom: '28px' }}>← Back</button>
        <h1 className="step-heading">What Are Your Goals?</h1>
        <p className="step-sub">Pick up to 3 goals. We'll recommend supplements that target these areas.</p>

        <div className="form-group">
          <label className="form-label">Select your goals <span className="optional">(max 3)</span></label>
          <div className="chips">
            {GOALS.map(g => (
              <button
                key={g}
                className={`chip${goals.includes(g) ? ' selected' : ''}`}
                style={{ opacity: !goals.includes(g) && goals.length >= 3 ? 0.4 : 1 }}
                onClick={() => toggleGoal(g)}
              >
                {g}
              </button>
            ))}
          </div>
          {goals.length > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Selected: {goals.join(', ')}
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={() => setStep('details')} disabled={goals.length === 0}>
          Continue →
        </button>
      </div>
    );
  }

  // ─── STEP: Personal Details ───
  if (step === 'details') {
    return (
      <div className="container" style={{ paddingTop: '40px' }}>
        <button className="btn-secondary" onClick={() => setStep('goals')} style={{ marginBottom: '28px' }}>← Back</button>
        <h1 className="step-heading">A Few More Details</h1>
        <p className="step-sub">This helps us personalize your recommendations and flag any important interactions.</p>

        <div className="form-group">
          <label className="form-label">Activity Level</label>
          <div className="chips">
            {['Beginner','Intermediate','Advanced'].map(l => (
              <button key={l} className={`chip${details.level === l ? ' selected' : ''}`} onClick={() => setDetails(f => ({ ...f, level: l }))}>{l}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Age</label>
          <input type="number" placeholder="e.g. 25" value={details.age} onChange={e => setDetails(f => ({ ...f, age: e.target.value }))} style={{ maxWidth: '180px' }} />
        </div>

        <div className="form-group">
          <label className="form-label">Gender</label>
          <div className="chips">
            {['Male','Female'].map(g => (
              <button key={g} className={`chip${details.gender === g ? ' selected' : ''}`} onClick={() => setDetails(f => ({ ...f, gender: g }))}>{g}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Dietary Restrictions <span className="optional">(optional)</span></label>
          <div className="chips">
            {DIETARY.map(d => (
              <button key={d} className={`chip${details.dietary.includes(d) ? ' selected' : ''}`} onClick={() => toggleDietary(d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Known Allergies <span className="optional">(optional)</span></label>
          <input type="text" placeholder="e.g. shellfish, soy..." value={details.allergies} onChange={e => setDetails(f => ({ ...f, allergies: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">Current Medications <span className="optional">(optional — helps flag interactions)</span></label>
          <input type="text" placeholder="e.g. blood pressure medication, metformin..." value={details.medications} onChange={e => setDetails(f => ({ ...f, medications: e.target.value }))} />
        </div>

        {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        <button className="btn-green" onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generating...' : '💊 Get My Supplement Recommendations'}
        </button>

        {loading && <div className="loading-wrap"><div className="spinner" /><span>Building your supplement guide...</span></div>}
      </div>
    );
  }

  return null;
}