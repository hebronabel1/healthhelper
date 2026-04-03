import { useState, useRef } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const TARGETS = ['Clear Skin','Gut Health','Hormonal Regulation','Liver & Kidney Support'];
const DIETARY = ['Gluten-Free','Halal','Keto','Lactose Intolerant','Nuts Allergy','Other','Vegan','Vegetarian'];

export default function CleanseBody({ onBack }) {
  const [form, setForm] = useState({ targets: [], age: '', gender: '', dietary: [], harmfulFoods: [] });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef();

  const toggleArr = (key, val) => setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !form.harmfulFoods.includes(val)) {
      setForm(f => ({ ...f, harmfulFoods: [...f.harmfulFoods, val] }));
    }
    setTagInput('');
    inputRef.current?.focus();
  };

  const removeTag = (tag) => setForm(f => ({ ...f, harmfulFoods: f.harmfulFoods.filter(t => t !== tag) }));

  const handleGenerate = async () => {
    if (!form.targets.length || !form.age || !form.gender) {
      setError('Please fill in all required fields and select at least one target.');
      return;
    }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const dietary = form.dietary.length ? form.dietary.join(', ') : 'None';
      const harmful = form.harmfulFoods.length ? form.harmfulFoods.join(', ') : 'Not specified';
      const prompt = `The user wants to cleanse their body and improve: ${form.targets.join(', ')}.

Their details:
- Age: ${form.age}
- Gender: ${form.gender}
- Dietary restrictions: ${dietary}
- Foods they currently eat that may be harming their goals: ${harmful}

Generate a detailed, personalized cleanse guide with these sections:

1. WHY YOU MAY BE EXPERIENCING THIS
Explain in plain English the common reasons for issues with ${form.targets.join(' and ')}. Connect food and lifestyle habits to these issues. Reference their harmful foods if provided: ${harmful}. Use simple analogies — like comparing the liver to a water filter, or the gut to a garden.

2. FOODS TO EAT & AVOID
List specific foods to eat and avoid for their targets. For each food, explain why it helps or hurts and how often to include it. Account for dietary restrictions: ${dietary}.

3. YOUR 7 CLEANSING MEAL IDEAS
List exactly 7 meals that support their cleansing goals and taste good. For each:
- Name the meal
- Write 2-3 sentences on why it helps their specific targets

Write in plain English. Use simple analogies. Be practical and specific.`;

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
    const doc = generatePDF({ title: 'Cleanse Skin & Body Guide', subtitle: `Targets: ${form.targets.join(', ')}`, sections });
    downloadPDF(doc, 'healthhelper-cleanse.pdf');
  };

  if (output && !loading) {
    return (
      <OutputDisplay
        output={output}
        onDownloadPDF={handlePDF}
        pdfLabel="Download Cleanse Guide PDF"
        onBack={() => setOutput('')}
        onStartOver={() => { setOutput(''); setForm({ targets: [], age: '', gender: '', dietary: [], harmfulFoods: [] }); setError(''); }}
      />
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Cleanse Skin & Body</h1>
      <p className="step-sub">Tell us what you want to target and we'll build a cleansing diet plan.</p>

      <div className="form-group">
        <label className="form-label">What do you want to target?</label>
        <div className="chips">
          {TARGETS.map(t => (
            <button key={t} className={`chip${form.targets.includes(t) ? ' selected' : ''}`} onClick={() => toggleArr('targets', t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Age</label>
        <input type="number" placeholder="e.g. 25" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={{ maxWidth: '180px' }} />
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
            <button key={d} className={`chip${form.dietary.includes(d) ? ' selected' : ''}`} onClick={() => toggleArr('dietary', d)}>{d}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          Current foods that may be harming your goals <span className="optional">(optional — type and press Enter)</span>
        </label>
        <div className="tag-input-wrap" onClick={() => inputRef.current?.focus()}>
          {form.harmfulFoods.map(tag => (
            <span key={tag} className="tag">
              {tag}
              <button onClick={() => removeTag(tag)}>×</button>
            </span>
          ))}
          <input
            ref={inputRef}
            className="tag-input"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder={form.harmfulFoods.length === 0 ? 'e.g. fast food, soda, fried chicken...' : ''}
          />
        </div>
        {tagInput && (
          <button className="btn-secondary" onClick={addTag} style={{ marginTop: '8px', fontSize: '13px', padding: '6px 14px' }}>
            + Add "{tagInput}"
          </button>
        )}
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-green" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : '✨ Generate My Cleanse Plan'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Building your cleanse guide...</span></div>}
    </div>
  );
}