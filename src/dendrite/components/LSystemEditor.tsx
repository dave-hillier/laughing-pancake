// L-System Grammar Editor Component

import React from 'react';
import { useDendriteStore } from '../store/dendriteStore';
import { Slider } from '../../shared/components';
import { L_SYSTEM_PRESETS } from '../engine';
import './LSystemEditor.css';

export const LSystemEditor: React.FC = () => {
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
      <div className="editor-section">
        <h3>Preset</h3>
        <select
          className="preset-select"
          onChange={e => {
            loadLSystemPreset(e.target.value);
            generate();
          }}
        >
          <option value="">Select preset...</option>
          {Object.keys(L_SYSTEM_PRESETS).map(name => (
            <option key={name} value={name}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="editor-section">
        <h3>Axiom</h3>
        <input
          type="text"
          className="axiom-input"
          value={lsystem.axiom}
          onChange={e => setAxiom(e.target.value)}
          placeholder="Starting symbol(s)"
        />
      </div>

      <div className="editor-section">
        <div className="section-header">
          <h3>Production Rules</h3>
          <button className="add-rule-btn" onClick={addRule}>
            + Add Rule
          </button>
        </div>
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
      </div>

      <div className="editor-section">
        <h3>Parameters</h3>
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
      </div>

      <button className="generate-btn" onClick={generate}>
        Generate
      </button>
    </div>
  );
};
