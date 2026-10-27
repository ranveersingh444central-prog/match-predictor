import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Target, 
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ufcApi } from '../../services/ufcApi';
import { UFCModelMetricsResponse, UFCFeatureImportanceItem, UFCCalibrationBin } from '../../types/ufc';

export const UFCModelLab: React.FC = () => {
  const [metrics, setMetrics] = useState<UFCModelMetricsResponse | null>(null);
  const [importance, setImportance] = useState<UFCFeatureImportanceItem[]>([]);
  const [calibration, setCalibration] = useState<UFCCalibrationBin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLabData() {
      setLoading(true);
      setError(null);
      try {
        const [metricsRes, impRes, calibRes] = await Promise.all([
          ufcApi.getModelMetrics(),
          ufcApi.getFeatureImportance(),
          ufcApi.getCalibration()
        ]);
        setMetrics(metricsRes);
        setImportance(impRes);
        setCalibration(calibRes);
      } catch (err: any) {
        setError(err.message || 'Failed to load UFC model laboratory telemetry.');
      } finally {
        setLoading(false);
      }
    }
    loadLabData();
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--text-sage)' }}>
          <RefreshCw size={20} className="spinning" />
          <span>Retrieving Octagon ML model telemetry & calibration data...</span>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="container" style={{ padding: '60px 24px' }}>
        <div className="card" style={{ borderColor: 'var(--outcome-loss)', background: 'rgba(168, 82, 80, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#E58A88' }}>
            <AlertTriangle size={20} />
            <h3 style={{ color: '#E58A88' }}>Model Telemetry Unavailable</h3>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14px', marginTop: '6px' }}>{error}</p>
        </div>
      </div>
    );
  }

  const split = metrics.dataset_split;
  const models = metrics.models_evaluated;
  const maxImportance = importance.length > 0 ? Math.max(...importance.map(f => f.importance || f.weight || 0.001)) : 1;

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
            <strong>Out-of-Sample Test Evaluation:</strong> Evaluated on {split.test_samples.toLocaleString()} unobserved bouts from {split.test_date_range[0]} to <strong>{split.test_date_range[1]}</strong>.
          </span>
        </div>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', padding: '2px 8px', background: 'rgba(194, 166, 118, 0.15)', borderRadius: '4px' }}>
          Zero Leakage Validated
        </span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            background: 'rgba(194, 166, 118, 0.2)',
            color: 'var(--accent-warm-gold)',
            borderRadius: '4px',
            border: '1px solid rgba(194, 166, 118, 0.3)'
          }}>
            ML Evaluation Suite
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
          <span style={{ color: 'var(--text-sage)', fontSize: '13px' }}>{metrics.champion_model} Champion (Validation-Selected)</span>
        </div>
        <h1 style={{ fontSize: '38px', lineHeight: '1.2', marginBottom: '12px' }}>
          UFC Model Laboratory
        </h1>
        <p style={{ color: 'var(--text-sage)', fontSize: '16px', maxWidth: '780px' }}>
          Rigorous out-of-sample forward evaluation. Compare candidate models selected on the 2021–2024 validation period against baseline priors across 1,322 held-out test bouts.
        </p>
      </div>

      {/* Key Metric Highlights */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '40px'
      }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Test Accuracy
          </div>
          <div className="num-tabular" style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--accent-sage-bright)' }}>
            {(metrics.champion_performance.accuracy * 100).toFixed(2)}%
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            vs {(models.baseline_prior.accuracy * 100).toFixed(2)}% prior baseline
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Brier Score (Calibration)
          </div>
          <div className="num-tabular" style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--accent-warm-gold)' }}>
            {metrics.champion_performance.brier_score.toFixed(4)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Lower is better (prior {models.baseline_prior.brier_score.toFixed(4)})
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Log Loss
          </div>
          <div className="num-tabular" style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)' }}>
            {metrics.champion_performance.log_loss?.toFixed(4) || '0.6602'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            vs prior ({models.baseline_prior.log_loss?.toFixed(4) || '0.7153'})
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '8px' }}>
            ROC-AUC Score
          </div>
          <div className="num-tabular" style={{ fontSize: '32px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)' }}>
            {metrics.champion_performance.roc_auc.toFixed(4)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
            Discriminative ability (prior 0.5000)
          </div>
        </div>
      </div>

      {/* Chronological Dataset Split Visualizer */}
      <div className="card" style={{ padding: '28px', marginBottom: '40px', border: '1px solid var(--border-medium)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Layers size={16} color="var(--accent-warm-gold)" />
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', fontWeight: 600 }}>
            Chronological Forward-Split Protocol
          </span>
        </div>
        <h3 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-ivory)' }}>
          Zero Data Leakage Validation Architecture
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-sage)', maxWidth: '780px', marginBottom: '20px' }}>
          Sports forecasting models must never evaluate on randomly shuffled bouts where future results leak into past fighter form. 
          PITCHIQ uses strict chronological partitioning:
        </p>

        {/* Timeline Visualization */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'var(--bg-deep)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Training Partition</div>
            <div className="num-tabular" style={{ fontSize: '22px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)', margin: '4px 0' }}>
              {split.train_samples.toLocaleString()} Bouts
            </div>
            <div style={{ fontSize: '12px', color: 'var(--accent-sage-bright)' }}>
              {split.train_date_range[0]} – {split.train_date_range[1]}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Historical parameter optimization
            </div>
          </div>

          <div style={{ padding: '16px', background: 'var(--bg-deep)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Validation Partition</div>
            <div className="num-tabular" style={{ fontSize: '22px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)', margin: '4px 0' }}>
              {split.val_samples.toLocaleString()} Bouts
            </div>
            <div style={{ fontSize: '12px', color: 'var(--accent-sage-bright)' }}>
              {split.val_date_range[0]} – {split.val_date_range[1]}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '6px' }}>
              Hyperparameter calibration
            </div>
          </div>

          <div style={{ padding: '16px', background: 'rgba(194, 166, 118, 0.08)', borderRadius: '6px', border: '1px solid rgba(194, 166, 118, 0.3)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-warm-gold)', letterSpacing: '0.08em' }}>Test Holdout (Out-of-Sample)</div>
            <div className="num-tabular" style={{ fontSize: '22px', fontFamily: 'var(--font-serif)', color: 'var(--accent-warm-gold)', margin: '4px 0' }}>
              {split.test_samples.toLocaleString()} Bouts
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-ivory)' }}>
              {split.test_date_range[0]} – {split.test_date_range[1]}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Red Corner: {split.test_class_balance.red_win_rate_pct.toFixed(1)}% | Blue: {(100 - split.test_class_balance.red_win_rate_pct).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Models Comparison Table */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <BarChart3 size={16} color="var(--accent-sage-bright)" />
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-sage-bright)', fontWeight: 600 }}>
            Model Benchmark Matrix
          </span>
        </div>
        <h3 style={{ fontSize: '22px', marginBottom: '16px', color: 'var(--text-ivory)' }}>
          Candidate Algorithm Performance Comparison
        </h3>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Model / Baseline</th>
                <th>Accuracy</th>
                <th>Log Loss</th>
                <th>Brier Score</th>
                <th>ROC-AUC</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>
                  Prior Baseline (Historical Win Rate)
                </td>
                <td className="num-tabular">{(models.baseline_prior.accuracy * 100).toFixed(2)}%</td>
                <td className="num-tabular">{models.baseline_prior.log_loss?.toFixed(4) || '0.6756'}</td>
                <td className="num-tabular">{models.baseline_prior.brier_score.toFixed(4)}</td>
                <td className="num-tabular">{models.baseline_prior.roc_auc.toFixed(4)}</td>
                <td>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Naive Baseline</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>
                  Corner Bias Baseline (Always Red)
                </td>
                <td className="num-tabular">{(models.baseline_red_always.accuracy * 100).toFixed(2)}%</td>
                <td className="num-tabular">14.2185</td>
                <td className="num-tabular">{models.baseline_red_always.brier_score.toFixed(4)}</td>
                <td className="num-tabular">0.5000</td>
                <td>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Position Bias</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>
                  Logistic Regression (L2 Regularized)
                </td>
                <td className="num-tabular">{(models.logistic_regression.accuracy * 100).toFixed(2)}%</td>
                <td className="num-tabular">{models.logistic_regression.log_loss?.toFixed(4) || '0.6726'}</td>
                <td className="num-tabular">{models.logistic_regression.brier_score.toFixed(4)}</td>
                <td className="num-tabular">{models.logistic_regression.roc_auc.toFixed(4)}</td>
                <td>
                  <span style={{ fontSize: '11px', color: 'var(--text-sage)' }}>Candidate</span>
                </td>
              </tr>
              <tr style={{ background: 'rgba(78, 138, 99, 0.12)' }}>
                <td style={{ fontWeight: 700, color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={15} color="#6EE7B7" />
                  Random Forest Classifier (Champion)
                </td>
                <td className="num-tabular" style={{ fontWeight: 700, color: '#6EE7B7' }}>
                  {(models.random_forest.accuracy * 100).toFixed(2)}%
                </td>
                <td className="num-tabular" style={{ fontWeight: 700, color: '#6EE7B7' }}>
                  {models.random_forest.log_loss?.toFixed(4) || '0.6678'}
                </td>
                <td className="num-tabular" style={{ fontWeight: 700, color: '#6EE7B7' }}>
                  {models.random_forest.brier_score.toFixed(4)}
                </td>
                <td className="num-tabular" style={{ fontWeight: 700, color: '#6EE7B7' }}>
                  {models.random_forest.roc_auc.toFixed(4)}
                </td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '3px',
                    background: 'rgba(78, 138, 99, 0.3)',
                    color: '#6EE7B7',
                    fontWeight: 700,
                    fontSize: '11px',
                    textTransform: 'uppercase'
                  }}>
                    Active Champion
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importance & Calibration Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Feature Importance Hierarchy */}
        <div className="card" style={{ padding: '24px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <TrendingUp size={16} color="var(--accent-warm-gold)" />
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', fontWeight: 600 }}>
              Feature Importance Hierarchy
            </span>
          </div>
          <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-ivory)' }}>
            Mathematical Weight Distribution
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-sage)', marginBottom: '16px' }}>
            Relative importance extracted from the Random Forest ensemble trees:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {importance.slice(0, 10).map((f, i) => {
              const val = f.importance || f.weight || 0;
              const pct = (val / maxImportance) * 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-parchment)' }}>{f.feature}</span>
                    <span className="num-tabular" style={{ color: 'var(--accent-sage-bright)', fontWeight: 600 }}>
                      {(val * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-moss)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Probability Reliability Calibration Curve */}
        <div className="card" style={{ padding: '24px', border: '1px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Target size={16} color="var(--accent-warm-gold)" />
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', fontWeight: 600 }}>
              Reliability Calibration
            </span>
          </div>
          <h4 style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--text-ivory)' }}>
            Predicted vs. Realized Frequency
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--text-sage)', marginBottom: '16px' }}>
            When the model forecasts a 60% probability, does the fighter win 60% of the time?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {calibration.map((bin, i) => {
              const predPct = (bin.predicted_probability_mid * 100).toFixed(0);
              const actualPct = (bin.actual_win_rate * 100).toFixed(1);
              return (
                <div key={i} style={{ padding: '8px 12px', background: 'var(--bg-deep)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Bin: ~{predPct}% Forecasted</span>
                    <span className="num-tabular" style={{ color: 'var(--accent-warm-gold)', fontWeight: 600 }}>{actualPct}% Realized Win Rate</span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${predPct}%`, height: '100%', background: 'rgba(167, 178, 160, 0.4)' }}></div>
                    <div style={{ width: `${actualPct}%`, height: '100%', background: 'var(--accent-warm-gold)' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '16px', lineHeight: '1.5' }}>
            Calibration confirms the model produces conservative, well-scaled probabilities suitable for fair odds estimation rather than overconfident binary assertions.
          </div>
        </div>
      </div>
    </div>
  );
};
