Technical Design Document
Dendrite Growth Simulator
&
Substrate Procedural Texture Tool
Browser-Based Creative Tools for Foliage and Material Creation
Version 1.0
January 2026
Table of Contents
Table of Contents	2
Executive Summary	14
This document specifies the complete technical design for two complementary browser-based creative applications: Dendrite, a growth simulation tool for procedural organic structures, and Substrate, a node-based procedural texture authoring system. Together, these applications provide a comprehensive workflow for creating high-quality foliage textures and organic materials.	14
Vision	14
The creative tools landscape lacks accessible, browser-based solutions for procedural organic content creation. Existing tools like Adobe Substance Designer are powerful but desktop-bound, expensive, and have steep learning curves. Game developers, technical artists, and hobbyists need lightweight, focused tools that excel at specific tasks.	14
Dendrite addresses the gap in organic growth simulation by providing intuitive interfaces for L-systems and space colonization algorithms. Substrate complements this by offering a streamlined texture composition workflow optimized for the outputs Dendrite produces.	14
Key Design Principles	14
Target Users	14
Part 1: Dendrite Growth Simulator	16
1.1 Product Overview	16
Dendrite is a specialized application for creating organic branching structures through algorithmic growth simulation. It implements two primary algorithms: L-systems for rule-based recursive structures, and space colonization for environment-responsive growth patterns.	16
The application produces vector representations of growth structures which can be exported directly or rasterized into texture maps suitable for use in game engines, 3D applications, or the companion Substrate application.	16
1.2 Core Algorithms	16
1.2.1 L-System Engine	16
Lindenmayer systems (L-systems) are parallel rewriting systems that generate complex structures through iterative application of production rules. Dendrite implements a comprehensive L-system interpreter supporting deterministic, stochastic, parametric, and context-sensitive grammars.	16
Alphabet and Symbols: The L-system operates on strings of symbols, each with semantic meaning during interpretation:	16
Production Rules: Rules define how symbols are replaced during each iteration. Dendrite supports multiple rule formats:	17
Deterministic rules apply unconditionally:	17
1.2.2 Space Colonization Algorithm	17
Space colonization simulates growth toward scattered attractor points, producing natural venation patterns for leaves, root systems, and tree canopies. The algorithm iteratively extends branches toward nearby attractors until all attractors are consumed.	17
Algorithm Overview:	17
1.2.3 Hybrid Growth Systems	18
Dendrite supports combining L-systems and space colonization for complex organic structures. Primary branches can be generated via L-system rules, with space colonization filling in fine detail between major branches. Alternatively, L-system structures can serve as initial branch networks that space colonization extends.	18
1.3 Data Structures	18
1.3.1 Branch Graph	18
The core data structure representing growth results is a directed acyclic graph of branch segments:	18
1.3.2 L-System Definition	19
1.3.3 Space Colonization Configuration	19
1.4 Rasterization Pipeline	21
The rasterization pipeline converts vector branch graphs into texture maps suitable for real-time rendering. All rasterization is GPU-accelerated using WebGL 2.0.	21
1.4.1 Output Maps	21
Distance Field: Encodes signed distance to nearest branch at each pixel. Computed using the Jump Flood Algorithm (JFA) for GPU efficiency. The distance field enables soft masking, edge detection, ambient occlusion approximation, and gradient-based effects.	21
Direction Field: Stores the tangent vector of the nearest branch segment at each pixel. Encoded as normalized 2D vector in RG channels. Used for anisotropic effects, flow-aligned detail, and directional blur.	21
Thickness Map: Branch width at each pixel, either from explicit thickness values or computed via flow accumulation (Strahler ordering). Single-channel grayscale output.	21
Depth/Height Map: If depth values are assigned during growth (e.g., from 3D L-system interpretation projected to 2D), this map encodes surface height for parallax and displacement effects.	21
ID Map: Unique identifier per branch segment, encoded as 24-bit color. Enables per-branch random variation in downstream processing.	21
1.4.2 Jump Flood Algorithm	21
The Jump Flood Algorithm computes distance fields in O(log n) passes regardless of geometric complexity:	21
1.4.3 Anti-Aliased Line Rendering	21
Branch segments are rendered as anti-aliased lines with variable thickness. For curved segments (Bezier splines from smoothed L-system output), adaptive tessellation generates sufficient line segments to maintain smoothness at target resolution.	21
Line rendering uses signed distance to line segment computed per-pixel in fragment shader, with smooth falloff for anti-aliasing. This approach handles arbitrary line widths and produces high-quality results suitable for further processing.	22
1.5 User Interface	22
1.5.1 Layout Overview	22
The application uses a three-panel layout optimized for iterative creative work:	22
1.5.2 L-System Editor	22
The L-system editor provides a structured interface for grammar definition:	22
1.5.3 Space Colonization Interface	22
The space colonization interface emphasizes visual, direct manipulation:	22
1.5.4 Canvas Interactions	22
1.6 Export Formats	22
1.6.1 Vector Exports	22
1.6.2 Raster Exports	23
1.6.3 Substrate Integration	23
One-click export to companion Substrate application creates a Substrate project file containing:	23
1.7 Technical Architecture	24
1.7.1 System Diagram	24
Dendrite follows a clean separation between computation and presentation:	24
1.7.2 Technology Stack	24
1.7.3 Performance Considerations	25
Part 2: Substrate Procedural Texture Tool	26
2.1 Product Overview	26
Substrate is a node-based procedural texture authoring application for creating tileable PBR materials. It provides a visual programming environment where artists connect processing nodes to build complex texture generation graphs. While general-purpose, Substrate is optimized for workflows involving organic materials and foliage, complementing Dendrite's growth simulation capabilities.	26
2.2 Node Graph Architecture	26
2.2.1 Execution Model	26
Substrate employs a dataflow execution model where texture data flows through connected nodes. The graph is a directed acyclic graph (DAG) with explicit data dependencies.	26
Graph Compilation: When the graph structure changes (node added, connection made), the system:	26
2.2.2 Data Types	26
Nodes communicate via typed connections. Type mismatches are prevented at connection time.	26
Implicit conversions are supported where lossless: Grayscale to Color (replicate to RGB), Color to RGBA (alpha = 1), Scalar to Grayscale (uniform fill).	27
2.2.3 Node Definition Interface	27
2.3 Node Library	29
2.3.1 Generator Nodes	29
Generators produce texture data from parameters alone, with no image inputs.	29
Noise Generators:	29
2.3.2 Filter Nodes	29
Filters transform input images through various operations.	29
Adjustment Filters:	29
2.3.3 Blend Nodes	30
Blend nodes combine multiple inputs using various compositing operations.	30
2.3.4 Utility Nodes	30
2.3.5 Input/Output Nodes	30
2.3.6 Scatter/Stamp Nodes	30
These nodes handle instanced placement of patterns, bridging the gap between pure shader operations and the instance-based stamping approach.	30
2.4 Shader Pipeline	31
2.4.1 Shader Compilation	31
Each node's shader is compiled once when the node type loads. Runtime parameter changes only update uniforms, avoiding recompilation.	31
Shaders follow a standard structure:	31
2.4.2 Framebuffer Management	31
The render pipeline manages a pool of framebuffers to minimize allocation overhead:	31
2.4.3 Tiling Considerations	31
All shaders assume tiling by default. Texture sampling uses GL_REPEAT wrap mode. Operations that could break tiling (edge-aware blur, non-tileable transforms) are explicitly marked and warn users.	31
For operations requiring neighbor sampling across tile boundaries, shaders manually wrap coordinates:	31
2.5 User Interface	31
2.5.1 Layout	32
Substrate uses a single-panel workflow centered on the node graph:	32
2.5.2 Node Graph Interactions	32
2.5.3 Parameter Controls	32
Parameters appear in the right sidebar when a node is selected:	32
2.5.4 Preview System	32
2.6 Project Format	32
2.6.1 Project Structure	32
Substrate projects are stored as JSON with embedded or referenced assets:	32
2.6.2 Export Options	33
2.7 Technical Architecture	34
2.7.1 System Diagram	34
2.7.2 Technology Stack	34
2.7.3 Performance Optimization	35
Part 3: Application Integration	36
3.1 Integration Philosophy	36
Dendrite and Substrate are designed as independent applications that work well together but don't require each other. Users may use Dendrite to export maps for use in Substance Designer, Photoshop, or game engines directly. Similarly, Substrate can import images from any source, not just Dendrite.	36
When used together, specific integration points reduce friction:	36
3.2 Export from Dendrite to Substrate	36
Dendrite provides a "Send to Substrate" action that:	36
3.3 File Format Compatibility	36
Both applications support common interchange formats:	36
3.4 Shared Components	36
Both applications share certain codebase elements to ensure consistency:	36
3.5 Deployment Options	36
Part 4: Implementation Roadmap	38
4.1 Phase 1: Dendrite Core (8 weeks)	38
Weeks 1-2: Foundation	38
Weeks 3-4: L-System Completion	38
Weeks 5-6: Space Colonization	38
Weeks 7-8: Rasterization	38
4.2 Phase 2: Substrate Core (8 weeks)	38
Weeks 1-2: Graph Editor	38
Weeks 3-4: Render Pipeline	38
Weeks 5-6: Node Library Foundation	38
Weeks 7-8: Output and Polish	39
4.3 Phase 3: Integration and Expansion (4 weeks)	39
Weeks 1-2: Integration	39
Weeks 3-4: Extended Node Library	39
4.4 Phase 4: Advanced Features (Ongoing)	39
Appendix A: L-System Grammar Reference	40
A.1 Formal Grammar	40
A.2 Example Grammars	40
Binary Tree:	40
Appendix B: Shader Code Examples	41
B.1 Perlin Noise Generator	41
B.2 Height to Normal Conversion	42
Appendix C: Glossary	43
— End of Document —	43
Executive Summary
This document specifies the complete technical design for two complementary browser-based creative applications: Dendrite, a growth simulation tool for procedural organic structures, and Substrate, a node-based procedural texture authoring system. Together, these applications provide a comprehensive workflow for creating high-quality foliage textures and organic materials.
Vision
The creative tools landscape lacks accessible, browser-based solutions for procedural organic content creation. Existing tools like Adobe Substance Designer are powerful but desktop-bound, expensive, and have steep learning curves. Game developers, technical artists, and hobbyists need lightweight, focused tools that excel at specific tasks.
Dendrite addresses the gap in organic growth simulation by providing intuitive interfaces for L-systems and space colonization algorithms. Substrate complements this by offering a streamlined texture composition workflow optimized for the outputs Dendrite produces.
Key Design Principles
Separation of Concerns: Two focused applications rather than one monolithic tool. Each app excels at its specific domain.
Browser-Native: No installation required. WebGL/WebGPU for GPU acceleration. Works on any modern device.
Real-Time Feedback: All parameter changes reflect immediately. Artists iterate visually, not through compile-wait cycles.
Interoperability: Standard formats (PNG, SVG, JSON) enable use with any existing pipeline. Deep integration between the two apps is optional, not required.
Progressive Complexity: Simple operations are simple. Advanced features are available but not in the way.
Target Users
Game developers creating foliage assets
Technical artists building procedural material libraries
Indie developers needing accessible texture tools
Digital artists exploring generative organic forms
Educators teaching procedural generation concepts
Part 1: Dendrite Growth Simulator
1.1 Product Overview
Dendrite is a specialized application for creating organic branching structures through algorithmic growth simulation. It implements two primary algorithms: L-systems for rule-based recursive structures, and space colonization for environment-responsive growth patterns.
The application produces vector representations of growth structures which can be exported directly or rasterized into texture maps suitable for use in game engines, 3D applications, or the companion Substrate application.
1.2 Core Algorithms
1.2.1 L-System Engine
Lindenmayer systems (L-systems) are parallel rewriting systems that generate complex structures through iterative application of production rules. Dendrite implements a comprehensive L-system interpreter supporting deterministic, stochastic, parametric, and context-sensitive grammars.
Alphabet and Symbols: The L-system operates on strings of symbols, each with semantic meaning during interpretation:


