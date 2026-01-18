// Main Substrate Application Component

import React from 'react';
import { NodeGraph } from './NodeGraph';
import { NodeBrowser } from './NodeBrowser';
import { PropertiesPanel } from './PropertiesPanel';
import { PreviewPanel } from './PreviewPanel';
import { useSubstrateStore } from '../store/substrateStore';
import { Slider } from '../../shared/components';
import { downloadBlob } from '../../shared/utils';
import './Substrate.css';

export const Substrate: React.FC = () => {
  const {
    projectName,
    setProjectName,
    resolution,
    setResolution,
    newProject,
    getProjectData,
    loadProject,
  } = useSubstrateStore();

  const handleSaveProject = () => {
    const data = getProjectData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${projectName.replace(/\s+/g, '_')}.substrate`);
  };

  const handleLoadProject = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.substrate,.json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const data = JSON.parse(text);
        loadProject(data);
        setProjectName(file.name.replace(/\.(substrate|json)$/, ''));
      }
    };
    input.click();
  };

  return (
    <div className="substrate-app">
      <header className="substrate-header">
        <div className="header-left">
          <h1 className="app-title">Substrate</h1>
          <p className="app-subtitle">Procedural Textures</p>
        </div>

        <div className="header-center">
          <input
            type="text"
            className="project-name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
          />
        </div>

        <div className="header-right">
          <div className="resolution-control">
            <Slider
              label="Resolution"
              value={resolution}
              min={256}
              max={4096}
              step={256}
              onChange={setResolution}
              unit="px"
            />
          </div>
          <button className="header-btn" onClick={newProject}>
            New
          </button>
          <button className="header-btn" onClick={handleLoadProject}>
            Load
          </button>
          <button className="header-btn primary" onClick={handleSaveProject}>
            Save
          </button>
        </div>
      </header>

      <div className="substrate-content">
        <aside className="left-sidebar">
          <NodeBrowser />
        </aside>

        <main className="main-area">
          <div className="graph-container">
            <NodeGraph />
          </div>
          <div className="preview-container">
            <PreviewPanel />
          </div>
        </main>

        <aside className="right-sidebar">
          <PropertiesPanel />
        </aside>
      </div>
    </div>
  );
};
