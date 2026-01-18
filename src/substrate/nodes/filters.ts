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

// Curves Adjustment
export const curves: NodeDefinition = {
  id: 'curves',
  name: 'Curves',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'blackPoint', name: 'Black Point', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'shadows', name: 'Shadows', type: 'float', default: 0.25, min: 0, max: 1 },
    { id: 'midtones', name: 'Midtones', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'highlights', name: 'Highlights', type: 'float', default: 0.75, min: 0, max: 1 },
    { id: 'whitePoint', name: 'White Point', type: 'float', default: 1, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_blackPoint;
uniform float u_shadows;
uniform float u_midtones;
uniform float u_highlights;
uniform float u_whitePoint;

in vec2 v_uv;
out vec4 fragColor;

float curveInterpolate(float t, float p0, float p1, float p2, float p3, float p4) {
  // Simple 5-point curve interpolation using smoothstep segments
  if (t < 0.25) {
    return mix(p0, p1, smoothstep(0.0, 0.25, t) * 4.0);
  } else if (t < 0.5) {
    return mix(p1, p2, (t - 0.25) * 4.0);
  } else if (t < 0.75) {
    return mix(p2, p3, (t - 0.5) * 4.0);
  } else {
    return mix(p3, p4, (t - 0.75) * 4.0);
  }
}

void main() {
  vec4 color = texture(u_input, v_uv);
  float value = curveInterpolate(color.r, u_blackPoint, u_shadows, u_midtones, u_highlights, u_whitePoint);
  fragColor = vec4(vec3(clamp(value, 0.0, 1.0)), color.a);
}`,
    uniforms: [],
  },
};

// Posterize
export const posterize: NodeDefinition = {
  id: 'posterize',
  name: 'Posterize',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'levels', name: 'Levels', type: 'int', default: 4, min: 2, max: 32 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform int u_levels;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);
  float n = float(u_levels);
  vec3 posterized = floor(color.rgb * n) / (n - 1.0);
  fragColor = vec4(posterized, color.a);
}`,
    uniforms: [],
  },
};

// Clamp
export const clamp: NodeDefinition = {
  id: 'clamp',
  name: 'Clamp',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'min', name: 'Min', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'max', name: 'Max', type: 'float', default: 1, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_min;
uniform float u_max;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);
  vec3 clamped = clamp(color.rgb, u_min, u_max);
  fragColor = vec4(clamped, color.a);
}`,
    uniforms: [],
  },
};

// Directional Blur
export const directionalBlur: NodeDefinition = {
  id: 'directional_blur',
  name: 'Directional Blur',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'angle', name: 'Angle', type: 'float', default: 0, min: 0, max: 360 },
    { id: 'strength', name: 'Strength', type: 'float', default: 10, min: 0, max: 50 },
    { id: 'samples', name: 'Samples', type: 'int', default: 16, min: 4, max: 32 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_angle;
uniform float u_strength;
uniform int u_samples;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float rad = u_angle * 3.14159265 / 180.0;
  vec2 dir = vec2(cos(rad), sin(rad)) / u_resolution * u_strength;

  vec4 color = vec4(0.0);
  float total = 0.0;

  for (int i = 0; i < 32; i++) {
    if (i >= u_samples) break;
    float t = float(i) / float(u_samples - 1) - 0.5;
    vec2 offset = dir * t;
    color += texture(u_input, fract(v_uv + offset));
    total += 1.0;
  }

  fragColor = color / total;
}`,
    uniforms: [],
  },
};

// Radial Blur
export const radialBlur: NodeDefinition = {
  id: 'radial_blur',
  name: 'Radial Blur',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'centerX', name: 'Center X', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'centerY', name: 'Center Y', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'strength', name: 'Strength', type: 'float', default: 0.1, min: 0, max: 0.5 },
    { id: 'samples', name: 'Samples', type: 'int', default: 16, min: 4, max: 32 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_centerX;
uniform float u_centerY;
uniform float u_strength;
uniform int u_samples;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 dir = v_uv - center;

  vec4 color = vec4(0.0);
  float total = 0.0;

  for (int i = 0; i < 32; i++) {
    if (i >= u_samples) break;
    float t = float(i) / float(u_samples - 1);
    float scale = 1.0 - u_strength * t;
    vec2 sampleUV = center + dir * scale;
    color += texture(u_input, fract(sampleUV));
    total += 1.0;
  }

  fragColor = color / total;
}`,
    uniforms: [],
  },
};

// Anisotropic Blur
export const anisotropicBlur: NodeDefinition = {
  id: 'anisotropic_blur',
  name: 'Anisotropic Blur',
  category: 'filter',
  inputs: [
    { id: 'input', name: 'Input', type: 'rgba', required: true },
    { id: 'direction', name: 'Direction', type: 'color', required: true },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'strength', name: 'Strength', type: 'float', default: 10, min: 0, max: 50 },
    { id: 'samples', name: 'Samples', type: 'int', default: 16, min: 4, max: 32 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform sampler2D u_direction;
uniform vec2 u_resolution;
uniform float u_strength;
uniform int u_samples;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 dir = (texture(u_direction, v_uv).rg * 2.0 - 1.0) / u_resolution * u_strength;

  vec4 color = vec4(0.0);
  float total = 0.0;

  for (int i = 0; i < 32; i++) {
    if (i >= u_samples) break;
    float t = float(i) / float(u_samples - 1) - 0.5;
    vec2 offset = dir * t;
    color += texture(u_input, fract(v_uv + offset));
    total += 1.0;
  }

  fragColor = color / total;
}`,
    uniforms: [],
  },
};