Production Rules: Rules define how symbols are replaced during each iteration. Dendrite supports multiple rule formats:
Deterministic rules apply unconditionally:
F → FF+[+F-F-F]-[-F+F+F]
Stochastic rules include probability weights:
F (0.33) → F[+F]F[-F]F
F (0.33) → F[+F]F
F (0.34) → F[-F]F
Parametric rules include numeric parameters:
A(s) → F(s)[+A(s*0.7)][-A(s*0.7)]
Context-sensitive rules consider neighboring symbols:
B < A > C → F[+A][-A]
Interpretation Parameters: Global parameters control the turtle graphics interpretation:
Angle (δ): Base rotation angle in degrees, typically 15-45° for natural branching
Step Length: Distance moved by F command, can decay per iteration
Length Decay: Multiplier applied to step length each iteration (0.8-0.95 typical)
Width: Initial line width for branch rendering
Width Decay: Multiplier for width on ! symbol or at branches
Angle Variance: Random deviation added to rotations for organic appearance
Iterations: Number of rule application passes (typically 3-7)
1.2.2 Space Colonization Algorithm
Space colonization simulates growth toward scattered attractor points, producing natural venation patterns for leaves, root systems, and tree canopies. The algorithm iteratively extends branches toward nearby attractors until all attractors are consumed.
Algorithm Overview:
Initialize attractor points within the growth region
Place initial branch node(s) at seed position(s)
For each iteration until no attractors remain:
Associate each attractor with its nearest branch node within attraction distance
For each branch node with associated attractors, compute normalized growth direction
Create new branch nodes at step distance in computed direction
Remove attractors within kill distance of any branch node
Compute branch thickness via flow accumulation (optional)
Core Parameters:
Attraction Distance: Maximum range at which attractors influence branch growth. Larger values create smoother, less detailed venation.
Kill Distance: Distance at which attractors are consumed. Smaller values create denser, more detailed branching.
Step Size: Distance branches grow per iteration. Affects resolution and computation time.
Growth Bias: Optional directional influence (e.g., upward for trees, outward for leaves).
Attractor Distribution Methods:
Uniform Random: Attractors scattered uniformly within a bounding region
Mask-Based: Attractor density controlled by grayscale mask image
Boundary-Weighted: Higher density near region edges for leaf venation
Clustered: Poisson disk or blue noise distribution for even spacing
Painted: User-defined attractor placement via brush tools
1.2.3 Hybrid Growth Systems
Dendrite supports combining L-systems and space colonization for complex organic structures. Primary branches can be generated via L-system rules, with space colonization filling in fine detail between major branches. Alternatively, L-system structures can serve as initial branch networks that space colonization extends.
1.3 Data Structures
1.3.1 Branch Graph
The core data structure representing growth results is a directed acyclic graph of branch segments:
interface BranchNode {
  id: string;
  position: Vector2;
  parent: string | null;
  children: string[];
  depth: number;           // Distance from root
  order: number;           // Strahler order for thickness
  attributes: {
    thickness: number;
    color: number;         // Gradient position 0-1
    age: number;           // Iteration when created
  };
}

