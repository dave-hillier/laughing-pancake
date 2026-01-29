import { describe, it, expect } from 'vitest'
import {
  generateId,
  clamp,
  lerp,
  degToRad,
  radToDeg,
  vec2Add,
  vec2Sub,
  vec2Scale,
  vec2Length,
  vec2Normalize,
  vec2Distance,
  vec2Rotate,
  vec2Dot,
  createBounds,
  expandBounds,
  boundsCenter,
  boundsSize,
} from './index'

describe('generateId', () => {
  it('generates unique IDs across multiple calls', () => {
    const ids = new Set<string>()
    for (let i = 0; i < 100; i++) {
      ids.add(generateId())
    }
    expect(ids.size).toBe(100)
  })

  it('returns non-empty string', () => {
    const id = generateId()
    expect(id.length).toBeGreaterThan(0)
    expect(typeof id).toBe('string')
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(0, 0, 10)).toBe(0)
    expect(clamp(10, 0, 10)).toBe(10)
  })

  it('returns min when value is below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0)
    expect(clamp(-100, -50, 50)).toBe(-50)
  })

  it('returns max when value is above range', () => {
    expect(clamp(15, 0, 10)).toBe(10)
    expect(clamp(100, -50, 50)).toBe(50)
  })

  it('handles edge case where min equals max', () => {
    expect(clamp(5, 5, 5)).toBe(5)
    expect(clamp(0, 5, 5)).toBe(5)
    expect(clamp(10, 5, 5)).toBe(5)
  })
})

describe('lerp', () => {
  it('returns start value when t is 0', () => {
    expect(lerp(0, 100, 0)).toBe(0)
    expect(lerp(-50, 50, 0)).toBe(-50)
  })

  it('returns end value when t is 1', () => {
    expect(lerp(0, 100, 1)).toBe(100)
    expect(lerp(-50, 50, 1)).toBe(50)
  })

  it('returns midpoint when t is 0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
    expect(lerp(-50, 50, 0.5)).toBe(0)
  })

  it('interpolates correctly for arbitrary t values', () => {
    expect(lerp(0, 100, 0.25)).toBe(25)
    expect(lerp(0, 100, 0.75)).toBe(75)
  })

  it('extrapolates beyond range when t > 1 or t < 0', () => {
    expect(lerp(0, 100, 2)).toBe(200)
    expect(lerp(0, 100, -1)).toBe(-100)
  })
})

describe('degToRad / radToDeg', () => {
  it('converts common angles correctly', () => {
    expect(degToRad(0)).toBe(0)
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2)
    expect(degToRad(180)).toBeCloseTo(Math.PI)
    expect(degToRad(360)).toBeCloseTo(Math.PI * 2)
  })

  it('radToDeg converts correctly', () => {
    expect(radToDeg(0)).toBe(0)
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90)
    expect(radToDeg(Math.PI)).toBeCloseTo(180)
    expect(radToDeg(Math.PI * 2)).toBeCloseTo(360)
  })

  it('roundtrips preserve value: radToDeg(degToRad(x)) ≈ x', () => {
    const angles = [0, 45, 90, 135, 180, 270, 360]
    for (const angle of angles) {
      expect(radToDeg(degToRad(angle))).toBeCloseTo(angle)
    }
  })

  it('handles negative angles', () => {
    expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2)
    expect(radToDeg(-Math.PI)).toBeCloseTo(-180)
  })
})

describe('vec2Add', () => {
  it('adds two vectors component-wise', () => {
    const result = vec2Add({ x: 1, y: 2 }, { x: 3, y: 4 })
    expect(result).toEqual({ x: 4, y: 6 })
  })

  it('handles zero vectors', () => {
    const v = { x: 5, y: 10 }
    const zero = { x: 0, y: 0 }
    expect(vec2Add(v, zero)).toEqual(v)
    expect(vec2Add(zero, v)).toEqual(v)
  })

  it('handles negative components', () => {
    const result = vec2Add({ x: -1, y: 2 }, { x: 3, y: -4 })
    expect(result).toEqual({ x: 2, y: -2 })
  })
})

