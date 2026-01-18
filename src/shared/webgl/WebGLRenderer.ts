// WebGL Renderer with fullscreen quad support

import { ShaderProgram, FULLSCREEN_VERTEX_SHADER } from './ShaderProgram';
import { Framebuffer, FramebufferPool, type FramebufferOptions } from './Framebuffer';

export class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private quadVAO: WebGLVertexArrayObject;
  private quadVBO: WebGLBuffer;
  private framebufferPool: FramebufferPool;
  private shaderCache: Map<string, ShaderProgram> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;
    this.framebufferPool = new FramebufferPool(gl);

    // Create fullscreen quad
    const quadData = new Float32Array([
      // positions    // texCoords
      -1.0, -1.0, 0.0, 0.0,
      1.0, -1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0, 1.0,
      1.0, 1.0, 1.0, 1.0,
    ]);

    this.quadVAO = gl.createVertexArray()!;
    this.quadVBO = gl.createBuffer()!;

    gl.bindVertexArray(this.quadVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadData, gl.STATIC_DRAW);

    // Position attribute
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);

    // TexCoord attribute
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

    gl.bindVertexArray(null);

    // Enable extensions for float textures
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
  }

  getContext(): WebGL2RenderingContext {
    return this.gl;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  getFramebufferPool(): FramebufferPool {
    return this.framebufferPool;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
  }

  clear(r = 0, g = 0, b = 0, a = 1): void {
    this.gl.clearColor(r, g, b, a);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  createShader(fragmentSource: string, cacheKey?: string): ShaderProgram {
    if (cacheKey && this.shaderCache.has(cacheKey)) {
      return this.shaderCache.get(cacheKey)!;
    }

    const shader = new ShaderProgram(this.gl, FULLSCREEN_VERTEX_SHADER, fragmentSource);

    if (cacheKey) {
      this.shaderCache.set(cacheKey, shader);
    }

    return shader;
  }

  createFramebuffer(options: FramebufferOptions): Framebuffer {
    return new Framebuffer(this.gl, options);
  }

  acquireFramebuffer(options: FramebufferOptions): Framebuffer {
    return this.framebufferPool.acquire(options);
  }

  releaseFramebuffer(fb: Framebuffer): void {
    this.framebufferPool.release(fb);
  }

  drawFullscreenQuad(): void {
    this.gl.bindVertexArray(this.quadVAO);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.gl.bindVertexArray(null);
  }

  bindTexture(texture: WebGLTexture, unit: number): void {
    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
  }

  createTexture(
    data: Uint8Array | Float32Array | null,
    width: number,
    height: number,
    format: 'R8' | 'RGBA8' | 'RGBA32F' = 'RGBA8'
  ): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    let internalFormat: number, texFormat: number, type: number;
    switch (format) {
      case 'R8':
        internalFormat = gl.R8;
        texFormat = gl.RED;
        type = gl.UNSIGNED_BYTE;
        break;
      case 'RGBA32F':
        internalFormat = gl.RGBA32F;
        texFormat = gl.RGBA;
        type = gl.FLOAT;
        break;
      default:
        internalFormat = gl.RGBA8;
        texFormat = gl.RGBA;
        type = gl.UNSIGNED_BYTE;
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, texFormat, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    return texture;
  }

  loadTexture(url: string): Promise<WebGLTexture> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        const gl = this.gl;
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        resolve(texture);
      };
      image.onerror = reject;
      image.src = url;
    });
  }

  dispose(): void {
    this.gl.deleteBuffer(this.quadVBO);
    this.gl.deleteVertexArray(this.quadVAO);
    this.framebufferPool.dispose();
    this.shaderCache.forEach(shader => shader.dispose());
    this.shaderCache.clear();
  }
}
