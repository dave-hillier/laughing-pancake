// Preview Panel Component - 2D and 3D preview

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useSubstrateStore } from '../store/substrateStore';
import { ShaderPipeline } from '../engine/ShaderPipeline';
import './PreviewPanel.css';

// 3D Preview Mesh
const PreviewMesh: React.FC<{ texture: THREE.Texture | null }> = ({ texture }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.5}
        metalness={0.1}
      />
    </mesh>
  );
};

export const PreviewPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pipelineRef = useRef<ShaderPipeline | null>(null);
  const [previewMode, setPreviewMode] = useState<'2d' | '3d'>('2d');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [tileCount, setTileCount] = useState(2);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  const {
    nodes,
    connections,
    previewNodeId,
    resolution,
    graphEngine,
  } = useSubstrateStore();

  // Initialize pipeline
  useEffect(() => {
    if (canvasRef.current && !pipelineRef.current) {
      pipelineRef.current = new ShaderPipeline(canvasRef.current, graphEngine);
    }

    return () => {
      pipelineRef.current?.dispose();
      pipelineRef.current = null;
    };
  }, [graphEngine]);

  // Update preview when graph changes
  useEffect(() => {
    if (!pipelineRef.current || !previewNodeId || nodes.length === 0) {
      setPreviewImage(null);
      return;
    }

    // Sync graph to engine
    graphEngine.deserialize({ nodes, connections });

    pipelineRef.current.setResolution(resolution);

    try {
      const canvas = pipelineRef.current.exportNode(previewNodeId);
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        setPreviewImage(dataUrl);

        // Create Three.js texture
        if (previewMode === '3d') {
          const tex = new THREE.TextureLoader().load(dataUrl);
          tex.wrapS = THREE.RepeatWrapping;
          tex.wrapT = THREE.RepeatWrapping;
          setTexture(tex);
        }
      }
    } catch (error) {
      console.error('Preview render failed:', error);
    }
  }, [nodes, connections, previewNodeId, resolution, graphEngine, previewMode]);

  return (
    <div className="preview-panel">
      <canvas ref={canvasRef} className="render-canvas" />

      <div className="preview-header">
        <div className="preview-tabs">
          <button
            className={`preview-tab ${previewMode === '2d' ? 'active' : ''}`}
            onClick={() => setPreviewMode('2d')}
          >
            2D
          </button>
          <button
            className={`preview-tab ${previewMode === '3d' ? 'active' : ''}`}
            onClick={() => setPreviewMode('3d')}
          >
            3D
          </button>
        </div>
        {previewMode === '2d' && (
          <div className="tile-controls">
            <span>Tiles:</span>
            {[1, 2, 3].map(n => (
              <button
                key={n}
                className={`tile-btn ${tileCount === n ? 'active' : ''}`}
                onClick={() => setTileCount(n)}
              >
                {n}x{n}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="preview-content">
        {previewMode === '2d' ? (
          <div className="preview-2d">
            {previewImage ? (
              <div
                className="preview-tiles"
                style={{
                  gridTemplateColumns: `repeat(${tileCount}, 1fr)`,
                  gridTemplateRows: `repeat(${tileCount}, 1fr)`,
                }}
              >
                {Array.from({ length: tileCount * tileCount }).map((_, i) => (
                  <img
                    key={i}
                    src={previewImage}
                    alt="Preview"
                    className="preview-tile"
                  />
                ))}
              </div>
            ) : (
              <div className="preview-empty">
                <p>Select a node to preview</p>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-3d">
            <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <PreviewMesh texture={texture} />
              <OrbitControls enableZoom enablePan={false} />
              <Environment preset="studio" />
            </Canvas>
          </div>
        )}
      </div>

      <div className="preview-info">
        <span>Resolution: {resolution}px</span>
        {previewNodeId && (
          <span>
            Node:{' '}
            {graphEngine.getNodeDefinition(
              nodes.find(n => n.id === previewNodeId)?.type || ''
            )?.name || 'Unknown'}
          </span>
        )}
      </div>
    </div>
  );
};
