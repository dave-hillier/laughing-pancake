// Main Application - Dendrite & Substrate
// Browser-based creative tools for foliage and material creation

import { useState } from 'react';
import { Dendrite } from './dendrite/components';
import { Substrate } from './substrate/components';
import './App.css';

type AppMode = 'dendrite' | 'substrate';

function App() {
  const [mode, setMode] = useState<AppMode>('dendrite');

  return (
    <div className="app">
      <nav className="app-nav">
        <button
          className={`nav-btn ${mode === 'dendrite' ? 'active' : ''}`}
          onClick={() => setMode('dendrite')}
        >
          <span className="nav-icon">🌿</span>
          <span className="nav-label">Dendrite</span>
        </button>
        <button
          className={`nav-btn ${mode === 'substrate' ? 'active' : ''}`}
          onClick={() => setMode('substrate')}
        >
          <span className="nav-icon">🎨</span>
          <span className="nav-label">Substrate</span>
        </button>
      </nav>

      <div className="app-content">
        {mode === 'dendrite' ? <Dendrite /> : <Substrate />}
      </div>
    </div>
  );
}

export default App;
