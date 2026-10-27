import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  Trophy, 
  Target, 
  ArrowUpRight, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { TeamSummary, TeamAnalysis as TeamAnalysisType } from '../types';

export const TeamAnalysis: React.FC = () => {
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selectedTeamName, setSelectedTeamName] = useState<string>('Arsenal');
  const [analysis, setAnalysis] = useState<TeamAnalysisType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load team list
  useEffect(() => {
    async function loadTeams() {
      try {
        const res = await api.getTeams();
        setTeams(res.teams);
        if (res.teams.length > 0) {
          setSelectedTeamName(res.teams[0].name);
        }
      } catch (e) {
        console.error('Error fetching teams:', e);
      }
    }
    loadTeams();
  }, []);

  // Load team detailed analysis when team changes
  useEffect(() => {
    if (!selectedTeamName) return;
    async function loadAnalysis() {
      setLoading(true);
      try {
        const res = await api.getTeamAnalysis(selectedTeamName);
        setAnalysis(res);
      } catch (e) {
        console.error('Error fetching team analysis:', e);
      } finally {
        setLoading(false);
      }
    }
    loadAnalysis();
  }, [selectedTeamName]);

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <div className="section-label">Club Analytics & Longitudinal Form</div>
          <h1 className="page-title">Team Performance Intelligence</h1>
          <p className="page-subtitle">
            Longitudinal breakdown of points, goal creation, concession profiles, 
            and home versus away venue variances across the verified historical period.
          </p>
        </div>
      </section>

      <section className="container">
        {/* Team Selector & Header Strip */}
        <div className="editorial-card-elevated" style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                backgroundColor: 'rgba(127, 150, 125, 0.15)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-moss)',
                fontFamily: 'var(--font-serif)',
                fontSize: '22px'
              }}>
                {selectedTeamName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                  Selected Club
                </label>
                <select
                  value={selectedTeamName}
                  onChange={(e) => setSelectedTeamName(e.target.value)}
                  style={{
                    backgroundColor: 'var(--bg-deep)',
                    color: 'var(--text-ivory)',
                    fontSize: '18px',
                    fontWeight: 600,
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    marginTop: '4px'
                  }}
                >
                  {teams.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.points} pts)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {analysis && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12.5px', color: 'var(--text-sage)' }}>Recent 5 Form:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {analysis.recent_form.map((res, i) => (
                    <span key={i} className={`form-pill ${res.toLowerCase()}`}>{res}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-sage)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            Loading team analytical records...
          </div>
        ) : analysis ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Metric Summary Cards */}
            <div className="grid-4">
              <div className="editorial-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-sage)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Points Per Match</span>
                  <Trophy size={16} color="var(--accent-moss)" />
                </div>
                <div className="num-tabular" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-ivory)' }}>
                  {analysis.ppg}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Total Points: {analysis.points} ({analysis.matches_played} matches)
                </div>
              </div>

              <div className="editorial-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-sage)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Win Rate</span>
                  <TrendingUp size={16} color="var(--accent-moss)" />
                </div>
                <div className="num-tabular" style={{ fontSize: '32px', fontWeight: 700, color: '#6EE7B7' }}>
                  {analysis.win_rate}%
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {analysis.wins}W • {analysis.draws}D • {analysis.losses}L
                </div>
              </div>

              <div className="editorial-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-sage)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg Goals Scored</span>
                  <Target size={16} color="var(--accent-moss)" />
                </div>
                <div className="num-tabular" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-ivory)' }}>
                  {analysis.avg_goals_scored}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Total GF: {analysis.goals_for} goals
                </div>
              </div>

              <div className="editorial-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-sage)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg Goals Conceded</span>
                  <Shield size={16} color="var(--accent-moss)" />
                </div>
                <div className="num-tabular" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-ivory)' }}>
                  {analysis.avg_goals_conceded}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Goal Difference: {analysis.goal_diff > 0 ? `+${analysis.goal_diff}` : analysis.goal_diff}
                </div>
              </div>
            </div>

            {/* Home vs Away Venue Splits */}
            <div className="grid-2">
              <div className="editorial-card">
                <h3 style={{ fontSize: '18px', marginBottom: '14px', color: '#6EE7B7' }}>
                  Home Venue Record
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Home Matches Played</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>{analysis.home_record.matches}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Home Record (W-D-L)</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>
                      {analysis.home_record.wins}W - {analysis.home_record.draws}D - {analysis.home_record.losses}L
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Home Win Percentage</span>
                    <span className="num-tabular" style={{ fontWeight: 600, color: '#6EE7B7' }}>
                      {analysis.home_record.win_rate}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Home Points Per Game</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>{analysis.home_record.ppg}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Goals Scored / Conceded</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>
                      {analysis.home_record.goals_for} / {analysis.home_record.goals_against}
                    </span>
                  </div>
                </div>
              </div>

              <div className="editorial-card">
                <h3 style={{ fontSize: '18px', marginBottom: '14px', color: '#38BDF8' }}>
                  Away Venue Record
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Away Matches Played</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>{analysis.away_record.matches}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Away Record (W-D-L)</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>
                      {analysis.away_record.wins}W - {analysis.away_record.draws}D - {analysis.away_record.losses}L
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Away Win Percentage</span>
                    <span className="num-tabular" style={{ fontWeight: 600, color: '#38BDF8' }}>
                      {analysis.away_record.win_rate}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Away Points Per Game</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>{analysis.away_record.ppg}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-sage)' }}>Goals Scored / Conceded</span>
                    <span className="num-tabular" style={{ fontWeight: 600 }}>
                      {analysis.away_record.goals_for} / {analysis.away_record.goals_against}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Match Logs */}
            <div>
              <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Recent Match Record History</h3>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Season</th>
                      <th>Opponent</th>
                      <th>Venue</th>
                      <th>Score</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.recent_matches.map((m, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-muted)' }}>{m.date}</td>
                        <td>{m.season}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>{m.opponent}</td>
                        <td>{m.venue}</td>
                        <td className="num-tabular" style={{ fontWeight: 600 }}>{m.score}</td>
                        <td>
                          <span className={`form-pill ${m.result.toLowerCase()}`}>
                            {m.result}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
};
