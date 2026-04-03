import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const REASONS = ['Everyday Activities Feel Easier','General Fitness','Run a 5K / 10K / Marathon','Survive Longer Workouts'];
const CARDIO = ['Cycling','Running','Stairmaster','Swimming','Walking'];
const DAYS = ['1','2','3','4','5','6','7'];

export default function ImproveEndurance({ onBack }) {
  const [form, setForm] = useState({ reasons: [], level: '', days: '', cardio: [] });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggleMax2 = (key, val) => {
    setForm(f => {
      if (f[key].includes(val)) return { ...f, [key]: f[key].filter(x => x !== val) };
      if (f[key].length >= 2) return f;
      return { ...f, [key]: [...f[key], val] };
    });
  };

  const handleGenerate = async () => {
    if (!form.reasons.length || !form.level || !form.days || !form.cardio.length) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const prompt = `The user wants to improve their endurance for: ${form.reasons.join(', ')}.

Their details:
- Activity level: ${form.level}
- Days available per week: ${form.days}
- Preferred cardio: ${form.cardio.join(', ')}

Generate a detailed endurance guide with these sections:

1. YOUR WEEKLY ROUTINE
Design a specific ${form.days}-day per week endurance routine using ${form.cardio.join(' and ')}. Give specific sessions — how long, how hard, what to focus on. Include weekly quotas (e.g. "aim for X miles or X minutes per week"). Tailor to ${form.level} level.

2. STRETCHES THAT HELP
List 5-6 specific stretches that improve endurance and prevent injury. For each stretch, explain in plain English what it does and why it matters for endurance.

3. HABITS THAT OPTIMIZE YOUR PERFORMANCE
List 4-5 specific habits (sleep, hydration, pre/post workout nutrition, etc.) with a clear explanation of why each one matters for endurance. Use simple analogies.

4. WHAT TO AVOID
List things that hurt endurance — smoking, alcohol, overtraining, etc. For each one, explain WHY it hurts performance in plain English.

Write in plain English. Use simple analogies. Be specific with real examples throughout.`;

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
    const doc = generatePDF({ title: 'Improve Endurance Guide', subtitle: `Goals: ${form.reasons.join(', ')} | ${form.level}`, sections });
    downloadPDF(doc, 'healthhelper-endurance.pdf');
  };

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Improve Endurance</h1>
      <p className="step-sub">Tell us your goals and we'll build a routine to get you there.</p>

      <div className="form-group">
        <label className="form-label">What are you improving endurance for? <span className="optional">(max 2)</span></label>
        <div className="chips">
          {REASONS.map(r => (
            <button key={r} className={`chip${form.reasons.includes(r) ? ' selected' : ''}`}
              style={{ opacity: !form.reasons.includes(r) && form.reasons.length >= 2 ? 0.4 : 1 }}
              onClick={() => toggleMax2('reasons', r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Activity Level</label>
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
        <label className="form-label">Preferred Method of Cardio <span className="optional">(max 2)</span></label>
        <div className="chips">
          {CARDIO.map(c => (
            <button key={c} className={`chip${form.cardio.includes(c) ? ' selected' : ''}`}
              style={{ opacity: !form.cardio.includes(c) && form.cardio.length >= 2 ? 0.4 : 1 }}
              onClick={() => toggleMax2('cardio', c)}>{c}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : '✨ Build My Endurance Plan'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Building your endurance routine...</span></div>}
      {output && !loading && <OutputDisplay output={output} onDownloadPDF={handlePDF} pdfLabel="Download Endurance Plan PDF" />}
    </div>
  );
}