interface BranchSegment {
  id: string;
  start: string;           // Node ID
  end: string;             // Node ID
  controlPoints?: Vector2[]; // For curved segments
}

interface BranchGraph {
  nodes: Map<string, BranchNode>;
  segments: Map<string, BranchSegment>;
  roots: string[];          // Root node IDs
  bounds: BoundingBox;
  metadata: {
    algorithm: 'lsystem' | 'colonization' | 'hybrid';
    parameters: AlgorithmParameters;
    createdAt: Date;
  };
}
1.3.2 L-System Definition
interface LSystemDefinition {
  axiom: string;
  rules: ProductionRule[];
  parameters: {
    angle: number;
    stepLength: number;
    lengthDecay: number;
    widthInitial: number;
    widthDecay: number;
    angleVariance: number;
    iterations: number;
  };
  interpretation: {
    mode: '2d' | '3d';
    startPosition: Vector2 | Vector3;
    startHeading: Vector2 | Vector3;
  };
}

interface ProductionRule {
  predecessor: string;
  successor: string;
  probability?: number;     // For stochastic rules
  condition?: string;       // For conditional rules
  leftContext?: string;     // For context-sensitive
  rightContext?: string;
}
1.3.3 Space Colonization Configuration
interface ColonizationConfig {
  attractors: {
    source: 'uniform' | 'mask' | 'boundary' | 'poisson' | 'painted';
    count: number;
    mask?: ImageData;       // For mask-based distribution
    region: BoundingBox | Path2D;
  };
  parameters: {
    attractionDistance: number;
    killDistance: number;
    stepSize: number;
    maxIterations: number;
    growthBias?: Vector2;
  };
  seeds: Vector2[];          // Initial branch positions
  thicknessMode: 'constant' | 'depth' | 'flow';
}
1.4 Rasterization Pipeline
The rasterization pipeline converts vector branch graphs into texture maps suitable for real-time rendering. All rasterization is GPU-accelerated using WebGL 2.0.
1.4.1 Output Maps
Distance Field: Encodes signed distance to nearest branch at each pixel. Computed using the Jump Flood Algorithm (JFA) for GPU efficiency. The distance field enables soft masking, edge detection, ambient occlusion approximation, and gradient-based effects.
Direction Field: Stores the tangent vector of the nearest branch segment at each pixel. Encoded as normalized 2D vector in RG channels. Used for anisotropic effects, flow-aligned detail, and directional blur.
Thickness Map: Branch width at each pixel, either from explicit thickness values or computed via flow accumulation (Strahler ordering). Single-channel grayscale output.
Depth/Height Map: If depth values are assigned during growth (e.g., from 3D L-system interpretation projected to 2D), this map encodes surface height for parallax and displacement effects.
ID Map: Unique identifier per branch segment, encoded as 24-bit color. Enables per-branch random variation in downstream processing.
1.4.2 Jump Flood Algorithm
The Jump Flood Algorithm computes distance fields in O(log n) passes regardless of geometric complexity:
Seed Pass: Rasterize branch centerlines. Each pixel on a branch stores its own coordinates as the "nearest seed."
JFA Passes: For step sizes [n/2, n/4, ..., 2, 1] where n is max dimension:
Each pixel samples 8 neighbors at current step distance
If neighbor has closer seed, adopt that seed
Write updated nearest-seed coordinates to output
Distance Pass: Compute actual distance from each pixel to its stored nearest seed.
For a 1024x1024 texture, JFA requires only 10 passes, each running in constant time per pixel on GPU.
1.4.3 Anti-Aliased Line Rendering
Branch segments are rendered as anti-aliased lines with variable thickness. For curved segments (Bezier splines from smoothed L-system output), adaptive tessellation generates sufficient line segments to maintain smoothness at target resolution.
Line rendering uses signed distance to line segment computed per-pixel in fragment shader, with smooth falloff for anti-aliasing. This approach handles arbitrary line widths and produces high-quality results suitable for further processing.
1.5 User Interface
1.5.1 Layout Overview
The application uses a three-panel layout optimized for iterative creative work:
Left Panel - Algorithm Configuration: Rule editor for L-systems or parameter controls for space colonization. Includes preset library and algorithm selection.
Center Panel - Canvas: Primary viewport showing growth visualization. Supports pan, zoom, and when using space colonization, attractor painting tools.
Right Panel - Output Configuration: Rasterization settings, export format selection, and preview of output maps.
1.5.2 L-System Editor
The L-system editor provides a structured interface for grammar definition:
Axiom input field with syntax highlighting
Rule list with add/remove/reorder capabilities
Per-rule probability slider for stochastic rules
Parameter sliders with real-time preview update
Iteration stepper to observe growth progression
Preset dropdown with common botanical patterns (fern, tree, bush, seaweed)
1.5.3 Space Colonization Interface
The space colonization interface emphasizes visual, direct manipulation:
Region definition via polygon drawing or mask image import
Attractor painting with adjustable brush size and density
Attractor eraser for refinement
Seed point placement by clicking
Real-time growth preview as parameters adjust
Step-by-step mode to observe colonization progression
1.5.4 Canvas Interactions
Mouse wheel: Zoom centered on cursor
Middle mouse drag: Pan viewport
Left click: Place seed (colonization) or select branch
Right click: Context menu with branch operations
Keyboard shortcuts for common operations
1.6 Export Formats
1.6.1 Vector Exports
SVG: Scalable vector graphics preserving full curve data. Includes metadata for branch attributes. Suitable for illustration, laser cutting, or further vector processing.
JSON Graph: Complete branch graph data structure serialized as JSON. Includes all node and segment data for custom processing pipelines.
1.6.2 Raster Exports
PNG Maps: Individual or combined export of distance, direction, thickness, depth, and ID maps at configurable resolution (256 to 8192 pixels).
PSD (Layered): All maps as separate layers in a Photoshop-compatible file.
EXR: High dynamic range format for distance fields requiring values beyond 0-1 range.
1.6.3 Substrate Integration
One-click export to companion Substrate application creates a Substrate project file containing:
All rasterized maps as node inputs
Suggested node graph for typical foliage processing
Original growth parameters for reference
1.7 Technical Architecture
1.7.1 System Diagram
Dendrite follows a clean separation between computation and presentation:
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (React)                                          │
│  ├── Algorithm Editor Components                           │
│  ├── Canvas (React-Konva or custom WebGL)                  │
│  ├── Parameter Controls                                    │
│  └── Export Interface                                      │
├─────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                 │
│  ├── Algorithm configuration                                │
│  ├── Branch graph                                          │
│  ├── Viewport state                                        │
│  └── Undo/redo history                                     │
├─────────────────────────────────────────────────────────────┤
│  Growth Engine (Web Worker)                                 │
│  ├── L-System Parser & Interpreter                         │
│  ├── Space Colonization Solver                             │
│  └── Branch Graph Builder                                  │
├─────────────────────────────────────────────────────────────┤
│  Rasterization Pipeline (WebGL 2.0)                         │
│  ├── Line Renderer                                         │
│  ├── Jump Flood Algorithm                                  │
│  ├── Map Generators (direction, thickness, ID)             │
│  └── Framebuffer Management                                │
└─────────────────────────────────────────────────────────────┘
1.7.2 Technology Stack


