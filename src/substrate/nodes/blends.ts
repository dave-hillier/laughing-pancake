// Blend Nodes - Combine multiple inputs

import type { NodeDefinition } from '../../shared/types';

// Basic Blend
export const blend: NodeDefinition = {
  id: 'blend',
  name: 'Blend',
  category: 'blend',
  inputs: [
    { id: 'a', name: 'Input A', type: 'rgba', required: true },
    { id: 'b', name: 'Input B', type: 'rgba', required: true },
    { id: 'mask', name: 'Mask', type: 'grayscale', required: false },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    {
      id: 'mode',
      name: 'Mode',
      type: 'int',
      default: 0,
      min: 0,
      max: 11,
    },
    { id: 'opacity', name: 'Opacity', type: 'float', default: 1, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_a;
uniform sampler2D u_b;
uniform sampler2D u_mask;
uniform int u_mode;
uniform float u_opacity;

in vec2 v_uv;
out vec4 fragColor;

vec3 blendMode(vec3 base, vec3 blend, int mode) {
  if (mode == 0) { // Normal
    return blend;
  } else if (mode == 1) { // Multiply
    return base * blend;
  } else if (mode == 2) { // Screen
    return 1.0 - (1.0 - base) * (1.0 - blend);
  } else if (mode == 3) { // Overlay
    return mix(
      2.0 * base * blend,
      1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
      step(0.5, base)
    );
  } else if (mode == 4) { // Soft Light
    return mix(
      2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
      sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
      step(0.5, blend)
    );
  } else if (mode == 5) { // Hard Light
    return mix(
      2.0 * base * blend,
      1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
      step(0.5, blend)
    );
  } else if (mode == 6) { // Add
    return min(base + blend, 1.0);
  } else if (mode == 7) { // Subtract
    return max(base - blend, 0.0);
  } else if (mode == 8) { // Difference
    return abs(base - blend);
  } else if (mode == 9) { // Exclusion
    return base + blend - 2.0 * base * blend;
  } else if (mode == 10) { // Darken
    return min(base, blend);
  } else if (mode == 11) { // Lighten
    return max(base, blend);
  }
  return blend;
}

void main() {
  vec4 colorA = texture(u_a, v_uv);
  vec4 colorB = texture(u_b, v_uv);
  float mask = texture(u_mask, v_uv).r;

  vec3 blended = blendMode(colorA.rgb, colorB.rgb, u_mode);
  float alpha = mix(colorA.a, colorB.a, u_opacity * mask);

  fragColor = vec4(mix(colorA.rgb, blended, u_opacity * mask), alpha);
}`,
    uniforms: [],
  },
};

// Height Blend
export const heightBlend: NodeDefinition = {
  id: 'height_blend',
  name: 'Height Blend',
  category: 'blend',
  inputs: [
    { id: 'a', name: 'Input A', type: 'rgba', required: true },
    { id: 'b', name: 'Input B', type: 'rgba', required: true },
    { id: 'heightA', name: 'Height A', type: 'grayscale', required: true },
    { id: 'heightB', name: 'Height B', type: 'grayscale', required: true },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'contrast', name: 'Contrast', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'bias', name: 'Bias', type: 'float', default: 0.5, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_a;
uniform sampler2D u_b;
uniform sampler2D u_heightA;
uniform sampler2D u_heightB;
uniform float u_contrast;
uniform float u_bias;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 colorA = texture(u_a, v_uv);
  vec4 colorB = texture(u_b, v_uv);
  float hA = texture(u_heightA, v_uv).r + u_bias;
  float hB = texture(u_heightB, v_uv).r + (1.0 - u_bias);

  float depth = u_contrast * 0.5;
  float blend = clamp((hA - hB + depth) / (2.0 * depth), 0.0, 1.0);

  fragColor = mix(colorB, colorA, blend);
}`,
    uniforms: [],
  },
};

// Switch
export const switchNode: NodeDefinition = {
  id: 'switch',
  name: 'Switch',
  category: 'blend',
  inputs: [
    { id: 'a', name: 'Input A', type: 'rgba', required: true },
    { id: 'b', name: 'Input B', type: 'rgba', required: true },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'select', name: 'Select B', type: 'bool', default: false },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_a;
uniform sampler2D u_b;
uniform int u_select;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = u_select == 1 ? texture(u_b, v_uv) : texture(u_a, v_uv);
}`,
    uniforms: [],
  },
};

// Lerp (Linear Interpolation)
export const lerp: NodeDefinition = {
  id: 'lerp',
  name: 'Lerp',
  category: 'blend',
  inputs: [
    { id: 'a', name: 'Input A', type: 'rgba', required: true },
    { id: 'b', name: 'Input B', type: 'rgba', required: true },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 't', name: 'Mix', type: 'float', default: 0.5, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_a;
uniform sampler2D u_b;
uniform float u_t;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 colorA = texture(u_a, v_uv);
  vec4 colorB = texture(u_b, v_uv);
  fragColor = mix(colorA, colorB, u_t);
}`,
    uniforms: [],
  },
};

export const blendNodes: NodeDefinition[] = [
  blend,
  heightBlend,
  switchNode,
  lerp,
];
