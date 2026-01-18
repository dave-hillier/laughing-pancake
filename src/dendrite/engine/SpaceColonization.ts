// Space Colonization Algorithm for Growth Simulation

import type {
  Vector2,
  BranchNode,
  BranchSegment,
  BranchGraph,
  ColonizationConfig,
  BoundingBox,
} from '../../shared/types';
import {
  generateId,
  vec2Add,
  vec2Sub,
  vec2Scale,
  vec2Normalize,
  vec2Distance,
  createBounds,
  expandBounds,
} from '../../shared/utils';

interface Attractor {
  id: string;
  position: Vector2;
  active: boolean;
}

interface InternalNode {
  id: string;
  position: Vector2;
  parent: string | null;
  children: string[];
  influenceDirection: Vector2;
  influenceCount: number;
}

export class SpaceColonization {
  private config: ColonizationConfig;
  private attractors: Attractor[] = [];
  private nodes: Map<string, InternalNode> = new Map();
  private onProgress?: (iteration: number, graph: BranchGraph) => void;

  constructor(
    config: ColonizationConfig,
    onProgress?: (iteration: number, graph: BranchGraph) => void
  ) {
    this.config = config;
    this.onProgress = onProgress;
    this.initializeAttractors();
    this.initializeSeeds();
  }

  private initializeAttractors(): void {
    const { source, count, region, mask } = this.config.attractors;

    switch (source) {
      case 'uniform':
        this.generateUniformAttractors(count, region);
        break;
      case 'mask':
        if (mask) {
          this.generateMaskAttractors(count, region, mask);
        } else {
          this.generateUniformAttractors(count, region);
        }
        break;
      case 'boundary':
        this.generateBoundaryAttractors(count, region);
        break;
      case 'poisson':
        this.generatePoissonAttractors(count, region);
        break;
      case 'painted':
        // Attractors added externally via addAttractor
        break;
    }
  }

  private generateUniformAttractors(count: number, region: BoundingBox): void {
    const width = region.max.x - region.min.x;
    const height = region.max.y - region.min.y;

    for (let i = 0; i < count; i++) {
      this.attractors.push({
        id: generateId(),
        position: {
          x: region.min.x + Math.random() * width,
          y: region.min.y + Math.random() * height,
        },
        active: true,
      });
    }
  }

  private generateMaskAttractors(
    count: number,
    region: BoundingBox,
    mask: ImageData
  ): void {
    const width = region.max.x - region.min.x;
    const height = region.max.y - region.min.y;
    let placed = 0;
    let attempts = 0;
    const maxAttempts = count * 10;

    while (placed < count && attempts < maxAttempts) {
      const x = Math.random() * width;
      const y = Math.random() * height;

      // Sample mask at this position
      const maskX = Math.floor((x / width) * mask.width);
      const maskY = Math.floor((y / height) * mask.height);
      const idx = (maskY * mask.width + maskX) * 4;
      const density = mask.data[idx] / 255;

      if (Math.random() < density) {
        this.attractors.push({
          id: generateId(),
          position: { x: region.min.x + x, y: region.min.y + y },
          active: true,
        });
        placed++;
      }
      attempts++;
    }
  }

  private generateBoundaryAttractors(count: number, region: BoundingBox): void {
    const width = region.max.x - region.min.x;
    const height = region.max.y - region.min.y;
    const cx = (region.min.x + region.max.x) / 2;
    const cy = (region.min.y + region.max.y) / 2;
    const radius = Math.min(width, height) / 2;

    for (let i = 0; i < count; i++) {
      // Bias toward edges
      const angle = Math.random() * Math.PI * 2;
      const r = radius * (0.6 + Math.random() * 0.4);

      this.attractors.push({
        id: generateId(),
        position: {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        },
        active: true,
      });
    }
  }

