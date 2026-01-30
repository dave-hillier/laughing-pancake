// L-System Grammar Editor Component

import { useDendriteStore } from '../store/dendriteStore';
import { Slider, EditorSection } from '../../shared/components';
import { capitalize } from '../../shared/utils';
import { L_SYSTEM_PRESETS } from '../engine';
import './LSystemEditor.css';

export const LSystemEditor = () => {
  const {
    lsystem,
    setAxiom,
    addRule,
    updateRule,
    removeRule,
    setLSystemParam,
    loadLSystemPreset,
    generate,
  } = useDendriteStore();

  return (
    <div className="lsystem-editor">
      <EditorSection title="Preset">
        <select
          className="editor-select"
          onChange={e => {
            loadLSystemPreset(e.target.value);
            generate();
          }}
        >
          <option value="">Select preset...</option>
          {Object.keys(L_SYSTEM_PRESETS).map(name => (
            <option key={name} value={name}>
              {capitalize(name)}
            </option>
          ))}
        </select>
      </EditorSection>

      <EditorSection title="Axiom">
        <input
          type="text"
          className="editor-input monospace"
          value={lsystem.axiom}
          onChange={e => setAxiom(e.target.value)}
          placeholder="Starting symbol(s)"
        />
      </EditorSection>

      <EditorSection
        title="Production Rules"
        action={
          <button className="add-rule-btn" onClick={addRule}>
            + Add Rule
          </button>
        }
      >
        <div className="rules-list">
          {lsystem.rules.map((rule, index) => (
            <div key={index} className="rule-item">
              <input
                type="text"
                className="rule-predecessor"
                value={rule.predecessor}
                onChange={e =>
                  updateRule(index, { predecessor: e.target.value })
                }
                placeholder="Symbol"
              />
              <span className="rule-arrow">→</span>
              <input
                type="text"
                className="rule-successor"
                value={rule.successor}
                onChange={e => updateRule(index, { successor: e.target.value })}
                placeholder="Replacement"
              />
              {rule.probability !== undefined && (
                <input
                  type="number"
                  className="rule-probability"
                  value={rule.probability}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={e =>
                    updateRule(index, {
                      probability: parseFloat(e.target.value),
                    })
                  }
                />
              )}
              <button
                className="remove-rule-btn"
                onClick={() => removeRule(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Parameters">
        <Slider
          label="Iterations"
          value={lsystem.parameters.iterations}
          min={1}
          max={10}
          step={1}
          onChange={v => setLSystemParam('iterations', v)}
        />
        <Slider
          label="Angle"
          value={lsystem.parameters.angle}
          min={1}
          max={180}
          step={1}
          onChange={v => setLSystemParam('angle', v)}
          unit="°"
        />
        <Slider
          label="Step Length"
          value={lsystem.parameters.stepLength}
          min={1}
          max={50}
          step={0.5}
          onChange={v => setLSystemParam('stepLength', v)}
        />
        <Slider
          label="Length Decay"
          value={lsystem.parameters.lengthDecay}
          min={0.5}
          max={1}
          step={0.01}
          onChange={v => setLSystemParam('lengthDecay', v)}
        />
        <Slider
          label="Initial Width"
          value={lsystem.parameters.widthInitial}
          min={0.5}
          max={10}
          step={0.5}
          onChange={v => setLSystemParam('widthInitial', v)}
        />
        <Slider
          label="Width Decay"
          value={lsystem.parameters.widthDecay}
          min={0.5}
          max={1}
          step={0.01}
          onChange={v => setLSystemParam('widthDecay', v)}
        />
        <Slider
          label="Angle Variance"
          value={lsystem.parameters.angleVariance}
          min={0}
          max={20}
          step={0.5}
          onChange={v => setLSystemParam('angleVariance', v)}
          unit="°"
        />
      </EditorSection>

      <button className="generate-btn" onClick={generate}>
        Generate
      </button>
    </div>
  );
};
