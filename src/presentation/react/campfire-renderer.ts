const vertexSource = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;
const fragmentSource = `
precision mediump float;
uniform sampler2D scene;
uniform vec2 resolution;
uniform vec4 imageRect;
uniform float time;
void main() {
  vec2 pixel = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
  vec2 uv = (pixel - imageRect.xy) / imageRect.zw;
  // Only redraw the campfire. Everything else stays on the original background.
  vec2 local = (uv - vec2(0.352, 0.501)) / vec2(0.085, 0.167);
  float mask = 1.0 - smoothstep(0.65, 1.0, length(local));
  if (mask <= 0.0) discard;
  vec3 original = texture2D(scene, vec2(uv.x, 1.0 - uv.y)).rgb;
  float rise = clamp((0.617 - uv.y) / 0.25, 0.0, 1.0);
  float wave = sin(uv.y * 112.0 + time * 4.8) + 0.45 * sin(uv.y * 237.0 - time * 7.1 + uv.x * 81.0);
  vec2 offset = vec2(wave * 0.0028 * rise, sin(time * 5.2 + uv.x * 147.0) * 0.0045 * rise);
  vec3 moved = texture2D(scene, vec2(uv.x + offset.x, 1.0 - uv.y - offset.y)).rgb;
  float heat = smoothstep(0.3, 0.75, max(original.r, moved.r)) * (1.0 - smoothstep(0.65, 0.9, original.b));
  float flicker = 1.0 + 0.055 * sin(time * 8.3) + 0.025 * sin(time * 13.7);
  vec3 color = mix(original, moved * flicker, heat * mask);
  // Small rising embers stay inside the fire's immediate surroundings.
  for (int i = 0; i < 5; i++) {
    float seed = float(i);
    float phase = fract(time * (0.16 + seed * 0.013) + seed * 0.193);
    vec2 ember = vec2(0.352 + sin(seed * 4.7 + phase * 4.0) * 0.027, 0.566 - phase * 0.21);
    float spark = (1.0 - smoothstep(0.0004, 0.0015, length((uv - ember) * vec2(1.0, 0.56)))) * sin(phase * 3.14159);
    color += vec3(1.0, 0.32, 0.06) * spark * 0.7;
  }
  gl_FragColor = vec4(color, mask);
}
`;

/** Deforms only the painted flames; never modifies the underlying image asset. */
export function animateCampfire(canvas: HTMLCanvasElement, ready: () => void) {
  const context = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!context) return () => {};
  const gl = context;
  const shaders: WebGLShader[] = [];
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Shader unavailable");
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error("Shader unavailable");
    return shader;
  };
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  let frame = 0;
  let disposed = false;
  let loaded = false;
  const image = new Image();
  const cleanup = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    image.onload = null;
    image.onerror = null;
    document.removeEventListener("visibilitychange", visibility);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.deleteTexture(texture);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
  };
  let lastFrame = 0;
  function draw(now: number) {
    if (disposed || document.hidden || !loaded || !program) return;
    frame = requestAnimationFrame(draw);
    if (now - lastFrame < 1000 / 30) return;
    lastFrame = now;
    const box = canvas.getBoundingClientRect();
    const scale = Math.min(1, 1600 / box.width);
    const width = Math.max(1, Math.round(box.width * scale));
    const height = Math.max(1, Math.round(box.height * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const mobile = matchMedia("(max-width: 740px)").matches;
    const imageScale = mobile
      ? 710 / image.height
      : Math.max(box.width / image.width, box.height / image.height);
    const drawWidth = image.width * imageScale;
    const drawHeight = image.height * imageScale;
    const left = (box.width - drawWidth) * (mobile ? 0.36 : 0.5);
    const top = mobile ? 0 : (box.height - drawHeight) * 0.5;
    gl.uniform2f(gl.getUniformLocation(program, "resolution"), width, height);
    gl.uniform4f(
      gl.getUniformLocation(program, "imageRect"),
      left * scale,
      top * scale,
      drawWidth * scale,
      drawHeight * scale,
    );
    gl.uniform1f(gl.getUniformLocation(program, "time"), now / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function visibility() {
    cancelAnimationFrame(frame);
    if (!document.hidden && loaded && !disposed)
      frame = requestAnimationFrame(draw);
  }
  try {
    if (!program || !buffer || !texture) throw new Error("WebGL unavailable");
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw new Error("Program unavailable");
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    image.onload = () => {
      if (disposed) return;
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      loaded = true;
      ready();
      document.addEventListener("visibilitychange", visibility);
      frame = requestAnimationFrame(draw);
    };
    image.src = "/assets/backgrounds/forest-camp-portal.png";
    return cleanup;
  } catch {
    cleanup();
    return () => {};
  }
}
