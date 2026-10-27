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
  ShieldCheck 
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isModelReady: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isModelReady
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Compass },
    { id: 'predictor', label: 'Predictor', icon: Activity },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'modellab', label: 'Model Lab', icon: BrainCircuit },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
  ];

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="app-header">
      <div className="container">
        <div className="nav-inner">
          {/* Typographic Brand Mark */}
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
            <div>
              <span className="brand-text">PITCHIQ</span>
              <span className="brand-badge">ML-11</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav>
            <ul className="nav-links">
              {navItems.map((item) => {
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

          {/* Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="nav-status">
              <span className={`status-dot ${isModelReady ? '' : 'degraded'}`}></span>
              <span>{isModelReady ? 'RF Engine Online' : 'Model Degraded'}</span>
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
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map((item) => {
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
