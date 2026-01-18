// Scatter/Stamp Nodes - Instance-based pattern generation

import type { NodeDefinition } from '../../shared/types';

// Tile Sampler
export const tileSampler: NodeDefinition = {
  id: 'tile_sampler',
  name: 'Tile Sampler',
  category: 'scatter',
  inputs: [
    { id: 'pattern', name: 'Pattern', type: 'rgba', required: true },
    { id: 'mask', name: 'Mask', type: 'grayscale', required: false },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'tilesX', name: 'Tiles X', type: 'int', default: 4, min: 1, max: 16 },
    { id: 'tilesY', name: 'Tiles Y', type: 'int', default: 4, min: 1, max: 16 },
    { id: 'offsetRandom', name: 'Position Random', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'rotationRandom', name: 'Rotation Random', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'scaleRandom', name: 'Scale Random', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'scaleBase', name: 'Scale', type: 'float', default: 1, min: 0.1, max: 2 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_pattern;
uniform sampler2D u_mask;
uniform int u_tilesX;
uniform int u_tilesY;
uniform float u_offsetRandom;
uniform float u_rotationRandom;
uniform float u_scaleRandom;
uniform float u_scaleBase;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p + u_seed, vec2(127.1, 311.7))) * 43758.5453);
}

vec2 hash2(vec2 p) {
  return vec2(hash(p), hash(p + 100.0));
}

void main() {
  vec2 tiles = vec2(float(u_tilesX), float(u_tilesY));
  vec2 p = v_uv * tiles;
  vec2 cell = floor(p);
  vec2 local = fract(p);

  vec4 color = vec4(0.0);
  float alpha = 0.0;

  // Check current and neighboring cells
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 offset = vec2(float(dx), float(dy));
      vec2 c = cell + offset;
      vec2 cellId = mod(c, tiles);

      // Per-instance randomization
      vec2 rnd = hash2(cellId);
      float rnd2 = hash(cellId + 200.0);
      float rnd3 = hash(cellId + 300.0);

      // Calculate instance transform
      vec2 instanceOffset = (rnd - 0.5) * u_offsetRandom;
      float instanceRotation = (rnd2 - 0.5) * u_rotationRandom * 6.28318;
      float instanceScale = u_scaleBase * (1.0 - u_scaleRandom * 0.5 + rnd3 * u_scaleRandom);

      // Transform local coordinates
      vec2 center = vec2(0.5) + instanceOffset;
      vec2 uv = local - offset - center;

      // Scale
      uv /= instanceScale;

      // Rotate
      float c_ = cos(instanceRotation);
      float s_ = sin(instanceRotation);
      uv = vec2(uv.x * c_ - uv.y * s_, uv.x * s_ + uv.y * c_);

      uv += 0.5;

      // Sample if within bounds
      if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
        vec4 sample = texture(u_pattern, uv);
        float mask = texture(u_mask, v_uv).r;

        if (sample.a > alpha && mask > 0.5) {
          color = sample;
          alpha = sample.a;
        }
      }
    }
  }

  fragColor = color;
}`,
    uniforms: [],
  },
};

// Scatter
export const scatter: NodeDefinition = {
  id: 'scatter',
  name: 'Scatter',
  category: 'scatter',
  inputs: [
    { id: 'pattern', name: 'Pattern', type: 'rgba', required: true },
    { id: 'density', name: 'Density Map', type: 'grayscale', required: false },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'count', name: 'Count', type: 'int', default: 100, min: 1, max: 500 },
    { id: 'scale', name: 'Scale', type: 'float', default: 0.1, min: 0.01, max: 0.5 },
    { id: 'scaleRandom', name: 'Scale Random', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'rotationRandom', name: 'Rotation Random', type: 'float', default: 1, min: 0, max: 1 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_pattern;
uniform sampler2D u_density;
uniform int u_count;
uniform float u_scale;
uniform float u_scaleRandom;
uniform float u_rotationRandom;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

float hash(float n) {
  return fract(sin(n + u_seed) * 43758.5453);
}

void main() {
  vec4 color = vec4(0.0);
  float maxAlpha = 0.0;

  for (int i = 0; i < 500; i++) {
    if (i >= u_count) break;

    float fi = float(i);

    // Generate instance position using low-discrepancy sequence
    vec2 instancePos = vec2(
      fract(fi * 0.618033988749895 + hash(fi)),
      fract(fi * 0.414213562373095 + hash(fi + 100.0))
    );

    // Check density at this position
    float density = texture(u_density, instancePos).r;
    if (hash(fi + 200.0) > density) continue;

    // Instance properties
    float instanceScale = u_scale * (1.0 - u_scaleRandom * 0.5 + hash(fi + 300.0) * u_scaleRandom);
    float instanceRotation = hash(fi + 400.0) * u_rotationRandom * 6.28318;

    // Transform coordinates
    vec2 uv = v_uv - instancePos;

    // Wrap for tiling
    uv = mod(uv + 0.5, 1.0) - 0.5;

    // Scale
    uv /= instanceScale;

    // Rotate
    float c = cos(instanceRotation);
    float s = sin(instanceRotation);
    uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

    uv += 0.5;

    // Sample if within bounds
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      vec4 sample = texture(u_pattern, uv);
      if (sample.a > maxAlpha) {
        color = sample;
        maxAlpha = sample.a;
      }
    }
  }

  fragColor = color;
}`,
    uniforms: [],
  },
};

