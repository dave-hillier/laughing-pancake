// Generator Nodes - Produce texture data from parameters

import type { NodeDefinition } from '../../shared/types';

// Perlin Noise Generator
export const perlinNoise: NodeDefinition = {
  id: 'perlin_noise',
  name: 'Perlin Noise',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 4, min: 0.1, max: 32 },
    { id: 'octaves', name: 'Octaves', type: 'int', default: 6, min: 1, max: 10 },
    { id: 'persistence', name: 'Persistence', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'lacunarity', name: 'Lacunarity', type: 'float', default: 2, min: 1, max: 4 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_scale;
uniform int u_octaves;
uniform float u_persistence;
uniform float u_lacunarity;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return n_xyz;
}

void main() {
  vec2 p = v_uv * u_scale;
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxValue = 0.0;

  for (int i = 0; i < 10; i++) {
    if (i >= u_octaves) break;
    value += amplitude * cnoise(vec3(p * frequency, u_seed));
    maxValue += amplitude;
    amplitude *= u_persistence;
    frequency *= u_lacunarity;
  }

  value = value / maxValue * 0.5 + 0.5;
  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Voronoi/Worley Noise
export const voronoiNoise: NodeDefinition = {
  id: 'voronoi',
  name: 'Voronoi',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 8, min: 1, max: 32 },
    { id: 'jitter', name: 'Jitter', type: 'float', default: 1, min: 0, max: 1 },
    { id: 'mode', name: 'Mode', type: 'int', default: 0, min: 0, max: 2 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_scale;
uniform float u_jitter;
uniform int u_mode;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1 + u_seed, 311.7)), dot(p, vec2(269.5, 183.3 + u_seed)));
  return fract(sin(p) * 43758.5453);
}

void main() {
  vec2 p = v_uv * u_scale;
  vec2 n = floor(p);
  vec2 f = fract(p);

  float f1 = 8.0;
  float f2 = 8.0;

  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(mod(n + g, u_scale)) * u_jitter;
      vec2 r = g + o - f;
      float d = dot(r, r);

      if (d < f1) {
        f2 = f1;
        f1 = d;
      } else if (d < f2) {
        f2 = d;
      }
    }
  }

  float value;
  if (u_mode == 0) {
    value = sqrt(f1); // F1
  } else if (u_mode == 1) {
    value = sqrt(f2); // F2
  } else {
    value = sqrt(f2) - sqrt(f1); // Edge
  }

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Gradient Generator
export const gradient: NodeDefinition = {
  id: 'gradient',
  name: 'Gradient',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'type', name: 'Type', type: 'int', default: 0, min: 0, max: 3 },
    { id: 'angle', name: 'Angle', type: 'float', default: 0, min: 0, max: 360 },
    { id: 'repeat', name: 'Repeat', type: 'float', default: 1, min: 1, max: 10 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform int u_type;
uniform float u_angle;
uniform float u_repeat;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 uv = v_uv;
  float value;

  if (u_type == 0) {
    // Linear
    float rad = u_angle * 3.14159265 / 180.0;
    vec2 dir = vec2(cos(rad), sin(rad));
    value = dot(uv - 0.5, dir) + 0.5;
  } else if (u_type == 1) {
    // Radial
    value = length(uv - 0.5) * 2.0;
  } else if (u_type == 2) {
    // Angular
    value = atan(uv.y - 0.5, uv.x - 0.5) / 6.28318530718 + 0.5;
  } else {
    // Diamond
    vec2 d = abs(uv - 0.5) * 2.0;
    value = max(d.x, d.y);
  }

  value = fract(value * u_repeat);
  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Solid Color
export const solidColor: NodeDefinition = {
  id: 'solid_color',
  name: 'Solid Color',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'color' }],
  parameters: [
    { id: 'color', name: 'Color', type: 'color', default: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform vec4 u_color;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = u_color;
}`,
    uniforms: [],
  },
};

// Checker Pattern
export const checker: NodeDefinition = {
  id: 'checker',
  name: 'Checker',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 8, min: 1, max: 64 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_scale;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 p = floor(v_uv * u_scale);
  float c = mod(p.x + p.y, 2.0);
  fragColor = vec4(vec3(c), 1.0);
}`,
    uniforms: [],
  },
};

// Brick Pattern
export const brick: NodeDefinition = {
  id: 'brick',
  name: 'Brick',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'rows', name: 'Rows', type: 'float', default: 8, min: 1, max: 32 },
    { id: 'cols', name: 'Columns', type: 'float', default: 4, min: 1, max: 16 },
    { id: 'gap', name: 'Gap', type: 'float', default: 0.05, min: 0, max: 0.5 },
    { id: 'offset', name: 'Offset', type: 'float', default: 0.5, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_rows;
uniform float u_cols;
uniform float u_gap;
uniform float u_offset;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 uv = v_uv * vec2(u_cols, u_rows);
  float row = floor(uv.y);
  uv.x += mod(row, 2.0) * u_offset;

  vec2 brick = fract(uv);
  float g = u_gap * 0.5;

  float edge = smoothstep(0.0, g, brick.x) * smoothstep(1.0, 1.0 - g, brick.x);
  edge *= smoothstep(0.0, g, brick.y) * smoothstep(1.0, 1.0 - g, brick.y);

  fragColor = vec4(vec3(edge), 1.0);
}`,
    uniforms: [],
  },
};

export const generatorNodes: NodeDefinition[] = [
  perlinNoise,
  voronoiNoise,
  gradient,
  solidColor,
  checker,
  brick,
];
