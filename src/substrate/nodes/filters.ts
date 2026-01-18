// Filter Nodes - Transform input images

import type { NodeDefinition } from '../../shared/types';

// Levels Adjustment
export const levels: NodeDefinition = {
  id: 'levels',
  name: 'Levels',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'inBlack', name: 'Input Black', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'inWhite', name: 'Input White', type: 'float', default: 1, min: 0, max: 1 },
    { id: 'gamma', name: 'Gamma', type: 'float', default: 1, min: 0.1, max: 4 },
    { id: 'outBlack', name: 'Output Black', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'outWhite', name: 'Output White', type: 'float', default: 1, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_inBlack;
uniform float u_inWhite;
uniform float u_gamma;
uniform float u_outBlack;
uniform float u_outWhite;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);

  // Remap input range
  vec3 c = clamp((color.rgb - u_inBlack) / (u_inWhite - u_inBlack), 0.0, 1.0);

  // Apply gamma
  c = pow(c, vec3(1.0 / u_gamma));

  // Remap output range
  c = c * (u_outWhite - u_outBlack) + u_outBlack;

  fragColor = vec4(c, color.a);
}`,
    uniforms: [],
  },
};

// HSL Adjustment
export const hslAdjust: NodeDefinition = {
  id: 'hsl_adjust',
  name: 'HSL Adjust',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'color', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'color' }],
  parameters: [
    { id: 'hue', name: 'Hue Shift', type: 'float', default: 0, min: -1, max: 1 },
    { id: 'saturation', name: 'Saturation', type: 'float', default: 0, min: -1, max: 1 },
    { id: 'lightness', name: 'Lightness', type: 'float', default: 0, min: -1, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_hue;
uniform float u_saturation;
uniform float u_lightness;

in vec2 v_uv;
out vec4 fragColor;

vec3 rgb2hsl(vec3 c) {
  float maxC = max(max(c.r, c.g), c.b);
  float minC = min(min(c.r, c.g), c.b);
  float l = (maxC + minC) / 2.0;
  float s = 0.0;
  float h = 0.0;

  if (maxC != minC) {
    float d = maxC - minC;
    s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

    if (maxC == c.r) {
      h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
    } else if (maxC == c.g) {
      h = (c.b - c.r) / d + 2.0;
    } else {
      h = (c.r - c.g) / d + 4.0;
    }
    h /= 6.0;
  }

  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0/2.0) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 c) {
  if (c.y == 0.0) {
    return vec3(c.z);
  }

  float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
  float p = 2.0 * c.z - q;

  return vec3(
    hue2rgb(p, q, c.x + 1.0/3.0),
    hue2rgb(p, q, c.x),
    hue2rgb(p, q, c.x - 1.0/3.0)
  );
}

void main() {
  vec4 color = texture(u_input, v_uv);
  vec3 hsl = rgb2hsl(color.rgb);

  hsl.x = fract(hsl.x + u_hue);
  hsl.y = clamp(hsl.y + u_saturation, 0.0, 1.0);
  hsl.z = clamp(hsl.z + u_lightness, 0.0, 1.0);

  fragColor = vec4(hsl2rgb(hsl), color.a);
}`,
    uniforms: [],
  },
};

// Invert
export const invert: NodeDefinition = {
  id: 'invert',
  name: 'Invert',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);
  fragColor = vec4(1.0 - color.rgb, color.a);
}`,
    uniforms: [],
  },
};

// Gaussian Blur
export const blur: NodeDefinition = {
  id: 'blur',
  name: 'Blur',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'radius', name: 'Radius', type: 'float', default: 2, min: 0, max: 20 },
    { id: 'quality', name: 'Quality', type: 'int', default: 8, min: 4, max: 16 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_radius;
uniform int u_quality;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;
  vec4 color = vec4(0.0);
  float total = 0.0;

  for (int x = -8; x <= 8; x++) {
    for (int y = -8; y <= 8; y++) {
      if (abs(x) > u_quality || abs(y) > u_quality) continue;

      vec2 offset = vec2(float(x), float(y)) * texel * u_radius;
      float weight = 1.0 - length(vec2(x, y)) / float(u_quality);
      if (weight > 0.0) {
        color += texture(u_input, fract(v_uv + offset)) * weight;
        total += weight;
      }
    }
  }

  fragColor = color / total;
}`,
    uniforms: [],
  },
};

