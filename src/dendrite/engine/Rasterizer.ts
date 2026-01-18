// GPU-accelerated Rasterization Pipeline for Branch Graphs

import type { BranchGraph, RasterizationSettings } from '../../shared/types';
import { WebGLRenderer } from '../../shared/webgl/WebGLRenderer';
import { Framebuffer } from '../../shared/webgl/Framebuffer';
import { ShaderProgram } from '../../shared/webgl/ShaderProgram';

// Shader sources
const LINE_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_normal;
in float a_thickness;
in vec3 a_data; // x: distance from start, y: segment ID, z: order

uniform vec2 u_resolution;
uniform mat3 u_transform;

out float v_thickness;
out vec3 v_data;
out vec2 v_position;

void main() {
  vec3 transformed = u_transform * vec3(a_position, 1.0);
  vec2 pos = transformed.xy + a_normal * a_thickness;
  v_position = pos;
  v_thickness = a_thickness;
  v_data = a_data;

  vec2 clipPos = (pos / u_resolution) * 2.0 - 1.0;
  gl_Position = vec4(clipPos.x, -clipPos.y, 0.0, 1.0);
}
`;

const LINE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in float v_thickness;
in vec3 v_data;
in vec2 v_position;

layout(location = 0) out vec4 o_seed;
layout(location = 1) out vec4 o_thickness;
layout(location = 2) out vec4 o_id;

void main() {
  // Seed for JFA: store position
  o_seed = vec4(v_position, v_data.x, 1.0);

  // Thickness map
  o_thickness = vec4(vec3(v_data.z), 1.0);

  // ID map: encode segment ID as RGB
  float id = v_data.y;
  o_id = vec4(
    mod(id, 256.0) / 255.0,
    mod(floor(id / 256.0), 256.0) / 255.0,
    floor(id / 65536.0) / 255.0,
    1.0
  );
}
`;

const JFA_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_stepSize;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 current = texture(u_input, v_uv);
  vec2 currentPos = current.xy;
  float currentDist = current.z;

  if (current.w == 0.0) {
    currentDist = 999999.0;
  }

  vec2 pixelPos = v_uv * u_resolution;

  // Sample 8 neighbors + center
  for (int dy = -1; dy <= 1; dy++) {
    for (int dx = -1; dx <= 1; dx++) {
      vec2 offset = vec2(float(dx), float(dy)) * u_stepSize;
      vec2 sampleUV = v_uv + offset / u_resolution;

      if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
        continue;
      }

      vec4 sample_val = texture(u_input, sampleUV);
      if (sample_val.w > 0.0) {
        float dist = distance(pixelPos, sample_val.xy);
        if (dist < currentDist) {
          currentDist = dist;
          currentPos = sample_val.xy;
        }
      }
    }
  }

  fragColor = vec4(currentPos, currentDist, current.w > 0.0 || currentDist < 999999.0 ? 1.0 : 0.0);
}
`;

const DISTANCE_FIELD_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_jfa;
uniform vec2 u_resolution;
uniform float u_maxDistance;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 jfa = texture(u_jfa, v_uv);
  vec2 pixelPos = v_uv * u_resolution;

  float dist = 0.0;
  if (jfa.w > 0.0) {
    dist = distance(pixelPos, jfa.xy);
  } else {
    dist = u_maxDistance;
  }

  float normalized = clamp(dist / u_maxDistance, 0.0, 1.0);
  fragColor = vec4(vec3(normalized), 1.0);
}
`;

const DIRECTION_FIELD_SHADER = `#version 300 es
precision highp float;

uniform sampler2D u_jfa;
uniform vec2 u_resolution;

in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 jfa = texture(u_jfa, v_uv);
  vec2 pixelPos = v_uv * u_resolution;

  if (jfa.w > 0.0) {
    vec2 dir = normalize(jfa.xy - pixelPos);
    // Encode direction as RG (range -1 to 1 mapped to 0 to 1)
    fragColor = vec4(dir * 0.5 + 0.5, 0.0, 1.0);
  } else {
    fragColor = vec4(0.5, 0.5, 0.0, 1.0);
  }
}
`;

export interface RasterizerOutput {
  distance?: HTMLCanvasElement;
  direction?: HTMLCanvasElement;
  thickness?: HTMLCanvasElement;
  depth?: HTMLCanvasElement;
  id?: HTMLCanvasElement;
}

export class Rasterizer {
  private renderer: WebGLRenderer;
  private lineShader: ShaderProgram;
  private jfaShader: ShaderProgram;
  private distanceShader: ShaderProgram;
  private directionShader: ShaderProgram;
  private lineVAO: WebGLVertexArrayObject;
  private lineVBO: WebGLBuffer;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer(canvas);
    const gl = this.renderer.getContext();

    // Compile shaders
    this.lineShader = new ShaderProgram(gl, LINE_VERTEX_SHADER, LINE_FRAGMENT_SHADER);
    this.jfaShader = this.renderer.createShader(JFA_SHADER, 'jfa');
    this.distanceShader = this.renderer.createShader(DISTANCE_FIELD_SHADER, 'distance');
    this.directionShader = this.renderer.createShader(DIRECTION_FIELD_SHADER, 'direction');

