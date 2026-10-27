import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  RefreshCw,
  Sliders,
  History,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { PredictionResult, FixtureItem, TeamSummary } from '../types';
import { TacticalPitch } from '../components/common/TacticalPitch';

interface MatchPredictorProps {
  initialFixture?: FixtureItem | null;
}

export const MatchPredictor: React.FC<MatchPredictorProps> = ({ initialFixture }) => {
  const [fixtures, setFixtures] = useState<FixtureItem[]>([]);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<FixtureItem | null>(null);

  // Form State
  const [mode, setMode] = useState<'scheduled' | 'hypothetical'>('scheduled');
  const [homeTeam, setHomeTeam] = useState<string>('Arsenal');
  const [awayTeam, setAwayTeam] = useState<string>('Chelsea');
  const [matchDate, setMatchDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Prediction State
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load teams and fixtures on mount
  useEffect(() => {
    async function initData() {
      try {
        const [teamsRes, fixturesRes, histRes] = await Promise.allSettled([
          api.getTeams(),
          api.getFixtures(),
          api.getPredictionHistory()
        ]);

        if (teamsRes.status === 'fulfilled') {
          setTeams(teamsRes.value.teams);
          if (teamsRes.value.teams.length >= 2 && !initialFixture) {
            setHomeTeam(teamsRes.value.teams[0].name);
            setAwayTeam(teamsRes.value.teams[1].name);
          }
        }

        if (fixturesRes.status === 'fulfilled' && fixturesRes.value.fixtures.length > 0) {
          const fxList = fixturesRes.value.fixtures;
          setFixtures(fxList);
          if (initialFixture) {
            setSelectedFixture(initialFixture);
            setHomeTeam(initialFixture.home_team);
            setAwayTeam(initialFixture.away_team);
            setMatchDate(initialFixture.date);
            setMode('scheduled');
          } else {
            setSelectedFixture(fxList[0]);
            setHomeTeam(fxList[0].home_team);
            setAwayTeam(fxList[0].away_team);
            setMatchDate(fxList[0].date);
          }
        } else if (initialFixture) {
          setHomeTeam(initialFixture.home_team);
          setAwayTeam(initialFixture.away_team);
          setMatchDate(initialFixture.date);
        }

        if (histRes.status === 'fulfilled') {
          setPredictionHistory(histRes.value.history || []);
        }
      } catch (e) {
        console.error('Error initializing predictor data:', e);
      }
    }
    initData();
  }, [initialFixture]);

  // Execute Prediction
  const handlePredict = async (customHome?: string, customAway?: string, customDate?: string) => {
    const h = (customHome || homeTeam).trim();
    const a = (customAway || awayTeam).trim();
    const d = customDate || matchDate;

    if (h.toLowerCase() === a.toLowerCase()) {
      setError('Home team and Away team cannot be identical. Please select two distinct clubs.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.predictMatch({
        home_team: h,
        away_team: a,
        match_date: d,
        fixture_id: selectedFixture && mode === 'scheduled' ? selectedFixture.fixture_id : undefined,
        is_hypothetical: mode === 'hypothetical'
      });
      setPrediction(res);
      setPredictionHistory(prev => [res, ...prev.slice(0, 9)]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate match prediction.');
    } finally {
      setLoading(false);
    }
  };

  const selectFixtureItem = (fx: FixtureItem) => {
    setSelectedFixture(fx);
    setHomeTeam(fx.home_team);
    setAwayTeam(fx.away_team);
    setMatchDate(fx.date);
    setMode('scheduled');
    handlePredict(fx.home_team, fx.away_team, fx.date);
  };

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <div className="section-label">Predictive Workspace</div>
          <h1 className="page-title">Match Outcome Predictor</h1>
          <p className="page-subtitle">
            Generate leakage-safe probabilistic forecasts for scheduled upcoming fixtures or custom hypothetical matchups.
            All estimates derived from causal pre-match rolling form.
          </p>
        </div>
      </section>

      <section className="container">
        {/* Mode Switcher */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '16px'
        }}>
          <button
            className={`btn-secondary ${mode === 'scheduled' ? 'active' : ''}`}
            onClick={() => setMode('scheduled')}
            style={{
              borderColor: mode === 'scheduled' ? 'var(--accent-moss)' : 'var(--border-subtle)',
              backgroundColor: mode === 'scheduled' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: mode === 'scheduled' ? 'var(--text-ivory)' : 'var(--text-sage)'
            }}
          >
            <Calendar size={15} /> Scheduled Upcoming Fixtures ({fixtures.length})
          </button>
          <button
            className={`btn-secondary ${mode === 'hypothetical' ? 'active' : ''}`}
            onClick={() => setMode('hypothetical')}
            style={{
              borderColor: mode === 'hypothetical' ? 'var(--accent-moss)' : 'var(--border-subtle)',
              backgroundColor: mode === 'hypothetical' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: mode === 'hypothetical' ? 'var(--text-ivory)' : 'var(--text-sage)'
            }}
          >
            <Sliders size={15} /> Custom Hypothetical Matchup
          </button>
        </div>

        {/* Scheduled Fixtures Carousel / Grid if mode is scheduled */}
        {mode === 'scheduled' && fixtures.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)', marginBottom: '12px' }}>
              Select Confirmed Fixture
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '12px'
            }}>
              {fixtures.map((fx) => {
                const isSelected = selectedFixture?.fixture_id === fx.fixture_id;
                return (
                  <div
                    key={fx.fixture_id}
                    onClick={() => selectFixtureItem(fx)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--accent-moss)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      {fx.date} • {fx.time}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                      {fx.home_team} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>vs</span> {fx.away_team}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Matchup Selection Box */}
        <div className="editorial-card-elevated" style={{ marginBottom: '36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '24px', alignItems: 'flex-end' }}>
            {/* Home Team Select */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)', marginBottom: '8px' }}>
                Home Club (Host)
              </label>
              <select
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-deep)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  color: 'var(--text-ivory)',
                  fontSize: '15px'
                }}
              >
                {teams.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ paddingBottom: '12px', fontSize: '18px', fontFamily: 'var(--font-serif)', color: 'var(--text-muted)' }}>
              vs
            </div>

            {/* Away Team Select */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)', marginBottom: '8px' }}>
                Away Club (Visitor)
              </label>
              <select
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-deep)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  color: 'var(--text-ivory)',
                  fontSize: '15px'
                }}
              >
                {teams.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Predict Button */}
            <div>
              <button
                className="btn-primary"
                onClick={() => handlePredict()}
                disabled={loading}
                style={{ height: '48px', padding: '0 28px' }}
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
                {loading ? 'Computing Features...' : 'Predict Match'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: '20px',
              padding: '14px 18px',
              backgroundColor: 'rgba(168, 82, 80, 0.15)',
              border: '1px solid rgba(168, 82, 80, 0.35)',
              borderRadius: '6px',
              color: '#FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13.5px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Prediction Results & Tactical Breakdown */}
        {prediction && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Top Probabilities Display */}
            <div className="editorial-card-elevated">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-moss)' }}>
                    Probabilistic Match Forecast • {prediction.is_hypothetical ? 'Hypothetical Fixture' : 'Confirmed Fixture'}
                  </span>
                  <h2 style={{ fontSize: '28px', marginTop: '4px' }}>
                    {prediction.home_team} vs {prediction.away_team}
                  </h2>
                </div>
                <div style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(78, 138, 99, 0.15)',
                  border: '1px solid var(--outcome-home)',
                  fontSize: '13px',
                  color: '#6EE7B7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <CheckCircle2 size={15} />
                  Most Probable: <strong>{prediction.most_likely_outcome.label} ({prediction.most_likely_outcome.probability}%)</strong>
                </div>
              </div>

              {/* Graphical Probability Distribution Bar */}
              <div className="prob-dist-bar" style={{ height: '16px' }}>
                <div 
                  className="prob-segment home" 
                  style={{ width: `${prediction.probabilities.home_win.probability}%` }}
                  title={`Home Win: ${prediction.probabilities.home_win.probability}%`}
                />
                <div 
                  className="prob-segment draw" 
                  style={{ width: `${prediction.probabilities.draw.probability}%` }}
                  title={`Draw: ${prediction.probabilities.draw.probability}%`}
                />
                <div 
                  className="prob-segment away" 
                  style={{ width: `${prediction.probabilities.away_win.probability}%` }}
                  title={`Away Win: ${prediction.probabilities.away_win.probability}%`}
                />
              </div>

              {/* 3 Outcome Cards */}
              <div className="grid-3" style={{ marginTop: '20px' }}>
                <div style={{
                  padding: '20px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(78, 138, 99, 0.08)',
                  border: '1px solid rgba(78, 138, 99, 0.25)'
                }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)' }}>
                    Home Victory ({prediction.home_team})
                  </div>
                  <div className="num-tabular" style={{ fontSize: '36px', fontWeight: 700, color: '#6EE7B7', margin: '8px 0' }}>
                    {prediction.probabilities.home_win.probability}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Raw probability: {prediction.probabilities.home_win.raw}
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(194, 166, 118, 0.08)',
                  border: '1px solid rgba(194, 166, 118, 0.25)'
                }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)' }}>
                    Draw
                  </div>
                  <div className="num-tabular" style={{ fontSize: '36px', fontWeight: 700, color: '#FDE047', margin: '8px 0' }}>
                    {prediction.probabilities.draw.probability}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Raw probability: {prediction.probabilities.draw.raw}
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 122, 140, 0.08)',
                  border: '1px solid rgba(59, 122, 140, 0.25)'
                }}>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)' }}>
                    Away Victory ({prediction.away_team})
                  </div>
                  <div className="num-tabular" style={{ fontSize: '36px', fontWeight: 700, color: '#38BDF8', margin: '8px 0' }}>
                    {prediction.probabilities.away_win.probability}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Raw probability: {prediction.probabilities.away_win.raw}
                  </div>
                </div>
              </div>

              {/* Confidence & Uncertainty Disclaimer */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '12.5px',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldAlert size={15} style={{ flexShrink: 0 }} />
                <span>{prediction.confidence_note} Model version: {prediction.model_version}.</span>
              </div>
            </div>

            {/* Tactical Field Visualizer & Pre-Match Statistical Drivers */}
            <div className="grid-2">
              <div className="editorial-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Tactical Pitch Deployment</h3>
                <TacticalPitch
                  homeTeam={prediction.home_team}
                  awayTeam={prediction.away_team}
                  homePpg={prediction.key_statistics.home_team_home_ppg}
                  awayPpg={prediction.key_statistics.away_team_away_ppg}
                  homeGoalsLast5={prediction.key_statistics.home_goals_scored_last_5}
                  awayGoalsLast5={prediction.key_statistics.away_goals_scored_last_5}
                />
              </div>

              <div className="editorial-card">
                <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Key Pre-Match Drivers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Form comparison */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-sage)' }}>Recent Form (5 Matches)</span>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {prediction.key_statistics.home_form.map((res, i) => (
                          <span key={i} className={`form-pill ${res.toLowerCase()}`}>{res}</span>
                        ))}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>vs</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {prediction.key_statistics.away_form.map((res, i) => (
                          <span key={i} className={`form-pill ${res.toLowerCase()}`}>{res}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Points last 5 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-sage)' }}>Points Earned (Last 5)</span>
                    <span className="num-tabular" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                      {prediction.key_statistics.home_points_last_5} pts vs {prediction.key_statistics.away_points_last_5} pts
                    </span>
                  </div>

                  {/* Goals scored / conceded */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-sage)' }}>Goals Conceded (Last 5)</span>
                    <span className="num-tabular" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                      {prediction.key_statistics.home_goals_conceded_last_5} vs {prediction.key_statistics.away_goals_conceded_last_5}
                    </span>
                  </div>

                  {/* Venue efficiency */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-sage)' }}>Venue Specific PPG</span>
                    <span className="num-tabular" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                      {prediction.key_statistics.home_team_home_ppg} (Home) vs {prediction.key_statistics.away_team_away_ppg} (Away)
                    </span>
                  </div>

                  {/* Rest Advantage */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-sage)' }}>Rest Advantage</span>
                    <span className="num-tabular" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                      {prediction.key_statistics.rest_advantage_days > 0 ? `+${prediction.key_statistics.rest_advantage_days} days (Home)` : `${prediction.key_statistics.rest_advantage_days} days`}
                    </span>
                  </div>

                  {/* H2H Prior Wins */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-sage)' }}>Head-to-Head History</span>
                    <span className="num-tabular" style={{ fontSize: '13.5px', color: 'var(--text-ivory)' }}>
                      {prediction.key_statistics.h2h_summary.home_wins}W - {prediction.key_statistics.h2h_summary.draws}D - {prediction.key_statistics.h2h_summary.away_wins}W
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Audit History Table */}
        {predictionHistory.length > 0 && (
          <div style={{ marginTop: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <History size={16} color="var(--accent-moss)" />
              <h3 style={{ fontSize: '18px' }}>Prediction Audit Trail</h3>
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Matchup</th>
                    <th>Home Win %</th>
                    <th>Draw %</th>
                    <th>Away Win %</th>
                    <th>Most Likely</th>
                    <th>Model</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionHistory.slice(0, 5).map((p, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>
                        {p.home_team} vs {p.away_team}
                      </td>
                      <td className="num-tabular" style={{ color: '#6EE7B7' }}>{p.probabilities.home_win.probability}%</td>
                      <td className="num-tabular" style={{ color: '#FDE047' }}>{p.probabilities.draw.probability}%</td>
                      <td className="num-tabular" style={{ color: '#38BDF8' }}>{p.probabilities.away_win.probability}%</td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)'
                        }}>
                          {p.most_likely_outcome.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.model_version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
