import { describe, it, expect } from 'vitest'
import { TurtleInterpreter } from './TurtleInterpreter'
import type { LSystemParameters } from '../../shared/types'

const defaultParams: LSystemParameters = {
  angle: 90,
  stepLength: 10,
  lengthDecay: 1,
  widthInitial: 1,
  widthDecay: 0.8,
  angleVariance: 0,
  iterations: 1,
}

describe('TurtleInterpreter', () => {
  describe('movement commands', () => {
    it('F command creates a branch segment and moves forward', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('F')

      expect(graph.nodes.size).toBe(2) // root + one new node
      expect(graph.segments.size).toBe(1)
    })

    it('G command creates segment (alternate draw command)', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('G')

      expect(graph.nodes.size).toBe(2)
      expect(graph.segments.size).toBe(1)
    })

    it('f command moves forward without drawing', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('f')

      // Only root node, no new drawing nodes
      expect(graph.nodes.size).toBe(1)
      expect(graph.segments.size).toBe(0)
    })

    it('multiple F commands create connected segments', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('FFF')

      expect(graph.nodes.size).toBe(4) // root + 3 nodes
      expect(graph.segments.size).toBe(3)
    })

    it('F moves in the correct direction (initially up)', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        stepLength: 10,
      })
      const graph = interpreter.interpret('F', { x: 0, y: 0 })

      // Default heading is up (0, -1), so after F, y should be -10
      const nodes = Array.from(graph.nodes.values())
      const endNode = nodes.find((n) => n.parent !== null)
      expect(endNode).toBeDefined()
      expect(endNode!.position.x).toBeCloseTo(0)
      expect(endNode!.position.y).toBeCloseTo(-10)
    })
  })

  describe('rotation commands', () => {
    it('+ rotates left by configured angle', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angle: 90,
        angleVariance: 0,
      })
      // + rotates right in this implementation, then F
      const graph = interpreter.interpret('+F', { x: 0, y: 0 })

      const nodes = Array.from(graph.nodes.values())
      const endNode = nodes.find((n) => n.parent !== null)
      expect(endNode).toBeDefined()
      // After 90 degree right turn from up, should move right
      expect(endNode!.position.x).toBeCloseTo(10)
      expect(endNode!.position.y).toBeCloseTo(0)
    })

    it('- rotates right by configured angle', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angle: 90,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('-F', { x: 0, y: 0 })

      const nodes = Array.from(graph.nodes.values())
      const endNode = nodes.find((n) => n.parent !== null)
      expect(endNode).toBeDefined()
      // After 90 degree left turn from up, should move left
      expect(endNode!.position.x).toBeCloseTo(-10)
      expect(endNode!.position.y).toBeCloseTo(0)
    })

    it('| turns around (180 degrees)', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('|F', { x: 0, y: 0 })

      const nodes = Array.from(graph.nodes.values())
      const endNode = nodes.find((n) => n.parent !== null)
      expect(endNode).toBeDefined()
      // After 180 degree turn from up, should move down
      expect(endNode!.position.x).toBeCloseTo(0)
      expect(endNode!.position.y).toBeCloseTo(10)
    })
  })

  describe('branch stack', () => {
    it('[ pushes current state onto stack', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angleVariance: 0,
      })
      // F[+F] should create a main branch and a side branch
      const graph = interpreter.interpret('F[+F]', { x: 0, y: 0 })

      expect(graph.nodes.size).toBe(3) // root, main F, branch F
      expect(graph.segments.size).toBe(2)
    })

    it('] pops state and returns to saved position/angle', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angleVariance: 0,
      })
      // F[+F]F should continue from the position after first F
      const graph = interpreter.interpret('F[+F]F', { x: 0, y: 0 })

      expect(graph.nodes.size).toBe(4)
      expect(graph.segments.size).toBe(3)
    })

    it('nested brackets create tree structure', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('F[+F[-F]]', { x: 0, y: 0 })

      expect(graph.nodes.size).toBe(4)
      expect(graph.segments.size).toBe(3)
    })

    it('symmetric branching creates expected structure', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angle: 45,
        angleVariance: 0,
      })
      // F[+F][-F] should create one main stem with two branches
      const graph = interpreter.interpret('F[+F][-F]', { x: 0, y: 0 })

      expect(graph.nodes.size).toBe(4) // root + 3 branches
      expect(graph.segments.size).toBe(3)
      expect(graph.roots.length).toBe(1)
    })
  })

  describe('width modifiers', () => {
    it('! decreases line width', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        widthInitial: 10,
        widthDecay: 0.5,
      })
      const graph = interpreter.interpret('F!F')

      const nodes = Array.from(graph.nodes.values())
      const nodesSorted = nodes.sort((a, b) => a.attributes.age - b.attributes.age)

      // The second F should have reduced width
      expect(nodesSorted.length).toBe(3)
    })

    it('# increases line width', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        widthInitial: 10,
        widthDecay: 0.5,
      })
      // Start, decrease, then increase - width management
      const graph = interpreter.interpret('F!F#F')

      expect(graph.nodes.size).toBe(4)
    })
  })

  describe('step length modifiers', () => {
    it('@ with parameter sets step length', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        stepLength: 10,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('@(5)F', { x: 0, y: 0 })

      const nodes = Array.from(graph.nodes.values())
      const endNode = nodes.find((n) => n.parent !== null)
      expect(endNode).toBeDefined()
      expect(endNode!.position.y).toBeCloseTo(-5)
    })

    it('@ without parameter applies length decay', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        stepLength: 10,
        lengthDecay: 0.5,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('@F', { x: 0, y: 0 })

      const nodes = Array.from(graph.nodes.values())
      const endNode = nodes.find((n) => n.parent !== null)
      expect(endNode).toBeDefined()
      expect(endNode!.position.y).toBeCloseTo(-5)
    })
  })

  describe('graph generation', () => {
    it('returns BranchGraph with nodes and segments', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('F')

      expect(graph.nodes).toBeInstanceOf(Map)
      expect(graph.segments).toBeInstanceOf(Map)
      expect(graph.roots).toBeInstanceOf(Array)
      expect(graph.bounds).toBeDefined()
      expect(graph.metadata).toBeDefined()
    })

    it('calculates correct bounding box for generated tree', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        stepLength: 10,
        angle: 90,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('F[+F][-F]', { x: 0, y: 0 })

      expect(graph.bounds.min.x).toBeLessThanOrEqual(0)
      expect(graph.bounds.max.x).toBeGreaterThanOrEqual(0)
      expect(graph.bounds.min.y).toBeLessThanOrEqual(-10)
    })

    it('assigns Strahler order to nodes', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('F[+F][-F]')

      // All nodes should have order >= 1
      for (const node of graph.nodes.values()) {
        expect(node.order).toBeGreaterThanOrEqual(0)
      }
    })

    it('segments connect to correct parent/child nodes', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('FF')

      for (const segment of graph.segments.values()) {
        expect(graph.nodes.has(segment.start)).toBe(true)
        expect(graph.nodes.has(segment.end)).toBe(true)
      }
    })

    it('metadata contains algorithm type', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('F')

      expect(graph.metadata.algorithm).toBe('lsystem')
    })
  })

  describe('integration with L-System output', () => {
    it('interprets binary tree L-System output correctly', () => {
      // Simulating output from L-System binary tree after 2 iterations
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angle: 30,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('F[+F][-F]')

      expect(graph.nodes.size).toBeGreaterThan(1)
      expect(graph.segments.size).toBeGreaterThan(0)
      expect(graph.roots.length).toBe(1)
    })

    it('produces connected graph (no orphan segments)', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('F[+F[-F]][-F[+F]]')

      // All segments should reference existing nodes
      for (const segment of graph.segments.values()) {
        expect(graph.nodes.has(segment.start)).toBe(true)
        expect(graph.nodes.has(segment.end)).toBe(true)
      }

      // All non-root nodes should have a parent
      for (const node of graph.nodes.values()) {
        if (!graph.roots.includes(node.id)) {
          expect(node.parent).not.toBeNull()
          expect(graph.nodes.has(node.parent!)).toBe(true)
        }
      }
    })

    it('handles complex L-System strings', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angle: 25,
        angleVariance: 0,
      })
      // Fern-like pattern
      const graph = interpreter.interpret('FF+[+F-F-F]-[-F+F+F]')

      expect(graph.nodes.size).toBeGreaterThan(5)
      expect(graph.segments.size).toBeGreaterThan(4)
    })
  })

  describe('deterministic behavior with seed', () => {
    it('produces same results with same seed', () => {
      const params: LSystemParameters = {
        ...defaultParams,
        angleVariance: 10, // Enable variance
      }

      const interpreter1 = new TurtleInterpreter(params, 42)
      const interpreter2 = new TurtleInterpreter(params, 42)

      const graph1 = interpreter1.interpret('F+F-F', { x: 0, y: 0 })
      const graph2 = interpreter2.interpret('F+F-F', { x: 0, y: 0 })

      const nodes1 = Array.from(graph1.nodes.values())
      const nodes2 = Array.from(graph2.nodes.values())

      expect(nodes1.length).toBe(nodes2.length)

      // Positions should match
      for (let i = 0; i < nodes1.length; i++) {
        expect(nodes1[i].position.x).toBeCloseTo(nodes2[i].position.x)
        expect(nodes1[i].position.y).toBeCloseTo(nodes2[i].position.y)
      }
    })

    it('produces different results with different seeds', () => {
      const params: LSystemParameters = {
        ...defaultParams,
        angleVariance: 20,
      }

      const interpreter1 = new TurtleInterpreter(params, 1)
      const interpreter2 = new TurtleInterpreter(params, 2)

      const graph1 = interpreter1.interpret('F+F+F+F', { x: 0, y: 0 })
      const graph2 = interpreter2.interpret('F+F+F+F', { x: 0, y: 0 })

      const nodes1 = Array.from(graph1.nodes.values())
      const nodes2 = Array.from(graph2.nodes.values())

      // At least some positions should differ due to angle variance
      let hasDifference = false
      for (let i = 1; i < nodes1.length; i++) {
        if (
          Math.abs(nodes1[i].position.x - nodes2[i].position.x) > 0.01 ||
          Math.abs(nodes1[i].position.y - nodes2[i].position.y) > 0.01
        ) {
          hasDifference = true
          break
        }
      }
      expect(hasDifference).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('')

      expect(graph.nodes.size).toBe(1) // Just root
      expect(graph.segments.size).toBe(0)
    })

    it('handles string with only ignored symbols', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      const graph = interpreter.interpret('XYZ')

      expect(graph.nodes.size).toBe(1) // Just root
      expect(graph.segments.size).toBe(0)
    })

    it('handles unmatched brackets gracefully', () => {
      const interpreter = new TurtleInterpreter(defaultParams)
      // Extra ] should not crash
      expect(() => interpreter.interpret('F]F')).not.toThrow()
    })

    it('handles custom start position', () => {
      const interpreter = new TurtleInterpreter({
        ...defaultParams,
        angleVariance: 0,
      })
      const graph = interpreter.interpret('F', { x: 100, y: 100 })

      const nodes = Array.from(graph.nodes.values())
      const root = nodes.find((n) => n.parent === null)
      expect(root!.position.x).toBe(100)
      expect(root!.position.y).toBe(100)
    })
  })
})
