import { describe, it, expect, vi } from 'vitest'
import { SpaceColonization } from './SpaceColonization'
import type { ColonizationConfig } from '../../shared/types'

const createConfig = (overrides: Partial<ColonizationConfig> = {}): ColonizationConfig => ({
  attractors: {
    source: 'uniform',
    count: 50,
    region: {
      min: { x: -100, y: -100 },
      max: { x: 100, y: 100 },
    },
  },
  parameters: {
    attractionDistance: 50,
    killDistance: 5,
    stepSize: 5,
    maxIterations: 100,
  },
  seeds: [{ x: 0, y: 0 }],
  thicknessMode: 'flow',
  ...overrides,
})

describe('SpaceColonization', () => {
  describe('attractor generation', () => {
    it('generates uniform attractors within bounds', () => {
      const config = createConfig({
        attractors: {
          source: 'uniform',
          count: 20,
          region: {
            min: { x: 0, y: 0 },
            max: { x: 100, y: 100 },
          },
        },
      })
      const colonization = new SpaceColonization(config)
      const attractors = colonization.getAttractors()

      expect(attractors.length).toBe(20)
      for (const attractor of attractors) {
        expect(attractor.position.x).toBeGreaterThanOrEqual(0)
        expect(attractor.position.x).toBeLessThanOrEqual(100)
        expect(attractor.position.y).toBeGreaterThanOrEqual(0)
        expect(attractor.position.y).toBeLessThanOrEqual(100)
      }
    })

    it('generates attractors using Poisson disk sampling', () => {
      const config = createConfig({
        attractors: {
          source: 'poisson',
          count: 30,
          region: {
            min: { x: 0, y: 0 },
            max: { x: 100, y: 100 },
          },
        },
      })
      const colonization = new SpaceColonization(config)
      const attractors = colonization.getAttractors()

      // Poisson sampling may produce fewer points than requested
      expect(attractors.length).toBeGreaterThan(0)
      expect(attractors.length).toBeLessThanOrEqual(30)
    })

    it('respects attractor count configuration', () => {
      const config = createConfig({
        attractors: {
          source: 'uniform',
          count: 42,
          region: {
            min: { x: -50, y: -50 },
            max: { x: 50, y: 50 },
          },
        },
      })
      const colonization = new SpaceColonization(config)
      const attractors = colonization.getAttractors()

      expect(attractors.length).toBe(42)
    })

    it('uses boundary-based placement when configured', () => {
      const config = createConfig({
        attractors: {
          source: 'boundary',
          count: 20,
          region: {
            min: { x: -100, y: -100 },
            max: { x: 100, y: 100 },
          },
        },
      })
      const colonization = new SpaceColonization(config)
      const attractors = colonization.getAttractors()

      expect(attractors.length).toBe(20)
      // Boundary attractors should be biased toward edges
      // At least some should be far from center
      const distancesFromCenter = attractors.map((a) =>
        Math.sqrt(a.position.x ** 2 + a.position.y ** 2)
      )
      const avgDistance =
        distancesFromCenter.reduce((a, b) => a + b, 0) / distancesFromCenter.length
      expect(avgDistance).toBeGreaterThan(50) // Should be biased outward
    })
  })

  describe('attractor manipulation', () => {
    it('addAttractor adds attractor at specified position', () => {
      const config = createConfig({
        attractors: {
          source: 'painted', // No auto-generated attractors
          count: 0,
          region: {
            min: { x: -100, y: -100 },
            max: { x: 100, y: 100 },
          },
        },
      })
      const colonization = new SpaceColonization(config)

      colonization.addAttractor({ x: 50, y: 50 })
      colonization.addAttractor({ x: -50, y: -50 })

      const attractors = colonization.getAttractors()
      expect(attractors.length).toBe(2)
      expect(attractors.some((a) => a.position.x === 50 && a.position.y === 50)).toBe(true)
    })

    it('removeAttractorsInRadius removes attractors within radius', () => {
      const config = createConfig({
        attractors: {
          source: 'painted',
          count: 0,
          region: {
            min: { x: -100, y: -100 },
            max: { x: 100, y: 100 },
          },
        },
      })
      const colonization = new SpaceColonization(config)

      colonization.addAttractor({ x: 0, y: 0 })
      colonization.addAttractor({ x: 5, y: 0 })
      colonization.addAttractor({ x: 100, y: 100 })

      colonization.removeAttractorsInRadius({ x: 0, y: 0 }, 10)

      const attractors = colonization.getAttractors()
      expect(attractors.length).toBe(1)
      expect(attractors[0].position.x).toBe(100)
    })

    it('getAttractors returns current attractor list', () => {
      const config = createConfig()
      const colonization = new SpaceColonization(config)

      const attractors = colonization.getAttractors()
      expect(Array.isArray(attractors)).toBe(true)
      expect(attractors.length).toBeGreaterThan(0)
    })
  })

  describe('seed management', () => {
    it('grows branches from configured seed positions', () => {
      const config = createConfig({
        seeds: [{ x: 0, y: 0 }],
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      expect(graph.roots.length).toBe(1)
      const rootNode = graph.nodes.get(graph.roots[0])
      expect(rootNode).toBeDefined()
      expect(rootNode!.position.x).toBe(0)
      expect(rootNode!.position.y).toBe(0)
    })

    it('multiple seeds create multiple growth origins', () => {
      const config = createConfig({
        seeds: [
          { x: -50, y: 0 },
          { x: 50, y: 0 },
        ],
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      expect(graph.roots.length).toBe(2)
    })
  })

  describe('growth algorithm', () => {
    it('produces BranchGraph after running', () => {
      const config = createConfig()
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      expect(graph.nodes).toBeInstanceOf(Map)
      expect(graph.segments).toBeInstanceOf(Map)
      expect(graph.nodes.size).toBeGreaterThan(0)
    })

    it('branches grow toward attractors', () => {
      // Place attractor directly above seed
      const config = createConfig({
        attractors: {
          source: 'painted',
          count: 0,
          region: {
            min: { x: -100, y: -100 },
            max: { x: 100, y: 100 },
          },
        },
        seeds: [{ x: 0, y: 0 }],
        parameters: {
          attractionDistance: 100,
          killDistance: 5,
          stepSize: 10,
          maxIterations: 20,
        },
      })
      const colonization = new SpaceColonization(config)
      colonization.addAttractor({ x: 0, y: -50 })

      const graph = colonization.run()

      // Should have grown upward toward the attractor
      const nodes = Array.from(graph.nodes.values())
      const hasNodeAboveOrigin = nodes.some((n) => n.position.y < -5)
      expect(hasNodeAboveOrigin).toBe(true)
    })

    it('attractors are killed when reached (kill distance)', () => {
      const config = createConfig({
        attractors: {
          source: 'painted',
          count: 0,
          region: {
            min: { x: -100, y: -100 },
            max: { x: 100, y: 100 },
          },
        },
        seeds: [{ x: 0, y: 0 }],
        parameters: {
          attractionDistance: 100,
          killDistance: 15,
          stepSize: 10,
          maxIterations: 50,
        },
      })
      const colonization = new SpaceColonization(config)
      colonization.addAttractor({ x: 0, y: -20 })

      colonization.run()

      // After running, the attractor should be marked inactive
      const attractors = colonization.getAttractors()
      expect(attractors.every((a) => !a.active)).toBe(true)
    })

    it('respects maximum iterations', () => {
      const config = createConfig({
        parameters: {
          attractionDistance: 100,
          killDistance: 1,
          stepSize: 1,
          maxIterations: 5,
        },
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      // Should not run forever, should produce a result
      expect(graph.nodes.size).toBeGreaterThan(0)
    })

    it('calls onProgress callback during iteration', () => {
      const onProgress = vi.fn()
      const config = createConfig({
        parameters: {
          attractionDistance: 100,
          killDistance: 5,
          stepSize: 5,
          maxIterations: 20,
        },
      })
      const colonization = new SpaceColonization(config, onProgress)
      colonization.run()

      // onProgress is called every 5 iterations
      expect(onProgress).toHaveBeenCalled()
    })
  })

  describe('thickness modes', () => {
    it('constant mode gives uniform thickness', () => {
      const config = createConfig({
        thicknessMode: 'constant',
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      const thicknesses = Array.from(graph.nodes.values()).map(
        (n) => n.attributes.thickness
      )
      const allSame = thicknesses.every((t) => t === thicknesses[0])
      expect(allSame).toBe(true)
    })

    it('depth mode varies thickness by tree depth', () => {
      const config = createConfig({
        thicknessMode: 'depth',
        parameters: {
          attractionDistance: 100,
          killDistance: 5,
          stepSize: 5,
          maxIterations: 50,
        },
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      if (graph.nodes.size > 2) {
        const nodes = Array.from(graph.nodes.values())
        const depths = nodes.map((n) => n.depth)
        const thicknesses = nodes.map((n) => n.attributes.thickness)

        // If there are different depths, there should be different thicknesses
        const uniqueDepths = new Set(depths)
        if (uniqueDepths.size > 1) {
          const uniqueThicknesses = new Set(thicknesses)
          expect(uniqueThicknesses.size).toBeGreaterThan(1)
        }
      }
    })

    it('flow mode uses Strahler order for thickness', () => {
      const config = createConfig({
        thicknessMode: 'flow',
        parameters: {
          attractionDistance: 100,
          killDistance: 5,
          stepSize: 5,
          maxIterations: 50,
        },
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      // All nodes should have thickness based on their order
      for (const node of graph.nodes.values()) {
        expect(node.attributes.thickness).toBeGreaterThanOrEqual(0)
        expect(node.attributes.thickness).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('output', () => {
    it('returns valid BranchGraph compatible with Rasterizer', () => {
      const config = createConfig()
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      expect(graph.nodes).toBeInstanceOf(Map)
      expect(graph.segments).toBeInstanceOf(Map)
      expect(graph.roots).toBeInstanceOf(Array)
      expect(graph.bounds).toBeDefined()
      expect(graph.metadata).toBeDefined()
      expect(graph.metadata.algorithm).toBe('colonization')
    })

    it('graph bounds contain all nodes', () => {
      const config = createConfig()
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      for (const node of graph.nodes.values()) {
        expect(node.position.x).toBeGreaterThanOrEqual(graph.bounds.min.x)
        expect(node.position.x).toBeLessThanOrEqual(graph.bounds.max.x)
        expect(node.position.y).toBeGreaterThanOrEqual(graph.bounds.min.y)
        expect(node.position.y).toBeLessThanOrEqual(graph.bounds.max.y)
      }
    })

    it('all segments reference valid nodes', () => {
      const config = createConfig()
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      for (const segment of graph.segments.values()) {
        expect(graph.nodes.has(segment.start)).toBe(true)
        expect(graph.nodes.has(segment.end)).toBe(true)
      }
    })

    it('parent-child relationships are consistent', () => {
      const config = createConfig()
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      for (const node of graph.nodes.values()) {
        if (node.parent !== null) {
          const parent = graph.nodes.get(node.parent)
          expect(parent).toBeDefined()
          expect(parent!.children).toContain(node.id)
        }
      }
    })
  })

  describe('edge cases', () => {
    it('handles no attractors', () => {
      const config = createConfig({
        attractors: {
          source: 'painted',
          count: 0,
          region: {
            min: { x: -100, y: -100 },
            max: { x: 100, y: 100 },
          },
        },
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      // Should still have root nodes from seeds
      expect(graph.roots.length).toBe(1)
      // No growth should occur
      expect(graph.nodes.size).toBe(1)
    })

    it('handles single attractor', () => {
      const config = createConfig({
        attractors: {
          source: 'painted',
          count: 0,
          region: {
            min: { x: -100, y: -100 },
            max: { x: 100, y: 100 },
          },
        },
        parameters: {
          attractionDistance: 100,
          killDistance: 5,
          stepSize: 5,
          maxIterations: 50,
        },
      })
      const colonization = new SpaceColonization(config)
      colonization.addAttractor({ x: 0, y: -50 })

      const graph = colonization.run()

      expect(graph.nodes.size).toBeGreaterThan(1)
    })

    it('handles empty seeds array gracefully', () => {
      const config = createConfig({
        seeds: [],
      })
      const colonization = new SpaceColonization(config)
      const graph = colonization.run()

      // No roots, no nodes
      expect(graph.roots.length).toBe(0)
    })
  })
})
