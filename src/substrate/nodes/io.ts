// Input/Output Nodes

import type { NodeDefinition } from '../../shared/types';

// Image Input (placeholder - actual loading done in UI)
export const imageInput: NodeDefinition = {
  id: 'image_input',
  name: 'Image Input',
  category: 'input',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'imageUrl', name: 'Image', type: 'enum', default: '', options: [] },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_imageUrl;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_imageUrl, v_uv);
}`,
    uniforms: [],
  },
};

// Output Nodes (mark final outputs)
export const colorOutput: NodeDefinition = {
  id: 'color_output',
  name: 'Color Output',
  category: 'output',
  inputs: [{ id: 'input', name: 'Color', type: 'color', required: true }],
  outputs: [],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_input, v_uv);
}`,
    uniforms: [],
  },
};

export const normalOutput: NodeDefinition = {
  id: 'normal_output',
  name: 'Normal Output',
  category: 'output',
  inputs: [{ id: 'input', name: 'Normal', type: 'color', required: true }],
  outputs: [],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_input, v_uv);
}`,
    uniforms: [],
  },
};

export const roughnessOutput: NodeDefinition = {
  id: 'roughness_output',
  name: 'Roughness Output',
  category: 'output',
  inputs: [{ id: 'input', name: 'Roughness', type: 'grayscale', required: true }],
  outputs: [],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float r = texture(u_input, v_uv).r;
  fragColor = vec4(vec3(r), 1.0);
}`,
    uniforms: [],
  },
};

export const heightOutput: NodeDefinition = {
  id: 'height_output',
  name: 'Height Output',
  category: 'output',
  inputs: [{ id: 'input', name: 'Height', type: 'grayscale', required: true }],
  outputs: [],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float h = texture(u_input, v_uv).r;
  fragColor = vec4(vec3(h), 1.0);
}`,
    uniforms: [],
  },
};

export const aoOutput: NodeDefinition = {
  id: 'ao_output',
  name: 'AO Output',
  category: 'output',
  inputs: [{ id: 'input', name: 'AO', type: 'grayscale', required: true }],
  outputs: [],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float ao = texture(u_input, v_uv).r;
  fragColor = vec4(vec3(ao), 1.0);
}`,
    uniforms: [],
  },
};

// Metallic Output
export const metallicOutput: NodeDefinition = {
  id: 'metallic_output',
  name: 'Metallic Output',
  category: 'output',
  inputs: [{ id: 'input', name: 'Metallic', type: 'grayscale', required: true }],
  outputs: [],
  parameters: [],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  float m = texture(u_input, v_uv).r;
  fragColor = vec4(vec3(m), 1.0);
}`,
    uniforms: [],
  },
};

// Graph Input (for subgraphs)
export const graphInput: NodeDefinition = {
  id: 'graph_input',
  name: 'Graph Input',
  category: 'input',
  inputs: [],
  outputs: [{ id: 'out', name: 'Output', type: 'rgba' }],
  parameters: [
    { id: 'name', name: 'Name', type: 'enum', default: 'input', options: [{ value: 'input', label: 'Input' }] },
    { id: 'type', name: 'Type', type: 'int', default: 0, min: 0, max: 3 },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  // Placeholder - actual input is bound at runtime
  fragColor = vec4(0.5, 0.5, 0.5, 1.0);
}`,
    uniforms: [],
  },
};

// Graph Output (for subgraphs)
export const graphOutput: NodeDefinition = {
  id: 'graph_output',
  name: 'Graph Output',
  category: 'output',
  inputs: [{ id: 'input', name: 'Input', type: 'rgba', required: true }],
  outputs: [],
  parameters: [
    { id: 'name', name: 'Name', type: 'enum', default: 'output', options: [{ value: 'output', label: 'Output' }] },
  ],
  shader: {
    fragment: `#version 300 es
precision highp float;

uniform sampler2D u_input;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  fragColor = texture(u_input, v_uv);
}`,
    uniforms: [],
  },
};

export const ioNodes: NodeDefinition[] = [
  imageInput,
  colorOutput,
  normalOutput,
  roughnessOutput,
  heightOutput,
  aoOutput,
  metallicOutput,
  graphInput,
  graphOutput,
];
