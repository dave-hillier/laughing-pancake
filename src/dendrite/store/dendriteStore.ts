// Dendrite State Management with Zustand

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  BranchGraph,
  LSystemDefinition,
  ColonizationConfig,
  ProductionRule,
  Vector2,
  RasterizationSettings,
  OutputMapType,
} from '../../shared/types';
import { LSystemParser, L_SYSTEM_PRESETS, TurtleInterpreter, SpaceColonization } from '../engine';

export type AlgorithmType = 'lsystem' | 'colonization';
export type ViewportMode = 'pan' | 'paint' | 'erase' | 'seed';

interface DendriteState {
  // Algorithm selection
  algorithmType: AlgorithmType;

  // L-System state
  lsystem: LSystemDefinition;

  // Space Colonization state
  colonization: ColonizationConfig;

  // Generated graph
  graph: BranchGraph | null;
  lsystemString: string;

  // Viewport state
  viewport: {
    pan: Vector2;
    zoom: number;
    mode: ViewportMode;
    brushSize: number;
  };

  // Rasterization settings
  rasterization: RasterizationSettings;

  // Export state
  exportMaps: Record<OutputMapType, HTMLCanvasElement | null>;

  // Undo/redo (simplified)
  history: BranchGraph[];
  historyIndex: number;
}

interface DendriteActions {
  // Algorithm selection
  setAlgorithmType: (type: AlgorithmType) => void;

  // L-System actions
  setAxiom: (axiom: string) => void;
  addRule: () => void;
  updateRule: (index: number, rule: Partial<ProductionRule>) => void;
  removeRule: (index: number) => void;
  setLSystemParam: (key: keyof LSystemDefinition['parameters'], value: number) => void;
  loadLSystemPreset: (presetName: string) => void;

  // Space Colonization actions
  setColonizationParam: (
    key: keyof ColonizationConfig['parameters'],
    value: number
  ) => void;
  setAttractorSource: (source: ColonizationConfig['attractors']['source']) => void;
  setAttractorCount: (count: number) => void;
  addSeed: (position: Vector2) => void;
  removeSeed: (index: number) => void;
  setThicknessMode: (mode: ColonizationConfig['thicknessMode']) => void;

  // Generation
  generate: () => void;

  // Viewport
  setViewportPan: (pan: Vector2) => void;
  setViewportZoom: (zoom: number) => void;
  setViewportMode: (mode: ViewportMode) => void;
  setBrushSize: (size: number) => void;

  // Rasterization
  setResolution: (resolution: number) => void;
  toggleMap: (map: OutputMapType) => void;

  // Export
  setExportMap: (map: OutputMapType, canvas: HTMLCanvasElement | null) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Reset
  reset: () => void;
}

const defaultLSystem: LSystemDefinition = {
  axiom: 'F',
  rules: [{ predecessor: 'F', successor: 'F[+F][-F]' }],
  parameters: {
    angle: 30,
    stepLength: 10,
    lengthDecay: 0.8,
    widthInitial: 2,
    widthDecay: 0.7,
    angleVariance: 0,
    iterations: 5,
  },
  interpretation: {
    mode: '2d',
    startPosition: { x: 0, y: 0 },
    startHeading: { x: 0, y: -1 },
  },
};

const defaultColonization: ColonizationConfig = {
  attractors: {
    source: 'uniform',
    count: 500,
    region: { min: { x: -200, y: -200 }, max: { x: 200, y: 200 } },
  },
  parameters: {
    attractionDistance: 50,
    killDistance: 10,
    stepSize: 5,
    maxIterations: 500,
  },
  seeds: [{ x: 0, y: 0 }],
  thicknessMode: 'flow',
};

