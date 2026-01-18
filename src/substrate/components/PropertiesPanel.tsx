// Properties Panel Component - Edit node parameters

import React from 'react';
import { useSubstrateStore } from '../store/substrateStore';
import { Slider, ColorPicker } from '../../shared/components';
import type { Color } from '../../shared/types';
import './PropertiesPanel.css';

export const PropertiesPanel: React.FC = () => {
  const {
    nodes,
    selectedNodeId,
    updateNodeParameter,
    removeNode,
    graphEngine,
  } = useSubstrateStore();

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const definition = selectedNode
    ? graphEngine.getNodeDefinition(selectedNode.type)
    : null;

  if (!selectedNode || !definition) {
    return (
      <div className="properties-panel">
        <div className="panel-empty">
          <p>Select a node to edit its properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>{definition.name}</h3>
        <button
          className="delete-node-btn"
          onClick={() => removeNode(selectedNode.id)}
          title="Delete Node"
        >
          ×
        </button>
      </div>

      <div className="panel-content">
        {definition.parameters.length === 0 ? (
          <p className="no-params">No parameters</p>
        ) : (
          definition.parameters.map(param => (
            <div key={param.id} className="parameter">
              {param.type === 'float' || param.type === 'int' ? (
                <Slider
                  label={param.name}
                  value={(selectedNode.parameters[param.id] as number) ?? param.default}
                  min={param.min ?? 0}
                  max={param.max ?? 1}
                  step={param.type === 'int' ? 1 : 0.01}
                  onChange={v => updateNodeParameter(selectedNode.id, param.id, v)}
                />
              ) : param.type === 'bool' ? (
                <div className="param-bool">
                  <label className="param-label">{param.name}</label>
                  <button
                    className={`toggle-btn ${selectedNode.parameters[param.id] ? 'active' : ''}`}
                    onClick={() =>
                      updateNodeParameter(
                        selectedNode.id,
                        param.id,
                        !selectedNode.parameters[param.id]
                      )
                    }
                  >
                    {selectedNode.parameters[param.id] ? 'On' : 'Off'}
                  </button>
                </div>
              ) : param.type === 'color' ? (
                <ColorPicker
                  label={param.name}
                  value={(selectedNode.parameters[param.id] as Color) ?? param.default}
                  onChange={v => updateNodeParameter(selectedNode.id, param.id, v)}
                  showAlpha
                />
              ) : param.type === 'enum' ? (
                <div className="param-enum">
                  <label className="param-label">{param.name}</label>
                  <select
                    className="param-select"
                    value={selectedNode.parameters[param.id] as string | number}
                    onChange={e =>
                      updateNodeParameter(
                        selectedNode.id,
                        param.id,
                        parseInt(e.target.value)
                      )
                    }
                  >
                    {param.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="panel-info">
        <div className="info-section">
          <h4>Inputs</h4>
          {definition.inputs.length === 0 ? (
            <p className="info-empty">None</p>
          ) : (
            <ul className="io-list">
              {definition.inputs.map(input => (
                <li key={input.id}>
                  <span className="io-name">{input.name}</span>
                  <span className="io-type">{input.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="info-section">
          <h4>Outputs</h4>
          {definition.outputs.length === 0 ? (
            <p className="info-empty">None</p>
          ) : (
            <ul className="io-list">
              {definition.outputs.map(output => (
                <li key={output.id}>
                  <span className="io-name">{output.name}</span>
                  <span className="io-type">{output.type}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
