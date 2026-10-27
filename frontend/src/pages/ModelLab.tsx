import React, { useEffect, useState } from 'react';
import { 
  BrainCircuit, 
  ShieldCheck, 
  BarChart3, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { ModelMetrics } from '../types';

export const ModelLab: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const res = await api.getModelMetrics();
        setMetrics(res);
      } catch (e) {
        console.error('Error loading model metrics:', e);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <div className="section-label">Academic Machine Learning Experiment 11</div>
          <h1 className="page-title">Model Evaluation Laboratory</h1>
          <p className="page-subtitle">
            Empirical evaluation of the deterministic Random Forest classification pipeline 
            against a naive baseline on 324 chronologically held-out Premier League matches.
          </p>
        </div>
      </section>

      <section className="container">
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-sage)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            Loading evaluation artifacts...
          </div>
        ) : !metrics ? (
          <div className="editorial-card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--text-sage)' }}>Model evaluation data not currently available.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            {/* Model Comparison Cards */}
            <div className="grid-2">
              {/* Baseline Card */}
              <div className="editorial-card" style={{ borderLeft: '3px solid var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                      Control Baseline Model
                    </span>
                    <h3 style={{ fontSize: '22px', marginTop: '4px' }}>Dummy Classifier</h3>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-sage)'
                  }}>
                    Strategy: Most Frequent (Home)
                  </span>
                </div>

                <div className="grid-2" style={{ marginTop: '20px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-sage)' }}>Test Accuracy</span>
                    <div className="num-tabular" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-ivory)' }}>
                      {(metrics.baseline.accuracy * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-sage)' }}>Macro F1-Score</span>
                    <div className="num-tabular" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      {metrics.baseline.macro_f1.toFixed(4)}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px', lineHeight: '1.6' }}>
                  A non-learning benchmark that blindly predicts the historical majority outcome (Home Win ~42%). 
                  Macro F1 is severely degraded because it yields zero recall for Draws and Away Wins.
                </p>
              </div>

              {/* Main Model Card */}
              <div className="editorial-card-elevated" style={{ borderLeft: '3px solid #6EE7B7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-moss)' }}>
                      Primary Evaluated Pipeline
                    </span>
                    <h3 style={{ fontSize: '22px', marginTop: '4px' }}>Random Forest Classifier</h3>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(78, 138, 99, 0.2)',
                    color: '#6EE7B7',
                    border: '1px solid rgba(78, 138, 99, 0.4)'
                  }}>
                    180 Trees • Balanced Subsample
                  </span>
                </div>

                <div className="grid-4" style={{ marginTop: '20px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-sage)' }}>Test Accuracy</span>
                    <div className="num-tabular" style={{ fontSize: '28px', fontWeight: 700, color: '#6EE7B7' }}>
                      {(metrics.main_model.accuracy * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-sage)' }}>Macro F1-Score</span>
                    <div className="num-tabular" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-ivory)' }}>
                      {metrics.main_model.macro_f1.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-sage)' }}>Log Loss</span>
                    <div className="num-tabular" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-ivory)' }}>
                      {metrics.main_model.log_loss.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-sage)' }}>Brier Score</span>
                    <div className="num-tabular" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-ivory)' }}>
                      {metrics.main_model.brier_score.toFixed(4)}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-sage)', marginTop: '16px', lineHeight: '1.6' }}>
                  Outperforms the naive majority baseline by <strong>+{( (metrics.main_model.accuracy - metrics.baseline.accuracy) * 100).toFixed(1)} percentage points</strong> and achieves a 
                  macro F1 of <strong>{metrics.main_model.macro_f1}</strong> with active calibrated predictions across all 3 classes.
                </p>
              </div>
            </div>

            {/* Chronological Train / Test Split Breakdown */}
            <div className="editorial-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Clock size={18} color="var(--accent-moss)" />
                <h3 style={{ fontSize: '18px' }}>Strict Chronological Partitioning</h3>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-sage)', lineHeight: '1.6', marginBottom: '20px' }}>
                Unlike synthetic toy benchmarks that randomly shuffle matches, football outcome forecasting 
                demands a strict chronological horizon to prevent past form from looking into future events.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '78% 22%',
                gap: '8px',
                height: '42px',
                borderRadius: '6px',
                overflow: 'hidden',
                marginBottom: '14px'
              }}>
                <div style={{
                  backgroundColor: 'rgba(78, 138, 99, 0.25)',
                  border: '1px solid rgba(78, 138, 99, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#6EE7B7'
                }}>
                  Training Period ({metrics.metadata.train_samples} matches: {metrics.metadata.training_period})
                </div>
                <div style={{
                  backgroundColor: 'rgba(194, 166, 118, 0.25)',
                  border: '1px solid rgba(194, 166, 118, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#FDE047'
                }}>
                  Held-Out Test ({metrics.metadata.test_samples} matches)
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>Pre-match historical form computed strictly backward in time</span>
                <span>Unseen Future Horizon: {metrics.metadata.test_period}</span>
              </div>
            </div>

            {/* Confusion Matrix & Per-Class Performance */}
            <div className="grid-2">
              {/* 3x3 Confusion Matrix */}
              <div className="editorial-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>3×3 Confusion Matrix (Unseen Test Set)</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-sage)', marginBottom: '18px' }}>
                  Vertical axis indicates ground truth outcome; horizontal axis indicates model predicted outcome.
                </p>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>Actual \ Pred</th>
                        {metrics.confusion_matrix.labels.map((lbl, i) => (
                          <th key={i} style={{ padding: '8px', fontSize: '12px', color: 'var(--text-ivory)' }}>
                            Pred {lbl}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.confusion_matrix.matrix.map((row, rIdx) => {
                        const actualLabel = metrics.confusion_matrix.labels[rIdx];
                        return (
                          <tr key={rIdx}>
                            <td style={{ padding: '10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-sage)', textAlign: 'left' }}>
                              Actual {actualLabel}
                            </td>
                            {row.map((val, cIdx) => {
                              const isDiagonal = rIdx === cIdx;
                              return (
                                <td 
                                  key={cIdx}
                                  className="num-tabular"
                                  style={{
                                    padding: '12px',
                                    backgroundColor: isDiagonal ? 'rgba(78, 138, 99, 0.28)' : 'rgba(255, 255, 255, 0.03)',
                                    color: isDiagonal ? '#6EE7B7' : 'var(--text-muted)',
                                    fontWeight: isDiagonal ? 700 : 400,
                                    fontSize: '15px',
                                    border: '1px solid var(--border-subtle)'
                                  }}
                                >
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Per-Class Metrics */}
              <div className="editorial-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Per-Class Metrics (Precision, Recall, F1)</h3>
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Outcome Class</th>
                        <th>Precision</th>
                        <th>Recall</th>
                        <th>F1-Score</th>
                        <th>Support</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics.main_model.per_class).map(([code, p]) => (
                        <tr key={code}>
                          <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>
                            {p.name} ({code})
                          </td>
                          <td className="num-tabular">{p.precision.toFixed(3)}</td>
                          <td className="num-tabular">{p.recall.toFixed(3)}</td>
                          <td className="num-tabular" style={{ fontWeight: 600, color: '#6EE7B7' }}>
                            {p.f1_score.toFixed(3)}
                          </td>
                          <td className="num-tabular" style={{ color: 'var(--text-muted)' }}>{p.support}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Note: Draws are notoriously difficult to predict in football due to low class frequency (~23%) and sudden late goals, resulting in lower recall for the draw outcome.
                </div>
              </div>
            </div>

            {/* Feature Importance Rankings */}
            <div className="editorial-card">
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Top Predictive Drivers (Gini Feature Importance)</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-sage)', marginBottom: '20px' }}>
                Mean decrease in impurity across the 180 decision trees. Reflects internal model utility, not physical causation.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {metrics.top_features.map((f, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '220px 1fr 60px', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-ivory)', fontFamily: 'monospace' }}>
                      {f.feature}
                    </span>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-deep)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${(f.importance / metrics.top_features[0].importance) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--accent-moss)',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                    <span className="num-tabular" style={{ fontSize: '12px', color: 'var(--text-sage)', textAlign: 'right' }}>
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Limitations Notice */}
            <div style={{
              padding: '24px',
              borderRadius: '8px',
              backgroundColor: 'rgba(194, 166, 118, 0.08)',
              border: '1px solid rgba(194, 166, 118, 0.25)',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <AlertTriangle size={22} color="#C2A676" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '15px', color: '#FDE047', marginBottom: '6px' }}>
                  Academic Epistemology & Inherent Uncertainty in Football
                </h4>
                <p style={{ fontSize: '13.5px', color: 'var(--text-sage)', lineHeight: '1.6' }}>
                  Professional football matches exhibit profound stochasticity. Factors such as red cards, 
                  early penalty decisions, tactical changes, in-game injuries, and pitch conditions introduce 
                  unavoidable noise that no historical pre-match feature pipeline can eliminate. 
                  Model outputs should always be interpreted as calibrated likelihood estimates rather than certainties.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
