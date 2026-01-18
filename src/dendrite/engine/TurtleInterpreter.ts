// Turtle Graphics Interpreter for L-Systems

import type {
  Vector2,
  BranchNode,
  BranchSegment,
  BranchGraph,
  LSystemParameters,
  BoundingBox,
} from '../../shared/types';
import { generateId, degToRad, vec2Rotate, vec2Add, createBounds, expandBounds } from '../../shared/utils';

interface TurtleState {
  position: Vector2;
  heading: Vector2;
  width: number;
  depth: number;
  nodeId: string | null;
}

export class TurtleInterpreter {
  private params: LSystemParameters;
  private random: () => number;

  constructor(params: LSystemParameters, seed?: number) {
    this.params = params;
    this.random = seed !== undefined ? this.seededRandom(seed) : Math.random.bind(Math);
  }

  private seededRandom(seed: number): () => number {
    let s = seed;
    return () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };
  }

  interpret(lSystemString: string, startPos: Vector2 = { x: 0, y: 0 }): BranchGraph {
    const nodes = new Map<string, BranchNode>();
    const segments = new Map<string, BranchSegment>();
    const roots: string[] = [];
    let bounds: BoundingBox = createBounds();

    // Initial turtle state
    const initialState: TurtleState = {
      position: startPos,
      heading: { x: 0, y: -1 }, // Pointing up
      width: this.params.widthInitial,
      depth: 0,
      nodeId: null,
    };

    // Stack for push/pop operations
    const stack: TurtleState[] = [];
    let state = { ...initialState };
    let currentStepLength = this.params.stepLength;
    let age = 0;

    // Create root node
    const rootId = generateId();
    nodes.set(rootId, {
      id: rootId,
      position: { ...state.position },
      parent: null,
      children: [],
      depth: 0,
      order: 0,
      attributes: { thickness: state.width, color: 0, age: 0 },
    });
    roots.push(rootId);
    state.nodeId = rootId;
    bounds = expandBounds(bounds, state.position);

    // Parse and execute L-system string
    let i = 0;
    while (i < lSystemString.length) {
      const char = lSystemString[i];
      let param: number | null = null;

      // Check for parameter
      if (i + 1 < lSystemString.length && lSystemString[i + 1] === '(') {
        const closeIdx = lSystemString.indexOf(')', i);
        if (closeIdx > i) {
          param = parseFloat(lSystemString.substring(i + 2, closeIdx));
          i = closeIdx;
        }
      }

      switch (char) {
        case 'F':
        case 'G': {
          // Move forward and draw
          const stepLen = param ?? currentStepLength;
          const newPos = vec2Add(
            state.position,
            { x: state.heading.x * stepLen, y: state.heading.y * stepLen }
          );

          // Create new node
          const newNodeId = generateId();
          const newNode: BranchNode = {
            id: newNodeId,
            position: newPos,
            parent: state.nodeId,
            children: [],
            depth: state.depth,
            order: 0,
            attributes: {
              thickness: state.width,
              color: Math.min(1, state.depth * 0.1),
              age: age++,
            },
          };
          nodes.set(newNodeId, newNode);
          bounds = expandBounds(bounds, newPos);

          // Link to parent
          if (state.nodeId) {
            const parentNode = nodes.get(state.nodeId);
            if (parentNode) {
              parentNode.children.push(newNodeId);
            }
          }

          // Create segment
          if (state.nodeId) {
            const segmentId = generateId();
            segments.set(segmentId, {
              id: segmentId,
              start: state.nodeId,
              end: newNodeId,
            });
          }

          // Update state
          state.position = newPos;
          state.nodeId = newNodeId;
          break;
        }

        case 'f':
        case 'g': {
          // Move forward without drawing
          const stepLen = param ?? currentStepLength;
          state.position = vec2Add(
            state.position,
            { x: state.heading.x * stepLen, y: state.heading.y * stepLen }
          );
          state.nodeId = null;
          break;
        }

        case '+': {
          // Turn right
          const angle = param ?? this.params.angle;
          const variance = (this.random() - 0.5) * 2 * this.params.angleVariance;
          state.heading = vec2Rotate(state.heading, degToRad(angle + variance));
          break;
        }

        case '-': {
          // Turn left
          const angle = param ?? this.params.angle;
          const variance = (this.random() - 0.5) * 2 * this.params.angleVariance;
          state.heading = vec2Rotate(state.heading, degToRad(-angle - variance));
          break;
        }

        case '[': {
          // Push state
          stack.push({ ...state, position: { ...state.position }, heading: { ...state.heading } });
          state.depth++;
          state.width *= this.params.widthDecay;
          break;
        }

        case ']': {
          // Pop state
          if (stack.length > 0) {
            state = stack.pop()!;
          }
          break;
        }

        case '!': {
          // Decrease width
          state.width *= this.params.widthDecay;
          break;
        }

        case '|': {
          // Turn around (180 degrees)
          state.heading = vec2Rotate(state.heading, Math.PI);
          break;
        }

        case '@': {
          // Decrease step length
          if (param) {
            currentStepLength = param;
          } else {
            currentStepLength *= this.params.lengthDecay;
          }
          break;
        }

        case '#': {
          // Increase width
          state.width /= this.params.widthDecay;
          break;
        }

        case '&': {
          // Pitch down (3D, ignored in 2D)
          break;
        }

        case '^': {
          // Pitch up (3D, ignored in 2D)
          break;
        }

        case '\\': {
          // Roll left (3D, ignored in 2D)
          break;
        }

        case '/': {
          // Roll right (3D, ignored in 2D)
          break;
        }

        // Other symbols (like X, Y) are ignored during interpretation
        default:
          break;
      }

      i++;
    }

    // Calculate Strahler order for thickness
    this.calculateStrahlerOrder(nodes, roots);

    return {
      nodes,
      segments,
      roots,
      bounds,
      metadata: {
        algorithm: 'lsystem',
        parameters: this.params,
        createdAt: new Date(),
      },
    };
  }

  private calculateStrahlerOrder(
    nodes: Map<string, BranchNode>,
    roots: string[]
  ): void {
    // Bottom-up calculation of Strahler number
    const calculated = new Set<string>();

    const calculate = (nodeId: string): number => {
      if (calculated.has(nodeId)) {
        return nodes.get(nodeId)!.order;
      }

      const node = nodes.get(nodeId);
      if (!node) return 0;

      if (node.children.length === 0) {
        // Leaf node
        node.order = 1;
        calculated.add(nodeId);
        return 1;
      }

      // Calculate children orders
      const childOrders = node.children.map(childId => calculate(childId));

      // Strahler rule
      const maxOrder = Math.max(...childOrders);
      const countMax = childOrders.filter(o => o === maxOrder).length;

      if (countMax >= 2) {
        node.order = maxOrder + 1;
      } else {
        node.order = maxOrder;
      }

      calculated.add(nodeId);
      return node.order;
    };

    roots.forEach(rootId => calculate(rootId));

    // Update thickness based on order
    const maxOrder = Math.max(...Array.from(nodes.values()).map(n => n.order));
    nodes.forEach(node => {
      node.attributes.thickness = this.params.widthInitial * (node.order / maxOrder);
    });
  }
}