  private generatePoissonAttractors(count: number, region: BoundingBox): void {
    // Simple Poisson disk sampling approximation
    const width = region.max.x - region.min.x;
    const height = region.max.y - region.min.y;
    const minDist = Math.sqrt((width * height) / count) * 0.8;

    const points: Vector2[] = [];
    const active: Vector2[] = [];

    // Start with random point
    const initial = {
      x: region.min.x + Math.random() * width,
      y: region.min.y + Math.random() * height,
    };
    points.push(initial);
    active.push(initial);

    while (active.length > 0 && points.length < count) {
      const idx = Math.floor(Math.random() * active.length);
      const point = active[idx];
      let found = false;

      for (let attempt = 0; attempt < 30; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = minDist + Math.random() * minDist;
        const candidate = {
          x: point.x + Math.cos(angle) * dist,
          y: point.y + Math.sin(angle) * dist,
        };

        if (
          candidate.x < region.min.x ||
          candidate.x > region.max.x ||
          candidate.y < region.min.y ||
          candidate.y > region.max.y
        ) {
          continue;
        }

        let valid = true;
        for (const p of points) {
          if (vec2Distance(p, candidate) < minDist) {
            valid = false;
            break;
          }
        }

        if (valid) {
          points.push(candidate);
          active.push(candidate);
          found = true;
          break;
        }
      }

      if (!found) {
        active.splice(idx, 1);
      }
    }

    this.attractors = points.map(p => ({
      id: generateId(),
      position: p,
      active: true,
    }));
  }

  private initializeSeeds(): void {
    for (const seedPos of this.config.seeds) {
      const id = generateId();
      this.nodes.set(id, {
        id,
        position: seedPos,
        parent: null,
        children: [],
        influenceDirection: { x: 0, y: 0 },
        influenceCount: 0,
      });
    }
  }

  addAttractor(position: Vector2): void {
    this.attractors.push({
      id: generateId(),
      position,
      active: true,
    });
  }

  removeAttractorsInRadius(center: Vector2, radius: number): void {
    this.attractors = this.attractors.filter(
      a => vec2Distance(a.position, center) > radius
    );
  }

  run(): BranchGraph {
    const { attractionDistance, killDistance, stepSize, maxIterations, growthBias } =
      this.config.parameters;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Check if any attractors remain
      const activeAttractors = this.attractors.filter(a => a.active);
      if (activeAttractors.length === 0) break;

      // Reset influence on all nodes
      this.nodes.forEach(node => {
        node.influenceDirection = { x: 0, y: 0 };
        node.influenceCount = 0;
      });

      // Associate attractors with nearest nodes
      for (const attractor of activeAttractors) {
        let closestNode: InternalNode | undefined = undefined;
        let closestDist = Infinity;

        for (const node of this.nodes.values()) {
          const dist = vec2Distance(node.position, attractor.position);
          if (dist < attractionDistance && dist < closestDist) {
            closestDist = dist;
            closestNode = node;
          }
        }

        if (closestNode) {
          const dir = vec2Normalize(
            vec2Sub(attractor.position, closestNode.position)
          );
          closestNode.influenceDirection = vec2Add(
            closestNode.influenceDirection,
            dir
          );
          closestNode.influenceCount++;
        }
      }

      // Grow new branches from influenced nodes
      const newNodes: InternalNode[] = [];

      this.nodes.forEach(node => {
        if (node.influenceCount > 0) {
          let growDir = vec2Normalize(node.influenceDirection);

          // Add growth bias if specified
          if (growthBias) {
            growDir = vec2Normalize(
              vec2Add(growDir, vec2Scale(growthBias, 0.3))
            );
          }

          const newPos = vec2Add(node.position, vec2Scale(growDir, stepSize));
          const newId = generateId();

          newNodes.push({
            id: newId,
            position: newPos,
            parent: node.id,
            children: [],
            influenceDirection: { x: 0, y: 0 },
            influenceCount: 0,
          });

          node.children.push(newId);
        }
      });

      // Add new nodes
      for (const node of newNodes) {
        this.nodes.set(node.id, node);
      }

      // Remove attractors within kill distance of any node
      for (const attractor of activeAttractors) {
        for (const node of this.nodes.values()) {
          if (vec2Distance(node.position, attractor.position) < killDistance) {
            attractor.active = false;
            break;
          }
        }
      }

      // Report progress
      if (this.onProgress && iteration % 5 === 0) {
        this.onProgress(iteration, this.buildGraph());
      }
    }

