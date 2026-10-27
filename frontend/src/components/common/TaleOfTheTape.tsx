import React from 'react';
import { UFCTaleOfTheTapeItem } from '../../types/ufc';
import { Shield, Zap, Target, Award, ArrowLeftRight } from 'lucide-react';

interface TaleOfTheTapeProps {
  fighterA: UFCTaleOfTheTapeItem;
  fighterB: UFCTaleOfTheTapeItem;
  cornerA?: string;
  cornerB?: string;
  reachRecorded?: boolean;
}

export const TaleOfTheTape: React.FC<TaleOfTheTapeProps> = ({
  fighterA,
  fighterB,
  cornerA = 'Red',
  cornerB = 'Blue',
  reachRecorded = true
}) => {
  // Helper to determine advantage for dual-sided bar
  const renderComparisonRow = (
    label: string,
    valAStr: string | number,
    valBStr: string | number,
    numA: number,
    numB: number,
    lowerIsBetter = false,
    unit = ''
  ) => {
    let edgeA = false;
    let edgeB = false;

    if (numA !== numB) {
      if (lowerIsBetter) {
        edgeA = numA < numB;
        edgeB = numB < numA;
      } else {
        edgeA = numA > numB;
        edgeB = numB > numA;
      }
    }

    // Proportional ratio for visualization
    const maxVal = Math.max(numA, numB, 0.001);
    const widthA = Math.min(100, Math.max(10, (numA / maxVal) * 100));
    const widthB = Math.min(100, Math.max(10, (numB / maxVal) * 100));

    return (
      <div className="tape-row" style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'grid',
        gridTemplateColumns: '1fr 140px 1fr',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Fighter A Value */}
        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', display: 'flex', justifyContent: 'flex-end', overflow: 'hidden' }}>
            <div style={{
              width: `${widthA}%`,
              background: edgeA ? 'var(--outcome-loss)' : 'rgba(167, 178, 160, 0.3)',
              borderRadius: '2px',
              transition: 'var(--transition-smooth)'
            }}></div>
          </div>
          <span className={`num-tabular ${edgeA ? 'edge-active' : ''}`} style={{
            fontSize: '14px',
            fontWeight: edgeA ? 600 : 400,
            color: edgeA ? 'var(--text-ivory)' : 'var(--text-sage)',
            minWidth: '55px'
          }}>
            {valAStr}{unit}
          </span>
        </div>

        {/* Central Metric Label */}
        <div style={{
          textAlign: 'center',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          fontWeight: 500
        }}>
          {label}
        </div>

        {/* Fighter B Value */}
        <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px' }}>
          <span className={`num-tabular ${edgeB ? 'edge-active' : ''}`} style={{
            fontSize: '14px',
            fontWeight: edgeB ? 600 : 400,
            color: edgeB ? 'var(--text-ivory)' : 'var(--text-sage)',
            minWidth: '55px'
          }}>
            {valBStr}{unit}
          </span>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${widthB}%`,
              background: edgeB ? 'var(--outcome-away)' : 'rgba(167, 178, 160, 0.3)',
              borderRadius: '2px',
              transition: 'var(--transition-smooth)'
            }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
      {/* Editorial Header */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg-surface-elevated)',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeftRight size={16} color="var(--accent-warm-gold)" />
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', color: 'var(--text-ivory)' }}>
            Tale of the Tape
          </span>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', padding: '2px 8px', background: 'rgba(194, 166, 118, 0.12)', borderRadius: '4px' }}>
            Pre-Fight Metrics
          </span>
        </div>
        {!reachRecorded && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            *Reach approximated from height
          </span>
        )}
      </div>

      {/* Head-to-Head Athlete Names */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--bg-surface)',
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {/* Fighter A */}
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(168, 82, 80, 0.25)',
              color: '#E58A88',
              borderRadius: '3px',
              border: '1px solid rgba(168, 82, 80, 0.4)'
            }}>
              {cornerA} Corner
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text-ivory)' }}>
            {fighterA.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {fighterA.prior_ufc_fights} UFC Fights • {fighterA.prior_ufc_wins} Wins
          </div>
        </div>

        {/* VS Divider */}
        <div style={{
          padding: '8px 16px',
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          color: 'var(--text-muted)',
          fontSize: '16px'
        }}>
          vs
        </div>

        {/* Fighter B */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(59, 122, 140, 0.25)',
              color: '#7EC2D4',
              borderRadius: '3px',
              border: '1px solid rgba(59, 122, 140, 0.4)'
            }}>
              {cornerB} Corner
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--text-ivory)' }}>
            {fighterB.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {fighterB.prior_ufc_fights} UFC Fights • {fighterB.prior_ufc_wins} Wins
          </div>
        </div>
      </div>

      {/* Physical Comparison Rows */}
      <div style={{ background: 'var(--bg-surface-card)' }}>
        {renderComparisonRow(
          'Height',
          fighterA.height_inches ? `${Math.floor(fighterA.height_inches / 12)}' ${Math.round(fighterA.height_inches % 12)}"` : 'N/A',
          fighterB.height_inches ? `${Math.floor(fighterB.height_inches / 12)}' ${Math.round(fighterB.height_inches % 12)}"` : 'N/A',
          fighterA.height_inches || 70,
          fighterB.height_inches || 70
        )}
        {renderComparisonRow(
          'Reach',
          fighterA.reach_inches ? `${fighterA.reach_inches}"` : 'N/A',
          fighterB.reach_inches ? `${fighterB.reach_inches}"` : 'N/A',
          fighterA.reach_inches || 70,
          fighterB.reach_inches || 70
        )}
        {renderComparisonRow(
          'Weight',
          fighterA.weight_lbs ? `${fighterA.weight_lbs}` : 'N/A',
          fighterB.weight_lbs ? `${fighterB.weight_lbs}` : 'N/A',
          fighterA.weight_lbs || 155,
          fighterB.weight_lbs || 155,
          false,
          ' lbs'
        )}
        {renderComparisonRow(
          'Stance',
          fighterA.stance || 'Orthodox',
          fighterB.stance || 'Orthodox',
          fighterA.stance === 'Southpaw' ? 1 : 0,
          fighterB.stance === 'Southpaw' ? 1 : 0
        )}
      </div>

      {/* Section Divider: Striking & Grappling */}
      <div style={{
        padding: '10px 16px',
        background: 'var(--bg-deep)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--accent-sage-bright)'
      }}>
        <Zap size={13} />
        <span>Striking & Grappling Differential Metrics</span>
      </div>

      <div style={{ background: 'var(--bg-surface-card)' }}>
        {renderComparisonRow(
          'Sig. Strikes / Min',
          fighterA.slpm.toFixed(2),
          fighterB.slpm.toFixed(2),
          fighterA.slpm,
          fighterB.slpm
        )}
        {renderComparisonRow(
          'Strikes Absorbed / Min',
          fighterA.sapm.toFixed(2),
          fighterB.sapm.toFixed(2),
          fighterA.sapm,
          fighterB.sapm,
          true // Lower is better
        )}
        {renderComparisonRow(
          'Striking Accuracy',
          `${fighterA.strike_acc_pct}%`,
          `${fighterB.strike_acc_pct}%`,
          fighterA.strike_acc_pct,
          fighterB.strike_acc_pct
        )}
        {renderComparisonRow(
          'Striking Defense',
          `${fighterA.strike_def_pct}%`,
          `${fighterB.strike_def_pct}%`,
          fighterA.strike_def_pct,
          fighterB.strike_def_pct
        )}
        {renderComparisonRow(
          'Takedowns / 15m',
          fighterA.takedown_avg_15m.toFixed(2),
          fighterB.takedown_avg_15m.toFixed(2),
          fighterA.takedown_avg_15m,
          fighterB.takedown_avg_15m
        )}
        {renderComparisonRow(
          'Takedown Defense',
          `${fighterA.takedown_def_pct}%`,
          `${fighterB.takedown_def_pct}%`,
          fighterA.takedown_def_pct,
          fighterB.takedown_def_pct
        )}
      </div>
    </div>
  );
};
