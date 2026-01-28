// Main Dendrite Application Component

import { useEffect } from 'react';
import { useDendriteStore } from '../store/dendriteStore';
import { LSystemEditor } from './LSystemEditor';
import { ColonizationEditor } from './ColonizationEditor';
import { Canvas } from './Canvas';
import { ExportPanel } from './ExportPanel';
import { ToggleButtonGroup } from '../../shared/components';
import './Dendrite.css';

const ALGORITHM_OPTIONS = [
  { value: 'lsystem' as const, label: 'L-System' },
  { value: 'colonization' as const, label: 'Space Colonization' },
];

export const Dendrite = () => {
  const { algorithmType, setAlgorithmType, generate, viewport, setViewportMode } =
    useDendriteStore();

  // Generate initial result on mount
  useEffect(() => {
    generate();
  }, []);

  return (
    <div className="dendrite-app">
      <header className="dendrite-header">
        <h1 className="app-title">Dendrite</h1>
        <p className="app-subtitle">Growth Simulator</p>
        <div className="algorithm-toggle">
          <ToggleButtonGroup
            options={ALGORITHM_OPTIONS}
            value={algorithmType}
            onChange={setAlgorithmType}
            fullWidth={false}
          />
        </div>
      </header>

      <div className="dendrite-content">
        <aside className="left-panel">
          {algorithmType === 'lsystem' ? <LSystemEditor /> : <ColonizationEditor />}
        </aside>

        <main className="center-panel">
          <div className="canvas-toolbar">
            <div className="toolbar-group">
              <button
                className={`tool-btn ${viewport.mode === 'pan' ? 'active' : ''}`}
                onClick={() => setViewportMode('pan')}
                title="Pan (Hold Middle Mouse)"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z" />
                </svg>
              </button>
              {algorithmType === 'colonization' && (
                <>
                  <button
                    className={`tool-btn ${viewport.mode === 'seed' ? 'active' : ''}`}
                    onClick={() => setViewportMode('seed')}
                    title="Place Seed Points"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="8" />
                    </svg>
                  </button>
                  <button
                    className={`tool-btn ${viewport.mode === 'paint' ? 'active' : ''}`}
                    onClick={() => setViewportMode('paint')}
                    title="Paint Attractors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
          <Canvas />
        </main>

        <aside className="right-panel">
          <ExportPanel />
        </aside>
      </div>
    </div>
  );
};
