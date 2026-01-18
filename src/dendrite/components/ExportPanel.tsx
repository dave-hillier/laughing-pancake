// Export Panel Component for Dendrite

import React, { useRef, useEffect, useState } from 'react';
import { useDendriteStore } from '../store/dendriteStore';
import { Slider } from '../../shared/components';
import { Rasterizer } from '../engine/Rasterizer';
import type { OutputMapType } from '../../shared/types';
import { downloadBlob, canvasToBlob } from '../../shared/utils';
import './ExportPanel.css';

const MAP_LABELS: Record<OutputMapType, string> = {
  distance: 'Distance Field',
  direction: 'Direction Field',
  thickness: 'Thickness',
  depth: 'Depth/Height',
  id: 'ID Map',
};

export const ExportPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rasterizerRef = useRef<Rasterizer | null>(null);
  const [isRasterizing, setIsRasterizing] = useState(false);
  const [previewMap, setPreviewMap] = useState<OutputMapType>('distance');

  const {
    graph,
    rasterization,
    exportMaps,
    setResolution,
    toggleMap,
    setExportMap,
  } = useDendriteStore();

  useEffect(() => {
    if (canvasRef.current && !rasterizerRef.current) {
      rasterizerRef.current = new Rasterizer(canvasRef.current);
    }

    return () => {
      rasterizerRef.current?.dispose();
      rasterizerRef.current = null;
    };
  }, []);

  const handleRasterize = async () => {
    if (!graph || !rasterizerRef.current) return;

    setIsRasterizing(true);

    try {
      const output = rasterizerRef.current.rasterize(graph, rasterization);

      // Store output maps
      Object.entries(output).forEach(([key, canvas]) => {
        if (canvas) {
          setExportMap(key as OutputMapType, canvas);
        }
      });
    } catch (error) {
      console.error('Rasterization failed:', error);
    }

    setIsRasterizing(false);
  };

  const handleExportSingle = async (map: OutputMapType) => {
    const canvas = exportMaps[map];
    if (!canvas) return;

    const blob = await canvasToBlob(canvas);
    downloadBlob(blob, `dendrite_${map}_${Date.now()}.png`);
  };

  const handleExportAll = async () => {
    for (const map of rasterization.maps) {
      const canvas = exportMaps[map];
      if (canvas) {
        const blob = await canvasToBlob(canvas);
        downloadBlob(blob, `dendrite_${map}_${Date.now()}.png`);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  const handleExportSVG = () => {
    if (!graph) return;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${graph.bounds.min.x - 10} ${graph.bounds.min.y - 10} ${graph.bounds.max.x - graph.bounds.min.x + 20} ${graph.bounds.max.y - graph.bounds.min.y + 20}">`;
    svg += '<g stroke="#333" fill="none" stroke-linecap="round">';

    graph.segments.forEach(segment => {
      const start = graph.nodes.get(segment.start);
      const end = graph.nodes.get(segment.end);
      if (!start || !end) return;

      const thickness = (start.attributes.thickness + end.attributes.thickness) / 2;
      svg += `<line x1="${start.position.x}" y1="${start.position.y}" x2="${end.position.x}" y2="${end.position.y}" stroke-width="${thickness * 2}"/>`;
    });

    svg += '</g></svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    downloadBlob(blob, `dendrite_${Date.now()}.svg`);
  };

  const handleExportJSON = () => {
    if (!graph) return;

    const data = {
      nodes: Array.from(graph.nodes.values()),
      segments: Array.from(graph.segments.values()),
      roots: graph.roots,
      bounds: graph.bounds,
      metadata: graph.metadata,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `dendrite_${Date.now()}.json`);
  };

  return (
    <div className="export-panel">
      <canvas ref={canvasRef} className="raster-canvas" />

      <div className="panel-section">
        <h3>Rasterization</h3>
        <Slider
          label="Resolution"
          value={rasterization.resolution}
          min={256}
          max={4096}
          step={256}
          onChange={setResolution}
          unit="px"
        />

        <div className="map-toggles">
          {(Object.keys(MAP_LABELS) as OutputMapType[]).map(map => (
            <label key={map} className="map-toggle">
              <input
                type="checkbox"
                checked={rasterization.maps.includes(map)}
                onChange={() => toggleMap(map)}
              />
              <span>{MAP_LABELS[map]}</span>
            </label>
          ))}
        </div>

        <button
          className="rasterize-btn"
          onClick={handleRasterize}
          disabled={!graph || isRasterizing}
        >
          {isRasterizing ? 'Rasterizing...' : 'Rasterize'}
        </button>
      </div>

      <div className="panel-section">
        <h3>Preview</h3>
        <div className="preview-tabs">
          {rasterization.maps.map(map => (
            <button
              key={map}
              className={`preview-tab ${previewMap === map ? 'active' : ''}`}
              onClick={() => setPreviewMap(map)}
            >
              {map}
            </button>
          ))}
        </div>
        <div className="preview-container">
          {exportMaps[previewMap] ? (
            <img
              src={exportMaps[previewMap]!.toDataURL()}
              alt={previewMap}
              className="preview-image"
              onClick={() => handleExportSingle(previewMap)}
              title="Click to export this map"
            />
          ) : (
            <div className="preview-empty">No preview available</div>
          )}
        </div>
      </div>

      <div className="panel-section">
        <h3>Export</h3>
        <div className="export-buttons">
          <button
            className="export-btn"
            onClick={handleExportAll}
            disabled={rasterization.maps.every(m => !exportMaps[m])}
          >
            Export All Maps (PNG)
          </button>
          <button
            className="export-btn secondary"
            onClick={handleExportSVG}
            disabled={!graph}
          >
            Export SVG
          </button>
          <button
            className="export-btn secondary"
            onClick={handleExportJSON}
            disabled={!graph}
          >
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
};
