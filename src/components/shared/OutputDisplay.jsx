import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function OutputDisplay({ output, onDownloadPDF, pdfLabel = 'Download PDF', onBack, onStartOver }) {
  const [showPDFModal, setShowPDFModal] = useState(false);
  const sections = parseOutput(output);

  const handleConfirmDownload = () => {
    onDownloadPDF();
    setShowPDFModal(false);
  };

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {onBack && <button className="btn-secondary" onClick={onBack}>← Back</button>}
          {onStartOver && <button className="btn-secondary" onClick={onStartOver}>↺ Start Over</button>}
        </div>
        <button className="btn-primary" onClick={() => setShowPDFModal(true)}>
          ⬇️ {pdfLabel}
        </button>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '700', marginBottom: '4px', color: 'var(--color-text)' }}>
        Your Personalized Guide
      </h2>
      <p style={{ color: 'var(--color-secondary)', fontSize: '13px', fontWeight: '600', marginBottom: '24px' }}>
        ✓ Generated successfully
      </p>

      {/* Sections */}
      <div>
        {sections.map((sec, i) => (
          <div key={i} className="output-block fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
            {sec.heading && <h3>{sec.heading}</h3>}
            {sec.content && (
              <div style={{ lineHeight: '1.75', fontSize: '15px', color: 'var(--color-text)' }}>
                {renderContent(sec.content)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '32px' }}>
        {onStartOver && <button className="btn-secondary" onClick={onStartOver}>↺ Start Over</button>}
        <button className="btn-green" onClick={() => setShowPDFModal(true)}>⬇️ {pdfLabel}</button>
      </div>

      {/* PDF Preview Modal — rendered via portal to escape fade-up stacking context */}
      {showPDFModal && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setShowPDFModal(false)}
        >
          <div
            style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', maxWidth: '680px', width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '24px 28px 16px', borderBottom: '1.5px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '2px' }}>PDF Preview</h3>
                <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Review your guide before downloading</p>
              </div>
              <button className="btn-secondary" onClick={() => setShowPDFModal(false)} style={{ padding: '6px 14px', fontSize: '13px' }}>✕ Close</button>
            </div>

            <div className="pdf-preview" style={{ flex: 1, overflowY: 'auto', margin: 0, borderRadius: 0, border: 'none', borderBottom: '1.5px solid var(--color-border)', maxHeight: 'none' }}>
              {output}
            </div>

            <div style={{ padding: '20px 28px', flexShrink: 0 }}>
              <button className="btn-green" onClick={handleConfirmDownload} style={{ width: '100%', justifyContent: 'center' }}>
                ⬇️ Confirm & Download
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function parseOutput(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const sections = [];
  let current = { heading: '', content: '' };

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      /^#{1,3}\s/.test(trimmed) ||
      /^\d+\.\s+[A-Z]/.test(trimmed) ||
      (trimmed.length > 3 && trimmed === trimmed.toUpperCase() && /[A-Z]{3}/.test(trimmed))
    ) {
      if (current.heading || current.content.trim()) {
        sections.push({ ...current });
      }
      current = { heading: trimmed.replace(/^#{1,3}\s*/, '').replace(/^\d+\.\s*/, ''), content: '' };
    } else {
      current.content += line + '\n';
    }
  }
  if (current.heading || current.content.trim()) sections.push(current);

  if (sections.length === 0 || (sections.length === 1 && !sections[0].heading)) {
    return [{ heading: '', content: text }];
  }

  return sections;
}

function renderContent(content) {
  const lines = content.split('\n').filter(l => l.trim());
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return (
        <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
          <span style={{ color: 'var(--color-secondary)', flexShrink: 0, marginTop: '2px' }}>•</span>
          <span>{trimmed.replace(/^[-•]\s*/, '')}</span>
        </div>
      );
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return <p key={i} style={{ fontWeight: '700', marginBottom: '6px' }}>{trimmed.replace(/\*\*/g, '')}</p>;
    }
    return trimmed ? <p key={i} style={{ marginBottom: '10px' }}>{trimmed}</p> : null;
  });
}
