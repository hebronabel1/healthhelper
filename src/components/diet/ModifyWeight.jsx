import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const DIETARY = ['Gluten-Free','Halal','Keto','Lactose Intolerant','Nuts Allergy','Other','Vegan','Vegetarian'];

export default function ModifyWeight({ onBack }) {
  const [direction, setDirection] = useState(null); // 'lose' | 'gain'
  const [form, setForm] = useState({ currentWeight: '', goalWeight: '', weightUnit: 'lbs', height: '', heightUnit: 'ft', gender: '', dietary: [] });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggleDietary = (opt) => {
    setForm(f => ({ ...f, dietary: f.dietary.includes(opt) ? f.dietary.filter(x => x !== opt) : [...f.dietary, opt] }));
  };

  const handleGenerate = async () => {
    if (!direction || !form.currentWeight || !form.goalWeight || !form.height || !form.gender) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const dietary = form.dietary.length ? form.dietary.join(', ') : 'None';
      const prompt = `The user wants to ${direction === 'lose' ? 'lose' : 'gain'} weight. Here are their details:
- Current weight: ${form.currentWeight} ${form.weightUnit}
- Goal weight: ${form.goalWeight} ${form.weightUnit}
- Height: ${form.height} ${form.heightUnit}
- Gender: ${form.gender}
- Dietary restrictions: ${dietary}

Generate a detailed, personalized guide to help them ${direction === 'lose' ? 'lose' : 'gain'} weight. Structure it with these clearly labeled sections:

${direction === 'lose' ? `
1. UNDERSTANDING CALORIE DEFICITS
Explain what a calorie deficit is and how it works for this person specifically. Use a simple analogy (like a bank account or gas tank). Be specific about what a reasonable deficit looks like for their stats.

2. INCORPORATING CARDIO
Give a specific weekly cardio plan. Don't just say "do cardio" — say exactly what, how often, and for how long. Give examples tailored to a beginner who might not love the gym.

3. HIGH-VOLUME, LOW-CALORIE FOODS
List specific foods they should eat that are filling, healthy, and low in calories. Explain why each one works. Account for their dietary restrictions: ${dietary}.
` : `
1. UNDERSTANDING CALORIE SURPLUSES
Explain what a calorie surplus is and how it leads to weight gain. Use a simple analogy. Be specific about what a healthy surplus looks like for their stats.

2. WEIGHT LIFTING TO BUILD MUSCLE
Give a specific weekly lifting plan. Explain why muscle matters for healthy weight gain. Include beginner-friendly exercises with examples.

3. CALORIE-DENSE HEALTHY FOODS
List specific foods they should eat to hit their calorie goals without eating junk. Explain why each one is a good choice. Account for their dietary restrictions: ${dietary}.
`}

4. CONSISTENCY IS EVERYTHING
Close with an honest, encouraging paragraph about why consistency matters more than perfection. Keep it real — no fluff.

Write in plain English. Use simple analogies. Be specific with examples. Reference their stats where relevant.`;

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
      title: `${direction === 'lose' ? 'Lose' : 'Gain'} Weight Guide`,
      subtitle: `Current: ${form.currentWeight}${form.weightUnit} → Goal: ${form.goalWeight}${form.weightUnit} | ${form.gender}`,
      sections,
    });
    downloadPDF(doc, `healthhelper-${direction}-weight.pdf`);
  };

  if (output && !loading) {
    return (
      <OutputDisplay
        output={output}
        onDownloadPDF={handlePDF}
        pdfLabel="Download Weight Guide PDF"
        onBack={() => setOutput('')}
        onStartOver={() => { setOutput(''); setDirection(null); setForm({ currentWeight: '', goalWeight: '', weightUnit: 'lbs', height: '', heightUnit: 'ft', gender: '', dietary: [] }); setError(''); }}
      />
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Modify Weight</h1>
      <p className="step-sub">Tell us about your goal and we'll build a personalized guide.</p>

      {/* Direction */}
      <div className="form-group">
        <label className="form-label">What do you want to do?</label>
        <div className="yn-buttons">
          {[{ id: 'lose', label: '📉 Lose Weight' }, { id: 'gain', label: '📈 Gain Weight' }].map(d => (
            <button key={d.id} className={`yn-btn${direction === d.id ? ' active' : ''}`} onClick={() => setDirection(d.id)}>{d.label}</button>
          ))}
        </div>
      </div>

      {direction && (
        <div className="fade-up">
          {/* Current weight */}
          <div className="form-group">
            <label className="form-label">Current Weight</label>
            <div className="unit-input">
              <input type="number" placeholder="e.g. 180" value={form.currentWeight} onChange={e => setForm(f => ({ ...f, currentWeight: e.target.value }))} />
              <select value={form.weightUnit} onChange={e => setForm(f => ({ ...f, weightUnit: e.target.value }))}>
                <option>lbs</option><option>kg</option>
              </select>
            </div>
          </div>

          {/* Goal weight */}
          <div className="form-group">
            <label className="form-label">Goal Weight</label>
            <div className="unit-input">
              <input type="number" placeholder="e.g. 160" value={form.goalWeight} onChange={e => setForm(f => ({ ...f, goalWeight: e.target.value }))} />
              <select value={form.weightUnit} onChange={e => setForm(f => ({ ...f, weightUnit: e.target.value }))}>
                <option>lbs</option><option>kg</option>
              </select>
            </div>
          </div>

          {/* Height */}
          <div className="form-group">
            <label className="form-label">Height</label>
            <div className="unit-input">
              <input type="text" placeholder={form.heightUnit === 'ft' ? "e.g. 5'10\"" : 'e.g. 178'} value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
              <select value={form.heightUnit} onChange={e => setForm(f => ({ ...f, heightUnit: e.target.value }))}>
                <option value="ft">ft/in</option><option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* Gender */}
          <div className="form-group">
            <label className="form-label">Gender</label>
            <div className="chips">
              {['Male','Female'].map(g => (
                <button key={g} className={`chip${form.gender === g ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, gender: g }))}>{g}</button>
              ))}
            </div>
          </div>

          {/* Dietary restrictions */}
          <div className="form-group">
            <label className="form-label">Dietary Restrictions <span className="optional">(optional)</span></label>
            <div className="chips">
              {DIETARY.map(d => (
                <button key={d} className={`chip${form.dietary.includes(d) ? ' selected' : ''}`} onClick={() => toggleDietary(d)}>{d}</button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : '✨ Generate My Guide'}
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-wrap">
          <div className="spinner" />
          <span>Building your personalized guide...</span>
        </div>
      )}
    </div>
  );
}