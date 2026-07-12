/* ========================= 14 WEBGL PILOT (S1-D075) ========================= *
 * Experimental true-3D world layer, gated behind ?r3d=1 — John's "just
 * acceptable" verdict on the parallax camera (S1-D074) plus his explicit
 * ask to try WebGL. Raw WebGL (no three.js, no dependency — the ~150-line
 * matrix/render code below IS the whole "library"; the single-file,
 * dependency-free build discipline holds). Presentation-only: el.x/el.y,
 * saves, and every sim distance are read exactly as the 2D path reads them
 * (depthQ, unchanged) — nothing here can affect a save file or a suite that
 * asserts world state. Default OFF (r3d unset); if WebGL context creation
 * fails for any reason, r3dReady() returns false and drawWorld silently
 * uses the existing 2D path — the pilot can never crash the game.
 *
 * The trick that makes this affordable: every kind's LOOK already exists as
 * a 2D brush-renderer function (10-world-render.js). Rather than duplicate
 * that art for a 3D pipeline, an offscreen "stamp" canvas calls the SAME
 * functions (through drawGroundMatter, shared with the 2D path) with W/H/S/
 * wx temporarily swapped to the stamp's small canvas, and uploads the
 * result as a billboard texture — every character's existing symbol just
 * becomes a sprite standing in a real 3D scene.
 *
 * Logged pilot limitations (honest, not hidden): no ground-plane ambient
 * particles (leaves, steam) in 3D space — 2D-only for now; the base `fire`
 * kind's flame animates via the ~140ms texture refresh, not true per-frame
 * flicker; no contact shadows. E2 ignition glow (fire↔flammable — the
 * mechanic closest to the coming sandbox-interaction milestone, S1-D068(3))
 * DOES stay live every frame via drawBurnFx's position override. */
const R3D_ON = QUERY.get('r3d') === '1';
window.__S1_R3D = { on: R3D_ON, active: false, fallback: null };

