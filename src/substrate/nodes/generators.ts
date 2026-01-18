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

// Simplex Noise Generator
export const simplexNoise: NodeDefinition = {
  id: 'simplex_noise',
  name: 'Simplex Noise',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 4, min: 0.1, max: 32 },
    { id: 'octaves', name: 'Octaves', type: 'int', default: 4, min: 1, max: 8 },
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

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 p = v_uv * u_scale + u_seed;
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxValue = 0.0;

  for (int i = 0; i < 8; i++) {
    if (i >= u_octaves) break;
    value += amplitude * snoise(p * frequency);
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

// Value Noise Generator
export const valueNoise: NodeDefinition = {
  id: 'value_noise',
  name: 'Value Noise',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 8, min: 0.1, max: 32 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_scale;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p + u_seed, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float value = valueNoise(v_uv * u_scale);
  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Fractal Brownian Motion
export const fbm: NodeDefinition = {
  id: 'fbm',
  name: 'FBM',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 4, min: 0.1, max: 32 },
    { id: 'octaves', name: 'Octaves', type: 'int', default: 6, min: 1, max: 10 },
    { id: 'gain', name: 'Gain', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'lacunarity', name: 'Lacunarity', type: 'float', default: 2, min: 1, max: 4 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_scale;
uniform int u_octaves;
uniform float u_gain;
uniform float u_lacunarity;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1 + u_seed, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 10; i++) {
    if (i >= u_octaves) break;
    value += amplitude * noise(p * frequency);
    frequency *= u_lacunarity;
    amplitude *= u_gain;
  }
  return value;
}

void main() {
  float value = fbm(v_uv * u_scale);
  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Gabor Noise
export const gaborNoise: NodeDefinition = {
  id: 'gabor_noise',
  name: 'Gabor Noise',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 4, min: 0.5, max: 16 },
    { id: 'angle', name: 'Angle', type: 'float', default: 0, min: 0, max: 360 },
    { id: 'frequency', name: 'Frequency', type: 'float', default: 4, min: 1, max: 16 },
    { id: 'bandwidth', name: 'Bandwidth', type: 'float', default: 1, min: 0.1, max: 4 },
    { id: 'seed', name: 'Seed', type: 'float', default: 0, min: 0, max: 1000 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_scale;
uniform float u_angle;
uniform float u_frequency;
uniform float u_bandwidth;
uniform float u_seed;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p + u_seed, vec2(127.1, 311.7))) * 43758.5453);
}

float gabor(vec2 p, vec2 dir, float freq, float bw) {
  float g = exp(-bw * dot(p, p));
  float s = cos(6.28318 * freq * dot(p, dir));
  return g * s;
}

