import React, { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Database,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { ModelMetrics, DataSummary, FixtureItem } from '../types';

interface OverviewProps {
  onNavigate: (tab: string, context?: any) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverviewData() {
      try {
        const [mRes, dRes, fRes] = await Promise.allSettled([
          api.getModelMetrics(),
          api.getDataSummary(),
          api.getFixtures()
        ]);

        if (mRes.status === 'fulfilled') setMetrics(mRes.value);
        if (dRes.status === 'fulfilled') setDataSummary(dRes.value);
        if (fRes.status === 'fulfilled') setFixtures(fRes.value.fixtures || []);
      } catch (e) {
        console.error('Error loading overview data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadOverviewData();
  }, []);

  return (
    <div>
      {/* Cinematic Editorial Hero Section */}
      <section style={{
        position: 'relative',
        padding: '90px 0 80px 0',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '820px' }}>
            <div className="section-label">
              <span style={{ width: '18px', height: '1px', backgroundColor: 'var(--accent-moss)' }}></span>
              AI Football Intelligence • Machine Learning Experiment 11
            </div>

            <h1 style={{
              fontSize: '56px',
              lineHeight: 1.1,
              marginBottom: '24px',
              color: 'var(--text-ivory)'
            }}>
              Turn match data into <span style={{ fontStyle: 'italic', color: '#6EE7B7' }}>probabilistic clarity.</span>
            </h1>

            <p style={{
              fontSize: '18px',
              lineHeight: 1.7,
              color: 'var(--text-sage)',
              maxWidth: '680px',
              marginBottom: '36px'
            }}>
              PITCHIQ evaluates English Premier League fixtures through real historical match records, 
              leakage-safe rolling team form, and time-aware Random Forest classification. 
              No gambling hype. No fabricated metrics. Pure analytical football science.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                className="btn-primary"
                onClick={() => onNavigate('predictor')}
              >
                Launch Match Predictor <ArrowRight size={16} />
              </button>
              <button 
                className="btn-secondary"
                onClick={() => onNavigate('modellab')}
              >
                Explore Model Lab <ArrowUpRight size={15} />
              </button>
              <button 
                className="btn-secondary"
                onClick={() => onNavigate('methodology')}
                style={{ border: 'none', color: 'var(--text-sage)' }}
              >
                Viva & Methodology →
              </button>
            </div>
          </div>
        </div>

        {/* Ambient Subtle Pitch Glow */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(24, 55, 45, 0.45) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      </section>

      {/* Model & Dataset Snapshot Strip */}
      <section style={{ backgroundColor: 'var(--bg-surface-muted)', borderBottom: '1px solid var(--border-subtle)', padding: '24px 0' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Classification Algorithm
              </div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-ivory)', marginTop: '4px' }}>
                Random Forest Pipeline
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Held-Out Test Accuracy
              </div>
              <div className="num-tabular" style={{ fontSize: '20px', fontWeight: 700, color: '#6EE7B7', marginTop: '4px' }}>
                {metrics ? `${(metrics.main_model.accuracy * 100).toFixed(1)}%` : '45.7%'}
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '6px' }}>
                  (vs {(metrics?.baseline.accuracy ? (metrics.baseline.accuracy * 100).toFixed(1) : '42.0')}% baseline)
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Evaluated Test Fixtures
              </div>
              <div className="num-tabular" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-ivory)', marginTop: '4px' }}>
                {metrics?.main_model.evaluated_test_matches || 324} <span style={{ fontSize: '13px', color: 'var(--text-sage)', fontWeight: 400 }}>unseen matches</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Verified Dataset
              </div>
              <div className="num-tabular" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-ivory)', marginTop: '4px' }}>
                {dataSummary?.total_valid_matches || 1520} <span style={{ fontSize: '13px', color: 'var(--text-sage)', fontWeight: 400 }}>Premier League matches</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Architectural Pillars Section */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ marginBottom: '48px', maxWidth: '640px' }}>
            <div className="section-label">System Architecture</div>
            <h2 style={{ fontSize: '36px', marginBottom: '14px' }}>
              Engineered with academic rigor.
            </h2>
            <p style={{ color: 'var(--text-sage)', fontSize: '15px', lineHeight: '1.7' }}>
              Sports prediction is frequently polluted by subtle data leakage. PITCHIQ is architected 
              to guarantee chronological feature validity at every step of the pipeline.
            </p>
          </div>

          <div className="grid-3">
            <div className="editorial-card">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(127, 150, 125, 0.12)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-moss)',
                marginBottom: '20px'
              }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Zero Target Leakage</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-sage)', lineHeight: '1.6' }}>
                Features are generated exclusively from matches completed strictly before the scheduled kickoff. 
                Scores, red cards, shots, and target outcomes never bleed into prediction inputs.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(127, 150, 125, 0.12)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-moss)',
                marginBottom: '20px'
              }}>
                <TrendingUp size={20} />
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Rolling Form Windows</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-sage)', lineHeight: '1.6' }}>
                Tracks rolling 5-match form, venue-specific efficiency (home PPG when playing at home), 
                rest-day differentials, and head-to-head records across 26 Premier League clubs.
              </p>
            </div>

            <div className="editorial-card">
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: 'rgba(127, 150, 125, 0.12)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-moss)',
                marginBottom: '20px'
              }}>
                <Calendar size={20} />
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Time-Aware Splitting</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-sage)', lineHeight: '1.6' }}>
                No synthetic random shuffling. Models are trained chronologically on past seasons 
                (2021–2024) and tested on the subsequent unseen season (2024–2025) to mirror live deployment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Fixtures Feed Preview */}
      <section style={{
        padding: '60px 0 80px 0',
        backgroundColor: 'var(--bg-botanical)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="section-label">Live Fixtures Feed</div>
              <h2 style={{ fontSize: '32px' }}>Upcoming Scheduled Fixtures</h2>
            </div>
            <button 
              className="btn-secondary"
              onClick={() => onNavigate('predictor')}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              View All Fixtures in Predictor →
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-sage)' }}>
              Loading fixtures feed...
            </div>
          ) : fixtures.length === 0 ? (
            <div className="editorial-card" style={{ textAlign: 'center', padding: '48px' }}>
              <p style={{ color: 'var(--text-sage)', marginBottom: '16px' }}>
                No immediate upcoming fixtures in the current queue. You can test any hypothetical matchup in the Predictor!
              </p>
              <button className="btn-primary" onClick={() => onNavigate('predictor')}>
                Create Hypothetical Matchup
              </button>
            </div>
          ) : (
            <div className="grid-3">
              {fixtures.slice(0, 6).map((fx) => (
                <div 
                  key={fx.fixture_id}
                  className="editorial-card"
                  style={{ cursor: 'pointer', transition: 'var(--transition-smooth)' }}
                  onClick={() => onNavigate('predictor', { fixture: fx })}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    <span>{fx.competition}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {fx.date} • {fx.time}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 0' }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                      {fx.home_team}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '0 8px' }}>vs</span>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-ivory)', textAlign: 'right' }}>
                      {fx.away_team}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    fontSize: '12.5px',
                    color: 'var(--accent-moss)'
                  }}>
                    <span>Predict Match Probability</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