    return this.buildGraph();
  }

  private buildGraph(): BranchGraph {
    const branchNodes = new Map<string, BranchNode>();
    const segments = new Map<string, BranchSegment>();
    const roots: string[] = [];
    let bounds: BoundingBox = createBounds();

    // Convert internal nodes to branch nodes
    this.nodes.forEach((node, id) => {
      const depth = this.calculateDepth(id);
      branchNodes.set(id, {
        id,
        position: node.position,
        parent: node.parent,
        children: node.children,
        depth,
        order: 0,
        attributes: {
          thickness: 1,
          color: Math.min(1, depth * 0.1),
          age: 0,
        },
      });
      bounds = expandBounds(bounds, node.position);

      if (node.parent === null) {
        roots.push(id);
      }
    });

    // Create segments
    this.nodes.forEach(node => {
      if (node.parent) {
        const segmentId = generateId();
        segments.set(segmentId, {
          id: segmentId,
          start: node.parent,
          end: node.id,
        });
      }
    });

    // Calculate Strahler order
    this.calculateStrahlerOrder(branchNodes, roots);

    // Update thickness based on order or flow
    this.updateThickness(branchNodes, roots);

    return {
      nodes: branchNodes,
      segments,
      roots,
      bounds,
      metadata: {
        algorithm: 'colonization',
        parameters: this.config.parameters,
        createdAt: new Date(),
      },
    };
  }

  private calculateDepth(nodeId: string): number {
    let depth = 0;
    let current = this.nodes.get(nodeId);
    while (current?.parent) {
      depth++;
      current = this.nodes.get(current.parent);
    }
    return depth;
  }

  private calculateStrahlerOrder(
    nodes: Map<string, BranchNode>,
    roots: string[]
  ): void {
    const calculated = new Set<string>();

    const calculate = (nodeId: string): number => {
      if (calculated.has(nodeId)) {
        return nodes.get(nodeId)!.order;
      }

      const node = nodes.get(nodeId);
      if (!node) return 0;

      if (node.children.length === 0) {
        node.order = 1;
        calculated.add(nodeId);
        return 1;
      }

      const childOrders = node.children.map(childId => calculate(childId));
      const maxOrder = Math.max(...childOrders);
      const countMax = childOrders.filter(o => o === maxOrder).length;

      node.order = countMax >= 2 ? maxOrder + 1 : maxOrder;
      calculated.add(nodeId);
      return node.order;
    };

    roots.forEach(rootId => calculate(rootId));
  }

  private updateThickness(
    nodes: Map<string, BranchNode>,
    _roots: string[]
  ): void {
    const { thicknessMode } = this.config;

    if (thicknessMode === 'constant') {
      nodes.forEach(node => {
        node.attributes.thickness = 1;
      });
    } else if (thicknessMode === 'depth') {
      const maxDepth = Math.max(...Array.from(nodes.values()).map(n => n.depth));
      nodes.forEach(node => {
        node.attributes.thickness = 1 - node.depth / (maxDepth + 1);
      });
    } else if (thicknessMode === 'flow') {
      // Flow accumulation (Strahler)
      const maxOrder = Math.max(...Array.from(nodes.values()).map(n => n.order));
      nodes.forEach(node => {
        node.attributes.thickness = node.order / maxOrder;
      });
    }
  }

  getAttractors(): Attractor[] {
    return this.attractors;
  }

  getNodes(): Map<string, InternalNode> {
    return this.nodes;
  }
}
