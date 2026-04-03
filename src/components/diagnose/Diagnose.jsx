import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const CONCERNS = ['Energy & Fatigue','Joint & Muscle Pain','Mental Clarity & Brain Fog','Skin Issues','Sleep Problems'];
const BAD_HABITS = ['Alcohol Consumption','Drug Use','Eating Late at Night','Excessive Caffeine','Excessive Screen Time','High Sugar Diet','Lack of Exercise','Poor Sleep Schedule','Processed & Fast Food','Smoking'];
const SLEEP_RANGES = ['4 or less hours','5–6 hours','7–8 hours','9+ hours'];

export default function Diagnose({ onBack }) {
  const [form, setForm] = useState({ concern: '', habits: [], age: '', gender: '', water: '', sleep: '' });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggleHabit = (h) => setForm(f => ({ ...f, habits: f.habits.includes(h) ? f.habits.filter(x => x !== h) : [...f.habits, h] }));

  const handleGenerate = async () => {
    if (!form.concern || !form.age || !form.gender || !form.sleep) {
      setError('Please fill in all required fields and select a health concern.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const habits = form.habits.length ? form.habits.join(', ') : 'None selected';
      const water = form.water ? `${form.water} fl oz` : 'Not specified';
      const prompt = `The user is struggling with: ${form.concern}.

Their details:
- Age: ${form.age}
- Gender: ${form.gender}
- Daily water intake: ${water}
- Hours of sleep per night: ${form.sleep}
- Bad habits they have: ${habits}

Generate a detailed, evidence-backed health guide with these clearly labeled sections. IMPORTANT: Only include information backed by established health and nutritional research. If something is debated in the research, say so. Do not speculate or fabricate.

1. WHAT'S LIKELY HAPPENING
Explain in plain English what is probably causing their ${form.concern}. Connect their habits (${habits}), sleep (${form.sleep}), and hydration (${water}) to how they feel. Use a simple analogy to explain the underlying mechanism. If any medical term is used, immediately explain it in plain English.

2. HOW YOUR HABITS ARE CONTRIBUTING
For each relevant habit they selected, explain specifically how it worsens ${form.concern}. Be direct and honest. Use simple analogies.

3. WHAT YOU CAN DO ABOUT IT
List 5-6 specific, actionable changes they can make to address ${form.concern}. For each, explain WHY it works using evidence. Give real, practical steps — not vague advice.

4. FOODS TO EAT & AVOID
List specific foods that help and specific foods that worsen ${form.concern}. Explain why each food helps or hurts in plain English.

5. WHEN TO SEE A DOCTOR
Be honest about when these symptoms go beyond what diet and lifestyle can fix. Give clear signs that would warrant seeing a healthcare provider.

Write in plain English throughout. If any term sounds complicated, explain it right away using everyday language or a simple analogy.`;

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
      title: 'Health Diagnose Report',
      subtitle: `Concern: ${form.concern}`,
      sections,
      disclaimer: 'DISCLAIMER: This report is for general informational purposes only and does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for any health concerns.',
    });
    downloadPDF(doc, 'healthhelper-diagnose.pdf');
  };

  if (output && !loading) {
    return (
      <OutputDisplay
        output={output}
        onDownloadPDF={handlePDF}
        pdfLabel="Download Diagnose Report PDF"
        onBack={() => setOutput('')}
        onStartOver={() => { setOutput(''); setForm({ concern: '', habits: [], age: '', gender: '', water: '', sleep: '' }); setError(''); }}
      />
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Diagnose</h1>
      <p className="step-sub">Tell us what you're struggling with. We'll give you evidence-backed suggestions on what may help.</p>

      {/* Disclaimer */}
      <div className="disclaimer">
        ⚠️ <strong>Important:</strong> This tool provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
      </div>

      <div className="form-group">
        <label className="form-label">What are you struggling with?</label>
        <div className="chips">
          {CONCERNS.map(c => (
            <button key={c} className={`chip${form.concern === c ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, concern: c }))}>{c}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Do any of these apply to you? <span className="optional">(optional)</span></label>
        <div className="chips">
          {BAD_HABITS.map(h => (
            <button key={h} className={`chip${form.habits.includes(h) ? ' selected' : ''}`} onClick={() => toggleHabit(h)}>{h}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Age</label>
        <input type="number" placeholder="e.g. 24" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={{ maxWidth: '180px' }} />
      </div>

      <div className="form-group">
        <label className="form-label">Gender</label>
        <div className="chips">
          {['Male','Female'].map(g => (
            <button key={g} className={`chip${form.gender === g ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, gender: g }))}>{g}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Daily Water Intake <span className="optional">(optional)</span></label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', maxWidth: '220px' }}>
          <input
            type="number"
            placeholder="e.g. 64"
            value={form.water}
            onChange={e => setForm(f => ({ ...f, water: e.target.value }))}
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '14px', whiteSpace: 'nowrap' }}>fl oz</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Hours of Sleep Per Night</label>
        <div className="chips">
          {SLEEP_RANGES.map(s => (
            <button key={s} className={`chip${form.sleep === s ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, sleep: s }))}>{s}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Analyzing...' : '🔍 Analyze & Get Suggestions'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Analyzing your inputs...</span></div>}
    </div>
  );
}