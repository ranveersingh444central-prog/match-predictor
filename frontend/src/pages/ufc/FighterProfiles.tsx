import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Swords, 
  Activity, 
  Shield, 
  Target,
  ArrowRight
} from 'lucide-react';
import { ufcApi } from '../../services/ufcApi';
import { UFCFighterSummary, UFCFighterDetail } from '../../types/ufc';

interface FighterProfilesProps {
  onNavigate?: (tab: string, context?: any) => void;
}

export const FighterProfiles: React.FC<FighterProfilesProps> = ({ onNavigate }) => {
  const [fighters, setFighters] = useState<UFCFighterSummary[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(18);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [stance, setStance] = useState<string>('');

  // States
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [selectedFighterName, setSelectedFighterName] = useState<string | null>(null);
  const [fighterDetail, setFighterDetail] = useState<UFCFighterDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load fighters
  useEffect(() => {
    async function loadFighters() {
      setLoading(true);
      setError(null);
      try {
        const res = await ufcApi.getFighters({
          search: debouncedSearch,
          stance: stance || undefined,
          page,
          page_size: pageSize
        });
        setFighters(res.fighters);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } catch (err: any) {
        setError(err.message || 'Failed to load UFC fighter directory.');
      } finally {
        setLoading(false);
      }
    }
    loadFighters();
  }, [debouncedSearch, stance, page, pageSize]);

  // Load fighter detail on select
  const handleOpenDetail = async (name: string) => {
    setSelectedFighterName(name);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const detail = await ufcApi.getFighterDetail(name);
      setFighterDetail(detail);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to fetch fighter career record.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedFighterName(null);
    setFighterDetail(null);
  };

  return (
    <div className="container" style={{ padding: '40px 24px 80px 24px' }}>
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
            background: 'rgba(127, 150, 125, 0.2)',
            color: 'var(--accent-sage-bright)',
            borderRadius: '4px',
            border: '1px solid rgba(127, 150, 125, 0.3)'
          }}>
            Athlete Directory
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
          <span style={{ color: 'var(--text-sage)', fontSize: '13px' }}>3,596 Registered Competitors</span>
        </div>
        <h1 style={{ fontSize: '38px', lineHeight: '1.2', marginBottom: '12px' }}>
          UFC Fighter Profiles
        </h1>
        <p style={{ color: 'var(--text-sage)', fontSize: '16px', maxWidth: '750px' }}>
          Explore canonical striking metrics, physical biometrics, and verified Octagon fight logs dating back to UFC 1.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '32px', border: '1px solid var(--border-medium)' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by fighter name (e.g. Khabib, Jones, McGregor)..."
              aria-label="Search fighters by name"
              style={{
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                color: 'var(--text-ivory)',
                padding: '11px 14px 11px 38px',
                fontSize: '14px'
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear fighter search"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)'
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Stance Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={15} color="var(--text-muted)" />
            <label htmlFor="stance-select" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Stance:</label>
            <select
              id="stance-select"
              value={stance}
              aria-label="Filter fighters by stance"
              onChange={(e) => {
                setStance(e.target.value);
                setPage(1);
              }}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                color: 'var(--text-ivory)',
                padding: '10px 14px',
                fontSize: '13.5px'
              }}
            >
              <option value="">All Stances</option>
              <option value="Orthodox">Orthodox</option>
              <option value="Southpaw">Southpaw</option>
              <option value="Switch">Switch</option>
            </select>

          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-sage)' }}>
          <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 12px auto' }} />
          <div>Retrieving verified fighter directory...</div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="card" style={{ borderColor: 'var(--outcome-loss)', background: 'rgba(168, 82, 80, 0.08)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#E58A88' }}>
            <AlertTriangle size={20} />
            <h4 style={{ color: '#E58A88' }}>Error Loading Fighters</h4>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14px', marginTop: '6px' }}>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && fighters.length === 0 && (
        <div className="card" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <Users size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', color: 'var(--text-ivory)', marginBottom: '8px' }}>No fighters found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            No athlete matched &quot;{debouncedSearch}&quot; with stance &quot;{stance || 'any'}&quot;. Try adjusting your search query.
          </p>
        </div>
      )}

      {/* Fighters Grid */}
      {!loading && !error && fighters.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>Showing <strong style={{ color: 'var(--text-ivory)' }}>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</strong> of <strong style={{ color: 'var(--text-ivory)' }}>{total.toLocaleString()}</strong> athletes</span>
            <span>Page {page} of {totalPages}</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px',
            marginBottom: '36px'
          }}>
            {fighters.map((f, i) => (
              <div
                key={i}
                className="card"
                onClick={() => handleOpenDetail(f.fighter_name)}
                style={{
                  cursor: 'pointer',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: 'var(--text-ivory)' }}>
                      {f.fighter_name}
                    </div>
                    <span style={{
                      fontSize: '10.5px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '2px 6px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '3px',
                      color: 'var(--accent-sage-bright)'
                    }}>
                      {f.stance || 'Orthodox'}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {f.total_ufc_bouts} UFC Bouts • {f.ufc_wins} Wins {f.total_ufc_bouts > 0 ? `(${((f.ufc_wins / f.total_ufc_bouts) * 100).toFixed(0)}% Win Rate)` : ''}
                  </div>

                  {/* Physical & Metric Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'var(--bg-deep)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Height</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-ivory)', fontWeight: 600 }}>{f.height || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reach</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-ivory)', fontWeight: 600 }}>{f.reach || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Weight</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-ivory)', fontWeight: 600 }}>{f.weight ? `${f.weight}` : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '12px',
                  color: 'var(--accent-warm-gold)'
                }}>
                  <span>View Complete Career Record</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
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
        </>
      )}

      {/* Fighter Detail Modal */}
      {selectedFighterName && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 12, 10, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-prominent)',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-elevated)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)'
            }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)' }}>
                  Athlete Dossier
                </span>
                <h2 style={{ fontSize: '24px', color: 'var(--text-ivory)' }}>
                  {selectedFighterName}
                </h2>
              </div>
              <button
                onClick={handleCloseDetail}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {detailLoading && (
                <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-sage)' }}>
                  <RefreshCw size={24} className="spinning" style={{ margin: '0 auto 12px auto' }} />
                  <div>Loading verified fight archive...</div>
                </div>
              )}

              {detailError && (
                <div className="card" style={{ borderColor: 'var(--outcome-loss)', background: 'rgba(168, 82, 80, 0.08)' }}>
                  <div style={{ color: '#E58A88', marginBottom: '6px' }}>Failed to load athlete profile</div>
                  <p style={{ color: 'var(--text-parchment)', fontSize: '13px' }}>{detailError}</p>
                </div>
              )}

              {fighterDetail && !detailLoading && (
                <div>
                  {/* Career Record Banner */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    padding: '16px',
                    background: 'var(--bg-deep)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-subtle)',
                    marginBottom: '24px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>UFC Record</div>
                      <div className="num-tabular" style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)' }}>
                        {fighterDetail.ufc_wins}W - {fighterDetail.ufc_losses}L
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Win Rate</div>
                      <div className="num-tabular" style={{ fontSize: '20px', fontFamily: 'var(--font-serif)', color: 'var(--accent-sage-bright)' }}>
                        {fighterDetail.win_rate_pct}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Stance</div>
                      <div style={{ fontSize: '16px', color: 'var(--text-ivory)', fontWeight: 600 }}>
                        {fighterDetail.stance || 'Orthodox'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Reach</div>
                      <div style={{ fontSize: '16px', color: 'var(--text-ivory)', fontWeight: 600 }}>
                        {fighterDetail.reach ? `${fighterDetail.reach}"` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Striking & Grappling Career Averages */}
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)', fontWeight: 600, marginBottom: '12px' }}>
                      Key Rate Statistics (Pre-Cutoff)
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px'
                    }}>
                      <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sig Strikes / Min</div>
                        <div className="num-tabular" style={{ fontSize: '18px', color: 'var(--text-ivory)', fontWeight: 600 }}>{fighterDetail.slpm.toFixed(2)}</div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Striking Acc</div>
                        <div className="num-tabular" style={{ fontSize: '18px', color: 'var(--text-ivory)', fontWeight: 600 }}>{fighterDetail.str_acc_pct}%</div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Strikes Absorbed</div>
                        <div className="num-tabular" style={{ fontSize: '18px', color: 'var(--text-ivory)', fontWeight: 600 }}>{fighterDetail.sapm.toFixed(2)}</div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Striking Defense</div>
                        <div className="num-tabular" style={{ fontSize: '18px', color: 'var(--text-ivory)', fontWeight: 600 }}>{fighterDetail.str_def_pct}%</div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Takedowns / 15m</div>
                        <div className="num-tabular" style={{ fontSize: '18px', color: 'var(--text-ivory)', fontWeight: 600 }}>{fighterDetail.td_avg_15m.toFixed(2)}</div>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Takedown Defense</div>
                        <div className="num-tabular" style={{ fontSize: '18px', color: 'var(--text-ivory)', fontWeight: 600 }}>{fighterDetail.td_def_pct}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Verified Fight History Table */}
                  <div>
                    <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)', fontWeight: 600, marginBottom: '12px' }}>
                      Octagon Bouts History ({fighterDetail.recent_fights.length})
                    </div>
                    {fighterDetail.recent_fights.length === 0 ? (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No official UFC bouts recorded in the archive.
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: 'var(--bg-botanical)', color: 'var(--text-sage)', borderBottom: '1px solid var(--border-subtle)' }}>
                              <th style={{ padding: '8px 12px' }}>Result</th>
                              <th style={{ padding: '8px 12px' }}>Opponent</th>
                              <th style={{ padding: '8px 12px' }}>Method</th>
                              <th style={{ padding: '8px 12px' }}>Round</th>
                              <th style={{ padding: '8px 12px' }}>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fighterDetail.recent_fights.map((fight, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(167, 178, 160, 0.08)' }}>
                                <td style={{ padding: '8px 12px' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    fontWeight: 700,
                                    fontSize: '11px',
                                    background: fight.outcome === 'W' ? 'rgba(78, 138, 99, 0.25)' : 'rgba(168, 82, 80, 0.2)',
                                    color: fight.outcome === 'W' ? '#6EE7B7' : '#FCA5A5'
                                  }}>
                                    {fight.outcome}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                                  {fight.opponent}
                                  {fight.title_bout && (
                                    <span style={{ marginLeft: '6px', fontSize: '9px', color: 'var(--accent-warm-gold)', textTransform: 'uppercase' }}>[Title]</span>
                                  )}
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-parchment)' }}>
                                  {fight.method}
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                                  R{fight.round} ({fight.time})
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                                  {fight.date}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Predict Action */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)'
            }}>
              <button
                className="btn-secondary"
                onClick={handleCloseDetail}
              >
                Close
              </button>

              {onNavigate && fighterDetail && (
                <button
                  className="btn-primary"
                  onClick={() => {
                    handleCloseDetail();
                    onNavigate('predictor', { fighterA: fighterDetail.fighter_name });
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Swords size={15} />
                  <span>Simulate in Predictor</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