/* ---- tiny column-major mat4 (hand-rolled, no dependency) ---- */
function m4Multiply(a, b){
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++){
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function m4Perspective(fovY, aspect, near, far){
  const f = 1 / Math.tan(fovY / 2), nf = 1 / (near - far);
  const o = new Float32Array(16);
  o[0] = f / aspect; o[5] = f; o[10] = (far + near) * nf; o[11] = -1; o[14] = 2 * far * near * nf;
  return o;
}
function m4LookAt(eye, center, up){
  let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  const zl = Math.hypot(zx, zy, zz) || 1; zx /= zl; zy /= zl; zz /= zl;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz) || 1; xx /= xl; xy /= xl; xz /= xl;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  const o = new Float32Array(16);
  o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0;
  o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0;
  o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
  o[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  o[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  o[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  o[15] = 1;
  return o;
}
function m4TransformPoint(m, p){
  const x = p[0], y = p[1], z = p[2], w = p[3];
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12] * w,
    m[1] * x + m[5] * y + m[9] * z + m[13] * w,
    m[2] * x + m[6] * y + m[10] * z + m[14] * w,
    m[3] * x + m[7] * y + m[11] * z + m[15] * w,
  ];
}

const R3D = {
  gl: null, glCanvas: null, program: null, ready: false,
  aCorner: -1, uViewProj: -1, uView: -1, uCenter: -1, uContentSize: -1, uUVRect: -1,
  uFogColor: -1, uFogNear: -1, uFogFar: -1, uTex: -1,
  quadBuf: null, view: null, proj: null, viewProj: null,
  textures: new Map(), stampCanvas: null, stampCtx: null,
};
let RASTERIZING_SPRITE = false; // guards addParticle (06-combat.js) during sprite stamping
function r3dReady(){ return R3D.ready; }

function r3dCompile(gl, type, src){
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)){
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('shader compile failed: ' + info);
  }
  return sh;
}
function r3dInit(){
  if (!R3D_ON) return;
  try {
    const c = document.createElement('canvas');
    c.width = Math.max(1, W * DPR); c.height = Math.max(1, H * DPR);
    const gl = c.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: true })
            || c.getContext('experimental-webgl', { alpha: true });
    if (!gl) throw new Error('no webgl context available');
    const vsSrc =
      'attribute vec2 aCorner;' + // fixed unit quad: x -0.5..0.5, y 0(ground)..1(top) — same for every sprite
      'uniform vec3 uCenter; uniform vec2 uContentSize; uniform vec4 uUVRect;' + // uUVRect = (u0, vTop, u1, vBottom)
      'uniform mat4 uViewProj; uniform mat4 uView;' +
      'varying vec2 vUV; varying float vFogDist;' +
      'void main(){' +
      '  vec3 right = vec3(uView[0][0], uView[1][0], uView[2][0]);' + // row 0 of the view rotation = the camera-right vector in world space
      '  vec3 up = vec3(0.0, 1.0, 0.0);' +
      '  vec3 pos = uCenter + right * (aCorner.x * uContentSize.x) + up * (aCorner.y * uContentSize.y);' +
      '  vec4 clip = uViewProj * vec4(pos, 1.0);' +
      '  gl_Position = clip;' +
      // the quad is CROPPED to each texture's actual drawn-content bbox (not
      // the whole mostly-empty stamp canvas) — a tight quad in both geometry
      // and UV, so nothing is wasted and nothing clips unpredictably (the
      // bug the pilot's first two attempts hit: a huge, mostly-transparent
      // quad sized to the full canvas produced unreadable near-plane clipping)
      '  vUV = vec2(mix(uUVRect.x, uUVRect.z, aCorner.x + 0.5), mix(uUVRect.w, uUVRect.y, aCorner.y));' +
      '  vFogDist = clip.w;' +
      '}';
    const fsSrc =
      'precision mediump float;' +
      'varying vec2 vUV; varying float vFogDist;' +
      'uniform sampler2D uTex; uniform vec3 uFogColor; uniform float uFogNear; uniform float uFogFar;' +
      'void main(){' +
      '  vec4 c = texture2D(uTex, vUV);' +
      '  if (c.a < 0.06) discard;' +
      '  float fog = clamp((vFogDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);' +
      '  vec3 rgb = mix(c.rgb, uFogColor, fog * 0.85);' +
      '  gl_FragColor = vec4(rgb, c.a);' +
      '}';
    const prog = gl.createProgram();
    gl.attachShader(prog, r3dCompile(gl, gl.VERTEX_SHADER, vsSrc));
    gl.attachShader(prog, r3dCompile(gl, gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('program link failed: ' + gl.getProgramInfoLog(prog));
    R3D.gl = gl; R3D.glCanvas = c; R3D.program = prog;
    R3D.aCorner = gl.getAttribLocation(prog, 'aCorner');
    R3D.uViewProj = gl.getUniformLocation(prog, 'uViewProj');
    R3D.uView = gl.getUniformLocation(prog, 'uView');
    R3D.uCenter = gl.getUniformLocation(prog, 'uCenter');
    R3D.uContentSize = gl.getUniformLocation(prog, 'uContentSize');
    R3D.uUVRect = gl.getUniformLocation(prog, 'uUVRect');
    R3D.uFogColor = gl.getUniformLocation(prog, 'uFogColor');
    R3D.uFogNear = gl.getUniformLocation(prog, 'uFogNear');
    R3D.uFogFar = gl.getUniformLocation(prog, 'uFogFar');
    R3D.uTex = gl.getUniformLocation(prog, 'uTex');
    // a fixed unit quad, ground at y=0 (aCorner.y=0), top at y=1 — every
    // sprite's actual on-screen size/crop comes from per-draw uniforms
    // (uContentSize, uUVRect), not from this geometry
    R3D.quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, R3D.quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, 0, 0.5, 0, -0.5, 1, 0.5, 1]), gl.STATIC_DRAW);
    R3D.stampCanvas = document.createElement('canvas');
    R3D.stampCanvas.width = R3D_STAMP; R3D.stampCanvas.height = R3D_STAMP;
    R3D.stampCtx = R3D.stampCanvas.getContext('2d');
    R3D.ready = true;
    window.__S1_R3D.active = true;
  } catch (e) {
    console.warn('[S1] WebGL pilot unavailable, using the 2D world layer:', e.message);
    window.__S1_R3D.fallback = e.message;
    R3D.ready = false;
  }
}
r3dInit();