// Edge Detection
export const edgeDetect: NodeDefinition = {
  id: 'edge_detect',
  name: 'Edge Detect',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'strength', name: 'Strength', type: 'float', default: 1, min: 0, max: 5 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_strength;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;

  float tl = texture(u_input, fract(v_uv + vec2(-texel.x, -texel.y))).r;
  float tc = texture(u_input, fract(v_uv + vec2(0.0, -texel.y))).r;
  float tr = texture(u_input, fract(v_uv + vec2(texel.x, -texel.y))).r;
  float ml = texture(u_input, fract(v_uv + vec2(-texel.x, 0.0))).r;
  float mr = texture(u_input, fract(v_uv + vec2(texel.x, 0.0))).r;
  float bl = texture(u_input, fract(v_uv + vec2(-texel.x, texel.y))).r;
  float bc = texture(u_input, fract(v_uv + vec2(0.0, texel.y))).r;
  float br = texture(u_input, fract(v_uv + vec2(texel.x, texel.y))).r;

  // Sobel operator
  float gx = -tl - 2.0*ml - bl + tr + 2.0*mr + br;
  float gy = -tl - 2.0*tc - tr + bl + 2.0*bc + br;

  float edge = sqrt(gx*gx + gy*gy) * u_strength;

  fragColor = vec4(vec3(clamp(edge, 0.0, 1.0)), 1.0);
}`,
    uniforms: [],
  },
};

// Normal from Height
export const normalFromHeight: NodeDefinition = {
  id: 'normal_from_height',
  name: 'Normal from Height',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Height', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Normal', type: 'color' }],
  parameters: [
    { id: 'strength', name: 'Strength', type: 'float', default: 1, min: 0.1, max: 10 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_strength;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;

  float left = texture(u_input, fract(v_uv - vec2(texel.x, 0))).r;
  float right = texture(u_input, fract(v_uv + vec2(texel.x, 0))).r;
  float down = texture(u_input, fract(v_uv - vec2(0, texel.y))).r;
  float up = texture(u_input, fract(v_uv + vec2(0, texel.y))).r;

  vec3 normal = normalize(vec3(
    (left - right) * u_strength,
    (down - up) * u_strength,
    1.0
  ));

  fragColor = vec4(normal * 0.5 + 0.5, 1.0);
}`,
    uniforms: [],
  },
};

// Transform
export const transform: NodeDefinition = {
  id: 'transform',
  name: 'Transform',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'offsetX', name: 'Offset X', type: 'float', default: 0, min: -1, max: 1 },
    { id: 'offsetY', name: 'Offset Y', type: 'float', default: 0, min: -1, max: 1 },
    { id: 'scale', name: 'Scale', type: 'float', default: 1, min: 0.1, max: 4 },
    { id: 'rotation', name: 'Rotation', type: 'float', default: 0, min: 0, max: 360 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_offsetX;
uniform float u_offsetY;
uniform float u_scale;
uniform float u_rotation;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 uv = v_uv - 0.5;

  // Scale
  uv /= u_scale;

  // Rotate
  float rad = u_rotation * 3.14159265 / 180.0;
  float c = cos(rad);
  float s = sin(rad);
  uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);

  // Offset and wrap
  uv = fract(uv + 0.5 + vec2(u_offsetX, u_offsetY));

  fragColor = texture(u_input, uv);
}`,
    uniforms: [],
  },
};

// Tile
export const tile: NodeDefinition = {
  id: 'tile',
  name: 'Tile',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'tilesX', name: 'Tiles X', type: 'float', default: 2, min: 1, max: 10 },
    { id: 'tilesY', name: 'Tiles Y', type: 'float', default: 2, min: 1, max: 10 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_tilesX;
uniform float u_tilesY;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 uv = fract(v_uv * vec2(u_tilesX, u_tilesY));
  fragColor = texture(u_input, uv);
}`,
    uniforms: [],
  },
};

export const filterNodes: NodeDefinition[] = [
  levels,
  hslAdjust,
  invert,
  blur,
  edgeDetect,
  normalFromHeight,
  transform,
  tile,
];
