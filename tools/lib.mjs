// Peças comuns dos cards SVG do README (sem dependências).
export const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";
export const C = {
  bg: '#020617', line: '#1e293b', border: '#1e3a5f', dim: '#64748b', mute: '#94a3b8',
  text: '#e2e8f0', white: '#f8fafc', accent: '#3b82f6', light: '#60a5fa', frost: '#bfdbfe',
};
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// gerador pseudoaleatório determinístico (o SVG só muda quando o conteúdo muda)
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// chuva de caracteres estilo matrix, bem discreta, em colunas que descem em loop
export function rain(W, H, { seed = 1, cols = 22, opacity = 0.22, color = C.light } = {}) {
  const r = rng(seed), glyphs = '01<>/{}[]=+*#:;$~ABCDEFKLOPRTVX0123456789';
  const out = [];
  for (let i = 0; i < cols; i++) {
    const x = Math.round(10 + (i + r() * 0.6) * (W - 20) / cols);
    const n = 8 + Math.floor(r() * 10), dur = (7 + r() * 7).toFixed(1), delay = (-r() * 14).toFixed(1);
    let sp = '';
    for (let k = 0; k < n; k++) {
      const ch = glyphs[Math.floor(r() * glyphs.length)];
      sp += `<tspan x="${x}" dy="14" fill-opacity="${((k + 1) / n).toFixed(2)}">${esc(ch)}</tspan>`;
    }
    out.push(`<text class="rn" font-size="11" fill="${color}" y="${-n * 14}" style="animation-duration:${dur}s;animation-delay:${delay}s">${sp}</text>`);
  }
  return `<g clip-path="url(#fc)" opacity="${opacity}">${out.join('')}</g>`;
}

// moldura do card: fundo, borda, cabeçalho "[NN] ~/secao", linha divisória, scanlines
export function card({ W, H, title, label, right = '', css = '', body = '', rainOpts = {}, noRain = false }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t" xml:space="preserve">
<title id="t">${esc(title)}</title>
<style>text{font-family:${MONO}}.rn{animation:rn linear infinite}@keyframes rn{from{transform:translateY(0)}to{transform:translateY(${H + 300}px)}}.bk{animation:bk 1.1s steps(1,end) infinite}@keyframes bk{0%{opacity:1}50%,100%{opacity:0}}${css}</style>
<defs><pattern id="sl" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#fff" fill-opacity=".02"/></pattern><clipPath id="fc"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="8"/></clipPath></defs>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="${C.bg}" stroke="${C.border}"/>
${noRain ? '' : rain(W, H, rainOpts)}
<text x="24" y="29" font-size="14" fill="${C.mute}">${esc(label)}</text>
${right ? `<text x="${W - 24}" y="29" font-size="14" fill="${C.mute}" text-anchor="end">${right}</text>` : ''}
<path d="M1 46H${W - 1}" stroke="${C.line}"/>
${body}
<rect width="${W}" height="${H}" rx="8" fill="url(#sl)"/>
</svg>
`;
}