function r3dWorldPos(el){
  // the camera sits at negative Z looking toward +Z, so NEAR (large el.y,
  // depthQ→1) must map to SMALL Z (close to the eye) and FAR to LARGE Z —
  // (1-depthQ) is the correct direction, not depthQ itself
  return [(el.x - 0.5) * 2 * R3D_HALF_W, 0, (1 - depthQ(el)) * R3D_DEPTH];
}
function r3dUpdateCamera(){
  // the eye swings sideways while the look-at point stays nearly fixed —
  // a real orbit around the scene, not a translate (S1-D077: the pilot's
  // first camera formula moved eye and center almost together, which read
  // as barely-there even when CAM.px was genuinely changing)
  const pan = CAM.px * R3D_PAN_SCALE;
  const eye = [pan, R3D_EYE_H, -R3D_EYE_BACK];
  const center = [pan * 0.12, 0, R3D_DEPTH * 0.5];
  R3D.view = m4LookAt(eye, center, [0, 1, 0]);
  R3D.proj = m4Perspective(R3D_FOV, Math.max(0.1, W / H), R3D_NEAR, R3D_FAR);
  R3D.viewProj = m4Multiply(R3D.proj, R3D.view);
}
// A billboard's texture key — distinct look, distinct texture. Coarse seed
// bucketing keeps texture count small while still varying siblings.
function r3dSpriteKey(el){
  const bp = el.burn && el.burn.phase;
  return el.k + '|' + (el.p ? JSON.stringify(el.p) : '') + '|' + (el.ch || '') + '|' + (bp || '') + '|' + (el.seed % 5);
}
// Scans the just-rasterized stamp for its actual drawn-content bounding
// box (alpha>10) — this is what makes the billboard TIGHT instead of a
// huge, mostly-transparent quad (the bug that broke the pilot's first two
// attempts: a quad sized to the whole canvas clips unpredictably against
// the near plane). Ground/bottom always uses R3D_STAMP_ANCHOR — the row
// every stub was rasterized against — even if content's own lowest pixel
// sits a hair off it, so different kinds' ground points stay consistent.
function r3dContentBounds(){
  const d = R3D.stampCtx.getImageData(0, 0, R3D_STAMP, R3D_STAMP).data;
  let minX = R3D_STAMP, maxX = 0, minY = R3D_STAMP, maxY = 0, found = false;
  for (let y = 0; y < R3D_STAMP; y++) for (let x = 0; x < R3D_STAMP; x++){
    if (d[(y * R3D_STAMP + x) * 4 + 3] > 10){
      found = true;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y;
    }
  }
  if (!found) return { u0: 0.5, u1: 0.5, vTop: R3D_STAMP_ANCHOR, vBottom: R3D_STAMP_ANCHOR, wPx: 0, hPx: 0 };
  const anchorPx = R3D_STAMP_ANCHOR * R3D_STAMP;
  return {
    u0: minX / R3D_STAMP, u1: maxX / R3D_STAMP,
    vTop: minY / R3D_STAMP, vBottom: R3D_STAMP_ANCHOR,
    wPx: maxX - minX, hPx: Math.max(1, anchorPx - minY),
  };
}
function r3dEnsureTexture(el, now){
  const key = r3dSpriteKey(el);
  let rec = R3D.textures.get(key);
  if (rec && now - rec.built < R3D_REFRESH_MS) return rec;
  const draw = ELEMENT_DRAW[el.k];
  const stub = { ...el, x: 0.5, y: R3D_STAMP_ANCHOR, s: 1 };
  const savedW = W, savedH = H, savedS = S, savedWX = wx;
  W = R3D_STAMP; H = R3D_STAMP; S = R3D_STAMP_S; wx = R3D.stampCtx;
  wx.clearRect(0, 0, R3D_STAMP, R3D_STAMP);
  RASTERIZING_SPRITE = true;
  try { drawGroundMatter(stub, draw, now, 1); } finally { RASTERIZING_SPRITE = false; }
  const bounds = r3dContentBounds();
  W = savedW; H = savedH; S = savedS; wx = savedWX;
  const gl = R3D.gl;
  const tex = (rec && rec.tex) || gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // NO flip: the UV formula above (vTop/vBottom from raw canvas row/STAMP)
  // already matches the stamp canvas's own row order directly — flipping
  // here would sample the wrong (transparent) region (found via the pilot's
  // "draws with no GL error, zero visible pixels" debugging session)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, R3D.stampCanvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  rec = { tex, built: now, bounds };
  R3D.textures.set(key, rec);
  return rec;
}
function r3dRenderFrame(now){
  const gl = R3D.gl;
  gl.viewport(0, 0, R3D.glCanvas.width, R3D.glCanvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(R3D.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, R3D.quadBuf);
  gl.enableVertexAttribArray(R3D.aCorner);
  gl.vertexAttribPointer(R3D.aCorner, 2, gl.FLOAT, false, 0, 0);
  gl.uniformMatrix4fv(R3D.uViewProj, false, R3D.viewProj);
  gl.uniformMatrix4fv(R3D.uView, false, R3D.view);
  gl.uniform3f(R3D.uFogColor, 0.925, 0.890, 0.812);
  gl.uniform1f(R3D.uFogNear, R3D_FOG_NEAR);
  gl.uniform1f(R3D.uFogFar, R3D_FOG_FAR);
  gl.uniform1i(R3D.uTex, 0);
  gl.activeTexture(gl.TEXTURE0);
  for (const el of state.world.els){
    if (el.transit || DEPTH_EXEMPT[el.k]) continue;
    const age = el.born ? now - el.born : 1e9;
    if (age < 0) continue;
    const pe = 1 - Math.pow(1 - Math.max(0, Math.min(1, age / 700)), 3);
    const rec = r3dEnsureTexture(el, now);
    if (!rec.bounds.wPx) continue; // nothing drawn this refresh — skip rather than show a blank quad
    gl.bindTexture(gl.TEXTURE_2D, rec.tex);
    const pos = r3dWorldPos(el);
    const scale = R3D_PX_WORLD * el.s * pe;
    gl.uniform3f(R3D.uCenter, pos[0], pos[1], pos[2]);
    gl.uniform2f(R3D.uContentSize, Math.max(0.01, rec.bounds.wPx * scale), rec.bounds.hPx * scale);
    gl.uniform4f(R3D.uUVRect, rec.bounds.u0, rec.bounds.vTop, rec.bounds.u1, rec.bounds.vBottom);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
// Screen-space projection of a world element, shared by the 2D and R3D
// paths (branches internally) — used wherever presentation code (transit
// flight, arrival banner) needs "where does this element appear on screen"
// without caring which renderer is active.
function elScreenPos(el){
  if (R3D_ON && R3D.ready) return projectR3D(el);
  return { x: worldScreenX(el) + camShiftFor(el) / W, y: el.y, k: depthK(el) };
}
function projectR3D(el){
  const wp = r3dWorldPos(el);
  const clipG = m4TransformPoint(R3D.viewProj, [wp[0], wp[1], wp[2], 1]);
  const clipU = m4TransformPoint(R3D.viewProj, [wp[0], wp[1] + 1, wp[2], 1]);
  const yG = 1 - ((clipG[1] / clipG[3]) * 0.5 + 0.5);
  const yU = 1 - ((clipU[1] / clipU[3]) * 0.5 + 0.5);
  const x = (clipG[0] / clipG[3]) * 0.5 + 0.5;
  const k = Math.max(0.05, Math.abs(yG - yU) / R3D_SCALE_REF);
  return { x, y: yG, k };
}
// Ground-matter pass for the WebGL pilot: sky elements + the existing 2D
// backdrop already drew into wx by the time drawWorld calls this; billboard
// matter renders into the GL canvas and composites on top (transparent
// background, so the sky/backdrop show through the gaps), then live-heat
// glow (E2 ignition, fire↔flammable) redraws on the `ex` overlay at its
// true projected position, and fresh-lock gold rings finish the parity
// with the 2D loop's per-element cues.
function drawGroundR3D(now){
  const worldCtx = wx;
  for (const el of state.world.els){
    if (!DEPTH_EXEMPT[el.k] || el.transit) continue;
    const age = el.born ? now - el.born : 1e9;
    if (age < 0) continue;
    const pe = 1 - Math.pow(1 - Math.max(0, Math.min(1, age / 700)), 3);
    const draw = ELEMENT_DRAW[el.k];
    wx = worldCtx; wx.save();
    if (draw) draw(el, now, pe);
    wx.restore();
  }
  r3dUpdateCamera();
  r3dRenderFrame(now);
  wx = worldCtx;
  wx.drawImage(R3D.glCanvas, 0, 0, W, H);
  for (const el of state.world.els){
    if (el.transit || DEPTH_EXEMPT[el.k]) continue;
    const age = el.born ? now - el.born : 1e9;
    if (age < 0) continue;
    const bp = el.burn && el.burn.phase;
    if (bp && bp !== 'ash' && bp !== 'sprout' && bp !== 'sapling'){
      const pos = elScreenPos(el);
      drawBurnFx(el, now, 1, { X: pos.x * W, Y: pos.y * H, s: el.s * pos.k });
    }
    if (el.fresh && age < 900){
      const q = age / 900, pos = elScreenPos(el);
      wx.save();
      wx.globalAlpha = (1 - q) * 0.6;
      wx.strokeStyle = GOLD; wx.lineWidth = 2.5;
      wx.beginPath(); wx.arc(pos.x * W, pos.y * H - S * 0.03, 10 + q * S * 0.12, 0, Math.PI * 2); wx.stroke();
      wx.restore();
    }
  }
}
