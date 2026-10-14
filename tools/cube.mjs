// Cubo mágico 3x3x3 girando, rasterizado em ASCII quadro a quadro (projeção ortográfica + z-buffer).
// Cada quadro vira um <g> que aparece por 1/N do ciclo (CSS steps), como um flipbook.
import { esc } from './lib.mjs';

const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const rotY = ([x, y, z], a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
const rotX = ([x, y, z], a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };

// faces de um cubinho: normal e quatro cantos (unidade = metade do cubinho)
const FACES = [
  [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
  [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]],
  [[1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]]],
  [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]],
  [[0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]]],
  [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
];

export function cubeFrames({ cols = 46, rows = 26, frames = 64 } = {}) {
  const light = norm([-0.4, 0.8, 0.6]);
  const out = [];
  for (let f = 0; f < frames; f++) {
    const t = f / frames;
    const yaw = t * Math.PI * 2 + 0.6, pitch = -0.55 + 0.08 * Math.sin(t * Math.PI * 2);
    // giro da camada de cima (ida e volta) e da camada da direita
    const top = (ease((t - 0.1) / 0.18) - ease((t - 0.55) / 0.18)) * Math.PI / 2;
    const right = (ease((t - 0.32) / 0.16) - ease((t - 0.78) / 0.16)) * -Math.PI / 2;
    const quads = [];
    for (let cx = -1; cx <= 1; cx++) for (let cy = -1; cy <= 1; cy++) for (let cz = -1; cz <= 1; cz++) {
      for (const [n0, corners] of FACES) {
        const outer = (n0[0] && n0[0] === cx) || (n0[1] && n0[1] === cy) || (n0[2] && n0[2] === cz);
        const tf = p => {
          let q = [cx * 2 + p[0] * 0.98, cy * 2 + p[1] * 0.98, cz * 2 + p[2] * 0.98];
          if (cy === 1) q = rotY(q, top);
          if (cx === 1) q = rotX(q, right);
          return rotX(rotY(q, yaw), pitch);
        };
        let n = n0; if (cy === 1) n = rotY(n, top); if (cx === 1) n = rotX(n, right); n = rotX(rotY(n, yaw), pitch);
        if (n[2] <= 0) continue; // de costas para a câmera
        const P = corners.map(tf);
        const face = n0[0] ? (n0[0] > 0 ? 0 : 1) : n0[1] ? (n0[1] > 0 ? 2 : 3) : (n0[2] > 0 ? 4 : 5);
        quads.push({ P, n, outer, face, shade: 0.25 + 0.75 * Math.max(0, dot(n, light)) });
      }
    }
    const S = 2.05; // escala: cubo cabe em ~ +-5.2 unidades
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const line = [];
      for (let c = 0; c < cols; c++) {
        const x = ((c + 0.5) / cols * 2 - 1) * 5.6 * S / 2 * (cols * 0.6 / rows), y = -((r + 0.5) / rows * 2 - 1) * 5.6 * S / 2;
        let best = null, bz = -1e9;
        for (const q of quads) {
          const [a, b, , d] = q.P;
          // coordenadas (u,v) no plano da face resolvendo o sistema 2x2 em x,y
          const e1 = sub(b, a), e2 = sub(d, a), det = e1[0] * e2[1] - e1[1] * e2[0];
          if (Math.abs(det) < 1e-6) continue;
          const px = x - a[0], py = y - a[1];
          const u = (px * e2[1] - py * e2[0]) / det, v = (e1[0] * py - e1[1] * px) / det;
          if (u < 0 || u > 1 || v < 0 || v > 1) continue;
          const z = a[2] + u * e1[2] + v * e2[2];
          if (z > bz) { bz = z; best = { q, u, v }; }
        }
        if (!best) { line.push(null); continue; }
        const { q, u, v } = best, edge = u < 0.13 || u > 0.87 || v < 0.13 || v > 0.87;
        if (!q.outer || edge) { line.push({ ch: q.outer ? '.' : ':', tone: 3 }); continue; }
        const ramp = ':-=+*#%@', ch = ramp[Math.min(ramp.length - 1, Math.floor(q.shade * ramp.length))];
        line.push({ ch, tone: [0, 1, 2, 0, 1, 2][q.face] });
      }
      grid.push(line);
    }
    out.push(grid);
  }
  return out;
}

// SVG dos quadros: uma <text> por linha e por tom, com textLength para travar a grade
export function cubeSvg({ x0, y0, cw = 5.4, lh = 9, fontSize = 9, colors, dur = 8, ...opts }) {
  const frames = cubeFrames(opts), N = frames.length;
  const groups = frames.map((grid, i) => {
    const byTone = colors.map(() => []);
    grid.forEach((line, r) => {
      colors.forEach((_, tone) => {
        const chars = line.map(c => (c && c.tone === tone ? c.ch : ' '));
        const first = chars.findIndex(ch => ch !== ' ');
        if (first < 0) return;
        let last = chars.length - 1; while (chars[last] === ' ') last--;
        const s = chars.slice(first, last + 1).join('');
        byTone[tone].push(`<text x="${(x0 + first * cw).toFixed(1)}" y="${(y0 + r * lh).toFixed(1)}" textLength="${(s.length * cw).toFixed(1)}">${esc(s)}</text>`);
      });
    });
    const body = byTone.map((t, k) => t.length ? `<g fill="${colors[k]}">${t.join('')}</g>` : '').join('');
    return `<g class="cb" style="animation-delay:${(i * dur / N).toFixed(3)}s">${body}</g>`;
  }).join('');
  const css = `.cb{opacity:0;animation:cbk ${dur}s steps(1,end) infinite}@keyframes cbk{0%{opacity:1}${(100 / N).toFixed(4)}%,100%{opacity:0}}`;
  return { svg: `<g font-weight="700" font-size="${fontSize}" xml:space="preserve">${groups}</g>`, css };
}