export const useDendriteStore = create<DendriteState & DendriteActions>()(
  immer((set, get) => ({
    // Initial state
    algorithmType: 'lsystem',
    lsystem: defaultLSystem,
    colonization: defaultColonization,
    graph: null,
    lsystemString: '',
    viewport: {
      pan: { x: 0, y: 0 },
      zoom: 1,
      mode: 'pan',
      brushSize: 20,
    },
    rasterization: {
      resolution: 1024,
      maps: ['distance', 'thickness'],
      antiAliasing: true,
    },
    exportMaps: {
      distance: null,
      direction: null,
      thickness: null,
      depth: null,
      id: null,
    },
    history: [],
    historyIndex: -1,

    // Actions
    setAlgorithmType: type =>
      set(state => {
        state.algorithmType = type;
      }),

    setAxiom: axiom =>
      set(state => {
        state.lsystem.axiom = axiom;
      }),

    addRule: () =>
      set(state => {
        state.lsystem.rules.push({ predecessor: 'F', successor: 'F' });
      }),

    updateRule: (index, rule) =>
      set(state => {
        Object.assign(state.lsystem.rules[index], rule);
      }),

    removeRule: index =>
      set(state => {
        state.lsystem.rules.splice(index, 1);
      }),

    setLSystemParam: (key, value) =>
      set(state => {
        state.lsystem.parameters[key] = value;
      }),

    loadLSystemPreset: presetName =>
      set(state => {
        const preset = L_SYSTEM_PRESETS[presetName];
        if (preset) {
          state.lsystem.axiom = preset.axiom;
          state.lsystem.rules = [...preset.rules];
          state.lsystem.parameters = { ...preset.parameters };
        }
      }),

    setColonizationParam: (key, value) =>
      set(state => {
        (state.colonization.parameters as Record<string, unknown>)[key] = value;
      }),

    setAttractorSource: source =>
      set(state => {
        state.colonization.attractors.source = source;
      }),

    setAttractorCount: count =>
      set(state => {
        state.colonization.attractors.count = count;
      }),

    addSeed: position =>
      set(state => {
        state.colonization.seeds.push(position);
      }),

    removeSeed: index =>
      set(state => {
        state.colonization.seeds.splice(index, 1);
      }),

    setThicknessMode: mode =>
      set(state => {
        state.colonization.thicknessMode = mode;
      }),

    generate: () => {
      const state = get();

      if (state.algorithmType === 'lsystem') {
        const parser = new LSystemParser(state.lsystem);
        const lsystemString = parser.parse(state.lsystem.parameters.iterations);

        const interpreter = new TurtleInterpreter(state.lsystem.parameters);
        const graph = interpreter.interpret(lsystemString);

        set(draft => {
          draft.lsystemString = lsystemString;
          draft.graph = graph;

          // Add to history
          if (draft.graph) {
            draft.history = draft.history.slice(0, draft.historyIndex + 1);
            draft.history.push(graph);
            draft.historyIndex = draft.history.length - 1;
          }
        });
      } else {
        const colonization = new SpaceColonization(state.colonization);
        const graph = colonization.run();

        set(draft => {
          draft.graph = graph;

          // Add to history
          if (draft.graph) {
            draft.history = draft.history.slice(0, draft.historyIndex + 1);
            draft.history.push(graph);
            draft.historyIndex = draft.history.length - 1;
          }
        });
      }
    },

    setViewportPan: pan =>
      set(state => {
        state.viewport.pan = pan;
      }),

    setViewportZoom: zoom =>
      set(state => {
        state.viewport.zoom = Math.max(0.1, Math.min(10, zoom));
      }),

    setViewportMode: mode =>
      set(state => {
        state.viewport.mode = mode;
      }),

    setBrushSize: size =>
      set(state => {
        state.viewport.brushSize = size;
      }),

    setResolution: resolution =>
      set(state => {
        state.rasterization.resolution = resolution;
      }),

    toggleMap: map =>
      set(state => {
        const index = state.rasterization.maps.indexOf(map);
        if (index >= 0) {
          state.rasterization.maps.splice(index, 1);
        } else {
          state.rasterization.maps.push(map);
        }
      }),

    setExportMap: (map, canvas) =>
      set(state => {
        // Use direct assignment to avoid immer issues with DOM elements
        state.exportMaps = { ...state.exportMaps, [map]: canvas } as typeof state.exportMaps;
      }),

    undo: () =>
      set(state => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          state.graph = state.history[state.historyIndex];
        }
      }),

    redo: () =>
      set(state => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          state.graph = state.history[state.historyIndex];
        }
      }),

    reset: () =>
      set(state => {
        state.lsystem = defaultLSystem;
        state.colonization = defaultColonization;
        state.graph = null;
        state.lsystemString = '';
        state.history = [];
        state.historyIndex = -1;
      }),
  }))
);
