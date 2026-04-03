import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const FEEL_OPTIONS = [
  'Better Energy Levels',
  'Better Mood & Reduced Stress',
  'Better Sleep',
  'Less Bloating & Digestive Issues',
  'Mental Clarity & Focus',
  'Reduced Inflammation or Joint Pain',
];

const DIETARY = ['Gluten-Free','Halal','Keto','Lactose Intolerant','Nuts Allergy','Other','Vegan','Vegetarian'];
const MEALS_OPTIONS = ['1','2','3','4','5','6'];

export default function FeelGood({ onBack }) {
  const [form, setForm] = useState({ goals: [], age: '', gender: '', dietary: [], meals: '' });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggle = (arr, key, val) => setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const handleGenerate = async () => {
    if (!form.goals.length || !form.age || !form.gender || !form.meals) {
      setError('Please fill in all required fields and select at least one goal.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const dietary = form.dietary.length ? form.dietary.join(', ') : 'None';
      const prompt = `The user wants to feel better in these areas: ${form.goals.join(', ')}.

Their details:
- Age: ${form.age}
- Gender: ${form.gender}
- Dietary restrictions: ${dietary}
- Meals per day: ${form.meals}

Generate a detailed, personalized diet guide with these clearly labeled sections:

1. WHY YOU MAY BE FEELING THIS
Explain in plain English the common reasons why people experience ${form.goals.join(' and ')}. Connect it to diet and lifestyle. Use simple analogies. Be specific to their age and gender where relevant.

2. FOODS TO EAT & AVOID
List specific foods they should eat and foods they should avoid for each of their goals. For each food, explain why it helps or hurts, and how often to incorporate it. Account for dietary restrictions: ${dietary}.

3. YOUR 7 MEAL IDEAS
List exactly 7 meals that support their goals and taste good. For each meal:
- Give the meal a name
- Write 2-3 sentences explaining why it helps their specific goals
Make sure the meals are practical, tasty, and account for their dietary restrictions.

Write in plain English. Use simple analogies. Be specific and practical.`;

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
    const doc = generatePDF({ title: 'Feel Good Diet Guide', subtitle: `Goals: ${form.goals.join(', ')}`, sections });
    downloadPDF(doc, 'healthhelper-feel-good.pdf');
  };

  if (output && !loading) {
    return (
      <OutputDisplay
        output={output}
        onDownloadPDF={handlePDF}
        pdfLabel="Download Feel Good Guide PDF"
        onBack={() => setOutput('')}
        onStartOver={() => { setOutput(''); setForm({ goals: [], age: '', gender: '', dietary: [], meals: '' }); setError(''); }}
      />
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Feel Good</h1>
      <p className="step-sub">Tell us what you want to improve and we'll build a diet around how you feel.</p>

      <div className="form-group">
        <label className="form-label">What do you want to feel better about?</label>
        <div className="chips">
          {FEEL_OPTIONS.map(o => (
            <button key={o} className={`chip${form.goals.includes(o) ? ' selected' : ''}`} onClick={() => toggle([], 'goals', o)}>{o}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Age</label>
        <input type="number" placeholder="e.g. 28" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={{ maxWidth: '180px' }} />
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
        <label className="form-label">Dietary Restrictions <span className="optional">(optional)</span></label>
        <div className="chips">
          {DIETARY.map(d => (
            <button key={d} className={`chip${form.dietary.includes(d) ? ' selected' : ''}`} onClick={() => toggle([], 'dietary', d)}>{d}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">How many meals do you eat per day?</label>
        <div className="chips">
          {MEALS_OPTIONS.map(m => (
            <button key={m} className={`chip${form.meals === m ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, meals: m }))}>{m}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-green" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : '✨ Generate My Guide'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Building your feel-good plan...</span></div>}
    </div>
  );
}