describe('vec2Sub', () => {
  it('subtracts vectors component-wise', () => {
    const result = vec2Sub({ x: 5, y: 10 }, { x: 3, y: 4 })
    expect(result).toEqual({ x: 2, y: 6 })
  })

  it('subtracting same vector yields zero vector', () => {
    const v = { x: 5, y: 10 }
    const result = vec2Sub(v, v)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('handles negative components', () => {
    const result = vec2Sub({ x: -1, y: 2 }, { x: 3, y: -4 })
    expect(result).toEqual({ x: -4, y: 6 })
  })
})

describe('vec2Scale', () => {
  it('scales vector by positive scalar', () => {
    const result = vec2Scale({ x: 2, y: 3 }, 3)
    expect(result).toEqual({ x: 6, y: 9 })
  })

  it('scales vector by zero yields zero vector', () => {
    const result = vec2Scale({ x: 5, y: 10 }, 0)
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('scales vector by negative scalar inverts direction', () => {
    const result = vec2Scale({ x: 2, y: 3 }, -2)
    expect(result).toEqual({ x: -4, y: -6 })
  })

  it('scales vector by 1 returns equivalent vector', () => {
    const v = { x: 5, y: 10 }
    const result = vec2Scale(v, 1)
    expect(result).toEqual(v)
  })
})

describe('vec2Length', () => {
  it('unit vectors have length 1', () => {
    expect(vec2Length({ x: 1, y: 0 })).toBe(1)
    expect(vec2Length({ x: 0, y: 1 })).toBe(1)
  })

  it('zero vector has length 0', () => {
    expect(vec2Length({ x: 0, y: 0 })).toBe(0)
  })

  it('computes correct magnitude', () => {
    expect(vec2Length({ x: 3, y: 4 })).toBe(5)
    expect(vec2Length({ x: -3, y: 4 })).toBe(5)
  })
})

describe('vec2Normalize', () => {
  it('returns unit vector in same direction', () => {
    const result = vec2Normalize({ x: 10, y: 0 })
    expect(result.x).toBeCloseTo(1)
    expect(result.y).toBeCloseTo(0)
  })

  it('normalized vector has length 1', () => {
    const vectors = [
      { x: 3, y: 4 },
      { x: -5, y: 12 },
      { x: 1, y: 1 },
    ]
    for (const v of vectors) {
      const normalized = vec2Normalize(v)
      expect(vec2Length(normalized)).toBeCloseTo(1)
    }
  })

  it('handles zero vector gracefully', () => {
    const result = vec2Normalize({ x: 0, y: 0 })
    expect(result).toEqual({ x: 0, y: 0 })
  })

  it('preserves direction for negative components', () => {
    const result = vec2Normalize({ x: -3, y: -4 })
    expect(result.x).toBeCloseTo(-0.6)
    expect(result.y).toBeCloseTo(-0.8)
  })
})

describe('vec2Distance', () => {
  it('returns 0 for same point', () => {
    const p = { x: 5, y: 10 }
    expect(vec2Distance(p, p)).toBe(0)
  })

  it('computes correct Euclidean distance', () => {
    expect(vec2Distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(vec2Distance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5)
  })

  it('distance is symmetric: d(a,b) = d(b,a)', () => {
    const a = { x: 1, y: 2 }
    const b = { x: 5, y: 8 }
    expect(vec2Distance(a, b)).toBe(vec2Distance(b, a))
  })
})

describe('vec2Rotate', () => {
  it('rotates 90 degrees correctly', () => {
    const v = { x: 1, y: 0 }
    const result = vec2Rotate(v, Math.PI / 2)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(1)
  })

  it('rotating 360 degrees returns original vector', () => {
    const v = { x: 3, y: 4 }
    const result = vec2Rotate(v, Math.PI * 2)
    expect(result.x).toBeCloseTo(v.x)
    expect(result.y).toBeCloseTo(v.y)
  })

  it('rotating zero degrees returns original vector', () => {
    const v = { x: 3, y: 4 }
    const result = vec2Rotate(v, 0)
    expect(result.x).toBeCloseTo(v.x)
    expect(result.y).toBeCloseTo(v.y)
  })

  it('rotating 180 degrees inverts direction', () => {
    const v = { x: 3, y: 4 }
    const result = vec2Rotate(v, Math.PI)
    expect(result.x).toBeCloseTo(-v.x)
    expect(result.y).toBeCloseTo(-v.y)
  })

  it('preserves vector length after rotation', () => {
    const v = { x: 3, y: 4 }
    const angles = [Math.PI / 4, Math.PI / 3, Math.PI / 2, Math.PI]
    for (const angle of angles) {
      const result = vec2Rotate(v, angle)
      expect(vec2Length(result)).toBeCloseTo(vec2Length(v))
    }
  })
})

describe('vec2Dot', () => {
  it('perpendicular vectors have dot product of 0', () => {
    expect(vec2Dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0)
    expect(vec2Dot({ x: 3, y: 4 }, { x: -4, y: 3 })).toBe(0)
  })

  it('parallel vectors have dot product equal to product of lengths', () => {
    const a = { x: 2, y: 0 }
    const b = { x: 3, y: 0 }
    expect(vec2Dot(a, b)).toBe(6)
  })

  it('is commutative: a·b = b·a', () => {
    const a = { x: 3, y: 4 }
    const b = { x: 5, y: 6 }
    expect(vec2Dot(a, b)).toBe(vec2Dot(b, a))
  })

  it('computes correct value', () => {
    expect(vec2Dot({ x: 1, y: 2 }, { x: 3, y: 4 })).toBe(11)
  })
})

describe('createBounds', () => {
  it('creates bounds with infinite values', () => {
    const bounds = createBounds()
    expect(bounds.min.x).toBe(Infinity)
    expect(bounds.min.y).toBe(Infinity)
    expect(bounds.max.x).toBe(-Infinity)
    expect(bounds.max.y).toBe(-Infinity)
  })
})

describe('expandBounds', () => {
  it('expands to include point outside current bounds', () => {
    let bounds = createBounds()
    bounds = expandBounds(bounds, { x: 0, y: 0 })
    expect(bounds.min).toEqual({ x: 0, y: 0 })
    expect(bounds.max).toEqual({ x: 0, y: 0 })

    bounds = expandBounds(bounds, { x: 10, y: 5 })
    expect(bounds.min).toEqual({ x: 0, y: 0 })
    expect(bounds.max).toEqual({ x: 10, y: 5 })
  })

  it('does not change bounds for point already inside', () => {
    let bounds = createBounds()
    bounds = expandBounds(bounds, { x: 0, y: 0 })
    bounds = expandBounds(bounds, { x: 10, y: 10 })

    const newBounds = expandBounds(bounds, { x: 5, y: 5 })
    expect(newBounds.min).toEqual({ x: 0, y: 0 })
    expect(newBounds.max).toEqual({ x: 10, y: 10 })
  })

  it('handles negative coordinates', () => {
    let bounds = createBounds()
    bounds = expandBounds(bounds, { x: -5, y: -10 })
    bounds = expandBounds(bounds, { x: 5, y: 10 })
    expect(bounds.min).toEqual({ x: -5, y: -10 })
    expect(bounds.max).toEqual({ x: 5, y: 10 })
  })
})

describe('boundsCenter', () => {
  it('returns geometric center of bounds', () => {
    const bounds = {
      min: { x: 0, y: 0 },
      max: { x: 10, y: 10 },
    }
    expect(boundsCenter(bounds)).toEqual({ x: 5, y: 5 })
  })

  it('handles asymmetric bounds', () => {
    const bounds = {
      min: { x: -10, y: 0 },
      max: { x: 10, y: 20 },
    }
    expect(boundsCenter(bounds)).toEqual({ x: 0, y: 10 })
  })

  it('center of single point bounds is that point', () => {
    const bounds = {
      min: { x: 5, y: 5 },
      max: { x: 5, y: 5 },
    }
    expect(boundsCenter(bounds)).toEqual({ x: 5, y: 5 })
  })
})

describe('boundsSize', () => {
  it('returns width and height of bounds', () => {
    const bounds = {
      min: { x: 0, y: 0 },
      max: { x: 10, y: 20 },
    }
    expect(boundsSize(bounds)).toEqual({ x: 10, y: 20 })
  })

  it('empty bounds (min=max) has zero size', () => {
    const bounds = {
      min: { x: 5, y: 5 },
      max: { x: 5, y: 5 },
    }
    expect(boundsSize(bounds)).toEqual({ x: 0, y: 0 })
  })

  it('handles negative origin', () => {
    const bounds = {
      min: { x: -10, y: -5 },
      max: { x: 10, y: 15 },
    }
    expect(boundsSize(bounds)).toEqual({ x: 20, y: 20 })
  })
})
