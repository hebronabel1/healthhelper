import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const DAYS = ['1','2','3','4','5','6','7'];
const MUSCLE_GOALS = ['5–10 lbs','10–20 lbs','20+ lbs'];

export default function BuildMuscle({ onBack }) {
  const [form, setForm] = useState({ level: '', days: '', muscleGoal: '' });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!form.level || !form.days || !form.muscleGoal) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const prompt = `The user wants to build muscle. Their details:
- Fitness level: ${form.level}
- Days available per week: ${form.days}
- Muscle gain goal: ${form.muscleGoal}

Generate a detailed muscle-building guide with these clearly labeled sections:

1. CALORIE & PROTEIN TARGETS
Explain what they need to eat to build muscle. Give a specific calorie range and daily protein target based on their goal of gaining ${form.muscleGoal}. Explain WHY these numbers matter using a simple analogy (like building a house needing materials). Be specific — give real numbers.

2. YOUR WEEKLY WORKOUT SPLIT
Design a specific ${form.days}-day per week workout split that hits the full body. Name each day (e.g. "Day 1 — Push: Chest, Shoulders, Triceps"). List 4-6 exercises per day with sets and reps. Tailor the difficulty to a ${form.level} level.

3. WEIGHTLIFTING VS CALISTHENICS
Recommend the best approach for a ${form.level}. Explain the pros and cons of each in plain English. Give specific examples of both types of exercises.

4. CONSISTENCY IS EVERYTHING
End with an honest, motivating paragraph about why consistency and diet matter more than the perfect workout. Keep it real — no fluff. Reference their goal of ${form.muscleGoal}.

Write in plain English. Use simple analogies. Be specific and practical throughout.`;

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
    const doc = generatePDF({ title: 'Build Muscle Guide', subtitle: `${form.level} | ${form.days} days/week | Goal: ${form.muscleGoal}`, sections });
    downloadPDF(doc, 'healthhelper-build-muscle.pdf');
  };

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Build Muscle</h1>
      <p className="step-sub">Answer a few questions and we'll design your muscle-building plan.</p>

      <div className="form-group">
        <label className="form-label">Current Fitness Level</label>
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
        <label className="form-label">How much muscle do you want to gain?</label>
        <div className="chips">
          {MUSCLE_GOALS.map(g => (
            <button key={g} className={`chip${form.muscleGoal === g ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, muscleGoal: g }))}>{g}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : '✨ Build My Muscle Plan'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Designing your workout plan...</span></div>}
      {output && !loading && <OutputDisplay output={output} onDownloadPDF={handlePDF} pdfLabel="Download Muscle Plan PDF" />}
    </div>
  );
}