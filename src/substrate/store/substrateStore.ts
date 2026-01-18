// Substrate State Management with Zustand

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { GraphNode, GraphConnection, Vector2 } from '../../shared/types';
import { generateId } from '../../shared/utils';
import { GraphEngine } from '../engine/GraphEngine';
import { allNodes } from '../nodes';

interface SubstrateState {
  // Graph data
  nodes: GraphNode[];
  connections: GraphConnection[];

  // UI state
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  viewportPan: Vector2;
  viewportZoom: number;

  // Preview
  previewNodeId: string | null;
  resolution: number;

  // Project
  projectName: string;
  isDirty: boolean;

  // Engine reference (not part of state, created on init)
  graphEngine: GraphEngine;
}

interface SubstrateActions {
  // Node management
  addNode: (type: string, position: Vector2) => string;
  removeNode: (nodeId: string) => void;
  updateNodePosition: (nodeId: string, position: Vector2) => void;
  updateNodeParameter: (nodeId: string, paramId: string, value: unknown) => void;

  // Connection management
  addConnection: (
    fromNode: string,
    fromOutput: string,
    toNode: string,
    toInput: string
  ) => boolean;
  removeConnection: (connectionId: string) => void;

  // Selection
  selectNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;

  // Viewport
  setViewportPan: (pan: Vector2) => void;
  setViewportZoom: (zoom: number) => void;

  // Preview
  setPreviewNode: (nodeId: string | null) => void;
  setResolution: (resolution: number) => void;

  // Project
  setProjectName: (name: string) => void;
  newProject: () => void;
  loadProject: (data: { nodes: GraphNode[]; connections: GraphConnection[] }) => void;
  getProjectData: () => { nodes: GraphNode[]; connections: GraphConnection[] };

  // Engine sync
  syncToEngine: () => void;
}

// Create and initialize graph engine
const createGraphEngine = () => {
  const engine = new GraphEngine();
  allNodes.forEach(def => engine.registerNodeDefinition(def));
  return engine;
};

export const useSubstrateStore = create<SubstrateState & SubstrateActions>()(
  immer((set, get) => ({
    // Initial state
    nodes: [],
    connections: [],
    selectedNodeId: null,
    hoveredNodeId: null,
    viewportPan: { x: 0, y: 0 },
    viewportZoom: 1,
    previewNodeId: null,
    resolution: 1024,
    projectName: 'Untitled Project',
    isDirty: false,
    graphEngine: createGraphEngine(),

    // Actions
    addNode: (type, position) => {
      const nodeId = generateId();
      const definition = get().graphEngine.getNodeDefinition(type);

      if (!definition) {
        console.error(`Unknown node type: ${type}`);
        return '';
      }

      // Create default parameters
      const parameters: Record<string, unknown> = {};
      for (const param of definition.parameters) {
        parameters[param.id] = param.default;
      }

      const newNode: GraphNode = {
        id: nodeId,
        type,
        position,
        parameters,
      };

      set(state => {
        state.nodes.push(newNode);
        state.isDirty = true;
      });

      get().syncToEngine();
      return nodeId;
    },

    removeNode: nodeId => {
      set(state => {
        state.nodes = state.nodes.filter(n => n.id !== nodeId);
        state.connections = state.connections.filter(
          c => c.from.node !== nodeId && c.to.node !== nodeId
        );
        if (state.selectedNodeId === nodeId) {
          state.selectedNodeId = null;
        }
        state.isDirty = true;
      });

      get().syncToEngine();
    },

    updateNodePosition: (nodeId, position) => {
      set(state => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          node.position = position;
        }
      });
    },

    updateNodeParameter: (nodeId, paramId, value) => {
      set(state => {
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          node.parameters[paramId] = value;
          state.isDirty = true;
        }
      });

      get().graphEngine.updateNodeParameter(nodeId, paramId, value);
    },

    addConnection: (fromNode, fromOutput, toNode, toInput) => {
      const connectionId = generateId();
      const connection: GraphConnection = {
        id: connectionId,
        from: { node: fromNode, output: fromOutput },
        to: { node: toNode, input: toInput },
      };

      // Attempt to add via engine (validates)
      const engine = get().graphEngine;
      get().syncToEngine(); // Ensure engine is up to date

      if (engine.addConnection(connection)) {
        set(state => {
          // Remove existing connection to same input
          state.connections = state.connections.filter(
            c => !(c.to.node === toNode && c.to.input === toInput)
          );
          state.connections.push(connection);
          state.isDirty = true;
        });
        return true;
      }

      return false;
    },

    removeConnection: connectionId => {
      set(state => {
        state.connections = state.connections.filter(c => c.id !== connectionId);
        state.isDirty = true;
      });

      get().syncToEngine();
    },

    selectNode: nodeId => {
      set(state => {
        state.selectedNodeId = nodeId;
        if (nodeId) {
          state.previewNodeId = nodeId;
        }
      });
    },

    setHoveredNode: nodeId => {
      set(state => {
        state.hoveredNodeId = nodeId;
      });
    },

    setViewportPan: pan => {
      set(state => {
        state.viewportPan = pan;
      });
    },

    setViewportZoom: zoom => {
      set(state => {
        state.viewportZoom = Math.max(0.1, Math.min(4, zoom));
      });
    },

    setPreviewNode: nodeId => {
      set(state => {
        state.previewNodeId = nodeId;
      });
    },

    setResolution: resolution => {
      set(state => {
        state.resolution = resolution;
      });
    },

    setProjectName: name => {
      set(state => {
        state.projectName = name;
        state.isDirty = true;
      });
    },

    newProject: () => {
      set(state => {
        state.nodes = [];
        state.connections = [];
        state.selectedNodeId = null;
        state.previewNodeId = null;
        state.projectName = 'Untitled Project';
        state.isDirty = false;
        state.viewportPan = { x: 0, y: 0 };
        state.viewportZoom = 1;
      });

      get().syncToEngine();
    },

    loadProject: data => {
      set(state => {
        state.nodes = data.nodes;
        state.connections = data.connections;
        state.selectedNodeId = null;
        state.previewNodeId = data.nodes[0]?.id || null;
        state.isDirty = false;
      });

      get().syncToEngine();
    },

    getProjectData: () => {
      const state = get();
      return {
        nodes: state.nodes,
        connections: state.connections,
      };
    },

    syncToEngine: () => {
      const state = get();
      state.graphEngine.deserialize({
        nodes: state.nodes,
        connections: state.connections,
      });
    },
  }))
);
