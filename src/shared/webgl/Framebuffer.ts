// WebGL Framebuffer abstraction with pooling

export type TextureFormat = 'R8' | 'RG8' | 'RGBA8' | 'R16F' | 'RG16F' | 'RGBA16F' | 'R32F' | 'RGBA32F';

export interface FramebufferOptions {
  width: number;
  height: number;
  format: TextureFormat;
  filter?: 'linear' | 'nearest';
  wrap?: 'repeat' | 'clamp';
}

export class Framebuffer {
  private gl: WebGL2RenderingContext;
  private framebuffer: WebGLFramebuffer;
  private texture: WebGLTexture;
  readonly width: number;
  readonly height: number;
  readonly format: TextureFormat;

  constructor(gl: WebGL2RenderingContext, options: FramebufferOptions) {
    this.gl = gl;
    this.width = options.width;
    this.height = options.height;
    this.format = options.format;

    // Create texture
    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    const { internalFormat, format, type } = this.getFormatParams(options.format);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, options.width, options.height, 0, format, type, null);

    // Set texture parameters
    const filter = options.filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);

    const wrap = options.wrap === 'clamp' ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);

    // Create framebuffer
    this.framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

    // Check completeness
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer incomplete: ${status}`);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  private getFormatParams(format: TextureFormat): {
    internalFormat: number;
    format: number;
    type: number;
  } {
    const gl = this.gl;
    switch (format) {
      case 'R8':
        return { internalFormat: gl.R8, format: gl.RED, type: gl.UNSIGNED_BYTE };
      case 'RG8':
        return { internalFormat: gl.RG8, format: gl.RG, type: gl.UNSIGNED_BYTE };
      case 'RGBA8':
        return { internalFormat: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };
      case 'R16F':
        return { internalFormat: gl.R16F, format: gl.RED, type: gl.HALF_FLOAT };
      case 'RG16F':
        return { internalFormat: gl.RG16F, format: gl.RG, type: gl.HALF_FLOAT };
      case 'RGBA16F':
        return { internalFormat: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT };
      case 'R32F':
        return { internalFormat: gl.R32F, format: gl.RED, type: gl.FLOAT };
      case 'RGBA32F':
        return { internalFormat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT };
      default:
        return { internalFormat: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };
    }
  }

  bind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
    this.gl.viewport(0, 0, this.width, this.height);
  }

  unbind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  getTexture(): WebGLTexture {
    return this.texture;
  }

  readPixels(): Uint8Array | Float32Array {
    this.bind();
    const { format, type } = this.getFormatParams(this.format);

    let channels = 4;
    if (format === this.gl.RED) channels = 1;
    else if (format === this.gl.RG) channels = 2;

    const isFloat = type === this.gl.FLOAT || type === this.gl.HALF_FLOAT;
    const data = isFloat
      ? new Float32Array(this.width * this.height * channels)
      : new Uint8Array(this.width * this.height * channels);

    // WebGL2 requires reading RGBA for non-RGBA formats
    if (channels < 4) {
      const tempData = isFloat
        ? new Float32Array(this.width * this.height * 4)
        : new Uint8Array(this.width * this.height * 4);
      this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, type, tempData);
      // Extract needed channels
      for (let i = 0; i < this.width * this.height; i++) {
        for (let c = 0; c < channels; c++) {
          data[i * channels + c] = tempData[i * 4 + c];
        }
      }
    } else {
      this.gl.readPixels(0, 0, this.width, this.height, this.gl.RGBA, type, data);
    }

    this.unbind();
    return data;
  }

  dispose(): void {
    this.gl.deleteFramebuffer(this.framebuffer);
    this.gl.deleteTexture(this.texture);
  }
}

// Framebuffer pool for reuse
export class FramebufferPool {
  private gl: WebGL2RenderingContext;
  private pool: Map<string, Framebuffer[]> = new Map();
  private inUse: Set<Framebuffer> = new Set();

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  private getKey(options: FramebufferOptions): string {
    return `${options.width}x${options.height}_${options.format}_${options.filter || 'linear'}_${options.wrap || 'repeat'}`;
  }

  acquire(options: FramebufferOptions): Framebuffer {
    const key = this.getKey(options);
    const available = this.pool.get(key) || [];

    let fb: Framebuffer;
    if (available.length > 0) {
      fb = available.pop()!;
    } else {
      fb = new Framebuffer(this.gl, options);
    }

    this.inUse.add(fb);
    return fb;
  }

  release(fb: Framebuffer): void {
    if (!this.inUse.has(fb)) return;

    this.inUse.delete(fb);
    const key = `${fb.width}x${fb.height}_${fb.format}`;
    const available = this.pool.get(key) || [];
    available.push(fb);
    this.pool.set(key, available);
  }

  releaseAll(): void {
    this.inUse.forEach(fb => this.release(fb));
  }

  dispose(): void {
    this.inUse.forEach(fb => fb.dispose());
    this.pool.forEach(fbs => fbs.forEach(fb => fb.dispose()));
    this.pool.clear();
    this.inUse.clear();
  }
}
