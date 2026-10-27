import React from 'react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="footer-inner">
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div className="brand-mark" style={{ width: '28px', height: '28px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-moss)' }}>IQ</span>
              </div>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '16px' }}>
                PITCHIQ
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-sage)', lineHeight: '1.6', marginBottom: '16px' }}>
              Read the game differently. Football match outcome forecasting powered by historical match records, 
              leakage-safe rolling statistics, and chronological machine learning validation.
            </p>
            <span style={{
              display: 'inline-block',
              fontSize: '11px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--accent-moss)',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(127, 150, 125, 0.1)',
              border: '1px solid rgba(127, 150, 125, 0.2)'
            }}>
              Machine Learning Experiment 11
            </span>
          </div>

          <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-ivory)', marginBottom: '14px' }}>
                Architecture
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: 'var(--text-sage)' }}>
                <li><button onClick={() => onSelectTab('predictor')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Match Predictor</button></li>
                <li><button onClick={() => onSelectTab('teams')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Team Form Intelligence</button></li>
                <li><button onClick={() => onSelectTab('modellab')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Model Evaluation Lab</button></li>
                <li><button onClick={() => onSelectTab('data')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Historical Data Explorer</button></li>
                <li><button onClick={() => onSelectTab('methodology')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Viva & Methodology</button></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-ivory)', marginBottom: '14px' }}>
                Data & Standards
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: 'var(--text-sage)' }}>
                <li>Football-Data.co.uk (E0)</li>
                <li>Strict Chronological Split</li>
                <li>Zero-Leakage Rolling Windows</li>
                <li>Scikit-Learn Random Forest</li>
                <li>StandardScaler Pipeline</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PITCHIQ Analytics. Educational & academic machine learning project.</p>
          <p style={{ color: 'var(--text-muted)' }}>
            Probabilistic forecasting model. Not a betting platform or financial tool.
          </p>
        </div>
      </div>
    </footer>
  );
};
