// Core type definitions shared across Dendrite and Substrate

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector2;
  max: Vector2;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// Branch Graph Data Structures (Dendrite)
export interface BranchNode {
  id: string;
  position: Vector2;
  parent: string | null;
  children: string[];
  depth: number;
  order: number; // Strahler order for thickness
  attributes: {
    thickness: number;
    color: number; // Gradient position 0-1
    age: number; // Iteration when created
  };
}

export interface BranchSegment {
  id: string;
  start: string; // Node ID
  end: string; // Node ID
  controlPoints?: Vector2[]; // For curved segments
}

export interface BranchGraph {
  nodes: Map<string, BranchNode>;
  segments: Map<string, BranchSegment>;
  roots: string[];
  bounds: BoundingBox;
  metadata: {
    algorithm: 'lsystem' | 'colonization' | 'hybrid';
    parameters: AlgorithmParameters;
    createdAt: Date;
  };
}

export type AlgorithmParameters = LSystemParameters | ColonizationParameters;

// L-System Types
export interface LSystemDefinition {
  axiom: string;
  rules: ProductionRule[];
  parameters: LSystemParameters;
  interpretation: {
    mode: '2d' | '3d';
    startPosition: Vector2 | Vector3;
    startHeading: Vector2 | Vector3;
  };
}

export interface LSystemParameters {
  angle: number;
  stepLength: number;
  lengthDecay: number;
  widthInitial: number;
  widthDecay: number;
  angleVariance: number;
  iterations: number;
}

export interface ProductionRule {
  predecessor: string;
  successor: string;
  probability?: number;
  condition?: string;
  leftContext?: string;
  rightContext?: string;
}

// Space Colonization Types
export interface ColonizationConfig {
  attractors: {
    source: 'uniform' | 'mask' | 'boundary' | 'poisson' | 'painted';
    count: number;
    mask?: ImageData;
    region: BoundingBox;
  };
  parameters: ColonizationParameters;
  seeds: Vector2[];
  thicknessMode: 'constant' | 'depth' | 'flow';
}

export interface ColonizationParameters {
  attractionDistance: number;
  killDistance: number;
  stepSize: number;
  maxIterations: number;
  growthBias?: Vector2;
}

// Substrate Node Graph Types
export type DataType = 'grayscale' | 'color' | 'rgba' | 'scalar' | 'vector2' | 'vector3';

export type NodeCategory =
  | 'generator'
  | 'filter'
  | 'blend'
  | 'utility'
  | 'input'
  | 'output'
  | 'scatter';

export interface NodeDefinition {
  id: string;
  name: string;
  category: NodeCategory;
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  parameters: ParameterDefinition[];
  shader?: {
    fragment: string;
    uniforms: UniformMapping[];
  };
  execute?: (inputs: NodeInputs, params: ParamValues) => NodeOutputs;
}

export interface InputDefinition {
  id: string;
  name: string;
  type: DataType;
  required: boolean;
  default?: DefaultValue;
}

export interface OutputDefinition {
  id: string;
  name: string;
  type: DataType;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  type: 'float' | 'int' | 'bool' | 'color' | 'enum' | 'curve';
  default: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: EnumOption[];
}

export interface EnumOption {
  value: string | number;
  label: string;
}

export interface UniformMapping {
  name: string;
  parameterId: string;
  type: 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'sampler2D';
}

export type DefaultValue = number | Color | Vector2 | Vector3 | null;
export type NodeInputs = Record<string, WebGLTexture | null>;
export type ParamValues = Record<string, unknown>;
export type NodeOutputs = Record<string, WebGLTexture>;

// Graph Instance Types
export interface GraphNode {
  id: string;
  type: string;
  position: Vector2;
  parameters: Record<string, unknown>;
}

export interface GraphConnection {
  id: string;
  from: { node: string; output: string };
  to: { node: string; input: string };
}

export interface SubstrateProject {
  version: string;
  name: string;
  resolution: number;
  nodes: GraphNode[];
  connections: GraphConnection[];
  outputs: Record<string, string>;
  assets: Record<string, string>;
}

// Export types for rasterization
export type OutputMapType = 'distance' | 'direction' | 'thickness' | 'depth' | 'id';

export interface RasterizationSettings {
  resolution: number;
  maps: OutputMapType[];
  antiAliasing: boolean;
}
