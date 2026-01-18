// Substrate Shader Pipeline - Executes node graph on GPU

import { WebGLRenderer } from '../../shared/webgl/WebGLRenderer';
import { Framebuffer } from '../../shared/webgl/Framebuffer';
import { ShaderProgram } from '../../shared/webgl/ShaderProgram';
import type { GraphEngine, CompiledGraph } from './GraphEngine';
import type { NodeDefinition, GraphNode } from '../../shared/types';

interface NodeRenderState {
  framebuffer: Framebuffer | null;
  dirty: boolean;
}

export class ShaderPipeline {
  private renderer: WebGLRenderer;
  private graphEngine: GraphEngine;
  private shaderCache: Map<string, ShaderProgram> = new Map();
  private nodeStates: Map<string, NodeRenderState> = new Map();
  private resolution: number = 1024;

  constructor(canvas: HTMLCanvasElement, graphEngine: GraphEngine) {
    this.renderer = new WebGLRenderer(canvas);
    this.graphEngine = graphEngine;
  }

  setResolution(resolution: number): void {
    this.resolution = resolution;
    // Mark all nodes as dirty when resolution changes
    this.nodeStates.forEach(state => {
      state.dirty = true;
    });
  }

  getResolution(): number {
    return this.resolution;
  }

  execute(): Map<string, Framebuffer> {
    const compiled = this.graphEngine.compile();
    const outputs = new Map<string, Framebuffer>();

    // Execute nodes in topological order
    for (const nodeId of compiled.executionOrder) {
      const node = compiled.nodeMap.get(nodeId);
      if (!node) continue;

      const definition = this.graphEngine.getNodeDefinition(node.type);
      if (!definition) continue;

      const result = this.executeNode(node, definition, compiled, outputs);
      if (result) {
        outputs.set(nodeId, result);
      }
    }

    return outputs;
  }

  executeNode(
    node: GraphNode,
    definition: NodeDefinition,
    compiled: CompiledGraph,
    previousOutputs: Map<string, Framebuffer>
  ): Framebuffer | null {
    // Get or create shader for this node type
    const shader = this.getOrCreateShader(definition);
    if (!shader) return null;

    // Create framebuffer for output
    const outputFB = this.renderer.createFramebuffer({
      width: this.resolution,
      height: this.resolution,
      format: 'RGBA8',
      wrap: 'repeat',
    });

    // Bind output
    outputFB.bind();

    const gl = this.renderer.getContext();
    gl.viewport(0, 0, this.resolution, this.resolution);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use shader
    shader.use();

    // Set resolution uniform
    shader.setUniform2f('u_resolution', this.resolution, this.resolution);

    // Bind input textures
    const inputConnections = compiled.inputMap.get(node.id);
    let textureUnit = 0;

    if (inputConnections) {
      for (const [inputId, sourceNodeId] of inputConnections) {
        const sourceOutput = previousOutputs.get(sourceNodeId);
        if (sourceOutput) {
          this.renderer.bindTexture(sourceOutput.getTexture(), textureUnit);
          shader.setUniform1i(`u_${inputId}`, textureUnit);
          textureUnit++;
        }
      }
    }

    // Set parameter uniforms
    for (const paramDef of definition.parameters) {
      const value = node.parameters[paramDef.id] ?? paramDef.default;
      this.setUniformValue(shader, `u_${paramDef.id}`, paramDef.type, value);
    }

    // Draw fullscreen quad
    this.renderer.drawFullscreenQuad();

    outputFB.unbind();

    return outputFB;
  }

  private getOrCreateShader(definition: NodeDefinition): ShaderProgram | null {
    if (!definition.shader) return null;

    if (this.shaderCache.has(definition.id)) {
      return this.shaderCache.get(definition.id)!;
    }

    try {
      const shader = this.renderer.createShader(
        definition.shader.fragment,
        definition.id
      );
      this.shaderCache.set(definition.id, shader);
      return shader;
    } catch (error) {
      console.error(`Failed to compile shader for ${definition.id}:`, error);
      return null;
    }
  }

  private setUniformValue(
    shader: ShaderProgram,
    name: string,
    type: string,
    value: unknown
  ): void {
    switch (type) {
      case 'float':
        shader.setUniform1f(name, value as number);
        break;
      case 'int':
        shader.setUniform1i(name, value as number);
        break;
      case 'bool':
        shader.setUniform1i(name, value ? 1 : 0);
        break;
      case 'color':
        const color = value as { r: number; g: number; b: number; a?: number };
        shader.setUniform4f(name, color.r, color.g, color.b, color.a ?? 1);
        break;
      case 'enum':
        shader.setUniform1i(name, value as number);
        break;
    }
  }

  getNodeOutput(nodeId: string): Framebuffer | null {
    return this.nodeStates.get(nodeId)?.framebuffer || null;
  }

  renderToCanvas(nodeId: string): void {
    const outputs = this.execute();
    const fb = outputs.get(nodeId);

    if (!fb) return;

    const gl = this.renderer.getContext();
    const canvas = this.renderer.getCanvas();

    // Render to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    const passthrough = this.renderer.createShader(
      `#version 300 es
      precision highp float;
      uniform sampler2D u_input;
      in vec2 v_uv;
      out vec4 fragColor;
      void main() {
        fragColor = texture(u_input, v_uv);
      }`,
      'passthrough'
    );

    passthrough.use();
    this.renderer.bindTexture(fb.getTexture(), 0);
    passthrough.setUniform1i('u_input', 0);
    this.renderer.drawFullscreenQuad();

    // Cleanup
    outputs.forEach(fb => fb.dispose());
  }

  exportNode(nodeId: string): HTMLCanvasElement | null {
    const outputs = this.execute();
    const fb = outputs.get(nodeId);

    if (!fb) {
      outputs.forEach(fb => fb.dispose());
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = this.resolution;
    canvas.height = this.resolution;

    const ctx = canvas.getContext('2d')!;
    const pixels = fb.readPixels() as Uint8Array;
    const imageData = ctx.createImageData(this.resolution, this.resolution);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    outputs.forEach(fb => fb.dispose());

    return canvas;
  }

  dispose(): void {
    this.shaderCache.forEach(shader => shader.dispose());
    this.nodeStates.forEach(state => state.framebuffer?.dispose());
    this.shaderCache.clear();
    this.nodeStates.clear();
    this.renderer.dispose();
  }
}
