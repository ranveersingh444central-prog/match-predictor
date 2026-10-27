import React, { useState } from 'react';
import { 
  Compass, 
  Activity, 
  Users, 
  BrainCircuit, 
  Database, 
  BookOpen, 
  Menu, 
  X, 
  Swords,
  Layers
} from 'lucide-react';

interface NavigationProps {
  activeSport: 'football' | 'ufc';
  onSelectSport: (sport: 'football' | 'ufc') => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isModelReady: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSport,
  onSelectSport,
  activeTab,
  onSelectTab,
  isModelReady
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic Navigation Items by Sport
  const footballNavItems = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'predictor', label: 'Match Predictor', icon: Activity },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'modellab', label: 'Model Lab', icon: BrainCircuit },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
  ];

  const ufcNavItems = [
    { id: 'overview', label: 'UFC Overview', icon: Compass },
    { id: 'predictor', label: 'Fight Predictor', icon: Swords },
    { id: 'fighters', label: 'Fighter Profiles', icon: Users },
    { id: 'data', label: 'Historical Bouts', icon: Database },
    { id: 'modellab', label: 'UFC Model Lab', icon: BrainCircuit },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
  ];

  const currentNavItems = activeSport === 'football' ? footballNavItems : ufcNavItems;

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSportSwitch = (sport: 'football' | 'ufc') => {
    if (sport !== activeSport) {
      onSelectSport(sport);
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="app-header">
      <div className="container">
        <div className="nav-inner">
          {/* Typographic Brand Mark & Sport Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div 
              className="brand-logo" 
              onClick={() => handleTabClick('overview')}
              style={{ cursor: 'pointer' }}
            >
              <div className="brand-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A7B2A0" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="brand-text">PITCHIQ</span>
                <span className="brand-badge">
                  {activeSport === 'football' ? 'PL-11' : 'UFC-16'}
                </span>
              </div>
            </div>

            {/* Global Sport Switcher Segmented Control */}
            <div 
              className="sport-switcher"
              role="tablist"
              aria-label="Sport Selection"
              style={{
                display: 'inline-flex',
                background: 'rgba(11, 25, 20, 0.9)',
                border: '1px solid var(--border-medium)',
                borderRadius: '6px',
                padding: '3px',
                gap: '2px'
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeSport === 'football'}
                className={`sport-switch-btn ${activeSport === 'football' ? 'active-sport' : ''}`}
                onClick={() => handleSportSwitch('football')}
                style={{
                  background: activeSport === 'football' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: activeSport === 'football' ? '1px solid var(--accent-moss)' : '1px solid transparent',
                  color: activeSport === 'football' ? 'var(--text-ivory)' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span>⚽</span>
                <span>Football</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeSport === 'ufc'}
                className={`sport-switch-btn ${activeSport === 'ufc' ? 'active-sport' : ''}`}
                onClick={() => handleSportSwitch('ufc')}
                style={{
                  background: activeSport === 'ufc' ? 'rgba(168, 82, 80, 0.25)' : 'transparent',
                  border: activeSport === 'ufc' ? '1px solid #E58A88' : '1px solid transparent',
                  color: activeSport === 'ufc' ? 'var(--text-ivory)' : 'var(--text-muted)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  padding: '5px 12px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <span>🥊</span>
                <span>UFC / MMA</span>
              </button>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav>
            <ul className="nav-links">
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={`nav-item-btn ${isActive ? 'active' : ''}`}
                      onClick={() => handleTabClick(item.id)}
                    >
                      <Icon size={15} opacity={isActive ? 1 : 0.75} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Status Indicator & Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="nav-status">
              <span className={`status-dot ${isModelReady ? '' : 'degraded'}`}></span>
              <span>
                {activeSport === 'football' 
                  ? (isModelReady ? 'RF Engine Online' : 'Model Degraded')
                  : (isModelReady ? 'Octagon RF Online' : 'UFC Engine Degraded')
                }
              </span>
            </div>

            {/* Mobile Nav Toggle */}
            <button
              className="mobile-nav-toggle"
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-ivory)',
                padding: '4px'
              }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div style={{
            padding: '16px 0',
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-deep)'
          }}>
            {/* Mobile Sport Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '0 8px' }}>
              <button
                type="button"
                onClick={() => handleSportSwitch('football')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  background: activeSport === 'football' ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: activeSport === 'football' ? '1px solid var(--accent-moss)' : '1px solid var(--border-subtle)',
                  color: 'var(--text-ivory)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⚽ Football</span>
              </button>
              <button
                type="button"
                onClick={() => handleSportSwitch('ufc')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '6px',
                  background: activeSport === 'ufc' ? 'rgba(168, 82, 80, 0.25)' : 'transparent',
                  border: activeSport === 'ufc' ? '1px solid #E58A88' : '1px solid var(--border-subtle)',
                  color: 'var(--text-ivory)',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🥊 UFC / MMA</span>
              </button>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      className={`nav-item-btn ${isActive ? 'active' : ''}`}
                      style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}
                      onClick={() => handleTabClick(item.id)}
                    >
                      <Icon size={16} />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};
