// WebGL Shader Program abstraction

export class ShaderProgram {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private uniformLocations: Map<string, WebGLUniformLocation> = new Map();
  private attributeLocations: Map<string, number> = new Map();

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    this.gl = gl;

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    this.program = gl.createProgram()!;
    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(this.program);
      gl.deleteProgram(this.program);
      throw new Error(`Program link failed: ${error}`);
    }

    // Clean up shaders after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }

  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compile failed: ${error}`);
    }

    return shader;
  }

  use(): void {
    this.gl.useProgram(this.program);
  }

  getUniformLocation(name: string): WebGLUniformLocation | null {
    if (!this.uniformLocations.has(name)) {
      const location = this.gl.getUniformLocation(this.program, name);
      if (location !== null) {
        this.uniformLocations.set(name, location);
      }
      return location;
    }
    return this.uniformLocations.get(name) || null;
  }

  getAttributeLocation(name: string): number {
    if (!this.attributeLocations.has(name)) {
      const location = this.gl.getAttribLocation(this.program, name);
      this.attributeLocations.set(name, location);
    }
    return this.attributeLocations.get(name)!;
  }

  setUniform1f(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) this.gl.uniform1f(location, value);
  }

  setUniform1i(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) this.gl.uniform1i(location, value);
  }

  setUniform2f(name: string, x: number, y: number): void {
    const location = this.getUniformLocation(name);
    if (location) this.gl.uniform2f(location, x, y);
  }

  setUniform3f(name: string, x: number, y: number, z: number): void {
    const location = this.getUniformLocation(name);
    if (location) this.gl.uniform3f(location, x, y, z);
  }

  setUniform4f(name: string, x: number, y: number, z: number, w: number): void {
    const location = this.getUniformLocation(name);
    if (location) this.gl.uniform4f(location, x, y, z, w);
  }

  setUniformMatrix4fv(name: string, value: Float32Array): void {
    const location = this.getUniformLocation(name);
    if (location) this.gl.uniformMatrix4fv(location, false, value);
  }

  dispose(): void {
    this.gl.deleteProgram(this.program);
  }
}

// Default vertex shader for fullscreen quad
export const FULLSCREEN_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_uv;

void main() {
  v_uv = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// Passthrough fragment shader
export const PASSTHROUGH_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_input;

void main() {
  fragColor = texture(u_input, v_uv);
}
`;