// Dilate
export const dilate: NodeDefinition = {
  id: 'dilate',
  name: 'Dilate',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'radius', name: 'Radius', type: 'int', default: 1, min: 1, max: 10 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform int u_radius;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;
  float maxVal = 0.0;

  for (int x = -10; x <= 10; x++) {
    for (int y = -10; y <= 10; y++) {
      if (abs(x) > u_radius || abs(y) > u_radius) continue;
      vec2 offset = vec2(float(x), float(y)) * texel;
      float val = texture(u_input, fract(v_uv + offset)).r;
      maxVal = max(maxVal, val);
    }
  }

  fragColor = vec4(vec3(maxVal), 1.0);
}`,
    uniforms: [],
  },
};

// Erode
export const erode: NodeDefinition = {
  id: 'erode',
  name: 'Erode',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'radius', name: 'Radius', type: 'int', default: 1, min: 1, max: 10 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform int u_radius;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;
  float minVal = 1.0;

  for (int x = -10; x <= 10; x++) {
    for (int y = -10; y <= 10; y++) {
      if (abs(x) > u_radius || abs(y) > u_radius) continue;
      vec2 offset = vec2(float(x), float(y)) * texel;
      float val = texture(u_input, fract(v_uv + offset)).r;
      minVal = min(minVal, val);
    }
  }

  fragColor = vec4(vec3(minVal), 1.0);
}`,
    uniforms: [],
  },
};

// Distance Field
export const distance: NodeDefinition = {
  id: 'distance',
  name: 'Distance',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'spread', name: 'Spread', type: 'float', default: 32, min: 1, max: 128 },
    { id: 'threshold', name: 'Threshold', type: 'float', default: 0.5, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_spread;
uniform float u_threshold;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;
  float center = texture(u_input, v_uv).r;
  bool inside = center > u_threshold;

  float minDist = u_spread;

  for (float x = -32.0; x <= 32.0; x += 1.0) {
    for (float y = -32.0; y <= 32.0; y += 1.0) {
      if (abs(x) > u_spread || abs(y) > u_spread) continue;
      vec2 offset = vec2(x, y) * texel;
      float sample = texture(u_input, fract(v_uv + offset)).r;
      bool sampleInside = sample > u_threshold;

      if (sampleInside != inside) {
        float dist = length(vec2(x, y));
        minDist = min(minDist, dist);
      }
    }
  }

  float normalizedDist = minDist / u_spread;
  float value = inside ? 0.5 + normalizedDist * 0.5 : 0.5 - normalizedDist * 0.5;

  fragColor = vec4(vec3(clamp(value, 0.0, 1.0)), 1.0);
}`,
    uniforms: [],
  },
};

// Warp
export const warp: NodeDefinition = {
  id: 'warp',
  name: 'Warp',
  category: 'filter',
  inputs: [
    { id: 'input', name: 'Input', type: 'rgba', required: true },
    { id: 'displacement', name: 'Displacement', type: 'color', required: true },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'strength', name: 'Strength', type: 'float', default: 0.1, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform sampler2D u_displacement;
uniform float u_strength;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 disp = texture(u_displacement, v_uv).rg * 2.0 - 1.0;
  vec2 uv = fract(v_uv + disp * u_strength);
  fragColor = texture(u_input, uv);
}`,
    uniforms: [],
  },
};

