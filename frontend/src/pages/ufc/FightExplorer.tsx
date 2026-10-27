import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Award, 
  Clock, 
  Swords,
  Scale
} from 'lucide-react';
import { ufcApi } from '../../services/ufcApi';
import { UFCFightItem, UFCWeightClass } from '../../types/ufc';

interface FightExplorerProps {
  initialFilter?: {
    weightClass?: string;
  } | null;
  onNavigate?: (tab: string, context?: any) => void;
}

export const FightExplorer: React.FC<FightExplorerProps> = ({ initialFilter, onNavigate }) => {
  const [fights, setFights] = useState<UFCFightItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [fighterSearch, setFighterSearch] = useState<string>('');
  const [debouncedFighter, setDebouncedFighter] = useState<string>('');
  const [weightClass, setWeightClass] = useState<string>(initialFilter?.weightClass || '');
  const [method, setMethod] = useState<string>('');

  // Dropdown options
  const [weightClasses, setWeightClasses] = useState<UFCWeightClass[]>([]);

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weight classes on mount
  useEffect(() => {
    async function loadWeightClasses() {
      try {
        const wcs = await ufcApi.getWeightClasses();
        setWeightClasses(wcs);
      } catch (e) {
        console.error('Failed to load weight classes:', e);
      }
    }
    loadWeightClasses();
  }, []);

  // Update initial weight class if prop changes
  useEffect(() => {
    if (initialFilter?.weightClass) {
      setWeightClass(initialFilter.weightClass);
      setPage(1);
    }
  }, [initialFilter]);

  // Debounce fighter search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFighter(fighterSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fighterSearch]);

  // Load bouts
  useEffect(() => {
    async function loadBouts() {
      setLoading(true);
      setError(null);
      try {
        const res = await ufcApi.getFights({
          fighter: debouncedFighter || undefined,
          weight_class: weightClass || undefined,
          method: method || undefined,
          page,
          page_size: pageSize
        });
        setFights(res.fights);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err: any) {
        setError(err.message || 'Failed to load historical UFC bouts.');
      } finally {
        setLoading(false);
      }
    }
    loadBouts();
  }, [debouncedFighter, weightClass, method, page, pageSize]);

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
            <strong>Historical Combat Archive:</strong> {total > 0 ? total.toLocaleString() : '8,961'} validated bouts spanning March 11, 1994 (UFC 2) to <strong>October 24, 2026</strong> (UFC 308: Topuria vs. Holloway).
          </span>
        </div>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', padding: '2px 8px', background: 'rgba(194, 166, 118, 0.15)', borderRadius: '4px' }}>
          {total > 0 ? total.toLocaleString() : '8,961'} Records
        </span>

      </div>

      {/* Editorial Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-block',
            padding: '3px 10px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontWeight: 700,
            background: 'rgba(78, 138, 99, 0.2)',
            color: '#6EE7B7',
            borderRadius: '4px',
            border: '1px solid rgba(78, 138, 99, 0.3)'
          }}>
            Fight Archive
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
          <span style={{ color: 'var(--text-sage)', fontSize: '13px' }}>Official Ground-Truth Records</span>
        </div>
        <h1 style={{ fontSize: '38px', lineHeight: '1.2', marginBottom: '12px' }}>
          UFC Fight History Explorer
        </h1>
        <p style={{ color: 'var(--text-sage)', fontSize: '16px', maxWidth: '780px' }}>
          Filter historical matchups by division, fighter, and finish method. Inspect corner designations, stoppage times, and title fight designations.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '32px', border: '1px solid var(--border-medium)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
          {/* Fighter Filter */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={fighterSearch}
              onChange={(e) => setFighterSearch(e.target.value)}
              placeholder="Filter by fighter..."
              style={{
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                color: 'var(--text-ivory)',
                padding: '9px 12px 9px 34px',
                fontSize: '13.5px'
              }}
            />
            {fighterSearch && (
              <button
                onClick={() => setFighterSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Weight Class Filter */}
          <div>
            <select
              value={weightClass}
              onChange={(e) => {
                setWeightClass(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                color: 'var(--text-ivory)',
                padding: '10px 12px',
                fontSize: '13.5px'
              }}
            >
              <option value="">All Weight Classes ({weightClasses.length})</option>
              {weightClasses.map((wc, i) => (
                <option key={i} value={wc.name}>
                  {wc.name} ({wc.total_bouts} bouts)
                </option>
              ))}
            </select>
          </div>

          {/* Finish Method Filter */}
          <div>
            <select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                color: 'var(--text-ivory)',
                padding: '10px 12px',
                fontSize: '13.5px'
              }}
            >
              <option value="">All Finish Methods</option>
              <option value="KO/TKO">KO / TKO</option>
              <option value="Submission">Submission</option>
              <option value="Decision - Unanimous">Decision - Unanimous</option>
              <option value="Decision - Split">Decision - Split</option>
              <option value="Decision - Majority">Decision - Majority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-sage)' }}>
          <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 12px auto' }} />
          <div>Querying historical bout database...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card" style={{ borderColor: 'var(--outcome-loss)', background: 'rgba(168, 82, 80, 0.08)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#E58A88' }}>
            <AlertTriangle size={20} />
            <h4 style={{ color: '#E58A88' }}>Database Query Error</h4>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14px', marginTop: '6px' }}>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && fights.length === 0 && (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Database size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', color: 'var(--text-ivory)', marginBottom: '8px' }}>No bouts match filter</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '450px', margin: '0 auto' }}>
            No fight records found with the applied search parameters. Try resetting division or method filters.
          </p>
        </div>
      )}

      {/* Table Results */}
      {!loading && !error && fights.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Showing <strong style={{ color: 'var(--text-ivory)' }}>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</strong> of <strong style={{ color: 'var(--text-ivory)' }}>{total.toLocaleString()}</strong> official bouts</span>
            <span>Page {page} of {totalPages}</span>
          </div>

          <div className="data-table-container" style={{ marginBottom: '32px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Division</th>
                  <th>Red Corner</th>
                  <th>Blue Corner</th>
                  <th>Winner</th>
                  <th>Method</th>
                  <th>Round & Time</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {fights.map((f, i) => {
                  const redWon = f.winner === f.red_fighter;
                  const blueWon = f.winner === f.blue_fighter;
                  return (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                        {f.date}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-ivory)' }}>{f.weight_class}</span>
                          {f.title_bout && (
                            <span style={{
                              fontSize: '9.5px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                              padding: '1px 5px',
                              borderRadius: '3px',
                              background: 'rgba(194, 166, 118, 0.2)',
                              color: 'var(--accent-warm-gold)',
                              fontWeight: 700
                            }}>
                              Title
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--outcome-loss)' }}></span>
                          <span style={{
                            fontWeight: redWon ? 700 : 400,
                            color: redWon ? 'var(--text-ivory)' : 'var(--text-sage)'
                          }}>
                            {f.red_fighter}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--outcome-away)' }}></span>
                          <span style={{
                            fontWeight: blueWon ? 700 : 400,
                            color: blueWon ? 'var(--text-ivory)' : 'var(--text-sage)'
                          }}>
                            {f.blue_fighter}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: f.winner_corner === 'Red' ? 'rgba(168, 82, 80, 0.2)' : f.winner_corner === 'Blue' ? 'rgba(59, 122, 140, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: f.winner_corner === 'Red' ? '#E58A88' : f.winner_corner === 'Blue' ? '#7EC2D4' : 'var(--text-muted)'
                        }}>
                          {f.winner || 'Draw / NC'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-parchment)' }}>
                        {f.method}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        R{f.last_round} ({f.last_round_time})
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {onNavigate && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                            onClick={() => onNavigate('predictor', {
                              fighterA: f.red_fighter,
                              fighterB: f.blue_fighter,
                              isTitle: f.title_bout
                            })}
                            title="Simulate this matchup in the Predictor"
                          >
                            <Swords size={12} />
                            <span>Simulate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-secondary"
              disabled={page <= 1}
              onClick={() => {
                setPage(p => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '13px', color: 'var(--text-sage)' }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>

            <button
              className="btn-secondary"
              disabled={page >= totalPages}
              onClick={() => {
                setPage(p => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
