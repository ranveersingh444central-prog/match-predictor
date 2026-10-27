import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Activity, 
  Users, 
  Database, 
  BrainCircuit, 
  ArrowRight, 
  Clock, 
  Award,
  AlertTriangle,
  RefreshCw,
  Flame,
  Scale
} from 'lucide-react';
import { ufcApi } from '../../services/ufcApi';
import { UFCStatusResponse, UFCWeightClass } from '../../types/ufc';

interface UFCOverviewProps {
  onNavigate: (tab: string, context?: any) => void;
}

export const UFCOverview: React.FC<UFCOverviewProps> = ({ onNavigate }) => {
  const [status, setStatus] = useState<UFCStatusResponse | null>(null);
  const [weightClasses, setWeightClasses] = useState<UFCWeightClass[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [statusRes, wcRes] = await Promise.all([
          ufcApi.getStatus(),
          ufcApi.getWeightClasses()
        ]);
        setStatus(statusRes);
        setWeightClasses(wcRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load UFC workspace metadata');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const marqueeFights = [
    {
      red: 'Jon Jones',
      blue: 'Daniel Cormier',
      division: 'Light Heavyweight',
      badge: 'Championship Rivalry',
      isTitle: true
    },
    {
      red: 'Khabib Nurmagomedov',
      blue: 'Justin Gaethje',
      division: 'Lightweight',
      badge: 'Undefeated Champion',
      isTitle: true
    },
    {
      red: 'Conor McGregor',
      blue: 'Dustin Poirier',
      division: 'Lightweight',
      badge: 'Marquee Trilogy',
      isTitle: false
    },
    {
      red: 'Israel Adesanya',
      blue: 'Robert Whittaker',
      division: 'Middleweight',
      badge: 'Championship Unification',
      isTitle: true
    }
  ];

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-sage)' }}>
          <RefreshCw size={20} className="spinning" />
          <span>Initializing UFC Combat Intelligence Workspace...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        <div className="card" style={{ borderColor: 'var(--outcome-loss)', background: 'rgba(168, 82, 80, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#E58A88', marginBottom: '8px' }}>
            <AlertTriangle size={20} />
            <h3 style={{ fontSize: '18px', color: '#E58A88' }}>UFC Intelligence Workspace Offline</h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
          <button className="btn-secondary" onClick={() => window.location.reload()}>Retry Connection</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px 80px 24px' }}>
      {/* Dataset Cutoff Notice */}
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
            <strong>Historical Combat Archive:</strong> Powered by official UFC records from March 11, 1994 to <strong>March 20, 2021</strong>.
          </span>
        </div>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', padding: '2px 8px', background: 'rgba(194, 166, 118, 0.15)', borderRadius: '4px' }}>
          Zero Leakage
        </span>
      </div>

      {/* Hero Editorial Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            background: 'rgba(168, 82, 80, 0.2)',
            color: '#E58A88',
            borderRadius: '4px',
            border: '1px solid rgba(168, 82, 80, 0.3)'
          }}>
            Sport 02 • Combat Sports
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
          <span style={{ color: 'var(--text-sage)', fontSize: '13px' }}>Octagon Analytics Engine</span>
        </div>

        <h1 style={{ fontSize: '42px', lineHeight: '1.15', marginBottom: '16px', maxWidth: '850px' }}>
          Mathematical probability meets the unpredictable nature of combat.
        </h1>
        <p style={{ fontSize: '17px', color: 'var(--text-sage)', maxWidth: '780px', lineHeight: '1.6' }}>
          PITCHIQ Combat Intelligence analyzes 6,000+ historical bouts and 3,500+ athlete profiles across 11 weight divisions. 
          Features date-aware pre-fight differential modeling, Tale of the Tape comparisons, and finish-method breakdowns.
        </p>
      </div>

      {/* KPI Metrics Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '40px'
      }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Historical Bouts
          </div>
          <div className="num-tabular" style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)' }}>
            {status?.total_bouts.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            1994 – March 2021
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Fighter Profiles
          </div>
          <div className="num-tabular" style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)' }}>
            {status?.total_athletes.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Height, reach & records
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Champion Model
          </div>
          <div style={{ fontSize: '26px', fontFamily: 'var(--font-serif)', color: 'var(--accent-sage-bright)' }}>
            {status?.champion_algorithm || 'Random Forest'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Out-of-sample forward split
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Brier Score
          </div>
          <div className="num-tabular" style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--accent-warm-gold)' }}>
            0.2368
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            vs 0.2535 baseline
          </div>
        </div>
      </div>

      {/* Marquee Matchup Simulator Section */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warm-gold)', marginBottom: '4px' }}>
              <Flame size={16} />
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Instant Simulation
              </span>
            </div>
            <h2 style={{ fontSize: '26px' }}>Marquee UFC Matchups</h2>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => onNavigate('predictor')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Custom Predictor</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px'
        }}>
          {marqueeFights.map((f, i) => (
            <div 
              key={i}
              className="card"
              style={{
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => onNavigate('predictor', { fighterA: f.red, fighterB: f.blue, isTitle: f.isTitle })}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
                  {f.division}
                </span>
                <span style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: 'rgba(194, 166, 118, 0.15)',
                  color: 'var(--accent-warm-gold)',
                  fontWeight: 600
                }}>
                  {f.badge}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--outcome-loss)' }}></span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-ivory)' }}>{f.red}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--outcome-away)' }}></span>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-ivory)' }}>{f.blue}</span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '12px',
                color: 'var(--accent-sage-bright)'
              }}>
                <span>Simulate Matchup</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weight Division Volume Explorer */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-sage)', marginBottom: '4px' }}>
              <Scale size={16} />
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                Weight Classes
              </span>
            </div>
            <h2 style={{ fontSize: '26px' }}>Official UFC Weight Divisions</h2>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => onNavigate('data')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Explore 6,000+ Bouts</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px'
        }}>
          {weightClasses.slice(0, 8).map((wc, i) => (
            <div 
              key={i} 
              className="card"
              style={{ padding: '16px', cursor: 'pointer' }}
              onClick={() => onNavigate('data', { weightClass: wc.name })}
            >
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-ivory)', marginBottom: '4px' }}>
                {wc.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{wc.total_bouts} bouts</span>
                <span style={{ color: 'var(--accent-warm-gold)' }}>{wc.championship_bouts} title fights</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
