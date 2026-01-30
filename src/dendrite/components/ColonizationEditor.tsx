// Space Colonization Editor Component

import { useDendriteStore } from '../store/dendriteStore';
import { Slider, ToggleButtonGroup, EditorSection } from '../../shared/components';
import './ColonizationEditor.css';

const ATTRACTOR_SOURCES = ['uniform', 'boundary', 'poisson'] as const;
const THICKNESS_MODES = ['constant', 'depth', 'flow'] as const;

export const ColonizationEditor = () => {
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
      <EditorSection title="Attractor Distribution">
        <ToggleButtonGroup
          options={ATTRACTOR_SOURCES}
          value={colonization.attractors.source}
          onChange={setAttractorSource}
        />
        <Slider
          label="Attractor Count"
          value={colonization.attractors.count}
          min={50}
          max={2000}
          step={50}
          onChange={setAttractorCount}
        />
      </EditorSection>

      <EditorSection title="Growth Parameters">
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
      </EditorSection>

      <EditorSection title="Thickness Mode">
        <ToggleButtonGroup
          options={THICKNESS_MODES}
          value={colonization.thicknessMode}
          onChange={setThicknessMode}
        />
      </EditorSection>

      <EditorSection title="Seed Points">
        <p className="hint-text">
          Click on the canvas to place seed points where growth begins.
        </p>
        <div className="seed-count">
          {colonization.seeds.length} seed{colonization.seeds.length !== 1 ? 's' : ''} placed
        </div>
      </EditorSection>

      <button className="generate-btn" onClick={generate}>
        Generate
      </button>
    </div>
  );
};
