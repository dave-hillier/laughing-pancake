// Growth Visualization Canvas Component

import React, { useRef, useEffect, useCallback } from 'react';
import { useDendriteStore } from '../store/dendriteStore';
import type { Vector2 } from '../../shared/types';
import './Canvas.css';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastMousePos = useRef<Vector2>({ x: 0, y: 0 });

  const {
    graph,
    viewport,
    algorithmType,
    setViewportPan,
    setViewportZoom,
    addSeed,
  } = useDendriteStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width, height } = canvas;
    const { pan, zoom } = viewport;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Apply transform
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1 / zoom;
    const gridSize = 50;
    const gridExtent = 1000;

    for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, -gridExtent);
      ctx.lineTo(x, gridExtent);
      ctx.stroke();
    }
    for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(-gridExtent, y);
      ctx.lineTo(gridExtent, y);
      ctx.stroke();
    }

    // Draw branch graph
    if (graph) {
      // Draw segments
      graph.segments.forEach(segment => {
        const startNode = graph.nodes.get(segment.start);
        const endNode = graph.nodes.get(segment.end);

        if (!startNode || !endNode) return;

        const thickness = (startNode.attributes.thickness + endNode.attributes.thickness) / 2;

        ctx.beginPath();
        ctx.moveTo(startNode.position.x, startNode.position.y);
        ctx.lineTo(endNode.position.x, endNode.position.y);

        // Color based on depth
        const hue = 120 - startNode.depth * 10;
        const saturation = 60;
        const lightness = 40 + startNode.order * 5;
        ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.lineWidth = Math.max(1 / zoom, thickness * 2);
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // Draw nodes (optional, for debugging)
      if (zoom > 2) {
        graph.nodes.forEach(node => {
          ctx.beginPath();
          ctx.arc(node.position.x, node.position.y, 2 / zoom, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff44';
          ctx.fill();
        });
      }
    }

    // Draw origin marker
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.stroke();

    ctx.restore();
  }, [graph, viewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      draw();
    };

    resize();
    window.addEventListener('resize', resize);

    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && viewport.mode === 'pan')) {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else if (e.button === 0 && viewport.mode === 'seed' && algorithmType === 'colonization') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - canvas.width / 2 - viewport.pan.x;
      const y = e.clientY - rect.top - canvas.height / 2 - viewport.pan.y;

      addSeed({ x: x / viewport.zoom, y: y / viewport.zoom });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;

      setViewportPan({
        x: viewport.pan.x + dx,
        y: viewport.pan.y + dy,
      });

      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewportZoom(viewport.zoom * delta);
  };

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas
        ref={canvasRef}
        className="growth-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="canvas-info">
        <span>Zoom: {(viewport.zoom * 100).toFixed(0)}%</span>
        {graph && <span>Nodes: {graph.nodes.size}</span>}
        {graph && <span>Segments: {graph.segments.size}</span>}
      </div>
    </div>
  );
};
