import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  Zap, 
  Layers, 
  Target, 
  FileCheck2, 
  AlertTriangle,
  Scale
} from 'lucide-react';

export const UFCMethodology: React.FC = () => {
  return (
    <div className="container" style={{ padding: '40px 24px 80px 24px' }}>
      {/* Historical Dataset Cutoff Banner */}
      <div style={{
        background: 'rgba(194, 166, 118, 0.10)',
        border: '1px solid rgba(194, 166, 118, 0.25)',
        borderRadius: '6px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={16} color="var(--accent-warm-gold)" />
          <span style={{ fontSize: '13px', color: 'var(--text-ivory)' }}>
            <strong>Documentation Standard:</strong> Technical and viva methodology specification for UFC / MMA Combat Intelligence subsystem.
          </span>
        </div>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', padding: '2px 8px', background: 'rgba(194, 166, 118, 0.15)', borderRadius: '4px' }}>
          Academic Rigor
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            background: 'rgba(127, 150, 125, 0.2)',
            color: 'var(--accent-sage-bright)',
            borderRadius: '4px',
            border: '1px solid rgba(127, 150, 125, 0.3)'
          }}>
            Technical Whitepaper
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
          <span style={{ color: 'var(--text-sage)', fontSize: '13px' }}>Combat Machine Learning</span>
        </div>
        <h1 style={{ fontSize: '38px', lineHeight: '1.2', marginBottom: '12px' }}>
          UFC Subsystem Methodology
        </h1>
        <p style={{ color: 'var(--text-sage)', fontSize: '16px', maxWidth: '780px' }}>
          A formal mathematical overview of combat binary probability estimation, anti-symmetric differential features, pre-fight zero-leakage timelines, and forward-split calibration.
        </p>
      </div>

      {/* Content Sections Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Section 1: Binary Problem Formulation */}
        <div className="card" style={{ padding: '28px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Target size={18} color="var(--accent-warm-gold)" />
            <h3 style={{ fontSize: '20px', color: 'var(--text-ivory)' }}>
              1. Binary Probability & Corner Allocation
            </h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14.5px', lineHeight: '1.7', marginBottom: '16px' }}>
            In mixed martial arts, bouts are sanctioned with a designated <strong>Red Corner</strong> (traditionally favored, defending champion, or higher-ranked competitor) and <strong>Blue Corner</strong> (challenger or lower seed). The modeling objective is formulated as:
          </p>
          <div style={{ padding: '14px 18px', background: 'var(--bg-deep)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-sage-bright)', marginBottom: '16px' }}>
            {"y = 1 if Red Corner wins,  y = 0 if Blue Corner wins"}
          </div>
          <p style={{ color: 'var(--text-sage)', fontSize: '14px', lineHeight: '1.6' }}>
            Historical draws and No Contests represent less than 1.2% of all UFC bouts. When predicting hypothetical or scheduled matchups, win probabilities are strictly normalized such that:
            <br />
            <strong style={{ color: 'var(--text-ivory)' }}>P(Red) + P(Blue) = 1.0</strong>. Fair decimal odds are computed directly as the reciprocal of each estimated probability: <code style={{ color: 'var(--accent-warm-gold)' }}>Odds = 1.0 / P</code>.
          </p>
        </div>

        {/* Section 2: Anti-Symmetric Differential Architecture */}
        <div className="card" style={{ padding: '28px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Scale size={18} color="var(--accent-warm-gold)" />
            <h3 style={{ fontSize: '20px', color: 'var(--text-ivory)' }}>
              2. Anti-Symmetric Differential Feature Representation
            </h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14.5px', lineHeight: '1.7', marginBottom: '16px' }}>
            To prevent arbitrary corner bias and ensure the model respects the fundamental symmetry of combat, all numerical features are structured as differentials:
          </p>
          <div style={{ padding: '14px 18px', background: 'var(--bg-deep)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-sage-bright)', marginBottom: '16px' }}>
            {"Δx = x_Red - x_Blue  ⟹  Δx(Blue, Red) = -Δx(Red, Blue)"}
          </div>
          <p style={{ color: 'var(--text-sage)', fontSize: '14px', lineHeight: '1.6' }}>
            Key differential vectors include:
          </p>
          <ul style={{ paddingLeft: '20px', color: 'var(--text-parchment)', fontSize: '14px', lineHeight: '1.7', marginTop: '8px' }}>
            <li><strong>slpm_diff:</strong> Differential in significant strikes landed per minute.</li>
            <li><strong>sapm_diff:</strong> Differential in significant strikes absorbed per minute (defensive vulnerability).</li>
            <li><strong>str_acc_diff & str_def_diff:</strong> Striking accuracy and striking defense percentage differentials.</li>
            <li><strong>td_avg_diff & td_def_diff:</strong> Takedown offensive output per 15 minutes and takedown defense percentage.</li>
            <li><strong>reach_diff & height_diff:</strong> Biometric frame advantages in inches.</li>
            <li><strong>age_diff:</strong> Chronological age differential at the date of the bout.</li>
          </ul>
        </div>

        {/* Section 3: Phase 3.1 Zero-Leakage Remediation */}
        <div className="card" style={{ padding: '28px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={18} color="#6EE7B7" />
            <h3 style={{ fontSize: '20px', color: 'var(--text-ivory)' }}>
              3. Chronological Anti-Leakage Remediation (Phase 3.1)
            </h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14.5px', lineHeight: '1.7', marginBottom: '16px' }}>
            A critical vulnerability identified in naive MMA datasets is the use of static career averages from the end of a fighter&apos;s career (such as a 2021 snapshot) to evaluate fights occurring in 2005 or 2012. 
            This constitutes <strong>target leakage</strong>, allowing the model to know future career longevity and striking development.
          </p>
          <div style={{ padding: '14px 18px', background: 'rgba(78, 138, 99, 0.15)', borderRadius: '6px', border: '1px solid rgba(78, 138, 99, 0.3)', color: '#6EE7B7', fontSize: '13.5px', marginBottom: '16px' }}>
            <strong>Phase 3.1 Protocol:</strong> In PITCHIQ, all 7 striking and grappling rate features were replaced with strict point-in-time rolling statistics calculated exclusively from prior bouts occurring at time <code style={{ color: '#F1EEE5' }}>t &lt; t_&#123;\text&#123;bout&#125;&#125;</code>.
          </div>
          <p style={{ color: 'var(--text-sage)', fontSize: '14px', lineHeight: '1.6' }}>
            Debut athletes with zero previous Octagon rounds are populated with neutral domain empirical medians rather than future career hindsight.
          </p>
        </div>

        {/* Section 4: Out-of-Sample Forward Validation */}
        <div className="card" style={{ padding: '28px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layers size={18} color="var(--accent-warm-gold)" />
            <h3 style={{ fontSize: '20px', color: 'var(--text-ivory)' }}>
              4. Forward Chronological Split vs. K-Fold Cross Validation
            </h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14.5px', lineHeight: '1.7', marginBottom: '16px' }}>
            Standard randomized K-Fold cross validation is mathematically inappropriate for sports prediction because it trains models on future bouts and evaluates them on past bouts. 
            PITCHIQ enforces a chronological walk-forward holdout:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Train (1994–2017)</div>
              <div style={{ fontSize: '15px', color: 'var(--text-ivory)', fontWeight: 600 }}>4,181 Bouts</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Validation (2018–2019)</div>
              <div style={{ fontSize: '15px', color: 'var(--text-ivory)', fontWeight: 600 }}>888 Bouts</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-deep)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-warm-gold)' }}>Test (2019–March 2021)</div>
              <div style={{ fontSize: '15px', color: 'var(--accent-warm-gold)', fontWeight: 600 }}>889 Bouts</div>
            </div>
          </div>
        </div>

        {/* Section 5: Calibration & Scoring Rules */}
        <div className="card" style={{ padding: '28px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={18} color="var(--accent-warm-gold)" />
            <h3 style={{ fontSize: '20px', color: 'var(--text-ivory)' }}>
              5. Proper Scoring Rules & Probability Calibration
            </h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14.5px', lineHeight: '1.7', marginBottom: '16px' }}>
            In combat sports, predicting a 95% confident win for an athlete who gets caught by a single punch in Round 1 yields a catastrophic penalty in proper betting and probability estimation. 
            Consequently, model selection prioritizes <strong>Brier Score</strong> and <strong>Logarithmic Loss</strong> over raw binary accuracy:
          </p>
          <div style={{ padding: '14px 18px', background: 'var(--bg-deep)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-sage-bright)', marginBottom: '16px' }}>
            {"Brier Score = (1/N) ∑ (p_i - y_i)²,   Log Loss = -(1/N) ∑ [y_i ln(p_i) + (1 - y_i) ln(1 - p_i)]"}
          </div>
          <p style={{ color: 'var(--text-sage)', fontSize: '14px', lineHeight: '1.6' }}>
            The Random Forest model achieves a Brier Score of <strong>0.2368</strong> (beating the historical prior baseline of 0.2422) and Log Loss of <strong>0.6678</strong>.
          </p>
        </div>

        {/* Section 6: Provenance & Dataset Boundaries */}
        <div className="card" style={{ padding: '28px', border: '1px solid var(--border-medium)', background: 'var(--bg-surface-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FileCheck2 size={18} color="var(--accent-warm-gold)" />
            <h3 style={{ fontSize: '20px', color: 'var(--text-ivory)' }}>
              6. Dataset Provenance & Dataset Scope Boundary
            </h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14px', lineHeight: '1.7', marginBottom: '12px' }}>
            The UFC dataset comprises 6,012 bouts and 3,596 athlete profiles derived from official public fight logs published under the CC0 Public Domain Dedication. 
            Ground truth records conclude on <strong>March 20, 2021</strong> (UFC on ESPN: Brunson vs. Holland).
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warm-gold)', fontSize: '13px' }}>
            <AlertTriangle size={15} />
            <span>Predictions for post-2021 or active bouts must be treated as hypothetical model simulations based on verified pre-cutoff fight histories.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
