import React from 'react';

interface TacticalPitchProps {
  homeTeam: string;
  awayTeam: string;
  homePpg?: number;
  awayPpg?: number;
  homeGoalsLast5?: number;
  awayGoalsLast5?: number;
}

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
  homeTeam,
  awayTeam,
  homePpg = 1.6,
  awayPpg = 1.2,
  homeGoalsLast5 = 8,
  awayGoalsLast5 = 6
}) => {
  return (
    <div className="pitch-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* SVG Football Pitch Markings */}
      <svg
        className="pitch-svg"
        viewBox="0 0 600 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <pattern id="pitch-stripes" width="60" height="380" patternUnits="userSpaceOnUse">
            <rect width="30" height="380" fill="rgba(255, 255, 255, 0.015)" />
            <rect x="30" width="30" height="380" fill="transparent" />
          </pattern>
        </defs>

        {/* Pitch Turf Base & Grass Stripes */}
        <rect width="600" height="380" rx="6" fill="#0E221A" />
        <rect width="600" height="380" fill="url(#pitch-stripes)" />

        {/* Boundary Lines */}
        <rect x="25" y="20" width="550" height="340" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Halfway Line & Center Circle */}
        <line x1="300" y1="20" x2="300" y2="360" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="300" cy="190" r="50" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="300" cy="190" r="3" fill="#7F967D" fillOpacity="0.8" />

        {/* Left Penalty Box (Home Defense / Away Attack) */}
        <rect x="25" y="85" width="95" height="210" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <rect x="25" y="130" width="35" height="120" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="90" cy="190" r="2.5" fill="#7F967D" fillOpacity="0.8" />
        <path d="M 120 150 A 45 45 0 0 1 120 230" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Right Penalty Box (Away Defense / Home Attack) */}
        <rect x="480" y="85" width="95" height="210" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <rect x="540" y="130" width="35" height="120" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="510" cy="190" r="2.5" fill="#7F967D" fillOpacity="0.8" />
        <path d="M 480 150 A 45 45 0 0 0 480 230" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Corner Arcs */}
        <path d="M 25 35 A 15 15 0 0 1 40 20" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M 25 345 A 15 15 0 0 0 40 360" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M 575 35 A 15 15 0 0 0 560 20" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />
        <path d="M 575 345 A 15 15 0 0 1 560 360" stroke="#7F967D" strokeWidth="1.5" strokeOpacity="0.4" />

        {/* Home Team Tactical Marker (Left Side) */}
        <g transform="translate(140, 190)">
          <circle r="36" fill="rgba(78, 138, 99, 0.15)" stroke="#4E8A63" strokeWidth="1.5" />
          <circle r="6" fill="#4E8A63" />
          <text y="-48" textAnchor="middle" fill="#F1EEE5" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
            {homeTeam}
          </text>
          <text y="54" textAnchor="middle" fill="#A7B2A0" fontSize="11" fontFamily="Inter, sans-serif">
            HOME • {homePpg} PPG
          </text>
        </g>

        {/* Away Team Tactical Marker (Right Side) */}
        <g transform="translate(460, 190)">
          <circle r="36" fill="rgba(59, 122, 140, 0.15)" stroke="#3B7A8C" strokeWidth="1.5" />
          <circle r="6" fill="#3B7A8C" />
          <text y="-48" textAnchor="middle" fill="#F1EEE5" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">
            {awayTeam}
          </text>
          <text y="54" textAnchor="middle" fill="#A7B2A0" fontSize="11" fontFamily="Inter, sans-serif">
            AWAY • {awayPpg} PPG
          </text>
        </g>

        {/* Tactical Balance Indicator at Midfield */}
        <line x1="260" y1="190" x2="340" y2="190" stroke="#C2A676" strokeWidth="1" strokeDasharray="3 3" />
      </svg>

      {/* Overlay Stat Tags */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
        padding: '0 8px',
        fontSize: '12px',
        color: 'var(--text-sage)'
      }}>
        <span>Recent 5 matches: <strong style={{ color: 'var(--text-ivory)' }}>{homeGoalsLast5} goals</strong></span>
        <span style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '11px' }}>Tactical Field Comparison</span>
        <span>Recent 5 matches: <strong style={{ color: 'var(--text-ivory)' }}>{awayGoalsLast5} goals</strong></span>
      </div>
    </div>
  );
};
