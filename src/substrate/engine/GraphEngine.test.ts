import { describe, it, expect, beforeEach } from 'vitest'
import { GraphEngine } from './GraphEngine'
import type { NodeDefinition, GraphNode, GraphConnection, DataType } from '../../shared/types'

const createNodeDefinition = (overrides: Partial<NodeDefinition> = {}): NodeDefinition => ({
  id: 'test-node',
  name: 'Test Node',
  category: 'filter',
  inputs: [{ id: 'input1', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'output1', name: 'Output', type: 'grayscale' }],
  parameters: [],
  ...overrides,
})

const createGraphNode = (overrides: Partial<GraphNode> = {}): GraphNode => ({
  id: 'node-1',
  type: 'test-node',
  position: { x: 0, y: 0 },
  parameters: {},
  ...overrides,
})

describe('GraphEngine', () => {
  let engine: GraphEngine

  beforeEach(() => {
    engine = new GraphEngine()
  })

  describe('node definitions', () => {
    it('registerNodeDefinition stores definition', () => {
      const def = createNodeDefinition({ id: 'my-filter' })
      engine.registerNodeDefinition(def)

      expect(engine.getNodeDefinition('my-filter')).toBe(def)
    })

    it('getNodeDefinition retrieves registered definition', () => {
      const def = createNodeDefinition({ id: 'blur' })
      engine.registerNodeDefinition(def)

      const retrieved = engine.getNodeDefinition('blur')
      expect(retrieved).toEqual(def)
    })

    it('getNodeDefinition returns undefined for unknown type', () => {
      expect(engine.getNodeDefinition('unknown')).toBeUndefined()
    })

    it('getAllNodeDefinitions returns all registered definitions', () => {
      const def1 = createNodeDefinition({ id: 'node-a' })
      const def2 = createNodeDefinition({ id: 'node-b' })

      engine.registerNodeDefinition(def1)
      engine.registerNodeDefinition(def2)

      const all = engine.getAllNodeDefinitions()
      expect(all).toHaveLength(2)
      expect(all).toContain(def1)
      expect(all).toContain(def2)
    })
  })

  describe('node management', () => {
    beforeEach(() => {
      engine.registerNodeDefinition(createNodeDefinition())
    })

    it('addNode adds node to graph', () => {
      const node = createGraphNode({ id: 'my-node' })
      engine.addNode(node)

      expect(engine.getNodes().has('my-node')).toBe(true)
    })

    it('removeNode removes node and its connections', () => {
      const def1 = createNodeDefinition({
        id: 'type-a',
        outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
      })
      const def2 = createNodeDefinition({
        id: 'type-b',
        inputs: [{ id: 'in', name: 'Input', type: 'grayscale', required: true }],
      })
      engine.registerNodeDefinition(def1)
      engine.registerNodeDefinition(def2)

      const node1 = createGraphNode({ id: 'node-1', type: 'type-a' })
      const node2 = createGraphNode({ id: 'node-2', type: 'type-b' })

      engine.addNode(node1)
      engine.addNode(node2)

      const connection: GraphConnection = {
        id: 'conn-1',
        from: { node: 'node-1', output: 'out' },
        to: { node: 'node-2', input: 'in' },
      }
      engine.addConnection(connection)

      engine.removeNode('node-1')

      expect(engine.getNodes().has('node-1')).toBe(false)
      expect(engine.getConnections()).toHaveLength(0)
    })

    it('updateNodeParameter updates parameter value', () => {
      const node = createGraphNode({ id: 'node-1', parameters: { value: 10 } })
      engine.addNode(node)

      engine.updateNodeParameter('node-1', 'value', 20)

      expect(engine.getNodes().get('node-1')?.parameters.value).toBe(20)
    })

    it('updateNodeParameter marks node as dirty', () => {
      const node = createGraphNode({ id: 'node-1' })
      engine.addNode(node)
      engine.clearDirty()

      engine.updateNodeParameter('node-1', 'value', 20)

      expect(engine.getDirtyNodes()).toContain('node-1')
    })

    it('updateNodePosition updates node position', () => {
      const node = createGraphNode({ id: 'node-1', position: { x: 0, y: 0 } })
      engine.addNode(node)

      engine.updateNodePosition('node-1', { x: 100, y: 200 })

      expect(engine.getNodes().get('node-1')?.position).toEqual({ x: 100, y: 200 })
    })
  })

  describe('connection management', () => {
    beforeEach(() => {
      const sourceNode = createNodeDefinition({
        id: 'source',
        inputs: [],
        outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
      })
      const targetNode = createNodeDefinition({
        id: 'target',
        inputs: [{ id: 'in', name: 'Input', type: 'grayscale', required: true }],
        outputs: [],
      })
      engine.registerNodeDefinition(sourceNode)
      engine.registerNodeDefinition(targetNode)

      engine.addNode(createGraphNode({ id: 'source-1', type: 'source' }))
      engine.addNode(createGraphNode({ id: 'target-1', type: 'target' }))
    })

    it('addConnection creates valid connection', () => {
      const connection: GraphConnection = {
        id: 'conn-1',
        from: { node: 'source-1', output: 'out' },
        to: { node: 'target-1', input: 'in' },
      }

      const result = engine.addConnection(connection)

      expect(result).toBe(true)
      expect(engine.getConnections()).toHaveLength(1)
    })

    it('addConnection rejects connection with invalid nodes', () => {
      const connection: GraphConnection = {
        id: 'conn-1',
        from: { node: 'nonexistent', output: 'out' },
        to: { node: 'target-1', input: 'in' },
      }

      const result = engine.addConnection(connection)

      expect(result).toBe(false)
    })

    it('addConnection rejects connection with invalid ports', () => {
      const connection: GraphConnection = {
        id: 'conn-1',
        from: { node: 'source-1', output: 'nonexistent' },
        to: { node: 'target-1', input: 'in' },
      }

      const result = engine.addConnection(connection)

      expect(result).toBe(false)
    })

    it('removeConnection removes existing connection', () => {
      const connection: GraphConnection = {
        id: 'conn-1',
        from: { node: 'source-1', output: 'out' },
        to: { node: 'target-1', input: 'in' },
      }
      engine.addConnection(connection)

      engine.removeConnection('conn-1')

      expect(engine.getConnections()).toHaveLength(0)
    })

    it('replaces existing connection to same input', () => {
      engine.addNode(createGraphNode({ id: 'source-2', type: 'source' }))

      const conn1: GraphConnection = {
        id: 'conn-1',
        from: { node: 'source-1', output: 'out' },
        to: { node: 'target-1', input: 'in' },
      }
      const conn2: GraphConnection = {
        id: 'conn-2',
        from: { node: 'source-2', output: 'out' },
        to: { node: 'target-1', input: 'in' },
      }

      engine.addConnection(conn1)
      engine.addConnection(conn2)

      expect(engine.getConnections()).toHaveLength(1)
      expect(engine.getConnections()[0].id).toBe('conn-2')
    })
  })

  describe('type checking', () => {
    const setupTypedNodes = (fromType: DataType, toType: DataType) => {
      engine.registerNodeDefinition(
        createNodeDefinition({
          id: 'from-type',
          inputs: [],
          outputs: [{ id: 'out', name: 'Output', type: fromType }],
        })
      )
      engine.registerNodeDefinition(
        createNodeDefinition({
          id: 'to-type',
          inputs: [{ id: 'in', name: 'Input', type: toType, required: true }],
          outputs: [],
        })
      )
      engine.addNode(createGraphNode({ id: 'from', type: 'from-type' }))
      engine.addNode(createGraphNode({ id: 'to', type: 'to-type' }))
    }

    it('validates grayscale to grayscale connection', () => {
      setupTypedNodes('grayscale', 'grayscale')

      const result = engine.addConnection({
        id: 'conn',
        from: { node: 'from', output: 'out' },
        to: { node: 'to', input: 'in' },
      })

      expect(result).toBe(true)
    })

    it('validates color to color connection', () => {
      setupTypedNodes('color', 'color')

      const result = engine.addConnection({
        id: 'conn',
        from: { node: 'from', output: 'out' },
        to: { node: 'to', input: 'in' },
      })

      expect(result).toBe(true)
    })

    it('allows grayscale to color conversion', () => {
      setupTypedNodes('grayscale', 'color')

      const result = engine.addConnection({
        id: 'conn',
        from: { node: 'from', output: 'out' },
        to: { node: 'to', input: 'in' },
      })

      expect(result).toBe(true)
    })

    it('allows scalar to grayscale conversion', () => {
      setupTypedNodes('scalar', 'grayscale')

      const result = engine.addConnection({
        id: 'conn',
        from: { node: 'from', output: 'out' },
        to: { node: 'to', input: 'in' },
      })

      expect(result).toBe(true)
    })

    it('rejects incompatible type connections', () => {
      setupTypedNodes('vector2', 'grayscale')

      const result = engine.addConnection({
        id: 'conn',
        from: { node: 'from', output: 'out' },
        to: { node: 'to', input: 'in' },
      })

      expect(result).toBe(false)
    })

    it('rejects vector3 to color connection', () => {
      setupTypedNodes('vector3', 'color')

      const result = engine.addConnection({
        id: 'conn',
        from: { node: 'from', output: 'out' },
        to: { node: 'to', input: 'in' },
      })

      expect(result).toBe(false)
    })
  })

  describe('cycle detection', () => {
    beforeEach(() => {
      const nodeDef = createNodeDefinition({
        id: 'passthrough',
        inputs: [{ id: 'in', name: 'Input', type: 'grayscale', required: true }],
        outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
      })
      engine.registerNodeDefinition(nodeDef)
    })

    it('detects direct self-loop', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))

      const result = engine.addConnection({
        id: 'conn',
        from: { node: 'node-a', output: 'out' },
        to: { node: 'node-a', input: 'in' },
      })

      expect(result).toBe(false)
    })

    it('detects cycle through multiple nodes', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-b', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-c', type: 'passthrough' }))

      // A -> B -> C
      engine.addConnection({
        id: 'conn-1',
        from: { node: 'node-a', output: 'out' },
        to: { node: 'node-b', input: 'in' },
      })
      engine.addConnection({
        id: 'conn-2',
        from: { node: 'node-b', output: 'out' },
        to: { node: 'node-c', input: 'in' },
      })

      // Try to create C -> A (would create cycle)
      const result = engine.addConnection({
        id: 'conn-3',
        from: { node: 'node-c', output: 'out' },
        to: { node: 'node-a', input: 'in' },
      })

      expect(result).toBe(false)
    })

    it('allows DAG structures (no cycles)', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-b', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-c', type: 'passthrough' }))

      // A -> B, A -> C (diamond without cycle)
      const result1 = engine.addConnection({
        id: 'conn-1',
        from: { node: 'node-a', output: 'out' },
        to: { node: 'node-b', input: 'in' },
      })
      const result2 = engine.addConnection({
        id: 'conn-2',
        from: { node: 'node-a', output: 'out' },
        to: { node: 'node-c', input: 'in' },
      })

      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })
  })

  describe('execution order', () => {
    beforeEach(() => {
      const nodeDef = createNodeDefinition({
        id: 'passthrough',
        inputs: [{ id: 'in', name: 'Input', type: 'grayscale', required: false }],
        outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
      })
      engine.registerNodeDefinition(nodeDef)
    })

    it('computes topological order for execution', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-b', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-c', type: 'passthrough' }))

      // A -> B -> C
      engine.addConnection({
        id: 'conn-1',
        from: { node: 'node-a', output: 'out' },
        to: { node: 'node-b', input: 'in' },
      })
      engine.addConnection({
        id: 'conn-2',
        from: { node: 'node-b', output: 'out' },
        to: { node: 'node-c', input: 'in' },
      })

      const compiled = engine.compile()

      expect(compiled.executionOrder).toBeDefined()
      expect(compiled.executionOrder.indexOf('node-a')).toBeLessThan(
        compiled.executionOrder.indexOf('node-b')
      )
      expect(compiled.executionOrder.indexOf('node-b')).toBeLessThan(
        compiled.executionOrder.indexOf('node-c')
      )
    })

    it('upstream nodes execute before downstream nodes', () => {
      engine.addNode(createGraphNode({ id: 'source', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'middle', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'sink', type: 'passthrough' }))

      engine.addConnection({
        id: 'conn-1',
        from: { node: 'source', output: 'out' },
        to: { node: 'middle', input: 'in' },
      })
      engine.addConnection({
        id: 'conn-2',
        from: { node: 'middle', output: 'out' },
        to: { node: 'sink', input: 'in' },
      })

      const compiled = engine.compile()

      const sourceIdx = compiled.executionOrder.indexOf('source')
      const middleIdx = compiled.executionOrder.indexOf('middle')
      const sinkIdx = compiled.executionOrder.indexOf('sink')

      expect(sourceIdx).toBeLessThan(middleIdx)
      expect(middleIdx).toBeLessThan(sinkIdx)
    })
  })

  describe('dirty tracking', () => {
    beforeEach(() => {
      const nodeDef = createNodeDefinition({
        id: 'passthrough',
        inputs: [{ id: 'in', name: 'Input', type: 'grayscale', required: false }],
        outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
      })
      engine.registerNodeDefinition(nodeDef)
    })

    it('marks node dirty when parameter changes', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))
      engine.clearDirty()

      engine.updateNodeParameter('node-a', 'value', 42)

      expect(engine.getDirtyNodes()).toContain('node-a')
    })

    it('marks downstream nodes dirty when upstream changes', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-b', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-c', type: 'passthrough' }))

      engine.addConnection({
        id: 'conn-1',
        from: { node: 'node-a', output: 'out' },
        to: { node: 'node-b', input: 'in' },
      })
      engine.addConnection({
        id: 'conn-2',
        from: { node: 'node-b', output: 'out' },
        to: { node: 'node-c', input: 'in' },
      })
      engine.clearDirty()

      engine.updateNodeParameter('node-a', 'value', 42)

      const dirty = engine.getDirtyNodes()
      expect(dirty).toContain('node-a')
      expect(dirty).toContain('node-b')
      expect(dirty).toContain('node-c')
    })

    it('clearDirty clears all dirty nodes', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))
      engine.updateNodeParameter('node-a', 'value', 42)

      engine.clearDirty()

      expect(engine.getDirtyNodes()).toHaveLength(0)
    })
  })

  describe('serialization', () => {
    beforeEach(() => {
      engine.registerNodeDefinition(
        createNodeDefinition({
          id: 'passthrough',
          inputs: [{ id: 'in', name: 'Input', type: 'grayscale', required: false }],
          outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
        })
      )
    })

    it('serialize returns nodes and connections', () => {
      engine.addNode(createGraphNode({ id: 'node-a', type: 'passthrough' }))
      engine.addNode(createGraphNode({ id: 'node-b', type: 'passthrough' }))
      engine.addConnection({
        id: 'conn-1',
        from: { node: 'node-a', output: 'out' },
        to: { node: 'node-b', input: 'in' },
      })

      const data = engine.serialize()

      expect(data.nodes).toHaveLength(2)
      expect(data.connections).toHaveLength(1)
    })

    it('deserialize restores nodes and connections', () => {
      const data = {
        nodes: [
          createGraphNode({ id: 'node-a', type: 'passthrough' }),
          createGraphNode({ id: 'node-b', type: 'passthrough' }),
        ],
        connections: [
          {
            id: 'conn-1',
            from: { node: 'node-a', output: 'out' },
            to: { node: 'node-b', input: 'in' },
          },
        ],
      }

      engine.deserialize(data)

      expect(engine.getNodes().size).toBe(2)
      expect(engine.getConnections()).toHaveLength(1)
    })

    it('deserialize marks all nodes as dirty', () => {
      engine.deserialize({
        nodes: [createGraphNode({ id: 'node-a', type: 'passthrough' })],
        connections: [],
      })

      expect(engine.getDirtyNodes()).toContain('node-a')
    })
  })
})
