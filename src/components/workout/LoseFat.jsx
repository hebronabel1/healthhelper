import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const REASONS = ['Better Mobility & Movement','Health Reasons (heart, diabetes, etc.)','Look Better'];
const DIETARY = ['Gluten-Free','Halal','Keto','Lactose Intolerant','Nuts Allergy','Other','Vegan','Vegetarian'];
const DAYS = ['1','2','3','4','5','6','7'];
const TIMELINE = ['1–3 months','3–6 months','6–12 months','1+ years'];

export default function LoseFat({ onBack }) {
  const [form, setForm] = useState({ reasons: [], currentWeight: '', goalWeight: '', weightUnit: 'lbs', days: '', dietary: [], level: '', timeline: '' });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggleArr = (key, val) => setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const handleGenerate = async () => {
    if (!form.reasons.length || !form.currentWeight || !form.goalWeight || !form.days || !form.level || !form.timeline) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const dietary = form.dietary.length ? form.dietary.join(', ') : 'None';
      const prompt = `The user wants to lose fat. Their details:
- Why: ${form.reasons.join(', ')}
- Current weight: ${form.currentWeight} ${form.weightUnit}
- Goal weight: ${form.goalWeight} ${form.weightUnit}
- Days available per week: ${form.days}
- Dietary restrictions: ${dietary}
- Fitness level: ${form.level}
- Timeline: ${form.timeline}

Generate a detailed fat loss guide with these sections:

1. ENERGY EXPENDITURE VS CALORIE INTAKE
Explain the relationship between calories eaten and calories burned in plain English. Use a simple analogy (like a bank account). Give a realistic expectation for going from ${form.currentWeight} to ${form.goalWeight} ${form.weightUnit} in ${form.timeline}. Be honest about what's realistic.

2. WAYS TO BURN CALORIES
List specific resistance training and cardio options tailored to ${form.level} level and ${form.days} days per week. Explain WHY each method works for fat loss. Give specific exercises and how to structure their week.

3. WATCH OUT — AGGRESSIVE TACTICS
Explain what crash dieting, extreme calorie deficits, and overtraining do to the body. Use plain English and a simple analogy (like trying to run a car on empty). Explain why consistency always beats intensity.

4. FOODS THAT HELP
List 8-10 specific foods that help with fat loss, accounting for these dietary restrictions: ${dietary}. For each, briefly explain why it helps.

Write in plain English. Use simple analogies. Be honest and specific.`;

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
    const doc = generatePDF({ title: 'Lose Fat Guide', subtitle: `${form.currentWeight} → ${form.goalWeight} ${form.weightUnit} | Timeline: ${form.timeline}`, sections });
    downloadPDF(doc, 'healthhelper-lose-fat.pdf');
  };

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Lose Fat</h1>
      <p className="step-sub">Tell us about your goals and we'll build a realistic fat loss plan.</p>

      <div className="form-group">
        <label className="form-label">Why do you want to lose fat?</label>
        <div className="chips">
          {REASONS.map(r => (
            <button key={r} className={`chip${form.reasons.includes(r) ? ' selected' : ''}`} onClick={() => toggleArr('reasons', r)}>{r}</button>
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
        <label className="form-label">Fitness Level</label>
        <div className="chips">
          {['Beginner','Intermediate','Advanced'].map(l => (
            <button key={l} className={`chip${form.level === l ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, level: l }))}>{l}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Days Available Per Week</label>
        <select value={form.days} onChange={e => setForm(f => ({ ...f, days: e.target.value }))} style={{ maxWidth: '200px' }}>
          <option value="">Select days</option>
          {DAYS.map(d => <option key={d} value={d}>{d} {d === '1' ? 'day' : 'days'}</option>)}
        </select>
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

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : '✨ Build My Fat Loss Plan'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Building your fat loss plan...</span></div>}
      {output && !loading && <OutputDisplay output={output} onDownloadPDF={handlePDF} pdfLabel="Download Fat Loss Plan PDF" />}
    </div>
  );
}