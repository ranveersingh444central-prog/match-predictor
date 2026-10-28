import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  Award, 
  HelpCircle,
  Search,
  CheckCircle2,
  Swords
} from 'lucide-react';
import { ufcApi } from '../../services/ufcApi';
import { UFCPredictionResponse, UFCFighterSummary } from '../../types/ufc';
import { TaleOfTheTape } from '../../components/common/TaleOfTheTape';

interface FightPredictorProps {
  initialFight?: {
    fighterA?: string;
    fighterB?: string;
    isTitle?: boolean;
  } | null;
}

export const FightPredictor: React.FC<FightPredictorProps> = ({ initialFight }) => {
  // Fighter selection states
  const [fighterA, setFighterA] = useState<string>('Jon Jones');
  const [fighterB, setFighterB] = useState<string>('Daniel Cormier');
  const [isTitleBout, setIsTitleBout] = useState<boolean>(true);
  const [targetDate, setTargetDate] = useState<string>('2026-10-24');

  // Search autocomplete helpers
  const [searchQueryA, setSearchQueryA] = useState<string>('');
  const [searchQueryB, setSearchQueryB] = useState<string>('');
  const [optionsA, setOptionsA] = useState<UFCFighterSummary[]>([]);
  const [optionsB, setOptionsB] = useState<UFCFighterSummary[]>([]);
  const [isSearchingA, setIsSearchingA] = useState<boolean>(false);
  const [isSearchingB, setIsSearchingB] = useState<boolean>(false);
  const [showDropdownA, setShowDropdownA] = useState<boolean>(false);
  const [showDropdownB, setShowDropdownB] = useState<boolean>(false);

  // Prediction states
  const [prediction, setPrediction] = useState<UFCPredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Marquee quick-fill presets
  const presets = [
    { name: 'Jones vs Cormier', a: 'Jon Jones', b: 'Daniel Cormier', title: true, date: '2026-10-24' },
    { name: 'Khabib vs Gaethje (UFC 254)', a: 'Khabib Nurmagomedov', b: 'Justin Gaethje', title: true, date: '2020-10-24' },
    { name: 'McGregor vs Poirier', a: 'Conor McGregor', b: 'Dustin Poirier', title: false, date: '2026-10-24' },
    { name: 'Adesanya vs Whittaker', a: 'Israel Adesanya', b: 'Robert Whittaker', title: true, date: '2026-10-24' },
    { name: 'Miocic vs Ngannou', a: 'Stipe Miocic', b: 'Francis Ngannou', title: true, date: '2026-10-24' }
  ];

  const executePrediction = useCallback(async (fa: string, fb: string, title: boolean, customDate?: string) => {
    if (fa.trim().toLowerCase() === fb.trim().toLowerCase()) {
      setError('Cannot predict a matchup between the same athlete. Please select two distinct fighters.');
      return;
    }

    setLoading(true);
    setError(null);

    const evalDate = customDate || targetDate;

    try {
      const res = await ufcApi.predictMatchup({
        fighter_a: fa.trim(),
        fighter_b: fb.trim(),
        corner_a: 'Red',
        corner_b: 'Blue',
        is_title_bout: title,
        target_date: evalDate
      });
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate UFC fight prediction.');
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  // Auto-search for Fighter A
  useEffect(() => {
    if (!searchQueryA.trim() || searchQueryA.length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingA(true);
      try {
        const res = await ufcApi.getFighters({ search: searchQueryA, page_size: 8 });
        setOptionsA(res.fighters);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingA(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQueryA]);

  // Auto-search for Fighter B
  useEffect(() => {
    if (!searchQueryB.trim() || searchQueryB.length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingB(true);
      try {
        const res = await ufcApi.getFighters({ search: searchQueryB, page_size: 8 });
        setOptionsB(res.fighters);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingB(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQueryB]);

  // Handle incoming props navigation or initial load
  useEffect(() => {
    if (initialFight) {
      const fa = initialFight.fighterA || 'Jon Jones';
      const fb = initialFight.fighterB || 'Daniel Cormier';
      const isTitle = initialFight.isTitle ?? true;
      if (initialFight.fighterA) setFighterA(initialFight.fighterA);
      if (initialFight.fighterB) setFighterB(initialFight.fighterB);
      if (initialFight.isTitle !== undefined) setIsTitleBout(initialFight.isTitle);
      executePrediction(fa, fb, isTitle);
    } else {
      executePrediction('Jon Jones', 'Daniel Cormier', true);
    }
  }, [initialFight, executePrediction]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executePrediction(fighterA, fighterB, isTitleBout);
  };

  const handleSwapFighters = () => {
    const nextA = fighterB;
    const nextB = fighterA;
    setFighterA(nextA);
    setFighterB(nextB);
    setShowDropdownA(false);
    setShowDropdownB(false);
    executePrediction(nextA, nextB, isTitleBout, targetDate);
  };

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setFighterA(preset.a);
    setFighterB(preset.b);
    setIsTitleBout(preset.title);
    const dateToUse = preset.date || '2026-10-24';
    setTargetDate(dateToUse);
    setShowDropdownA(false);
    setShowDropdownB(false);
    executePrediction(preset.a, preset.b, preset.title, dateToUse);
  };

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
            <strong>UFC Historical Cutoff Notice:</strong> Ground-truth records conclude on <strong>October 24, 2026</strong>. Predictions for subsequent or fantasy matchups are hypothetical simulations based on pre-cutoff career profiles.
          </span>
        </div>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-warm-gold)', padding: '2px 8px', background: 'rgba(194, 166, 118, 0.15)', borderRadius: '4px' }}>
          Simulated Octagon
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
            background: 'rgba(168, 82, 80, 0.2)',
            color: '#E58A88',
            borderRadius: '4px',
            border: '1px solid rgba(168, 82, 80, 0.3)'
          }}>
            Binary Win Classifier
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>•</span>
          <span style={{ color: 'var(--text-sage)', fontSize: '13px' }}>Forward-Split Evaluated</span>
        </div>
        <h1 style={{ fontSize: '38px', lineHeight: '1.2', marginBottom: '12px' }}>
          UFC Fight Predictor
        </h1>
        <p style={{ color: 'var(--text-sage)', fontSize: '16px', maxWidth: '780px' }}>
          Model head-to-head combat dynamics using anti-symmetric differentials across striking volume, defensive absorption, grappling metrics, and physical reach.
        </p>
      </div>

      {/* Preset Matchups Ribbon */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          Historical & Marquee Presets
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {presets.map((p, i) => (
            <button
              key={i}
              type="button"
              className="btn-secondary"
              style={{
                fontSize: '12.5px',
                padding: '6px 14px',
                borderRadius: '20px',
                borderColor: fighterA === p.a && fighterB === p.b ? 'var(--accent-warm-gold)' : 'var(--border-subtle)',
                backgroundColor: fighterA === p.a && fighterB === p.b ? 'rgba(194, 166, 118, 0.12)' : 'transparent',
                color: fighterA === p.a && fighterB === p.b ? 'var(--text-ivory)' : 'var(--text-sage)'
              }}
              onClick={() => handlePresetSelect(p)}
            >
              <Swords size={13} style={{ marginRight: '6px', opacity: 0.7 }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Matchup Configuration Form */}
      <div className="card" style={{ padding: '28px', marginBottom: '36px', border: '1px solid var(--border-medium)' }}>
        <form onSubmit={handleFormSubmit}>
          <div className="fight-matchup-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
            {/* Fighter A (Red Corner) */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#E58A88', fontWeight: 600, marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--outcome-loss)' }}></span>
                Red Corner (Fighter A)
              </label>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={fighterA}
                  aria-label="Fighter A name (Red Corner)"
                  onChange={(e) => {
                    setFighterA(e.target.value);
                    setSearchQueryA(e.target.value);
                    setShowDropdownA(true);
                  }}
                  onFocus={() => setShowDropdownA(true)}
                  placeholder="Search 4,600+ athletes..."
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    color: 'var(--text-ivory)',
                    padding: '12px 14px',
                    fontSize: '15px'
                  }}
                />
              </div>

              {/* Dropdown Autocomplete A */}
              {showDropdownA && optionsA.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: 'var(--bg-surface-card)',
                  border: '1px solid var(--border-prominent)',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-elevated)',
                  marginTop: '4px',
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}>
                  {optionsA.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseDown={() => {
                        setFighterA(f.fighter_name);
                        setShowDropdownA(false);
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>{f.fighter_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.total_ufc_bouts} bouts • {f.ufc_wins} wins</div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--accent-sage-bright)' }}>{f.stance || 'Orthodox'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* VS Badge & Corner Swap Action */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '20px'
            }}>
              <button
                type="button"
                onClick={handleSwapFighters}
                title="Swap Fighters & Corners (Tests Prediction Symmetry)"
                aria-label="Swap Fighters"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-warm-gold)';
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-medium)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: 'var(--accent-warm-gold)'
                }}>
                  VS
                </span>
              </button>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Swap
              </span>
            </div>

            {/* Fighter B (Blue Corner) */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7EC2D4', fontWeight: 600, marginBottom: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--outcome-away)' }}></span>
                Blue Corner (Fighter B)
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={fighterB}
                  aria-label="Fighter B name (Blue Corner)"
                  onChange={(e) => {
                    setFighterB(e.target.value);
                    setSearchQueryB(e.target.value);
                    setShowDropdownB(true);
                  }}
                  onFocus={() => setShowDropdownB(true)}
                  placeholder="Search 4,600+ athletes..."
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '6px',
                    color: 'var(--text-ivory)',
                    padding: '12px 14px',
                    fontSize: '15px'
                  }}
                />
              </div>

              {/* Dropdown Autocomplete B */}
              {showDropdownB && optionsB.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  background: 'var(--bg-surface-card)',
                  border: '1px solid var(--border-prominent)',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-elevated)',
                  marginTop: '4px',
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}>
                  {optionsB.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseDown={() => {
                        setFighterB(f.fighter_name);
                        setShowDropdownB(false);
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>{f.fighter_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.total_ufc_bouts} bouts • {f.ufc_wins} wins</div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--accent-sage-bright)' }}>{f.stance || 'Orthodox'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bout Settings & Action Button */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Title Bout Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: 'var(--text-parchment)' }}>
                <input
                  type="checkbox"
                  checked={isTitleBout}
                  onChange={(e) => setIsTitleBout(e.target.checked)}
                  style={{ accentColor: 'var(--accent-warm-gold)', width: '16px', height: '16px' }}
                />
                <span>Championship Bout (5 Rounds / 25 Minutes)</span>
              </label>

              {/* Target Cutoff Date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Evaluation Date:</span>
                <input
                  type="date"
                  value={targetDate}
                  max="2026-10-24"
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    color: 'var(--text-ivory)',
                    padding: '4px 8px',
                    fontSize: '12px'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ padding: '12px 28px', fontSize: '14.5px' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spinning" />
                  <span>Computing Odds...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Calculate Probabilities</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="card" style={{ borderColor: 'var(--outcome-loss)', background: 'rgba(168, 82, 80, 0.08)', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#E58A88' }}>
            <AlertCircle size={20} />
            <h4 style={{ color: '#E58A88', fontSize: '16px' }}>Simulation Warning</h4>
          </div>
          <p style={{ color: 'var(--text-parchment)', fontSize: '14px', marginTop: '6px' }}>{error}</p>
        </div>
      )}

      {/* Prediction Output Results */}
      {prediction && !loading && (
        <div>
          {/* Main Editorial Verdict Card */}
          <div className="card" style={{ padding: '32px', marginBottom: '32px', border: '1px solid var(--border-medium)', background: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-warm-gold)', fontWeight: 600, marginBottom: '6px' }}>
                  Model Prediction Verdict
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--text-ivory)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>{prediction.predicted_winner}</span>
                  <span style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-sans)',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: 'rgba(78, 138, 99, 0.25)',
                    color: '#6EE7B7',
                    border: '1px solid rgba(78, 138, 99, 0.45)',
                    fontWeight: 600
                  }}>
                    {prediction.confidence_level} Confidence
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Model Architecture
                </div>
                <div style={{ fontSize: '14px', color: 'var(--accent-sage-bright)' }}>
                  {prediction.model_version}
                </div>
              </div>
            </div>

            {/* Dual Win Probability Gauge */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                    {prediction.probabilities.fighter_a.name}
                  </span>
                  <span style={{ fontSize: '12px', color: '#E58A88', marginLeft: '6px' }}>
                    ({prediction.probabilities.fighter_a.corner} Corner)
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#7EC2D4', marginRight: '6px' }}>
                    ({prediction.probabilities.fighter_b.corner} Corner)
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-ivory)' }}>
                    {prediction.probabilities.fighter_b.name}
                  </span>
                </div>
              </div>

              {/* Probability Split Bar */}
              <div style={{
                height: '16px',
                borderRadius: '8px',
                background: 'var(--bg-deep)',
                border: '1px solid var(--border-medium)',
                overflow: 'hidden',
                display: 'flex'
              }}>
                <div style={{
                  width: `${(prediction.probabilities.fighter_a.probability * 100).toFixed(1)}%`,
                  background: 'var(--outcome-loss)',
                  transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
                }}></div>
                <div style={{
                  width: `${(prediction.probabilities.fighter_b.probability * 100).toFixed(1)}%`,
                  background: 'var(--outcome-away)',
                  transition: 'width 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
                }}></div>
              </div>

              {/* Exact Tabular Percentages & Odds */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div>
                  <span className="num-tabular" style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)' }}>
                    {prediction.probabilities.fighter_a.probability_percent}
                  </span>
                  <span className="num-tabular" style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    Fair Odds: {prediction.probabilities.fighter_a.fair_decimal_odds.toFixed(2)}
                  </span>
                </div>

                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
                  Sum: {(prediction.probabilities_sum_check * 100).toFixed(1)}%
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="num-tabular" style={{ fontSize: '13px', color: 'var(--text-muted)', marginRight: '8px' }}>
                    Fair Odds: {prediction.probabilities.fighter_b.fair_decimal_odds.toFixed(2)}
                  </span>
                  <span className="num-tabular" style={{ fontSize: '24px', fontFamily: 'var(--font-serif)', color: 'var(--text-ivory)' }}>
                    {prediction.probabilities.fighter_b.probability_percent}
                  </span>
                </div>
              </div>
            </div>

            {/* Method Breakdown & Influential Factors Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
              {/* Method Probability Distribution */}
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)', fontWeight: 600, marginBottom: '14px' }}>
                  Predicted Method of Finish
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(prediction.method_probabilities).map(([method, prob], idx) => {
                    const pct = prob ? (prob * 100).toFixed(1) : '0.0';
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-parchment)' }}>{method}</span>
                          <span className="num-tabular" style={{ color: 'var(--accent-warm-gold)', fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-warm-gold)', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Influential Differential Factors */}
              <div>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-sage)', fontWeight: 600, marginBottom: '14px' }}>
                  Key Differential Factors
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {prediction.influential_factors.map((factor, idx) => (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      background: 'var(--bg-surface)',
                      borderRadius: '4px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', color: 'var(--text-ivory)', fontWeight: 500 }}>
                          {factor.factor}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Advantage: <strong style={{ color: 'var(--accent-sage-bright)' }}>{factor.advantage_fighter}</strong>
                        </div>
                      </div>
                      <span className="num-tabular" style={{ fontSize: '12px', color: 'var(--text-parchment)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '3px' }}>
                        {factor.differential}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tale of the Tape Reusable Component */}
          <div style={{ marginBottom: '32px' }}>
            <TaleOfTheTape
              fighterA={prediction.tale_of_the_tape.fighter_a}
              fighterB={prediction.tale_of_the_tape.fighter_b}
              cornerA="Red"
              cornerB="Blue"
              reachRecorded={prediction.data_quality.reach_recorded}
            />
          </div>

          {/* Disclaimer Footer */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--bg-surface-muted)',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px',
            color: 'var(--text-dim)',
            lineHeight: '1.6'
          }}>
            <strong>Analytical Disclaimer:</strong> {prediction.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
