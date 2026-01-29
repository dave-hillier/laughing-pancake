# Unit Test Plan for Dendrite & Substrate

## Overview

This document outlines a comprehensive unit testing strategy for the laughing-pancake codebase. The plan focuses on **behavior-driven tests** that verify high-level functionality without coupling to implementation details.

**Guiding Principles:**
- Test **what** the code does, not **how** it does it
- Test public APIs and observable outputs
- Use property-based testing where appropriate
- Avoid testing private methods or internal state directly
- Tests should survive refactoring if behavior stays the same

---

## Test Framework Setup

### Recommended Stack
- **Vitest** - Fast, Vite-native test runner with TypeScript support
- **@testing-library/react** - For React component tests (if needed later)
- **happy-dom** or **jsdom** - DOM environment for any DOM-dependent tests
- **vitest-webgl-canvas-mock** or custom mocks - For WebGL context mocking

### Installation
```bash
npm install -D vitest @vitest/coverage-v8 happy-dom
```

### Configuration (vitest.config.ts)
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts']
    }
  }
})
```

---

## Test Organization

```
src/
├── shared/
│   ├── utils/
│   │   └── utils.test.ts
│   ├── types/
│   │   └── types.test.ts          # Type guard tests if any
│   └── webgl/
│       ├── ShaderProgram.test.ts
│       ├── Framebuffer.test.ts
│       └── WebGLRenderer.test.ts
├── dendrite/
│   ├── engine/
│   │   ├── LSystemParser.test.ts
│   │   ├── TurtleInterpreter.test.ts
│   │   ├── SpaceColonization.test.ts
│   │   └── Rasterizer.test.ts
│   └── store/
│       └── dendriteStore.test.ts
└── substrate/
    ├── engine/
    │   ├── GraphEngine.test.ts
    │   └── ShaderPipeline.test.ts
    ├── nodes/
    │   ├── generators.test.ts
    │   ├── filters.test.ts
    │   ├── blends.test.ts
    │   └── ...
    └── store/
        └── substrateStore.test.ts
```

---

## Priority 1: Core Utility Functions

### File: `src/shared/utils/utils.test.ts`

These pure functions are foundational and easy to test first.

#### Math Utilities
```typescript
describe('clamp', () => {
  it('returns value when within range')
  it('returns min when value is below range')
  it('returns max when value is above range')
  it('handles edge case where min equals max')
})

describe('lerp', () => {
  it('returns start value when t is 0')
  it('returns end value when t is 1')
  it('returns midpoint when t is 0.5')
  it('extrapolates beyond range when t > 1 or t < 0')
})

describe('degToRad / radToDeg', () => {
  it('converts common angles correctly (0, 90, 180, 360)')
  it('roundtrips preserve value: radToDeg(degToRad(x)) ≈ x')
})
```

#### Vector2 Operations
```typescript
describe('vec2Add', () => {
  it('adds two vectors component-wise')
  it('handles zero vectors')
  it('handles negative components')
})

describe('vec2Sub', () => {
  it('subtracts vectors component-wise')
  it('subtracting same vector yields zero vector')
})

describe('vec2Scale', () => {
  it('scales vector by positive scalar')
  it('scales vector by zero yields zero vector')
  it('scales vector by negative scalar inverts direction')
})

describe('vec2Normalize', () => {
  it('returns unit vector in same direction')
  it('normalized vector has length 1')
  it('handles zero vector gracefully')
})

describe('vec2Rotate', () => {
  it('rotates 90 degrees clockwise correctly')
  it('rotating 360 degrees returns original vector')
  it('rotating zero degrees returns original vector')
})

describe('vec2Distance', () => {
  it('returns 0 for same point')
  it('computes correct Euclidean distance')
  it('distance is symmetric: d(a,b) = d(b,a)')
})

describe('vec2Dot', () => {
  it('perpendicular vectors have dot product of 0')
  it('parallel vectors have dot product equal to product of lengths')
  it('is commutative: a·b = b·a')
})

describe('vec2Length', () => {
  it('unit vectors have length 1')
  it('zero vector has length 0')
  it('computes correct magnitude')
})
```

#### Bounds Operations
```typescript
describe('createBounds', () => {
  it('creates bounds from single point')
  it('min and max are equal for single point')
})

