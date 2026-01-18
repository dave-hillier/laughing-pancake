// Utility Nodes - Channel operations and color manipulation

import type { NodeDefinition } from '../../shared/types';

// Channel Split
export const channelSplit: NodeDefinition = {
  id: 'channel_split',
  name: 'Channel Split',
  category: 'utility',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [
    { id: 'r', name: 'Red', type: 'grayscale' },
    { id: 'g', name: 'Green', type: 'grayscale' },
    { id: 'b', name: 'Blue', type: 'grayscale' },
    { id: 'a', name: 'Alpha', type: 'grayscale' },
  ],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 color = texture(u_input, v_uv);
  // Output all channels packed - renderer handles unpacking
  fragColor = color;
}`,
    uniforms: [],
  },
};

// Channel Combine
export const channelCombine: NodeDefinition = {
  id: 'channel_combine',
  name: 'Channel Combine',
  category: 'utility',
  inputs: [
    { id: 'r', name: 'Red', type: 'grayscale', required: false, default: 0 },
    { id: 'g', name: 'Green', type: 'grayscale', required: false, default: 0 },
    { id: 'b', name: 'Blue', type: 'grayscale', required: false, default: 0 },
    { id: 'a', name: 'Alpha', type: 'grayscale', required: false, default: 1 },
  ],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_r;
uniform sampler2D u_g;
uniform sampler2D u_b;
uniform sampler2D u_a;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float r = texture(u_r, v_uv).r;
  float g = texture(u_g, v_uv).r;
  float b = texture(u_b, v_uv).r;
  float a = texture(u_a, v_uv).r;
  fragColor = vec4(r, g, b, a);
}`,
    uniforms: [],
  },
};

// Sample Color (Gradient Lookup)
export const sampleColor: NodeDefinition = {
  id: 'sample_color',
  name: 'Sample Color',
  category: 'utility',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'color' }],
  parameters: [
    { id: 'color1', name: 'Color 1', type: 'color', default: { r: 0, g: 0, b: 0, a: 1 } },
    { id: 'color2', name: 'Color 2', type: 'color', default: { r: 1, g: 1, b: 1, a: 1 } },
    { id: 'color3', name: 'Color 3', type: 'color', default: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
    { id: 'pos1', name: 'Position 1', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'pos2', name: 'Position 2', type: 'float', default: 1, min: 0, max: 1 },
    { id: 'pos3', name: 'Position 3', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'useThirdColor', name: 'Use Third Color', type: 'bool', default: false },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_pos1;
uniform float u_pos2;
uniform float u_pos3;
uniform int u_useThirdColor;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float t = texture(u_input, v_uv).r;

  vec4 color;
  if (u_useThirdColor == 1) {
    // Three-color gradient
    if (t < u_pos3) {
      float localT = (t - u_pos1) / (u_pos3 - u_pos1);
      color = mix(u_color1, u_color3, clamp(localT, 0.0, 1.0));
    } else {
      float localT = (t - u_pos3) / (u_pos2 - u_pos3);
      color = mix(u_color3, u_color2, clamp(localT, 0.0, 1.0));
    }
  } else {
    // Two-color gradient
    float localT = (t - u_pos1) / (u_pos2 - u_pos1);
    color = mix(u_color1, u_color2, clamp(localT, 0.0, 1.0));
  }

  fragColor = color;
}`,
    uniforms: [],
  },
};

// Histogram Scan
export const histogramScan: NodeDefinition = {
  id: 'histogram_scan',
  name: 'Histogram Scan',
  category: 'utility',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'position', name: 'Position', type: 'float', default: 0.5, min: 0, max: 1 },
    { id: 'contrast', name: 'Contrast', type: 'float', default: 0.5, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_position;
uniform float u_contrast;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float value = texture(u_input, v_uv).r;

  // Remap based on position and contrast
  float range = 1.0 - u_contrast;
  float low = u_position - range * 0.5;
  float high = u_position + range * 0.5;

  float result = smoothstep(low, high, value);

  fragColor = vec4(vec3(result), 1.0);
}`,
    uniforms: [],
  },
};

// Remap (value remapping)
export const remap: NodeDefinition = {
  id: 'remap',
  name: 'Remap',
  category: 'utility',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'inMin', name: 'Input Min', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'inMax', name: 'Input Max', type: 'float', default: 1, min: 0, max: 1 },
    { id: 'outMin', name: 'Output Min', type: 'float', default: 0, min: 0, max: 1 },
    { id: 'outMax', name: 'Output Max', type: 'float', default: 1, min: 0, max: 1 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform float u_inMin;
uniform float u_inMax;
uniform float u_outMin;
uniform float u_outMax;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float value = texture(u_input, v_uv).r;
  float t = (value - u_inMin) / (u_inMax - u_inMin);
  float result = mix(u_outMin, u_outMax, clamp(t, 0.0, 1.0));
  fragColor = vec4(vec3(result), 1.0);
}`,
    uniforms: [],
  },
};

// Grayscale to Color
export const grayscaleToColor: NodeDefinition = {
  id: 'grayscale_to_color',
  name: 'Grayscale to Color',
  category: 'utility',
  inputs: [{ id: 'input', name: 'Input', type: 'grayscale', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'color' }],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float value = texture(u_input, v_uv).r;
  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

// Color to Grayscale
export const colorToGrayscale: NodeDefinition = {
  id: 'color_to_grayscale',
  name: 'Color to Grayscale',
  category: 'utility',
  inputs: [{ id: 'input', name: 'Input', type: 'color', required: true }],
  outputs: [{ id: 'out', name: 'Output', type: 'grayscale' }],
  parameters: [
    { id: 'mode', name: 'Mode', type: 'int', default: 0, min: 0, max: 3 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform int u_mode;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec3 color = texture(u_input, v_uv).rgb;
  float value;

  if (u_mode == 0) {
    // Luminance (perceptual)
    value = dot(color, vec3(0.2126, 0.7152, 0.0722));
  } else if (u_mode == 1) {
    // Average
    value = (color.r + color.g + color.b) / 3.0;
  } else if (u_mode == 2) {
    // Lightness (HSL)
    value = (max(max(color.r, color.g), color.b) + min(min(color.r, color.g), color.b)) / 2.0;
  } else {
    // Value (HSV)
    value = max(max(color.r, color.g), color.b);
  }

  fragColor = vec4(vec3(value), 1.0);
}`,
    uniforms: [],
  },
};

export const utilityNodes: NodeDefinition[] = [
  channelSplit,
  channelCombine,
  sampleColor,
  histogramScan,
  remap,
  grayscaleToColor,
  colorToGrayscale,
];