    // Create line geometry buffers
    this.lineVAO = gl.createVertexArray()!;
    this.lineVBO = gl.createBuffer()!;

    gl.bindVertexArray(this.lineVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineVBO);

    // Position: 2 floats
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0);

    // Normal: 2 floats
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 8);

    // Thickness: 1 float
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 32, 16);

    // Data (distance, id, order): 3 floats
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 32, 20);

    gl.bindVertexArray(null);
  }

  rasterize(
    graph: BranchGraph,
    settings: RasterizationSettings
  ): RasterizerOutput {
    const { resolution, maps } = settings;
    const gl = this.renderer.getContext();

    this.renderer.resize(resolution, resolution);

    // Calculate transform to fit graph in canvas
    const transform = this.calculateTransform(graph, resolution);

    // Generate line geometry
    const lineData = this.generateLineGeometry(graph);

    // Upload geometry
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineVBO);
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.DYNAMIC_DRAW);

    // Create framebuffers for multi-target rendering
    const seedFB = this.renderer.createFramebuffer({
      width: resolution,
      height: resolution,
      format: 'RGBA32F',
    });

    const thicknessFB = this.renderer.createFramebuffer({
      width: resolution,
      height: resolution,
      format: 'RGBA8',
    });

    const idFB = this.renderer.createFramebuffer({
      width: resolution,
      height: resolution,
      format: 'RGBA8',
    });

    // Render lines to multiple targets
    this.renderLines(
      lineData.length / 8, // 8 floats per vertex
      transform,
      resolution,
      seedFB,
      thicknessFB,
      idFB
    );

    // Run Jump Flood Algorithm
    const jfaResult = this.runJFA(seedFB, resolution);

    // Generate output maps
    const output: RasterizerOutput = {};

    if (maps.includes('distance')) {
      output.distance = this.generateDistanceMap(jfaResult, resolution);
    }

    if (maps.includes('direction')) {
      output.direction = this.generateDirectionMap(jfaResult, resolution);
    }

    if (maps.includes('thickness')) {
      output.thickness = this.framebufferToCanvas(thicknessFB);
    }

    if (maps.includes('id')) {
      output.id = this.framebufferToCanvas(idFB);
    }

    // Cleanup
    seedFB.dispose();
    thicknessFB.dispose();
    idFB.dispose();
    jfaResult.dispose();

    return output;
  }

  private calculateTransform(
    graph: BranchGraph,
    resolution: number
  ): Float32Array {
    const { bounds } = graph;
    const width = bounds.max.x - bounds.min.x;
    const height = bounds.max.y - bounds.min.y;
    const scale = (resolution * 0.9) / Math.max(width, height);

    const offsetX = (resolution - width * scale) / 2 - bounds.min.x * scale;
    const offsetY = (resolution - height * scale) / 2 - bounds.min.y * scale;

    // 3x3 transformation matrix (column-major)
    return new Float32Array([
      scale, 0, 0,
      0, scale, 0,
      offsetX, offsetY, 1,
    ]);
  }

  private generateLineGeometry(graph: BranchGraph): Float32Array {
    const vertices: number[] = [];
    let segmentId = 0;

    graph.segments.forEach(segment => {
      const startNode = graph.nodes.get(segment.start);
      const endNode = graph.nodes.get(segment.end);

      if (!startNode || !endNode) return;

      const p0 = startNode.position;
      const p1 = endNode.position;
      const thickness0 = startNode.attributes.thickness * 3;
      const thickness1 = endNode.attributes.thickness * 3;
      const order0 = startNode.order / 10;
      const order1 = endNode.order / 10;

      // Calculate perpendicular normal
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;

      const nx = -dy / len;
      const ny = dx / len;

      // Create quad (2 triangles, 6 vertices)
      // Vertex format: position(2), normal(2), thickness(1), data(3)

      // Triangle 1
      vertices.push(p0.x, p0.y, nx, ny, thickness0, 0, segmentId, order0);
      vertices.push(p0.x, p0.y, -nx, -ny, thickness0, 0, segmentId, order0);
      vertices.push(p1.x, p1.y, nx, ny, thickness1, len, segmentId, order1);

      // Triangle 2
      vertices.push(p0.x, p0.y, -nx, -ny, thickness0, 0, segmentId, order0);
      vertices.push(p1.x, p1.y, -nx, -ny, thickness1, len, segmentId, order1);
      vertices.push(p1.x, p1.y, nx, ny, thickness1, len, segmentId, order1);

      segmentId++;
    });

    return new Float32Array(vertices);
  }

  private renderLines(
    vertexCount: number,
    transform: Float32Array,
    resolution: number,
    seedFB: Framebuffer,
    thicknessFB: Framebuffer,
    idFB: Framebuffer
  ): void {
    const gl = this.renderer.getContext();

    // For WebGL2, we need to use MRT (Multiple Render Targets)
    // Create a combined framebuffer with multiple attachments
    const combinedFB = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, combinedFB);

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      seedFB.getTexture(),
      0
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT1,
      gl.TEXTURE_2D,
      thicknessFB.getTexture(),
      0
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT2,
      gl.TEXTURE_2D,
      idFB.getTexture(),
      0
    );

    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
    ]);

    gl.viewport(0, 0, resolution, resolution);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.lineShader.use();

    const transformLoc = gl.getUniformLocation(
      (this.lineShader as unknown as { program: WebGLProgram }).program || null,
      'u_transform'
    );
    const resolutionLoc = gl.getUniformLocation(
      (this.lineShader as unknown as { program: WebGLProgram }).program || null,
      'u_resolution'
    );

    // Get program from shader
    gl.uniformMatrix3fv(transformLoc, false, transform);
    gl.uniform2f(resolutionLoc, resolution, resolution);

    gl.bindVertexArray(this.lineVAO);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    gl.bindVertexArray(null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(combinedFB);
  }

  private runJFA(seedFB: Framebuffer, resolution: number): Framebuffer {
    const gl = this.renderer.getContext();

    // Create ping-pong buffers
    let currentFB = this.renderer.createFramebuffer({
      width: resolution,
      height: resolution,
      format: 'RGBA32F',
    });

    let nextFB = this.renderer.createFramebuffer({
      width: resolution,
      height: resolution,
      format: 'RGBA32F',
    });

    // Copy seed to current
    currentFB.bind();
    gl.viewport(0, 0, resolution, resolution);

    // Use passthrough shader to copy
    const passthrough = this.renderer.createShader(
      `#version 300 es
      precision highp float;
      uniform sampler2D u_input;
      in vec2 v_uv;
      out vec4 fragColor;
      void main() { fragColor = texture(u_input, v_uv); }`,
      'passthrough'
    );
    passthrough.use();
    this.renderer.bindTexture(seedFB.getTexture(), 0);
    passthrough.setUniform1i('u_input', 0);
    this.renderer.drawFullscreenQuad();
    currentFB.unbind();

    // JFA passes
    this.jfaShader.use();
    this.jfaShader.setUniform2f('u_resolution', resolution, resolution);

    let stepSize = Math.floor(resolution / 2);
    while (stepSize >= 1) {
      nextFB.bind();
      gl.viewport(0, 0, resolution, resolution);

      this.renderer.bindTexture(currentFB.getTexture(), 0);
      this.jfaShader.setUniform1i('u_input', 0);
      this.jfaShader.setUniform1f('u_stepSize', stepSize);
      this.renderer.drawFullscreenQuad();

      nextFB.unbind();

      // Swap buffers
      const temp = currentFB;
      currentFB = nextFB;
      nextFB = temp;

      stepSize = Math.floor(stepSize / 2);
    }

    // Cleanup
    nextFB.dispose();

    return currentFB;
  }

  private generateDistanceMap(jfaFB: Framebuffer, resolution: number): HTMLCanvasElement {
    const gl = this.renderer.getContext();

    const outputFB = this.renderer.createFramebuffer({
      width: resolution,
      height: resolution,
      format: 'RGBA8',
    });

    outputFB.bind();
    gl.viewport(0, 0, resolution, resolution);

    this.distanceShader.use();
    this.renderer.bindTexture(jfaFB.getTexture(), 0);
    this.distanceShader.setUniform1i('u_jfa', 0);
    this.distanceShader.setUniform2f('u_resolution', resolution, resolution);
    this.distanceShader.setUniform1f('u_maxDistance', resolution * 0.2);
    this.renderer.drawFullscreenQuad();

    outputFB.unbind();

    const canvas = this.framebufferToCanvas(outputFB);
    outputFB.dispose();

    return canvas;
  }

  private generateDirectionMap(jfaFB: Framebuffer, resolution: number): HTMLCanvasElement {
    const gl = this.renderer.getContext();

    const outputFB = this.renderer.createFramebuffer({
      width: resolution,
      height: resolution,
      format: 'RGBA8',
    });

    outputFB.bind();
    gl.viewport(0, 0, resolution, resolution);

    this.directionShader.use();
    this.renderer.bindTexture(jfaFB.getTexture(), 0);
    this.directionShader.setUniform1i('u_jfa', 0);
    this.directionShader.setUniform2f('u_resolution', resolution, resolution);
    this.renderer.drawFullscreenQuad();

    outputFB.unbind();

    const canvas = this.framebufferToCanvas(outputFB);
    outputFB.dispose();

    return canvas;
  }

  private framebufferToCanvas(fb: Framebuffer): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = fb.width;
    canvas.height = fb.height;

    const ctx = canvas.getContext('2d')!;
    const pixels = fb.readPixels() as Uint8Array;
    const imageData = ctx.createImageData(fb.width, fb.height);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  dispose(): void {
    const gl = this.renderer.getContext();
    gl.deleteBuffer(this.lineVBO);
    gl.deleteVertexArray(this.lineVAO);
    this.lineShader.dispose();
    this.renderer.dispose();
  }
}
