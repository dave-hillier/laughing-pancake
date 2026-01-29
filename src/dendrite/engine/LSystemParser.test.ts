import { describe, it, expect } from 'vitest'
import { LSystemParser, L_SYSTEM_PRESETS } from './LSystemParser'

describe('LSystemParser', () => {
  describe('deterministic rules', () => {
    it('applies single rule for one iteration', () => {
      const parser = new LSystemParser({
        axiom: 'A',
        rules: [{ predecessor: 'A', successor: 'AB' }],
      })
      expect(parser.parse(1)).toBe('AB')
    })

    it('applies rules recursively over multiple iterations', () => {
      const parser = new LSystemParser({
        axiom: 'A',
        rules: [
          { predecessor: 'A', successor: 'AB' },
          { predecessor: 'B', successor: 'A' },
        ],
      })
      expect(parser.parse(0)).toBe('A')
      expect(parser.parse(1)).toBe('AB')
      expect(parser.parse(2)).toBe('ABA')
      expect(parser.parse(3)).toBe('ABAAB')
    })

    it('preserves symbols without matching rules', () => {
      const parser = new LSystemParser({
        axiom: 'AXB',
        rules: [
          { predecessor: 'A', successor: 'AA' },
          { predecessor: 'B', successor: 'BB' },
        ],
      })
      expect(parser.parse(1)).toBe('AAXBB')
    })

    it('handles empty axiom', () => {
      const parser = new LSystemParser({
        axiom: '',
        rules: [{ predecessor: 'A', successor: 'AB' }],
      })
      expect(parser.parse(1)).toBe('')
    })

    it('handles rules that produce empty string', () => {
      const parser = new LSystemParser({
        axiom: 'ABA',
        rules: [{ predecessor: 'B', successor: '' }],
      })
      expect(parser.parse(1)).toBe('AA')
    })

    it('handles multiple rules for complex patterns', () => {
      const parser = new LSystemParser({
        axiom: 'F',
        rules: [{ predecessor: 'F', successor: 'F[+F][-F]' }],
      })
      expect(parser.parse(1)).toBe('F[+F][-F]')
      expect(parser.parse(2)).toBe('F[+F][-F][+F[+F][-F]][-F[+F][-F]]')
    })
  })

  describe('stochastic rules', () => {
    it('selects from multiple rules for same predecessor', () => {
      const parser = new LSystemParser(
        {
          axiom: 'F',
          rules: [
            { predecessor: 'F', successor: 'A', probability: 0.5 },
            { predecessor: 'F', successor: 'B', probability: 0.5 },
          ],
        },
        42 // seed for determinism
      )
      const result = parser.parse(1)
      expect(['A', 'B']).toContain(result)
    })

    it('produces same results with same seed', () => {
      const createParser = () =>
        new LSystemParser(
          {
            axiom: 'FFF',
            rules: [
              { predecessor: 'F', successor: 'A', probability: 0.5 },
              { predecessor: 'F', successor: 'B', probability: 0.5 },
            ],
          },
          12345
        )

      const parser1 = createParser()
      const parser2 = createParser()

      expect(parser1.parse(1)).toBe(parser2.parse(1))
    })

    it('produces different results with different seeds', () => {
      const results = new Set<string>()

      for (let seed = 0; seed < 20; seed++) {
        const parser = new LSystemParser(
          {
            axiom: 'FFFFF',
            rules: [
              { predecessor: 'F', successor: 'A', probability: 0.5 },
              { predecessor: 'F', successor: 'B', probability: 0.5 },
            ],
          },
          seed
        )
        results.add(parser.parse(1))
      }

      // With 5 symbols and 2 choices each, we should see variety
      expect(results.size).toBeGreaterThan(1)
    })

    it('respects probability weights', () => {
      // With 90% probability for A, most results should be A
      const counts = { A: 0, B: 0 }
      const iterations = 100

      for (let seed = 0; seed < iterations; seed++) {
        const parser = new LSystemParser(
          {
            axiom: 'F',
            rules: [
              { predecessor: 'F', successor: 'A', probability: 0.9 },
              { predecessor: 'F', successor: 'B', probability: 0.1 },
            ],
          },
          seed
        )
        const result = parser.parse(1)
        if (result === 'A') counts.A++
        else counts.B++
      }

      // A should appear significantly more often than B
      expect(counts.A).toBeGreaterThan(counts.B)
    })
  })

  describe('context-sensitive rules', () => {
    it('applies rules based on left context', () => {
      const parser = new LSystemParser({
        axiom: 'BAB',
        rules: [
          { predecessor: 'A', successor: 'X', leftContext: 'B' },
          { predecessor: 'A', successor: 'Y' }, // fallback
        ],
      })
      // First A has B on left, so becomes X
      // The sequence is B A B, so A has B on both sides
      expect(parser.parse(1)).toBe('BXB')
    })

    it('applies rules based on right context', () => {
      const parser = new LSystemParser({
        axiom: 'ABC',
        rules: [
          { predecessor: 'A', successor: 'X', rightContext: 'B' },
          { predecessor: 'A', successor: 'Y' }, // fallback
        ],
      })
      expect(parser.parse(1)).toBe('XBC')
    })

    it('applies rules based on both contexts', () => {
      const parser = new LSystemParser({
        axiom: 'XABX',
        rules: [
          { predecessor: 'A', successor: 'Z', leftContext: 'X', rightContext: 'B' },
          { predecessor: 'A', successor: 'Y' },
        ],
      })
      expect(parser.parse(1)).toBe('XZBX')
    })

    it('falls back to context-free rule when context does not match', () => {
      const parser = new LSystemParser({
        axiom: 'CAC',
        rules: [
          { predecessor: 'A', successor: 'X', leftContext: 'B' }, // won't match
          { predecessor: 'A', successor: 'Y' }, // fallback
        ],
      })
      expect(parser.parse(1)).toBe('CYC')
    })
  })

  describe('parametric rules', () => {
    it('parses symbols with parameters', () => {
      const parser = new LSystemParser({
        axiom: 'A(10)',
        rules: [{ predecessor: 'A', successor: 'F(s)A(s)' }],
      })
      const result = parser.parse(1)
      expect(result).toContain('F(')
      expect(result).toContain('A(')
    })

    it('evaluates parameter expressions', () => {
      const parser = new LSystemParser({
        axiom: 'A(10)',
        rules: [{ predecessor: 'A', successor: 'F(s*0.5)' }],
      })
      const result = parser.parse(1)
      expect(result).toBe('F(5)')
    })
  })

  describe('presets', () => {
    it('binary tree preset produces valid L-System string', () => {
      const preset = L_SYSTEM_PRESETS.binaryTree
      const parser = new LSystemParser(preset)
      const result = parser.parse(3)
      expect(result).toBeTruthy()
      expect(result).toContain('F')
      expect(result).toContain('[')
      expect(result).toContain(']')
    })

    it('fern preset produces valid L-System string', () => {
      const preset = L_SYSTEM_PRESETS.fern
      const parser = new LSystemParser(preset)
      const result = parser.parse(3)
      expect(result).toBeTruthy()
      expect(result.length).toBeGreaterThan(preset.axiom.length)
    })

    it('all presets can be parsed without errors', () => {
      for (const [name, preset] of Object.entries(L_SYSTEM_PRESETS)) {
        const parser = new LSystemParser(preset)
        expect(() => parser.parse(2)).not.toThrow()
        const result = parser.parse(2)
        expect(result.length).toBeGreaterThan(0)
      }
    })

    it('dragon curve preset produces expected pattern', () => {
      const preset = L_SYSTEM_PRESETS.dragon
      const parser = new LSystemParser(preset)
      const result = parser.parse(2)
      expect(result).toContain('F')
      expect(result).toContain('+')
      expect(result).toContain('-')
    })

    it('koch curve preset produces correct growth', () => {
      const preset = L_SYSTEM_PRESETS.koch
      const parser = new LSystemParser(preset)
      // Koch: F -> F+F-F-F+F
      // So 1 F becomes 5 F's after 1 iteration
      const result = parser.parse(1)
      const fCount = (result.match(/F/g) || []).length
      expect(fCount).toBe(5)
    })
  })

  describe('edge cases', () => {
    it('handles very long axioms', () => {
      const parser = new LSystemParser({
        axiom: 'F'.repeat(100),
        rules: [{ predecessor: 'F', successor: 'FF' }],
      })
      const result = parser.parse(1)
      expect(result).toBe('F'.repeat(200))
    })

    it('handles rules with special characters', () => {
      const parser = new LSystemParser({
        axiom: 'F',
        rules: [{ predecessor: 'F', successor: 'F[+F][-F]|F' }],
      })
      const result = parser.parse(1)
      expect(result).toBe('F[+F][-F]|F')
    })

    it('handles zero iterations', () => {
      const parser = new LSystemParser({
        axiom: 'ABC',
        rules: [{ predecessor: 'A', successor: 'XYZ' }],
      })
      expect(parser.parse(0)).toBe('ABC')
    })
  })
})
