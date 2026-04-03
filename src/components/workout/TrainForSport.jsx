import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const SPORTS = ['Basketball','Football','MMA / Boxing','Running / Track','Soccer'];
const ATTRIBUTES = ['Agility & Quickness','Endurance & Stamina','Explosiveness & Power','Flexibility & Mobility','Strength'];

export default function TrainForSport({ onBack }) {
  const [form, setForm] = useState({ sport: '', attributes: [], level: '' });
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggleMax2 = (val) => {
    setForm(f => {
      if (f.attributes.includes(val)) return { ...f, attributes: f.attributes.filter(x => x !== val) };
      if (f.attributes.length >= 2) return f;
      return { ...f, attributes: [...f.attributes, val] };
    });
  };

  const handleGenerate = async () => {
    if (!form.sport || !form.attributes.length || !form.level) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const prompt = `The user wants to train for ${form.sport}. Their details:
- Sport: ${form.sport}
- Physical attributes to improve: ${form.attributes.join(', ')}
- Skill level: ${form.level}

Generate a detailed, sport-specific training guide with these sections:

1. SPORT-SPECIFIC DRILLS & EXERCISES
List 6-8 drills and exercises specifically for ${form.sport} that target ${form.attributes.join(' and ')}. For each, explain what it does and why it matters for ${form.sport} performance. Make it specific to ${form.level} level.

2. PLYOMETRICS FOR ${form.sport.toUpperCase()}
List 4-5 plyometric exercises that are directly relevant to ${form.sport} and improve ${form.attributes.join(' and ')}. Explain what each one does and how to perform it safely. Use a simple analogy to explain what plyometrics are.

3. WHAT TO EAT TO FUEL YOUR PERFORMANCE
Give specific nutrition advice for a ${form.sport} player at ${form.level} level. Cover pre-game/pre-workout meals, post-workout recovery food, and daily nutrition habits. Give real food examples.

4. RECOVERY TIPS
List 4-5 specific recovery habits — sleep, stretching, rest days, etc. For each, explain WHY it matters for athletic performance in ${form.sport}. Be specific.

5. WHAT TO AVOID
List habits, foods, and behaviors that will directly hurt your ${form.sport} performance. For each, explain why in plain English with a simple analogy where helpful.

Write in plain English. Use simple analogies. Be specific with real examples throughout. Tailor everything to ${form.sport}.`;

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
    const doc = generatePDF({ title: `Train for ${form.sport}`, subtitle: `${form.level} | Focus: ${form.attributes.join(', ')}`, sections });
    downloadPDF(doc, `healthhelper-train-${form.sport.toLowerCase().replace(/\s/g, '-')}.pdf`);
  };

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Train for a Sport</h1>
      <p className="step-sub">Pick your sport and what you want to improve. We'll build a sport-specific plan.</p>

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
            <button
              key={a}
              className={`chip${form.attributes.includes(a) ? ' selected' : ''}`}
              style={{ opacity: !form.attributes.includes(a) && form.attributes.length >= 2 ? 0.4 : 1 }}
              onClick={() => toggleMax2(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Skill Level</label>
        <div className="chips">
          {['Beginner','Intermediate','Advanced'].map(l => (
            <button key={l} className={`chip${form.level === l ? ' selected' : ''}`} onClick={() => setForm(f => ({ ...f, level: l }))}>{l}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : '✨ Build My Sport Training Plan'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Building your sport-specific plan...</span></div>}
      {output && !loading && <OutputDisplay output={output} onDownloadPDF={handlePDF} pdfLabel="Download Sport Training Plan PDF" />}
    </div>
  );
}