1.7.3 Performance Considerations
Web Worker Isolation: Growth algorithms run in dedicated Web Workers to prevent UI blocking during complex computations. Message passing communicates parameters and results.
Incremental Updates: For space colonization, results stream back iteration-by-iteration for real-time visualization. L-systems compute fully before transfer.
GPU Rasterization: All pixel-level operations use GPU shaders. The CPU never touches individual pixels in production paths.
Resolution Scaling: During interaction, rasterization occurs at reduced resolution (1/4 to 1/2). Full resolution renders on parameter release or explicit request.
Framebuffer Pooling: Reusable framebuffer pool prevents allocation churn during repeated rasterization.
Part 2: Substrate Procedural Texture Tool
2.1 Product Overview
Substrate is a node-based procedural texture authoring application for creating tileable PBR materials. It provides a visual programming environment where artists connect processing nodes to build complex texture generation graphs. While general-purpose, Substrate is optimized for workflows involving organic materials and foliage, complementing Dendrite's growth simulation capabilities.
2.2 Node Graph Architecture
2.2.1 Execution Model
Substrate employs a dataflow execution model where texture data flows through connected nodes. The graph is a directed acyclic graph (DAG) with explicit data dependencies.
Graph Compilation: When the graph structure changes (node added, connection made), the system:
Validates the graph for cycles and type compatibility
Performs topological sort to determine execution order
Allocates or reuses framebuffers for each node output
Compiles shader programs for nodes requiring GPU execution
Dirty Propagation: When a parameter changes:
Mark the affected node as dirty
Propagate dirty flag to all downstream nodes
Re-execute only dirty nodes in topological order
Clear dirty flags after execution
2.2.2 Data Types
Nodes communicate via typed connections. Type mismatches are prevented at connection time.


