import React, { useState, useEffect } from 'react';
import { Navigation } from './components/common/Navigation';
import { Footer } from './components/common/Footer';

// Football Pages
import { Overview } from './pages/Overview';
import { MatchPredictor } from './pages/MatchPredictor';
import { TeamAnalysis } from './pages/TeamAnalysis';
import { ModelLab } from './pages/ModelLab';
import { DataExplorer } from './pages/DataExplorer';
import { Methodology } from './pages/Methodology';

// UFC Pages
import { UFCOverview } from './pages/ufc/UFCOverview';
import { FightPredictor } from './pages/ufc/FightPredictor';
import { FighterProfiles } from './pages/ufc/FighterProfiles';
import { FightExplorer } from './pages/ufc/FightExplorer';
import { UFCModelLab } from './pages/ufc/UFCModelLab';
import { UFCMethodology } from './pages/ufc/UFCMethodology';

// API Services & Types
import { api } from './services/api';
import { ufcApi } from './services/ufcApi';
import { FixtureItem } from './types';

export function App() {
  // Global Active Sport: 'football' | 'ufc'
  const [activeSport, setActiveSport] = useState<'football' | 'ufc'>('football');

  // Independent Tab States for Sport Isolation
  const [footballTab, setFootballTab] = useState<string>('overview');
  const [ufcTab, setUfcTab] = useState<string>('overview');

  // Backend Health States
  const [isFootballReady, setIsFootballReady] = useState<boolean>(true);
  const [isUfcReady, setIsUfcReady] = useState<boolean>(true);

  // Cross-Page Navigation Contexts (Football)
  const [selectedFixtureForPredictor, setSelectedFixtureForPredictor] = useState<FixtureItem | null>(null);

  // Cross-Page Navigation Contexts (UFC)
  const [selectedFightForPredictor, setSelectedFightForPredictor] = useState<{
    fighterA?: string;
    fighterB?: string;
    isTitle?: boolean;
  } | null>(null);
  const [selectedFilterForExplorer, setSelectedFilterForExplorer] = useState<{
    weightClass?: string;
  } | null>(null);

  // Initial Health Checks
  useEffect(() => {
    async function checkHealth() {
      // Football Health Check
      try {
        const res = await api.getHealth();
        setIsFootballReady(res.model_loaded && res.data_ready);
      } catch (err) {
        console.warn('Football backend service unreachable:', err);
        setIsFootballReady(false);
      }

      // UFC Health Check
      try {
        const ufcRes = await ufcApi.getStatus();
        setIsUfcReady(ufcRes.model_loaded && ufcRes.data_ready);
      } catch (err) {
        console.warn('UFC backend service unreachable:', err);
        setIsUfcReady(false);
      }
    }
    checkHealth();
  }, []);

  // Football Navigation Handler
  const handleFootballNavigate = (tab: string, context?: any) => {
    if (context?.fixture) {
      setSelectedFixtureForPredictor(context.fixture);
    }
    setFootballTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // UFC Navigation Handler
  const handleUfcNavigate = (tab: string, context?: any) => {
    if (context?.fighterA || context?.fighterB) {
      setSelectedFightForPredictor({
        fighterA: context.fighterA,
        fighterB: context.fighterB,
        isTitle: context.isTitle
      });
    }
    if (context?.weightClass) {
      setSelectedFilterForExplorer({
        weightClass: context.weightClass
      });
    }
    setUfcTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentTab = activeSport === 'football' ? footballTab : ufcTab;
  const isCurrentModelReady = activeSport === 'football' ? isFootballReady : isUfcReady;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Sticky Navigation with Multi-Sport Switcher */}
      <Navigation
        activeSport={activeSport}
        onSelectSport={(sport) => {
          setActiveSport(sport);
        }}
        activeTab={currentTab}
        onSelectTab={(tab) => {
          if (activeSport === 'football') {
            setSelectedFixtureForPredictor(null);
            setFootballTab(tab);
          } else {
            setSelectedFightForPredictor(null);
            setSelectedFilterForExplorer(null);
            setUfcTab(tab);
          }
        }}
        isModelReady={isCurrentModelReady}
      />

      {/* Main Page Workspace */}
      <main style={{ flex: 1 }}>
        {/* ================= FOOTBALL WORKSPACE ================= */}
        {activeSport === 'football' && (
          <>
            {footballTab === 'overview' && <Overview onNavigate={handleFootballNavigate} />}
            {footballTab === 'predictor' && <MatchPredictor initialFixture={selectedFixtureForPredictor} />}
            {footballTab === 'teams' && <TeamAnalysis />}
            {footballTab === 'modellab' && <ModelLab />}
            {footballTab === 'data' && <DataExplorer />}
            {footballTab === 'methodology' && <Methodology />}
          </>
        )}

        {/* ================= UFC / MMA WORKSPACE ================= */}
        {activeSport === 'ufc' && (
          <>
            {ufcTab === 'overview' && <UFCOverview onNavigate={handleUfcNavigate} />}
            {ufcTab === 'predictor' && <FightPredictor initialFight={selectedFightForPredictor} />}
            {ufcTab === 'fighters' && <FighterProfiles onNavigate={handleUfcNavigate} />}
            {ufcTab === 'data' && <FightExplorer initialFilter={selectedFilterForExplorer} onNavigate={handleUfcNavigate} />}
            {ufcTab === 'modellab' && <UFCModelLab />}
            {ufcTab === 'methodology' && <UFCMethodology />}
          </>
        )}
      </main>

      {/* Unified Editorial Footer */}
      <Footer 
        activeSport={activeSport}
        onSelectSport={(sport) => setActiveSport(sport)}
        onSelectTab={(tab) => {
          if (activeSport === 'football') {
            handleFootballNavigate(tab);
          } else {
            handleUfcNavigate(tab);
          }
        }} 
      />
    </div>
  );
}

export default App;
