import React from 'react';

interface FooterProps {
  activeSport?: 'football' | 'ufc';
  onSelectSport?: (sport: 'football' | 'ufc') => void;
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ activeSport = 'football', onSelectSport, onSelectTab }) => {
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
              Multi-sport probabilistic intelligence. Machine-learning match outcome forecasting for Premier League football and UFC combat sports, powered by zero-leakage rolling statistics and chronological validation.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                Football ML-11
              </span>
              <span style={{
                display: 'inline-block',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--accent-warm-gold)',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(194, 166, 118, 0.1)',
                border: '1px solid rgba(194, 166, 118, 0.2)'
              }}>
                Octagon UFC-16
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {/* Football Links */}
            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-ivory)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚽</span> Football Architecture
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: 'var(--text-sage)' }}>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('football');
                      onSelectTab('predictor');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    Match Predictor
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('football');
                      onSelectTab('teams');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    Team Form Intelligence
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('football');
                      onSelectTab('modellab');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    Model Evaluation Lab
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('football');
                      onSelectTab('data');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    Historical Fixtures Explorer
                  </button>
                </li>
              </ul>
            </div>

            {/* UFC Links */}
            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-ivory)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🥊</span> Combat Intelligence
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: 'var(--text-sage)' }}>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('ufc');
                      onSelectTab('predictor');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    Fight Predictor & Tale of Tape
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('ufc');
                      onSelectTab('fighters');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    Fighter Profiles & Bouts
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('ufc');
                      onSelectTab('data');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    Historical Bout Database
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      if (onSelectSport) onSelectSport('ufc');
                      onSelectTab('modellab');
                    }} 
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                  >
                    UFC Calibration Lab
                  </button>
                </li>
              </ul>
            </div>

            {/* Integrity Standards */}
            <div>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-ivory)', marginBottom: '14px' }}>
                Standards & Integrity
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13.5px', color: 'var(--text-sage)' }}>
                <li>Strict Chronological Partitions</li>
                <li>Zero-Leakage Rolling Windows</li>
                <li>Anti-Symmetric Differentials</li>
                <li>UFC Cutoff: October 24, 2026</li>
                <li>Brier Score Calibration</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} PITCHIQ Analytics. Multi-sport machine learning intelligence platform.</p>
          <p style={{ color: 'var(--text-muted)' }}>
            Probabilistic forecasting model. Not a betting platform or financial tool.
          </p>
        </div>
      </div>
    </footer>
  );
};
