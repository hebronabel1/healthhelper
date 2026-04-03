import { useState } from 'react';
import { callAI, BASE_SYSTEM } from '../../utils/api.js';
import { generatePDF, downloadPDF } from '../../utils/pdf.js';
import OutputDisplay from '../shared/OutputDisplay.jsx';

const DIET_TYPES = ['Balanced & Whole Foods','Halal','High Protein','Low Carb','Plant-Based'];

export default function EatHealthier({ onBack }) {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const toggle = (opt) => {
    setSelected(s => {
      if (s.includes(opt)) return s.filter(x => x !== opt);
      if (s.length >= 2) return s;
      return [...s, opt];
    });
  };

  const handleGenerate = async () => {
    if (!selected.length) { setError('Please select at least one diet type.'); return; }
    setError('');
    setLoading(true);
    setOutput('');
    try {
      const prompt = `The user wants to eat healthier. Their selected diet type(s): ${selected.join(' and ')}.

Generate a practical, helpful guide with these two sections:

1. YOUR 7 FOODS
List exactly 7 foods that fit a ${selected.join(' / ')} diet. For each food:
- Name the food
- Write 2-3 sentences explaining why it's a great choice for this diet and what it does for the body

2. YOUR 7 MEAL IDEAS
List exactly 7 meals that fit a ${selected.join(' / ')} diet, taste good, and are practical to make. For each:
- Name the meal
- Write 2-3 sentences on what makes it a healthy choice and what's in it

Be specific. Give real food names and real meal names — not generic descriptions. Write in plain English.`;

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
    const doc = generatePDF({ title: 'Eat Healthier Guide', subtitle: `Diet: ${selected.join(' + ')}`, sections });
    downloadPDF(doc, 'healthhelper-eat-healthier.pdf');
  };

  if (output && !loading) {
    return (
      <OutputDisplay
        output={output}
        onDownloadPDF={handlePDF}
        pdfLabel="Download Eating Guide PDF"
        onBack={() => setOutput('')}
        onStartOver={() => { setOutput(''); setSelected([]); setError(''); }}
      />
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '28px' }}>← Back</button>
      <h1 className="step-heading">Overall Eat Healthier</h1>
      <p className="step-sub">Pick up to 2 diet types and we'll give you foods and meals that fit.</p>

      <div className="form-group">
        <label className="form-label">What kind of diet are you looking for? <span className="optional">(max 2)</span></label>
        <div className="chips">
          {DIET_TYPES.map(d => (
            <button
              key={d}
              className={`chip${selected.includes(d) ? ' selected' : ''}`}
              onClick={() => toggle(d)}
              style={{ opacity: !selected.includes(d) && selected.length >= 2 ? 0.4 : 1 }}
            >
              {d}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            Selected: {selected.join(' + ')}
          </div>
        )}
      </div>

      {error && <div style={{ color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      <button className="btn-green" onClick={handleGenerate} disabled={loading || !selected.length}>
        {loading ? 'Generating...' : '✨ Generate Foods & Meals'}
      </button>

      {loading && <div className="loading-wrap"><div className="spinner" /><span>Picking the best foods for you...</span></div>}
    </div>
  );
}