Implicit conversions are supported where lossless: Grayscale to Color (replicate to RGB), Color to RGBA (alpha = 1), Scalar to Grayscale (uniform fill).
2.2.3 Node Definition Interface
interface NodeDefinition {
  id: string;                    // Unique node type identifier
  name: string;                  // Display name
  category: NodeCategory;        // For node browser organization
  inputs: InputDefinition[];
  outputs: OutputDefinition[];
  parameters: ParameterDefinition[];
  
  // For GPU nodes
  shader?: {
    fragment: string;            // GLSL fragment shader source
    uniforms: UniformMapping[];  // Parameter to uniform mapping
  };
  
  // For CPU nodes (rare, used for I/O)
  execute?: (inputs: NodeInputs, params: ParamValues) => NodeOutputs;
}

interface InputDefinition {
  id: string;
  name: string;
  type: DataType;
  required: boolean;
  default?: DefaultValue;        // Used when not connected
}

interface ParameterDefinition {
  id: string;
  name: string;
  type: 'float' | 'int' | 'bool' | 'color' | 'enum' | 'curve';
  default: any;
  min?: number;
  max?: number;
  options?: EnumOption[];        // For enum type
}
2.3 Node Library
2.3.1 Generator Nodes
Generators produce texture data from parameters alone, with no image inputs.
Noise Generators:
Perlin Noise: Classic gradient noise with octaves, lacunarity, persistence controls
Simplex Noise: Improved gradient noise with fewer directional artifacts
Worley/Cellular: Cell-based noise with F1, F2, distance metric options
Value Noise: Interpolated random values, useful for smooth variation
Fractal Brownian Motion: Multi-octave noise composition
Gabor Noise: Oriented noise for anisotropic textures
Pattern Generators:
Brick: Configurable brick pattern with offset, gap, randomization
Tile: Regular grid with shape, rotation, scale variation
Hexagon: Hexagonal tiling with multiple layout options
Weave: Fabric weave patterns (plain, twill, satin)
Voronoi: Cell-based patterns with edge, cell, distance outputs
Shape Generators:
Rectangle: Rounded rectangle with configurable corner radius
Ellipse: Circle or ellipse with soft edges
Polygon: Regular n-gon with rotation
Star: Star shape with point count and inner radius
Gradient: Linear, radial, angular, or diamond gradients
2.3.2 Filter Nodes
Filters transform input images through various operations.
Adjustment Filters:
Levels: Black point, white point, gamma adjustment
Curves: Arbitrary transfer function via spline curve
HSL Adjust: Hue rotation, saturation, lightness modification
Invert: Invert values (1 - x)
Posterize: Reduce value levels for banding effects
Clamp: Restrict values to specified range
Blur Filters:
Gaussian Blur: Standard blur with configurable radius
Directional Blur: Blur along specified direction
Radial Blur: Circular blur around center point
Anisotropic Blur: Blur guided by direction field input
Morphological Filters:
Dilate: Expand bright regions
Erode: Shrink bright regions
Distance: Compute distance field from binary input
Edge Detect: Various edge detection algorithms
Distortion Filters:
Warp: Distort using direction field
Twirl: Spiral distortion around center
Spherize: Bulge or pinch effect
Displace: Offset pixels based on height map
Conversion Filters:
Normal from Height: Generate normal map from height field
Height from Normal: Integrate normal map to height (approximate)
Curvature: Extract curvature from normal map
Ambient Occlusion: Compute AO from height map
Gradient: Extract gradient magnitude and direction
2.3.3 Blend Nodes
Blend nodes combine multiple inputs using various compositing operations.
Standard Blends: Multiply, Screen, Overlay, Soft Light, Hard Light, Add, Subtract, Difference, Exclusion
Comparison Blends: Min (Darken), Max (Lighten)
Height Blend: Combine based on height values with adjustable contrast
Mask Blend: Interpolate between inputs using grayscale mask
Switch: Select input based on boolean or threshold
2.3.4 Utility Nodes
Tile: Repeat input n×m times
Transform: Scale, rotate, offset with tiling modes
Safe Transform: Transform with tiling-aware edge handling
Channel Split: Separate RGBA into individual channels
Channel Combine: Merge channels into single output
Sample Color: Apply color gradient based on grayscale input
Histogram Scan: Remap values based on histogram position
2.3.5 Input/Output Nodes
Image Input: Load external image file
Graph Input: Receive data from parent graph (for subgraphs)
Color Output: Designate as base color/albedo output
Normal Output: Designate as normal map output
Roughness Output: Designate as roughness output
Metallic Output: Designate as metallic output
Height Output: Designate as height/displacement output
AO Output: Designate as ambient occlusion output
2.3.6 Scatter/Stamp Nodes
These nodes handle instanced placement of patterns, bridging the gap between pure shader operations and the instance-based stamping approach.
Tile Sampler: Scatter an input pattern across a grid with per-instance randomization (position, rotation, scale, color). Uses GPU instancing internally.
Scatter: Place instances based on mask density. Poisson disk sampling prevents overlap.
Splatter: Random placement with adjustable count and variation. Simpler than Scatter for debris-like patterns.
Flood Fill: Fill regions of a mask with random colors for ID generation.
2.4 Shader Pipeline
2.4.1 Shader Compilation
Each node's shader is compiled once when the node type loads. Runtime parameter changes only update uniforms, avoiding recompilation.
Shaders follow a standard structure:
precision highp float;