// Twirl
export const twirl: NodeDefinition = {
  id: 'twirl',
  name: 'Twirl',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'centerX', name: 'Center X', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'centerY', name: 'Center Y', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'radius', name: 'Radius', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'angle', name: 'Angle', type: 'float', default: 180, min: -720, max: 720 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_centerX;
uniform float u_centerY;
uniform float u_radius;
uniform float u_angle;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 uv = v_uv - center;
  float dist = length(uv);

  if (dist < u_radius) {
    float percent = (u_radius - dist) / u_radius;
    float theta = percent * percent * u_angle * 3.14159265 / 180.0;
    float c = cos(theta);
    float s = sin(theta);
    uv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
  }

  fragColor = texture(u_input, fract(uv + center));
}`,
    uniforms: [],
  },
};

// Spherize
export const spherize: NodeDefinition = {
  id: 'spherize',
  name: 'Spherize',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'centerX', name: 'Center X', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'centerY', name: 'Center Y', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'radius', name: 'Radius', type: 'float', default: 0.4, min: 0, max: 1 },
    { id: 'strength', name: 'Strength', type: 'float', default: 0.5, min: -1, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_centerX;
uniform float u_centerY;
uniform float u_radius;
uniform float u_strength;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 center = vec2(u_centerX, u_centerY);
  vec2 uv = v_uv - center;
  float dist = length(uv);

  if (dist < u_radius) {
    float percent = dist / u_radius;
    float newDist;
    if (u_strength > 0.0) {
      newDist = pow(percent, 1.0 + u_strength) * u_radius;
    } else {
      newDist = pow(percent, 1.0 / (1.0 - u_strength)) * u_radius;
    }
    uv = normalize(uv) * newDist;
  }

  fragColor = texture(u_input, fract(uv + center));
}`,
    uniforms: [],
  },
};

// Displace
export const displace: NodeDefinition = {
  id: 'displace',
  name: 'Displace',
  category: 'filter',
  inputs: [
    { id: 'input', name: 'Input', type: 'rgba', required: true },
    { id: 'height', name: 'Height Map', type: 'grayscale', required: true },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'strength', name: 'Strength', type: 'float', default: 0.1, min: 0, max: 0.5 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform sampler2D u_height;
uniform vec2 u_resolution;
uniform float u_strength;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;

  float left = texture(u_height, fract(v_uv - vec2(texel.x, 0.0))).r;
  float right = texture(u_height, fract(v_uv + vec2(texel.x, 0.0))).r;
  float down = texture(u_height, fract(v_uv - vec2(0.0, texel.y))).r;
  float up = texture(u_height, fract(v_uv + vec2(0.0, texel.y))).r;

  vec2 disp = vec2(left - right, down - up) * u_strength;
  fragColor = texture(u_input, fract(v_uv + disp));
}`,
    uniforms: [],
  },
};

// Height from Normal
export const heightFromNormal: NodeDefinition = {
  id: 'height_from_normal',
  name: 'Height from Normal',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Normal', type: 'color', required: true }],
  outputs: [{ id: 'out', name: 'Height', type: 'grayscale' }],
  parameters: [
    { id: 'iterations', name: 'Iterations', type: 'int', default: 64, min: 16, max: 256 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform int u_iterations;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  // Approximate height integration from normal map
  // Uses a simplified Poisson solver approach
  vec2 texel = 1.0 / u_resolution;
  vec3 normal = texture(u_input, v_uv).rgb * 2.0 - 1.0;

  float height = 0.5;
  float scale = 1.0 / float(u_iterations);

  for (int i = 0; i < 256; i++) {
    if (i >= u_iterations) break;

    vec2 offset = vec2(float(i % 16) - 8.0, float(i / 16) - 8.0) * texel * 2.0;
    vec3 sampleNormal = texture(u_input, fract(v_uv + offset)).rgb * 2.0 - 1.0;

    height += dot(sampleNormal.xy, offset) * scale;
  }

  fragColor = vec4(vec3(clamp(height, 0.0, 1.0)), 1.0);
}`,
    uniforms: [],
  },
};

