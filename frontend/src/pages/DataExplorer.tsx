import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';
import { MatchRecord, TeamSummary, DataSummary } from '../types';

export const DataExplorer: React.FC = () => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Filters
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedResult, setSelectedResult] = useState<string>('');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load team list and data summary
  useEffect(() => {
    async function loadMeta() {
      try {
        const [teamsRes, sumRes] = await Promise.allSettled([
          api.getTeams(),
          api.getDataSummary()
        ]);
        if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.teams);
        if (sumRes.status === 'fulfilled') setDataSummary(sumRes.value);
      } catch (e) {
        console.error('Error fetching data explorer metadata:', e);
      }
    }
    loadMeta();
  }, []);

  // Fetch paginated matches when filters or page changes
  useEffect(() => {
    async function fetchMatches() {
      setLoading(true);
      try {
        const res = await api.getMatches({
          team: selectedTeam || undefined,
          season: selectedSeason || undefined,
          result: selectedResult || undefined,
          page: currentPage,
          page_size: pageSize
        });
        setMatches(res.matches);
        setTotalMatches(res.total);
        setTotalPages(res.total_pages);
      } catch (e) {
        console.error('Error loading matches:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, [selectedTeam, selectedSeason, selectedResult, currentPage, pageSize]);

  // Export current filtered table to CSV
  const handleExportCSV = () => {
    if (matches.length === 0) return;
    const headers = ['Date', 'Season', 'HomeTeam', 'AwayTeam', 'Score', 'Result', 'Shots', 'ShotsOnTarget'];
    const rows = matches.map(m => [
      m.date,
      m.season,
      `"${m.home_team}"`,
      `"${m.away_team}"`,
      `"${m.score}"`,
      m.result,
      `"${m.shots}"`,
      `"${m.shots_target}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pitchiq_matches_export_p${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <section className="page-header">
        <div className="container">
          <div className="section-label">Traceable Historical Corpus</div>
          <h1 className="page-title">Historical Match Explorer</h1>
          <p className="page-subtitle">
            Inspect the underlying 1,520 Premier League matches across seasons 2021/22 to 2024/25. 
            All features, rolling statistics, and model benchmarks trace directly to this corpus.
          </p>
        </div>
      </section>

      <section className="container">
        {/* Data Provenance Bar */}
        {dataSummary && (
          <div className="editorial-card" style={{ marginBottom: '28px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Source Provider</span>
                <div style={{ fontWeight: 600, color: 'var(--text-ivory)', marginTop: '4px' }}>Football-Data.co.uk</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Verified Matches</span>
                <div className="num-tabular" style={{ fontWeight: 600, color: '#6EE7B7', marginTop: '4px' }}>{dataSummary.total_valid_matches} valid fixtures</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Temporal Range</span>
                <div style={{ fontWeight: 600, color: 'var(--text-ivory)', marginTop: '4px' }}>{dataSummary.date_range_start} to {dataSummary.date_range_end}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Seasons Ingested</span>
                <div style={{ fontWeight: 600, color: 'var(--text-ivory)', marginTop: '4px' }}>21/22, 22/23, 23/24, 24/25</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="editorial-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Team Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Filter by Club
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => { setSelectedTeam(e.target.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: 'var(--bg-deep)',
                    color: 'var(--text-ivory)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13.5px'
                  }}
                >
                  <option value="">All 26 Clubs</option>
                  {teams.map(t => (
                    <option key={t.name} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Season Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Season
                </label>
                <select
                  value={selectedSeason}
                  onChange={(e) => { setSelectedSeason(e.target.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: 'var(--bg-deep)',
                    color: 'var(--text-ivory)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13.5px'
                  }}
                >
                  <option value="">All Seasons</option>
                  <option value="2122">2021–2022</option>
                  <option value="2223">2022–2023</option>
                  <option value="2324">2023–2024</option>
                  <option value="2425">2024–2025</option>
                </select>
              </div>

              {/* Result Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Full-Time Outcome
                </label>
                <select
                  value={selectedResult}
                  onChange={(e) => { setSelectedResult(e.target.value); setCurrentPage(1); }}
                  style={{
                    backgroundColor: 'var(--bg-deep)',
                    color: 'var(--text-ivory)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '13.5px'
                  }}
                >
                  <option value="">All Outcomes</option>
                  <option value="H">Home Win (H)</option>
                  <option value="D">Draw (D)</option>
                  <option value="A">Away Win (A)</option>
                </select>
              </div>
            </div>

            {/* Export & Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span className="num-tabular" style={{ fontSize: '13px', color: 'var(--text-sage)' }}>
                Showing <strong>{matches.length}</strong> of <strong>{totalMatches}</strong> records
              </span>
              <button
                className="btn-secondary"
                onClick={handleExportCSV}
                style={{ padding: '8px 14px', fontSize: '13px' }}
                title="Download currently visible records as CSV"
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Matches Table */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-sage)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            Filtering historical dataset...
          </div>
        ) : matches.length === 0 ? (
          <div className="editorial-card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ color: 'var(--text-sage)' }}>No matches match the selected filter combination.</p>
          </div>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Season</th>
                  <th>Home Club</th>
                  <th>Score</th>
                  <th>Away Club</th>
                  <th>Result</th>
                  <th>Shots (H - A)</th>
                  <th>Target (H - A)</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)' }}>{m.date}</td>
                    <td>{m.season}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>{m.home_team}</td>
                    <td className="num-tabular" style={{ fontWeight: 700, fontSize: '15px' }}>{m.score}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>{m.away_team}</td>
                    <td>
                      <span className={`form-pill ${m.result.toLowerCase()}`}>
                        {m.result}
                      </span>
                    </td>
                    <td className="num-tabular" style={{ color: 'var(--text-sage)' }}>{m.shots}</td>
                    <td className="num-tabular" style={{ color: 'var(--text-sage)' }}>{m.shots_target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '20px',
          padding: '12px 0',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '13.5px',
          color: 'var(--text-sage)'
        }}>
          <div>
            Page <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>{currentPage}</span> of <span className="num-tabular" style={{ fontWeight: 600, color: 'var(--text-ivory)' }}>{totalPages}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-secondary"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              style={{ padding: '6px 14px', fontSize: '13px', opacity: currentPage <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              className="btn-secondary"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              style={{ padding: '6px 14px', fontSize: '13px', opacity: currentPage >= totalPages ? 0.4 : 1 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