// Splatter
export const splatter: NodeDefinition = {
  id: 'splatter',
  name: 'Splatter',
  category: 'scatter',
  inputs: [{ id: 'pattern', name: 'Pattern', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'count', name: 'Count', type: 'int', default: 20, min: 1, max: 100 },
    { id: 'scale', name: 'Scale', type: 'float', default: 0.15, min: 0.01, max: 0.5 },
    { id: 'scaleRandom', name: 'Scale Random', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'rotationRandom', name: 'Rotation', type: 'float', default: 1, min: 0, max: 1 },
    { id: 'blendMode', name: 'Blend', type: 'int', default: 0, min: 0, max: 2 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_pattern;
uniform int u_count;
uniform float u_scale;
uniform float u_scaleRandom;
uniform float u_rotationRandom;
uniform int u_blendMode;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

float hash(float n) {
  return fract(sin(n + u_seed) * 43758.5453);
}

void main() {
  vec4 color = vec4(0.0);

  for (int i = 0; i < 100; i++) {
    if (i >= u_count) break;

    float fi = float(i);

    // Random instance position
    vec2 instancePos = vec2(hash(fi), hash(fi + 100.0));

    // Instance properties
    float instanceScale = u_scale * (1.0 - u_scaleRandom * 0.5 + hash(fi + 200.0) * u_scaleRandom);
    float instanceRotation = hash(fi + 300.0) * u_rotationRandom * 6.28318;

    // Transform coordinates
    vec2 uv = v_uv - instancePos;

    // Wrap for tiling
    uv = mod(uv + 0.5, 1.0) - 0.5;

    // Scale
    uv /= instanceScale;

    // Rotate
    float c = cos(instanceRotation);
    float s = sin(instanceRotation);
    uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

    uv += 0.5;

    // Sample if within bounds
    if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
      vec4 sample = texture(u_pattern, uv);

      if (u_blendMode == 0) {
        // Over (alpha blend)
        color = mix(color, sample, sample.a);
      } else if (u_blendMode == 1) {
        // Add
        color.rgb += sample.rgb * sample.a;
        color.a = max(color.a, sample.a);
      } else {
        // Max
        color = max(color, sample);
      }
    }
  }

  fragColor = color;
}`,
    uniforms: [],
  },
};

// Flood Fill
export const floodFill: NodeDefinition = {
  id: 'flood_fill',
  name: 'Flood Fill',
  category: 'scatter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'color' }],
  parameters: [
    { id: 'threshold', name: 'Threshold', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_threshold;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

vec3 hash3(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx + u_seed) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

void main() {
  float value = texture(u_input, v_uv).r;

  if (value < u_threshold) {
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Find region seed point by searching in a local area
  vec2 texel = 1.0 / u_resolution;
  vec2 seedPoint = v_uv;
  float minDist = 1000.0;

  // Simple region identification based on local minima search
  for (int dy = -8; dy <= 8; dy++) {
    for (int dx = -8; dx <= 8; dx++) {
      vec2 offset = vec2(float(dx), float(dy)) * texel * 4.0;
      vec2 samplePos = fract(v_uv + offset);
      float sampleValue = texture(u_input, samplePos).r;

      if (sampleValue >= u_threshold) {
        // Use gradient descent to find stable point
        vec2 gradient;
        gradient.x = texture(u_input, fract(samplePos + vec2(texel.x, 0.0))).r -
                     texture(u_input, fract(samplePos - vec2(texel.x, 0.0))).r;
        gradient.y = texture(u_input, fract(samplePos + vec2(0.0, texel.y))).r -
                     texture(u_input, fract(samplePos - vec2(0.0, texel.y))).r;

        float dist = length(gradient);
        if (dist < minDist) {
          minDist = dist;
          seedPoint = samplePos;
        }
      }
    }
  }

  // Generate color from seed point
  vec2 quantizedSeed = floor(seedPoint * 32.0) / 32.0;
  vec3 regionColor = hash3(quantizedSeed);

  fragColor = vec4(regionColor, 1.0);
}`,
    uniforms: [],
  },
};

export const scatterNodes: NodeDefinition[] = [
  tileSampler,
  scatter,
  splatter,
  floodFill,
];