// Curvature
export const curvature: NodeDefinition = {
  id: 'curvature',
  name: 'Curvature',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Normal', type: 'color', required: true }],
  outputs: [{ id: 'out', name: 'Curvature', type: 'grayscale' }],
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

  vec3 center = texture(u_input, v_uv).rgb * 2.0 - 1.0;
  vec3 left = texture(u_input, fract(v_uv - vec2(texel.x, 0.0))).rgb * 2.0 - 1.0;
  vec3 right = texture(u_input, fract(v_uv + vec2(texel.x, 0.0))).rgb * 2.0 - 1.0;
  vec3 down = texture(u_input, fract(v_uv - vec2(0.0, texel.y))).rgb * 2.0 - 1.0;
  vec3 up = texture(u_input, fract(v_uv + vec2(0.0, texel.y))).rgb * 2.0 - 1.0;

  float curvature = (dot(center, left) + dot(center, right) + dot(center, up) + dot(center, down)) * 0.25;
  curvature = (1.0 - curvature) * u_strength;

  fragColor = vec4(vec3(clamp(curvature * 0.5 + 0.5, 0.0, 1.0)), 1.0);
}`,
    uniforms: [],
  },
};

// Ambient Occlusion
export const ambientOcclusion: NodeDefinition = {
  id: 'ambient_occlusion',
  name: 'Ambient Occlusion',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Height', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'AO', type: 'grayscale' }],
  parameters: [
    { id: 'radius', name: 'Radius', type: 'float', default: 10, min: 1, max: 50 },
    { id: 'intensity', name: 'Intensity', type: 'float', default: 1, min: 0, max: 3 },
    { id: 'samples', name: 'Samples', type: 'int', default: 16, min: 4, max: 32 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_radius;
uniform float u_intensity;
uniform int u_samples;

in vec2 v_uv;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 texel = 1.0 / u_resolution;
  float centerHeight = texture(u_input, v_uv).r;
  float ao = 0.0;

  for (int i = 0; i < 32; i++) {
    if (i >= u_samples) break;

    float angle = float(i) * 6.28318 / float(u_samples);
    float r = hash(v_uv + float(i)) * u_radius;
    vec2 offset = vec2(cos(angle), sin(angle)) * r * texel;

    float sampleHeight = texture(u_input, fract(v_uv + offset)).r;
    float heightDiff = sampleHeight - centerHeight;

    if (heightDiff > 0.0) {
      ao += heightDiff * (1.0 - r / u_radius);
    }
  }

  ao = ao / float(u_samples) * u_intensity;
  float value = 1.0 - clamp(ao, 0.0, 1.0);

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Gradient Extract
export const gradientExtract: NodeDefinition = {
  id: 'gradient_extract',
  name: 'Gradient Extract',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [
    { id: 'magnitude', name: 'Magnitude', type: 'grayscale' },
    { id: 'direction', name: 'Direction', type: 'color' },
  ],
  parameters: [
    { id: 'scale', name: 'Scale', type: 'float', default: 1, min: 0.1, max: 5 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_scale;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;

  float left = texture(u_input, fract(v_uv - vec2(texel.x, 0.0))).r;
  float right = texture(u_input, fract(v_uv + vec2(texel.x, 0.0))).r;
  float down = texture(u_input, fract(v_uv - vec2(0.0, texel.y))).r;
  float up = texture(u_input, fract(v_uv + vec2(0.0, texel.y))).r;

  vec2 gradient = vec2(right - left, up - down) * u_scale;
  float magnitude = length(gradient);
  vec2 direction = normalize(gradient) * 0.5 + 0.5;

  // Output direction in RG, magnitude in B
  fragColor = vec4(direction, magnitude, 1.0);
}`,
    uniforms: [],
  },
};

// Safe Transform (tiling-aware)
export const safeTransform: NodeDefinition = {
  id: 'safe_transform',
  name: 'Safe Transform',
  category: 'filter',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'offsetX', name: 'Offset X', type: 'float', default: 0, min: -1, max: 1 },
    { id: 'offsetY', name: 'Offset Y', type: 'float', default: 0, min: -1, max: 1 },
    { id: 'scale', name: 'Scale', type: 'float', default: 1, min: 0.1, max: 4 },
    { id: 'rotation', name: 'Rotation', type: 'float', default: 0, min: 0, max: 360 },
    { id: 'blendEdge', name: 'Blend Edge', type: 'float', default: 0.1, min: 0, max: 0.5 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_offsetX;
uniform float u_offsetY;
uniform float u_scale;
uniform float u_rotation;
uniform float u_blendEdge;

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

  // Offset
  uv = uv + 0.5 + vec2(u_offsetX, u_offsetY);

  // Sample with edge blending for seamless tiling
  vec4 color = texture(u_input, fract(uv));

  // Edge blend weights
  vec2 edgeDist = min(fract(uv), 1.0 - fract(uv));
  float edgeBlend = smoothstep(0.0, u_blendEdge, min(edgeDist.x, edgeDist.y));

  // Sample adjacent tiles for blending
  vec4 colorX = texture(u_input, fract(uv + vec2(1.0, 0.0)));
  vec4 colorY = texture(u_input, fract(uv + vec2(0.0, 1.0)));

  color = mix(mix(colorX, colorY, 0.5), color, edgeBlend);

  fragColor = color;
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
  curves,
  posterize,
  clamp,
  directionalBlur,
  radialBlur,
  anisotropicBlur,
  dilate,
  erode,
  distance,
  warp,
  twirl,
  spherize,
  displace,
  heightFromNormal,
  curvature,
  ambientOcclusion,
  gradientExtract,
  safeTransform,
];