void main() {
  vec2 p = v_uv * u_scale;
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad));

  float value = 0.0;
  vec2 cell = floor(p);

  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 offset = vec2(float(dx), float(dy));
      vec2 c = cell + offset;
      vec2 pos = vec2(hash(c), hash(c + 100.0));
      vec2 kernelPos = p - c - pos;
      value += gabor(kernelPos, dir, u_frequency, u_bandwidth);
    }
  }

  value = value * 0.5 + 0.5;
  fragColor = vec4(vec3(clamp(value, 0.0, 1.0)), 1.0);
}`,
    uniforms: [],
  },
};

// Hexagon Pattern
export const hexagon: NodeDefinition = {
  id: 'hexagon',
  name: 'Hexagon',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 8, min: 1, max: 32 },
    { id: 'gap', name: 'Gap', type: 'float', default: 0.05, min: 0, max: 0.3 },
    { id: 'mode', name: 'Mode', type: 'int', default: 0, min: 0, max: 2 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_scale;
uniform float u_gap;
uniform int u_mode;

in vec2 v_uv;
out vec4 fragColor;

const vec2 s = vec2(1.0, 1.732050808);

float hexDist(vec2 p) {
  p = abs(p);
  return max(dot(p, s * 0.5), p.x);
}

vec4 hexCoords(vec2 uv) {
  vec4 hC = floor(vec4(uv, uv - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(uv - hC.xy * s, uv - (hC.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy) : vec4(h.zw, hC.zw + 0.5);
}

void main() {
  vec2 uv = v_uv * u_scale;
  vec4 hex = hexCoords(uv);

  float d = hexDist(hex.xy);
  float value;

  if (u_mode == 0) {
    // Solid hexagons
    value = smoothstep(0.5, 0.5 - u_gap, d);
  } else if (u_mode == 1) {
    // Distance field
    value = d;
  } else {
    // Cell ID based
    value = fract(sin(dot(hex.zw, vec2(127.1, 311.7))) * 43758.5453);
  }

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Weave Pattern
export const weave: NodeDefinition = {
  id: 'weave',
  name: 'Weave',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 8, min: 1, max: 32 },
    { id: 'type', name: 'Type', type: 'int', default: 0, min: 0, max: 2 },
    { id: 'gap', name: 'Gap', type: 'float', default: 0.1, min: 0, max: 0.5 },
    { id: 'depth', name: 'Depth', type: 'float', default: 0.3, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_scale;
uniform int u_type;
uniform float u_gap;
uniform float u_depth;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 p = v_uv * u_scale;
  vec2 i = floor(p);
  vec2 f = fract(p);

  float thread = 1.0 - u_gap;
  float value;

  if (u_type == 0) {
    // Plain weave
    bool over = mod(i.x + i.y, 2.0) < 1.0;
    float hThread = step(f.y, thread) * step(1.0 - thread, f.y + 1.0);
    float vThread = step(f.x, thread) * step(1.0 - thread, f.x + 1.0);
    value = over ? (1.0 - u_depth * 0.5) : (1.0 - u_depth);
    value *= max(smoothstep(0.0, u_gap, f.x) * smoothstep(1.0, 1.0 - u_gap, f.x),
                 smoothstep(0.0, u_gap, f.y) * smoothstep(1.0, 1.0 - u_gap, f.y));
  } else if (u_type == 1) {
    // Twill weave (diagonal pattern)
    bool over = mod(i.x + i.y * 2.0, 4.0) < 2.0;
    value = over ? 1.0 : (1.0 - u_depth);
    value *= smoothstep(0.0, u_gap, f.x) * smoothstep(1.0, 1.0 - u_gap, f.x);
    value *= smoothstep(0.0, u_gap, f.y) * smoothstep(1.0, 1.0 - u_gap, f.y);
  } else {
    // Satin weave
    bool over = mod(i.x + i.y * 3.0, 5.0) < 1.0;
    value = over ? 1.0 : (1.0 - u_depth * 0.3);
    value *= smoothstep(0.0, u_gap, f.x) * smoothstep(1.0, 1.0 - u_gap, f.x);
    value *= smoothstep(0.0, u_gap, f.y) * smoothstep(1.0, 1.0 - u_gap, f.y);
  }

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Tile Pattern (grid with variations)
export const tilePattern: NodeDefinition = {
  id: 'tile_pattern',
  name: 'Tile Pattern',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'tilesX', name: 'Tiles X', type: 'float', default: 4, min: 1, max: 16 },
    { id: 'tilesY', name: 'Tiles Y', type: 'float', default: 4, min: 1, max: 16 },
    { id: 'gap', name: 'Gap', type: 'float', default: 0.05, min: 0, max: 0.5 },
    { id: 'roundness', name: 'Roundness', type: 'float', default: 0, min: 0, max: 0.5 },
    { id: 'randomize', name: 'Randomize', type: 'float', default: 0, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_tilesX;
uniform float u_tilesY;
uniform float u_gap;
uniform float u_roundness;
uniform float u_randomize;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float roundedBox(vec2 p, vec2 size, float radius) {
  vec2 q = abs(p) - size + radius;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

void main() {
  vec2 p = v_uv * vec2(u_tilesX, u_tilesY);
  vec2 i = floor(p);
  vec2 f = fract(p) - 0.5;

  float rand = hash(i) * u_randomize;
  vec2 size = vec2(0.5 - u_gap * 0.5) * (1.0 - rand * 0.5);
  float radius = u_roundness * min(size.x, size.y);

  float d = roundedBox(f, size, radius);
  float value = 1.0 - smoothstep(-0.01, 0.01, d);

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Rectangle Shape
export const rectangle: NodeDefinition = {
  id: 'rectangle',
  name: 'Rectangle',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'width', name: 'Width', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'height', name: 'Height', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'cornerRadius', name: 'Corner Radius', type: 'float', default: 0, min: 0, max: 0.5 },
    { id: 'softness', name: 'Softness', type: 'float', default: 0.01, min: 0, max: 0.2 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_width;
uniform float u_height;
uniform float u_cornerRadius;
uniform float u_softness;

in vec2 v_uv;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 size, float radius) {
  vec2 q = abs(p) - size + radius;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

void main() {
  vec2 p = v_uv - 0.5;
  vec2 size = vec2(u_width, u_height) * 0.5;
  float radius = u_cornerRadius * min(size.x, size.y);

  float d = roundedBox(p, size, radius);
  float value = 1.0 - smoothstep(-u_softness, u_softness, d);

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Ellipse Shape
export const ellipse: NodeDefinition = {
  id: 'ellipse',
  name: 'Ellipse',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'radiusX', name: 'Radius X', type: 'float', default: 0.4, min: 0, max: 0.5 },
    { id: 'radiusY', name: 'Radius Y', type: 'float', default: 0.4, min: 0, max: 0.5 },
    { id: 'softness', name: 'Softness', type: 'float', default: 0.01, min: 0, max: 0.2 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform float u_radiusX;
uniform float u_radiusY;
uniform float u_softness;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 p = v_uv - 0.5;
  vec2 r = vec2(u_radiusX, u_radiusY);

  float d = length(p / r) - 1.0;
  float value = 1.0 - smoothstep(-u_softness, u_softness, d * min(r.x, r.y));

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Polygon Shape
export const polygon: NodeDefinition = {
  id: 'polygon',
  name: 'Polygon',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'sides', name: 'Sides', type: 'int', default: 6, min: 3, max: 12 },
    { id: 'radius', name: 'Radius', type: 'float', default: 0.4, min: 0, max: 0.5 },
    { id: 'rotation', name: 'Rotation', type: 'float', default: 0, min: 0, max: 360 },
    { id: 'softness', name: 'Softness', type: 'float', default: 0.01, min: 0, max: 0.2 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform int u_sides;
uniform float u_radius;
uniform float u_rotation;
uniform float u_softness;

in vec2 v_uv;
out vec4 fragColor;

const float PI = 3.14159265359;

void main() {
  vec2 p = v_uv - 0.5;

  float rot = u_rotation * PI / 180.0;
  float c = cos(rot);
  float s = sin(rot);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

  float a = atan(p.y, p.x);
  float n = float(u_sides);
  float r = length(p);

  float angle = 2.0 * PI / n;
  float d = r * cos(mod(a + PI / n, angle) - PI / n) / cos(PI / n);

  float value = 1.0 - smoothstep(u_radius - u_softness, u_radius + u_softness, d);

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Star Shape
export const star: NodeDefinition = {
  id: 'star',
  name: 'Star',
  category: 'generator',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'points', name: 'Points', type: 'int', default: 5, min: 3, max: 12 },
    { id: 'outerRadius', name: 'Outer Radius', type: 'float', default: 0.4, min: 0, max: 0.5 },
    { id: 'innerRadius', name: 'Inner Radius', type: 'float', default: 0.2, min: 0, max: 0.5 },
    { id: 'rotation', name: 'Rotation', type: 'float', default: 0, min: 0, max: 360 },
    { id: 'softness', name: 'Softness', type: 'float', default: 0.01, min: 0, max: 0.2 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform int u_points;
uniform float u_outerRadius;
uniform float u_innerRadius;
uniform float u_rotation;
uniform float u_softness;

in vec2 v_uv;
out vec4 fragColor;

const float PI = 3.14159265359;

void main() {
  vec2 p = v_uv - 0.5;

  float rot = u_rotation * PI / 180.0;
  float c = cos(rot);
  float s = sin(rot);
  p = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

  float a = atan(p.y, p.x);
  float n = float(u_points);
  float r = length(p);

  float angle = PI / n;
  float sector = mod(a + PI * 0.5, 2.0 * angle) - angle;

  float outerR = u_outerRadius;
  float innerR = u_innerRadius;
  float targetR = mix(innerR, outerR, (cos(sector * n) + 1.0) * 0.5);

  float value = 1.0 - smoothstep(targetR - u_softness, targetR + u_softness, r);

  fragColor = vec4(vec3(value), 1.0);
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
  simplexNoise,
  valueNoise,
  fbm,
  gaborNoise,
  hexagon,
  weave,
  tilePattern,
  rectangle,
  ellipse,
  polygon,
  star,
];