uniform sampler2D u_input0;      // Connected inputs
uniform sampler2D u_input1;
uniform vec2 u_resolution;       // Output dimensions
uniform float u_param_blend;     // Node parameters

varying vec2 v_uv;

void main() {
    vec4 a = texture2D(u_input0, v_uv);
    vec4 b = texture2D(u_input1, v_uv);
    gl_FragColor = mix(a, b, u_param_blend);
}
2.4.2 Framebuffer Management
The render pipeline manages a pool of framebuffers to minimize allocation overhead:
Framebuffers are sized to the working resolution (default 1024×1024)
Nodes that no longer have downstream dependents release their framebuffers
Double-buffering handles nodes that read and write the same data
Format selection matches output data type (R8, RG8, RGBA8, or float variants)
2.4.3 Tiling Considerations
All shaders assume tiling by default. Texture sampling uses GL_REPEAT wrap mode. Operations that could break tiling (edge-aware blur, non-tileable transforms) are explicitly marked and warn users.
For operations requiring neighbor sampling across tile boundaries, shaders manually wrap coordinates:
vec2 sampleUV = fract(v_uv + offset); // Wraps 0-1
vec4 neighbor = texture2D(u_input, sampleUV);
2.5 User Interface
2.5.1 Layout
Substrate uses a single-panel workflow centered on the node graph:
Main Canvas: Node graph editor occupying the majority of screen space. Nodes are dragged from a sidebar or created via right-click menu.
Left Sidebar: Node browser organized by category. Search field for finding nodes by name.
Right Sidebar: Properties panel showing parameters for selected node. Preview thumbnail of node output.
Bottom Panel: 2D preview (tileable) and 3D preview (material on mesh) toggled via tabs.
2.5.2 Node Graph Interactions
Drag from node browser to create new node
Right-click canvas for context menu with node creation
Drag between output socket and input socket to connect
Click connection to select, Delete key to remove
Double-click node to rename
Ctrl+click to add node to selection
Drag selection box to select multiple nodes
Ctrl+G to group selected nodes into subgraph
Mouse wheel to zoom, middle-drag to pan
2.5.3 Parameter Controls
Parameters appear in the right sidebar when a node is selected:
Float/Int: Slider with numeric input field
Color: Color picker with hex input
Enum: Dropdown menu
Bool: Toggle switch
Curve: Interactive spline editor
All parameters support right-click to expose as graph input
2.5.4 Preview System
2D Preview: Shows selected node's output tiled 2×2 or 3×3 to verify seamlessness. Zoom and pan supported. Channel isolation toggles (R, G, B, A).
3D Preview: Material applied to configurable mesh (sphere, cube, plane, custom). Orbit camera. Environment lighting with HDRI support. Toggles for individual map channels.
2.6 Project Format
2.6.1 Project Structure
Substrate projects are stored as JSON with embedded or referenced assets:
{
  "version": "1.0",
  "name": "Oak Leaf Material",
  "resolution": 2048,
  "nodes": [
    {
      "id": "node_001",
      "type": "perlin_noise",
      "position": { "x": 100, "y": 200 },
      "parameters": {
        "scale": 4.0,
        "octaves": 6,
        "persistence": 0.5
      }
    },
    ...
  ],
  "connections": [
    {
      "from": { "node": "node_001", "output": "out" },
      "to": { "node": "node_002", "input": "height" }
    },
    ...
  ],
  "outputs": {
    "baseColor": "node_010",
    "normal": "node_011",
    "roughness": "node_012",
    "height": "node_013"
  },
  "assets": {
    "leaf_mask.png": "data:image/png;base64,..."
  }
}
2.6.2 Export Options
Texture Export: PNG or EXR for each designated output at configurable resolution. Batch export for all outputs with naming convention.
Material Preset: JSON containing only output file references and material metadata for game engine import.
Unreal/Unity Package: Platform-specific material import format with textures and material graph configuration.
2.7 Technical Architecture
2.7.1 System Diagram
┌─────────────────────────────────────────────────────────────┐
│  UI Layer (React)                                          │
│  ├── Node Graph Editor (React Flow)                        │
│  ├── Node Browser                                          │
│  ├── Properties Panel                                      │
│  └── Preview Panels (2D + Three.js 3D)                     │
├─────────────────────────────────────────────────────────────┤
│  State Management (Zustand)                                 │
│  ├── Graph structure (nodes, connections)                   │
│  ├── Node parameters                                       │
│  ├── Selection state                                       │
│  └── Undo/redo history                                     │
├─────────────────────────────────────────────────────────────┤
│  Graph Engine                                              │
│  ├── Topology analyzer (cycle detection, sort)             │
│  ├── Dirty propagation system                              │
│  ├── Type checker                                          │
│  └── Execution scheduler                                   │
├─────────────────────────────────────────────────────────────┤
│  Render Pipeline (WebGL 2.0)                                │
│  ├── Shader compiler/cache                                 │
│  ├── Framebuffer pool                                      │
│  ├── Node renderers                                        │
│  └── Export renderer (high-res)                            │
├─────────────────────────────────────────────────────────────┤
│  Node Library                                              │
│  ├── Built-in nodes (generators, filters, blends)          │
│  ├── Custom node loader                                    │
│  └── Subgraph support                                      │
└─────────────────────────────────────────────────────────────┘
2.7.2 Technology Stack