describe('expandBounds', () => {
  it('expands to include point outside current bounds')
  it('does not change bounds for point already inside')
  it('handles negative coordinates')
})

describe('boundsCenter', () => {
  it('returns geometric center of bounds')
  it('center of unit bounds at origin is (0.5, 0.5)')
})

describe('boundsSize', () => {
  it('returns width and height of bounds')
  it('empty bounds (min=max) has zero size')
})
```

#### ID Generation
```typescript
describe('generateId', () => {
  it('generates unique IDs across multiple calls')
  it('returns non-empty string')
})
```

---

## Priority 2: L-System Parser

### File: `src/dendrite/engine/LSystemParser.test.ts`

Test the grammar parsing and string rewriting system.

#### Basic Parsing
```typescript
describe('LSystemParser', () => {
  describe('deterministic rules', () => {
    it('applies single rule for one iteration', () => {
      // axiom: 'A', rule: A -> AB
      // after 1 iteration: 'AB'
    })

    it('applies rules recursively over multiple iterations', () => {
      // axiom: 'A', rules: A -> AB, B -> A
      // iteration 0: A
      // iteration 1: AB
      // iteration 2: ABA
      // iteration 3: ABAAB
    })

    it('preserves symbols without matching rules')

    it('handles empty axiom')

    it('handles rules that produce empty string')
  })

  describe('stochastic rules', () => {
    it('selects from multiple rules for same predecessor', () => {
      // With same seed, should produce deterministic results
    })

    it('respects probability weights when provided')

    it('produces different results with different seeds')

    it('produces same results with same seed')
  })

  describe('parametric rules', () => {
    it('passes parameters through rule application')
    it('evaluates parameter expressions')
  })

  describe('context-sensitive rules', () => {
    it('applies rules based on left context')
    it('applies rules based on right context')
    it('applies rules based on both contexts')
    it('falls back to context-free rule when context does not match')
  })

  describe('presets', () => {
    it('binary tree preset produces valid L-System string')
    it('fern preset produces valid L-System string')
    it('all presets can be parsed without errors')
  })
})
```

---

## Priority 3: Turtle Interpreter

### File: `src/dendrite/engine/TurtleInterpreter.test.ts`

Test turtle graphics interpretation and branch graph generation.

#### Command Interpretation
```typescript
describe('TurtleInterpreter', () => {
  describe('movement commands', () => {
    it('F command creates a branch segment and moves forward')
    it('G command creates segment (alternate draw command)')
    it('f command moves forward without drawing')
    it('g command moves forward without drawing (alternate)')
  })

  describe('rotation commands', () => {
    it('+ rotates left by configured angle')
    it('- rotates right by configured angle')
    it('| turns around (180 degrees)')
  })

  describe('branch stack', () => {
    it('[ pushes current state onto stack')
    it('] pops state and returns to saved position/angle')
    it('nested brackets create tree structure')
  })

  describe('width modifiers', () => {
    it('! decreases line width')
    it('# increases line width')
  })

  describe('angle modifiers', () => {
    it('@ decreases turning angle')
    it('other angle modifiers work correctly')
  })

  describe('graph generation', () => {
    it('returns BranchGraph with nodes and segments')
    it('calculates correct bounding box for generated tree')
    it('assigns Strahler order to segments for natural thickness')
    it('segments connect to correct parent/child nodes')
  })

  describe('integration with L-System output', () => {
    it('interprets binary tree L-System output correctly', () => {
      // Parse L-System, interpret result, verify reasonable graph
    })

    it('produces connected graph (no orphan segments)')
  })
})
```

---

## Priority 4: Space Colonization Algorithm

### File: `src/dendrite/engine/SpaceColonization.test.ts`

Test the space colonization growth algorithm.

#### Attractor Management
```typescript
describe('SpaceColonization', () => {
  describe('attractor generation', () => {
    it('generates uniform attractors within bounds')
    it('generates attractors using Poisson disk sampling')
    it('respects attractor count configuration')
    it('uses boundary-based placement when configured')
  })

  describe('attractor manipulation', () => {
    it('addAttractor adds attractor at specified position')
    it('removeAttractorsInRadius removes attractors within radius')
    it('getAttractors returns current attractor list')
  })

  describe('seed management', () => {
    it('grows branches from configured seed positions')
    it('multiple seeds create multiple growth origins')
  })

  describe('growth algorithm', () => {
    it('produces BranchGraph after running', () => {
      // Should have nodes and segments
    })

    it('branches grow toward attractors')

    it('attractors are killed when reached (kill distance)')

    it('respects maximum iterations')

    it('calls onProgress callback during iteration')

    it('produces deterministic results with same seed')
  })

  describe('thickness modes', () => {
    it('constant mode gives uniform thickness')
    it('depth mode varies thickness by tree depth')
    it('flow mode uses Strahler order for thickness')
  })

  describe('output', () => {
    it('returns valid BranchGraph compatible with Rasterizer')
    it('graph bounds contain all nodes')
    it('all segments reference valid nodes')
  })
})
```

---

## Priority 5: Graph Engine (Substrate)

### File: `src/substrate/engine/GraphEngine.test.ts`

Test the node graph execution engine.

#### Node Definition Management
```typescript
describe('GraphEngine', () => {
  describe('node definitions', () => {
    it('registerNodeDefinition stores definition')
    it('getNodeDefinition retrieves registered definition')
    it('getNodeDefinition returns undefined for unknown type')
    it('getAllNodeDefinitions returns all registered definitions')
  })

  describe('node management', () => {
    it('addNode adds node to graph')
    it('removeNode removes node and its connections')
    it('updateNodeParameter updates parameter value')
    it('updateNodeParameter marks node as dirty')
  })

  describe('connection management', () => {
    it('addConnection creates valid connection')
    it('addConnection rejects connection with type mismatch')
    it('addConnection rejects connection creating cycle')
    it('removeConnection removes existing connection')
  })

  describe('type checking', () => {
    it('validates grayscale to grayscale connection')
    it('validates color to color connection')
    it('rejects incompatible type connections')
    it('allows connections where type coercion is valid')
  })

  describe('cycle detection', () => {
    it('detects direct self-loop')
    it('detects cycle through multiple nodes')
    it('allows DAG structures (no cycles)')
  })

  describe('execution order', () => {
    it('computes topological order for execution')
    it('upstream nodes execute before downstream nodes')
  })

  describe('dirty tracking', () => {
    it('marks node dirty when parameter changes')
    it('marks downstream nodes dirty when upstream changes')
    it('clean nodes are not marked for re-execution')
  })
})
```

---

## Priority 6: Node Definitions

### File: `src/substrate/nodes/generators.test.ts`

Test generator node definitions.

```typescript
describe('Generator Nodes', () => {
  describe('Perlin Noise', () => {
    it('has correct input/output port definitions')
    it('defines required parameters (scale, octaves, etc.)')
    it('shader function produces valid GLSL')
  })

  describe('Voronoi', () => {
    it('has correct input/output port definitions')
    it('defines cell scale and distance type parameters')
  })

  describe('Gradient', () => {
    it('supports linear and radial gradient types')
    it('has start/end color parameters')
  })

  describe('Checkerboard', () => {
    it('has scale parameter')
    it('produces alternating pattern')
  })

  // Test each generator node similarly
})
```

### File: `src/substrate/nodes/filters.test.ts`

```typescript
describe('Filter Nodes', () => {
  describe('Levels', () => {
    it('has input port for source image')
    it('has output port')
    it('defines input/output level parameters')
  })

  describe('Blur', () => {
    it('has radius parameter')
    it('supports different blur types if applicable')
  })

  describe('Edge Detection', () => {
    it('has input and output ports')
    it('defines threshold parameters')
  })

  describe('Normal Map', () => {
    it('converts height to normal map')
    it('has strength parameter')
  })
})
```

### File: `src/substrate/nodes/blends.test.ts`

```typescript
describe('Blend Nodes', () => {
  describe('Blend', () => {
    it('has two input ports (foreground, background)')
    it('has one output port')
    it('defines blend mode parameter')
    it('defines opacity parameter')
  })

  // Test that each blend mode is available
  it('supports add blend mode')
  it('supports multiply blend mode')
  it('supports screen blend mode')
  it('supports overlay blend mode')
})
```

---

## Priority 7: WebGL Abstractions

### File: `src/shared/webgl/ShaderProgram.test.ts`

Tests require WebGL context mocking.

```typescript
describe('ShaderProgram', () => {
  // These tests need a mocked WebGL2 context

  describe('compilation', () => {
    it('compiles valid vertex and fragment shaders')
    it('throws on invalid shader source')
    it('reports shader compilation errors')
  })

  describe('uniforms', () => {
    it('setUniform1f sets float uniform')
    it('setUniform2f sets vec2 uniform')
    it('setUniform3f sets vec3 uniform')
    it('setUniform4f sets vec4 uniform')
    it('setUniformMatrix4fv sets mat4 uniform')
    it('setUniform1i sets integer uniform')
  })

  describe('attributes', () => {
    it('getAttribLocation returns valid location')
    it('enables vertex attribute array')
  })

  describe('lifecycle', () => {
    it('use() activates the program')
    it('dispose() releases WebGL resources')
  })
})
```

### File: `src/shared/webgl/Framebuffer.test.ts`

```typescript
describe('Framebuffer', () => {
  describe('creation', () => {
    it('creates framebuffer with specified dimensions')
    it('supports various texture formats (R8, RGBA8, R16F, etc.)')
    it('validates framebuffer completeness')
  })

  describe('binding', () => {
    it('bind() makes framebuffer active render target')
    it('unbind() restores default framebuffer')
  })

  describe('texture access', () => {
    it('getTexture() returns the attached texture')
    it('texture can be bound for reading')
  })

  describe('resize', () => {
    it('resize() changes framebuffer dimensions')
    it('preserves format after resize')
  })

  describe('disposal', () => {
    it('dispose() releases framebuffer and texture')
  })
})
```

### File: `src/shared/webgl/WebGLRenderer.test.ts`

```typescript
describe('WebGLRenderer', () => {
  describe('initialization', () => {
    it('creates WebGL2 context from canvas')
    it('getContext() returns the WebGL context')
    it('getCanvas() returns the source canvas')
  })

  describe('viewport', () => {
    it('resize() updates viewport dimensions')
    it('clear() clears with specified color')
  })

  describe('shader management', () => {
    it('createShader() returns ShaderProgram')
    it('caches shaders by key to avoid recompilation')
    it('returns cached shader for same key')
  })

  describe('framebuffer management', () => {
    it('createFramebuffer() returns Framebuffer')
    it('supports framebuffer pooling')
  })
})
```

---

## Priority 8: Zustand Stores

### File: `src/dendrite/store/dendriteStore.test.ts`

Test store actions and state transitions.

```typescript
describe('dendriteStore', () => {
  beforeEach(() => {
    // Reset store to initial state
  })

  describe('algorithm selection', () => {
    it('setAlgorithmType switches between L-System and colonization')
    it('switching preserves unrelated state')
  })

  describe('L-System parameters', () => {
    it('setAxiom updates axiom string')
    it('addRule adds production rule')
    it('updateRule modifies existing rule')
    it('removeRule deletes rule')
    it('setLSystemParam updates numeric parameters')
    it('loadLSystemPreset loads preset configuration')
  })

  describe('colonization parameters', () => {
    it('setColonizationParam updates colonization settings')
    it('setAttractorSource changes attractor generation mode')
    it('addSeed adds growth seed point')
    it('setThicknessMode changes thickness calculation')
  })

  describe('viewport', () => {
    it('setViewportPan updates pan position')
    it('setViewportZoom updates zoom level')
    it('setViewportMode changes interaction mode')
  })

  describe('undo/redo', () => {
    it('undo reverts last action')
    it('redo reapplies undone action')
    it('undo/redo stack has correct depth')
  })

  describe('generation', () => {
    it('generate() triggers algorithm execution')
    it('generation updates branchGraph in state')
  })
})
```

### File: `src/substrate/store/substrateStore.test.ts`

```typescript
describe('substrateStore', () => {
  beforeEach(() => {
    // Reset store to initial state
  })

  describe('node operations', () => {
    it('addNode creates node with unique ID')
    it('removeNode deletes node and its connections')
    it('updateNodePosition moves node')
    it('updateNodeParameter changes parameter value')
  })

  describe('connection operations', () => {
    it('addConnection creates valid connection')
    it('addConnection fails for invalid connection')
    it('removeConnection deletes connection')
  })

  describe('selection', () => {
    it('selectNode sets selected node ID')
    it('selectNode with null clears selection')
    it('setHoveredNode updates hover state')
  })

  describe('viewport', () => {
    it('setViewportPan updates pan')
    it('setViewportZoom updates zoom')
  })

  describe('project management', () => {
    it('newProject resets to initial state')
    it('loadProject restores saved state')
    it('getProjectData returns serializable project')
  })
})
```

---

## Test Implementation Order

### Phase 1: Foundation (Week 1)
1. Set up Vitest and configuration
2. Implement `utils.test.ts` - all utility functions
3. Implement basic `LSystemParser.test.ts` - deterministic rules

### Phase 2: Core Algorithms (Week 2)
4. Complete `LSystemParser.test.ts` - stochastic, parametric, context-sensitive
5. Implement `TurtleInterpreter.test.ts`
6. Implement `SpaceColonization.test.ts`

### Phase 3: Substrate Engine (Week 3)
7. Implement `GraphEngine.test.ts`
8. Implement node definition tests (generators, filters, blends)

### Phase 4: WebGL & Stores (Week 4)
9. Set up WebGL mocking strategy
10. Implement WebGL abstraction tests
11. Implement store tests

---

## Coverage Goals

| Module | Target Coverage |
|--------|-----------------|
| `shared/utils` | 100% |
| `dendrite/engine/LSystemParser` | 95% |
| `dendrite/engine/TurtleInterpreter` | 90% |
| `dendrite/engine/SpaceColonization` | 85% |
| `substrate/engine/GraphEngine` | 95% |
| `substrate/nodes/*` | 80% |
| `shared/webgl/*` | 70% |
| `*/store/*` | 80% |

**Overall Target: 85% line coverage**

---

## Testing Best Practices

### Do
- Test observable behavior and outputs
- Use descriptive test names that explain the expected behavior
- Keep tests independent - each test should set up its own state
- Use factory functions for test data creation
- Test edge cases and error conditions
- Use `toBeCloseTo()` for floating-point comparisons

### Don't
- Don't test private methods directly
- Don't rely on test execution order
- Don't test implementation details (internal variable names, etc.)
- Don't mock everything - prefer testing real behavior
- Don't write tests that pass regardless of implementation

### Example Test Structure
```typescript
describe('ComponentName', () => {
  describe('methodOrBehavior', () => {
    it('does expected thing when given valid input', () => {
      // Arrange
      const input = createTestInput()

      // Act
      const result = component.method(input)

      // Assert
      expect(result).toEqual(expectedOutput)
    })

    it('handles edge case appropriately', () => {
      // ...
    })

    it('throws error for invalid input', () => {
      expect(() => component.method(invalidInput)).toThrow()
    })
  })
})
```

---

## Mocking Strategy

### What to Mock
- WebGL context and related APIs
- DOM APIs when testing in Node
- `Math.random()` for deterministic tests (use seeded random)
- Timers if testing animations/delays

### What NOT to Mock
- The code under test
- Pure utility functions
- Simple data structures
- Internal collaborators unless necessary for isolation

### WebGL Mock Example
```typescript
// test/mocks/webgl.ts
export function createMockWebGL2Context(): WebGL2RenderingContext {
  return {
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    useProgram: vi.fn(),
    // ... other methods as needed
  } as unknown as WebGL2RenderingContext
}
```

---

## Continuous Integration

Add to GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

---

## Summary

This plan provides a comprehensive roadmap for adding unit tests to the Dendrite & Substrate codebase. The approach prioritizes:

1. **Pure functions first** - Utilities are easiest to test and provide immediate confidence
2. **Core algorithms second** - L-System, Turtle, Space Colonization are the heart of Dendrite
3. **Graph engine third** - Critical for Substrate's node-based workflow
4. **WebGL and stores last** - Require more setup but are still important

By following this plan, the codebase will have a solid foundation of tests that verify behavior without locking in implementation details, enabling confident refactoring and feature development.
