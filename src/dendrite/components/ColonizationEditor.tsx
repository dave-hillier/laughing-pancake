// Space Colonization Editor Component

import React from 'react';
import { useDendriteStore } from '../store/dendriteStore';
import { Slider } from '../../shared/components';
import './ColonizationEditor.css';

export const ColonizationEditor: React.FC = () => {
  const {
    colonization,
    setColonizationParam,
    setAttractorSource,
    setAttractorCount,
    setThicknessMode,
    generate,
  } = useDendriteStore();

  return (
    <div className="colonization-editor">
      <div className="editor-section">
        <h3>Attractor Distribution</h3>
        <div className="source-buttons">
          {(['uniform', 'boundary', 'poisson'] as const).map(source => (
            <button
              key={source}
              className={`source-btn ${colonization.attractors.source === source ? 'active' : ''}`}
              onClick={() => setAttractorSource(source)}
            >
              {source.charAt(0).toUpperCase() + source.slice(1)}
            </button>
          ))}
        </div>
        <Slider
          label="Attractor Count"
          value={colonization.attractors.count}
          min={50}
          max={2000}
          step={50}
          onChange={setAttractorCount}
        />
      </div>

      <div className="editor-section">
        <h3>Growth Parameters</h3>
        <Slider
          label="Attraction Distance"
          value={colonization.parameters.attractionDistance}
          min={10}
          max={200}
          step={5}
          onChange={v => setColonizationParam('attractionDistance', v)}
        />
        <Slider
          label="Kill Distance"
          value={colonization.parameters.killDistance}
          min={1}
          max={50}
          step={1}
          onChange={v => setColonizationParam('killDistance', v)}
        />
        <Slider
          label="Step Size"
          value={colonization.parameters.stepSize}
          min={1}
          max={20}
          step={0.5}
          onChange={v => setColonizationParam('stepSize', v)}
        />
        <Slider
          label="Max Iterations"
          value={colonization.parameters.maxIterations}
          min={50}
          max={1000}
          step={50}
          onChange={v => setColonizationParam('maxIterations', v)}
        />
      </div>

      <div className="editor-section">
        <h3>Thickness Mode</h3>
        <div className="thickness-buttons">
          {(['constant', 'depth', 'flow'] as const).map(mode => (
            <button
              key={mode}
              className={`thickness-btn ${colonization.thicknessMode === mode ? 'active' : ''}`}
              onClick={() => setThicknessMode(mode)}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="editor-section">
        <h3>Seed Points</h3>
        <p className="hint-text">
          Click on the canvas to place seed points where growth begins.
        </p>
        <div className="seed-count">
          {colonization.seeds.length} seed{colonization.seeds.length !== 1 ? 's' : ''} placed
        </div>
      </div>

      <button className="generate-btn" onClick={generate}>
        Generate
      </button>
    </div>
  );
};