2.7.3 Performance Optimization
Lazy Evaluation: Only nodes with visible outputs (preview, output nodes) trigger computation. Disconnected subgraphs remain dormant.
Resolution Scaling: Working resolution can be lower than export resolution. Computation scales linearly with pixel count.
Shader Caching: Compiled shaders are cached by node type. Instance parameters use uniforms.
Texture Compression: Internal textures use appropriate formats. sRGB for color, linear for data maps.
Incremental Updates: Parameter changes only re-render affected subgraph, not entire graph.
Part 3: Application Integration
3.1 Integration Philosophy
Dendrite and Substrate are designed as independent applications that work well together but don't require each other. Users may use Dendrite to export maps for use in Substance Designer, Photoshop, or game engines directly. Similarly, Substrate can import images from any source, not just Dendrite.
When used together, specific integration points reduce friction:
3.2 Export from Dendrite to Substrate
Dendrite provides a "Send to Substrate" action that:
Rasterizes all configured output maps at target resolution
Creates a new Substrate project with Image Input nodes for each map
Optionally includes a starter graph appropriate for the growth type:
Leaf venation: Distance → Levels → Color gradient, plus normal/roughness derivation
Tree branches: Thickness-based color, bark detail overlay, ambient occlusion
Root system: Underground material setup with dirt integration
Opens Substrate in new tab or switches to existing instance
3.3 File Format Compatibility
Both applications support common interchange formats:
PNG: 8-bit and 16-bit per channel for all raster maps
EXR: HDR format for distance fields and precision-sensitive data
JSON: Project files use human-readable JSON for version control friendliness
3.4 Shared Components
Both applications share certain codebase elements to ensure consistency:
WebGL abstraction layer for framebuffer and shader management
Color space conversion utilities
File export/import handlers
Common UI components (color pickers, curve editors, sliders)
These are published as a shared npm package consumed by both applications.
3.5 Deployment Options
Standalone Web Apps: Each application deployed independently at separate URLs. Integration via file export/import or cross-tab communication.
Combined Workspace: Single application shell with tab-based interface hosting both editors. Shared project state enables tighter integration.
Electron Wrapper: Desktop application packaging for offline use, file system access, and native performance. Both apps bundled together.
Part 4: Implementation Roadmap
4.1 Phase 1: Dendrite Core (8 weeks)
Weeks 1-2: Foundation
Project setup: Vite, React, TypeScript, testing infrastructure
Basic canvas with pan/zoom
Simple L-system parser (deterministic rules only)
Turtle graphics interpreter (2D)
Canvas rendering of line segments
Weeks 3-4: L-System Completion
Stochastic rule support
Parametric rules
Context-sensitive rules
Parameter UI with real-time preview
Preset library for common patterns
Weeks 5-6: Space Colonization
Basic colonization algorithm
Attractor distribution methods
Web Worker execution
Iterative visualization
Region/mask definition tools
Weeks 7-8: Rasterization
WebGL setup and line rendering
Jump Flood Algorithm implementation
Distance, direction, thickness map generation
Export functionality (PNG, SVG, JSON)
4.2 Phase 2: Substrate Core (8 weeks)
Weeks 1-2: Graph Editor
React Flow integration
Custom node components
Connection type system
Basic node browser
Weeks 3-4: Render Pipeline
WebGL framebuffer management
Shader compilation system
Dirty propagation
Basic preview panels
Weeks 5-6: Node Library Foundation
Noise generators (Perlin, Worley, Simplex)
Adjustment filters (Levels, Curves, HSL)
Blend modes (common set)
Height to Normal conversion
Weeks 7-8: Output and Polish
Output node system
Export functionality
3D preview with Three.js
Project save/load
4.3 Phase 3: Integration and Expansion (4 weeks)
Weeks 1-2: Integration
Dendrite to Substrate export
Shared component library extraction
Cross-app communication
Starter graph templates
Weeks 3-4: Extended Node Library
Tile Sampler node
Additional generators (brick, hexagon, weave)
Morphological operations
Distortion filters
4.4 Phase 4: Advanced Features (Ongoing)
3D L-system interpretation
Hybrid growth systems
Custom node creation interface
Subgraph/function node support
Community preset sharing
Performance optimization (WebGPU)
Mobile/tablet support
Appendix A: L-System Grammar Reference
A.1 Formal Grammar
L-System       := Axiom Rules
Axiom          := Symbol+
Rules          := Rule+
Rule           := Context? Predecessor Condition? '->' Successor Weight?
Context        := Symbol '<' | '>' Symbol
Predecessor    := Symbol Parameters?
Successor      := (Symbol Parameters?)+
Parameters     := '(' Expression (',' Expression)* ')'
Weight         := '(' Number ')'
Condition      := ':' BoolExpression
Symbol         := [A-Za-z] | '+' | '-' | '[' | ']' | '!' | ...
A.2 Example Grammars
Binary Tree:
Axiom: F
Rules: F → F[+F][-F]
Angle: 30°
Iterations: 5
Fern:
Axiom: X
Rules:
  X → F+[[X]-X]-F[-FX]+X
  F → FF
