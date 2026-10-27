import React, { useState, useEffect } from 'react';
import { Navigation } from './components/common/Navigation';
import { Footer } from './components/common/Footer';
import { Overview } from './pages/Overview';
import { MatchPredictor } from './pages/MatchPredictor';
import { TeamAnalysis } from './pages/TeamAnalysis';
import { ModelLab } from './pages/ModelLab';
import { DataExplorer } from './pages/DataExplorer';
import { Methodology } from './pages/Methodology';
import { api } from './services/api';
import { FixtureItem } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isModelReady, setIsModelReady] = useState<boolean>(true);
  const [selectedFixtureForPredictor, setSelectedFixtureForPredictor] = useState<FixtureItem | null>(null);

  // Check backend health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.getHealth();
        setIsModelReady(res.model_loaded && res.data_ready);
      } catch (err) {
        console.warn('Backend server currently starting or offline:', err);
        setIsModelReady(false);
      }
    }
    checkHealth();
  }, []);

  const handleNavigate = (tab: string, context?: any) => {
    if (context?.fixture) {
      setSelectedFixtureForPredictor(context.fixture);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Sticky Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setSelectedFixtureForPredictor(null);
          setActiveTab(tab);
        }}
        isModelReady={isModelReady}
      />

      {/* Main Page Content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'overview' && <Overview onNavigate={handleNavigate} />}
        {activeTab === 'predictor' && <MatchPredictor initialFixture={selectedFixtureForPredictor} />}
        {activeTab === 'teams' && <TeamAnalysis />}
        {activeTab === 'modellab' && <ModelLab />}
        {activeTab === 'data' && <DataExplorer />}
        {activeTab === 'methodology' && <Methodology />}
      </main>

      {/* Editorial Footer */}
      <Footer onSelectTab={(tab) => handleNavigate(tab)} />
    </div>
  );
}

export default App;
