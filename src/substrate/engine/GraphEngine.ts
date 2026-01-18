// Substrate Graph Engine - Manages node graph execution

import type {
  NodeDefinition,
  GraphNode,
  GraphConnection,
  DataType,
} from '../../shared/types';

export interface CompiledGraph {
  executionOrder: string[];
  nodeMap: Map<string, GraphNode>;
  connectionMap: Map<string, GraphConnection[]>;
  inputMap: Map<string, Map<string, string>>; // nodeId -> inputId -> sourceNodeId
}

export class GraphEngine {
  private nodeDefinitions: Map<string, NodeDefinition> = new Map();
  private nodes: Map<string, GraphNode> = new Map();
  private connections: GraphConnection[] = [];
  private compiledGraph: CompiledGraph | null = null;
  private dirtyNodes: Set<string> = new Set();

  registerNodeDefinition(definition: NodeDefinition): void {
    this.nodeDefinitions.set(definition.id, definition);
  }

  getNodeDefinition(typeId: string): NodeDefinition | undefined {
    return this.nodeDefinitions.get(typeId);
  }

  getAllNodeDefinitions(): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values());
  }

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    this.invalidateCompilation();
    this.markDirty(node.id);
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    // Remove associated connections
    this.connections = this.connections.filter(
      c => c.from.node !== nodeId && c.to.node !== nodeId
    );
    this.invalidateCompilation();
  }

  updateNodeParameter(nodeId: string, paramId: string, value: unknown): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.parameters[paramId] = value;
      this.markDirty(nodeId);
    }
  }

  updateNodePosition(nodeId: string, position: { x: number; y: number }): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.position = position;
    }
  }

  addConnection(connection: GraphConnection): boolean {
    // Validate connection
    if (!this.validateConnection(connection)) {
      return false;
    }

    // Remove existing connection to the same input
    this.connections = this.connections.filter(
      c => !(c.to.node === connection.to.node && c.to.input === connection.to.input)
    );

    this.connections.push(connection);
    this.invalidateCompilation();
    this.markDirty(connection.to.node);

    return true;
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.find(c => c.id === connectionId);
    if (connection) {
      this.connections = this.connections.filter(c => c.id !== connectionId);
      this.invalidateCompilation();
      this.markDirty(connection.to.node);
    }
  }

  private validateConnection(connection: GraphConnection): boolean {
    const fromNode = this.nodes.get(connection.from.node);
    const toNode = this.nodes.get(connection.to.node);

    if (!fromNode || !toNode) return false;

    const fromDef = this.nodeDefinitions.get(fromNode.type);
    const toDef = this.nodeDefinitions.get(toNode.type);

    if (!fromDef || !toDef) return false;

    const fromOutput = fromDef.outputs.find(o => o.id === connection.from.output);
    const toInput = toDef.inputs.find(i => i.id === connection.to.input);

    if (!fromOutput || !toInput) return false;

    // Check type compatibility
    if (!this.areTypesCompatible(fromOutput.type, toInput.type)) {
      return false;
    }

    // Check for cycles
    if (this.wouldCreateCycle(connection)) {
      return false;
    }

    return true;
  }

  private areTypesCompatible(from: DataType, to: DataType): boolean {
    if (from === to) return true;

    // Implicit conversions
    const conversions: Record<DataType, DataType[]> = {
      grayscale: ['color', 'rgba'],
      color: ['rgba'],
      rgba: [],
      scalar: ['grayscale', 'color', 'rgba'],
      vector2: [],
      vector3: [],
    };

    return conversions[from]?.includes(to) || false;
  }

  private wouldCreateCycle(newConnection: GraphConnection): boolean {
    // DFS to check if adding this connection creates a cycle
    const visited = new Set<string>();
    const stack: string[] = [newConnection.from.node];

    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (nodeId === newConnection.to.node) {
        return true; // Cycle detected
      }

      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      // Find all nodes that feed into this node
      for (const conn of this.connections) {
        if (conn.to.node === nodeId) {
          stack.push(conn.from.node);
        }
      }
    }

    return false;
  }

  compile(): CompiledGraph {
    if (this.compiledGraph) {
      return this.compiledGraph;
    }

    const nodeMap = new Map(this.nodes);
    const connectionMap = new Map<string, GraphConnection[]>();
    const inputMap = new Map<string, Map<string, string>>();

    // Build connection maps
    for (const connection of this.connections) {
      // Output connections (what this node feeds)
      if (!connectionMap.has(connection.from.node)) {
        connectionMap.set(connection.from.node, []);
      }
      connectionMap.get(connection.from.node)!.push(connection);

      // Input connections (what feeds this node)
      if (!inputMap.has(connection.to.node)) {
        inputMap.set(connection.to.node, new Map());
      }
      inputMap.get(connection.to.node)!.set(connection.to.input, connection.from.node);
    }

    // Topological sort
    const executionOrder = this.topologicalSort();

    this.compiledGraph = {
      executionOrder,
      nodeMap,
      connectionMap,
      inputMap,
    };

    return this.compiledGraph;
  }

  private topologicalSort(): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    // Initialize
    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, 0);
      adjacency.set(nodeId, []);
    }

    // Build graph
    for (const connection of this.connections) {
      const fromId = connection.from.node;
      const toId = connection.to.node;

      adjacency.get(fromId)!.push(toId);
      inDegree.set(toId, (inDegree.get(toId) || 0) + 1);
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    const result: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      for (const neighbor of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  private invalidateCompilation(): void {
    this.compiledGraph = null;
  }

  markDirty(nodeId: string): void {
    this.dirtyNodes.add(nodeId);

    // Propagate to downstream nodes
    const visited = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);

      this.dirtyNodes.add(current);

      // Find downstream nodes
      for (const connection of this.connections) {
        if (connection.from.node === current) {
          stack.push(connection.to.node);
        }
      }
    }
  }

  getDirtyNodes(): string[] {
    return Array.from(this.dirtyNodes);
  }

  clearDirty(): void {
    this.dirtyNodes.clear();
  }

  getNodes(): Map<string, GraphNode> {
    return this.nodes;
  }

  getConnections(): GraphConnection[] {
    return this.connections;
  }

  serialize(): { nodes: GraphNode[]; connections: GraphConnection[] } {
    return {
      nodes: Array.from(this.nodes.values()),
      connections: this.connections,
    };
  }

  deserialize(data: { nodes: GraphNode[]; connections: GraphConnection[] }): void {
    this.nodes.clear();
    this.connections = [];

    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
    }

    for (const connection of data.connections) {
      this.connections.push(connection);
    }

    this.invalidateCompilation();
    this.nodes.forEach((_, id) => this.markDirty(id));
  }
}