Angle: 25°
Iterations: 6
Stochastic Bush:
Axiom: F
Rules:
  F (0.33) → F[+F]F[-F]F
  F (0.33) → F[+F]F
  F (0.34) → F[-F]F
Angle: 22.5°
Iterations: 4
Appendix B: Shader Code Examples
B.1 Perlin Noise Generator
precision highp float;

uniform vec2 u_resolution;
uniform float u_scale;
uniform int u_octaves;
uniform float u_persistence;
uniform float u_lacunarity;

varying vec2 v_uv;

// Permutation and gradient functions...

float perlin(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(grad(hash(i + vec2(0,0)), f - vec2(0,0)),
            grad(hash(i + vec2(1,0)), f - vec2(1,0)), u.x),
        mix(grad(hash(i + vec2(0,1)), f - vec2(0,1)),
            grad(hash(i + vec2(1,1)), f - vec2(1,1)), u.x),
        u.y);
}

void main() {
    vec2 p = v_uv * u_scale;
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for (int i = 0; i < 10; i++) {
        if (i >= u_octaves) break;
        value += amplitude * perlin(p * frequency);
        maxValue += amplitude;
        amplitude *= u_persistence;
        frequency *= u_lacunarity;
    }
    
    value = value / maxValue * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(value), 1.0);
}
B.2 Height to Normal Conversion
precision highp float;

uniform sampler2D u_height;
uniform vec2 u_resolution;
uniform float u_strength;

varying vec2 v_uv;

void main() {
    vec2 texel = 1.0 / u_resolution;
    
    float left  = texture2D(u_height, fract(v_uv - vec2(texel.x, 0))).r;
    float right = texture2D(u_height, fract(v_uv + vec2(texel.x, 0))).r;
    float down  = texture2D(u_height, fract(v_uv - vec2(0, texel.y))).r;
    float up    = texture2D(u_height, fract(v_uv + vec2(0, texel.y))).r;
    
    vec3 normal = normalize(vec3(
        (left - right) * u_strength,
        (down - up) * u_strength,
        1.0
    ));
    
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
}
Appendix C: Glossary



— End of Document —