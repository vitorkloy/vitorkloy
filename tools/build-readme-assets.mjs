// Gera os SVGs animados do README (hero, stack, contato, destaque, projetos e botões).
// Uso: node tools/build-readme-assets.mjs   (o contributions.svg é gerado pelo workflow)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, MONO, esc, rng, card } from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', 'src', 'ascii');
const json = f => JSON.parse(readFileSync(join(here, f), 'utf8'));
const ICONS = json('icons.json'), BI = json('bootstrap-icons.json'), ART = json('art.json');
mkdirSync(OUT, { recursive: true });
const save = (name, svg) => { writeFileSync(join(OUT, name), svg, 'utf8'); console.log('ok', name, svg.length); };

const W = 880;

// ---------- hero: "vitor" em letras de voxel ----------
const FONT = {
  v: ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  i: ['#', '.', '#', '#', '#', '#', '#'],
  t: ['.#..', '.#..', '####', '.#..', '.#..', '.#..', '..##'],
  o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  r: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'],
};
function voxels(word, x0, y0, s) {
  const cells = []; let cx = 0;
  for (const ch of word) {
    const g = FONT[ch];
    g.forEach((row, r) => [...row].forEach((v, c) => v === '#' && cells.push([r, cx + c])));
    cx += g[0].length + 1;
  }
  const has = new Set(cells.map(([r, c]) => r + ',' + c));
  const P = ([r, c]) => [x0 + c * s, y0 + r * s];
  // laterais em 4 quadros de profundidade, alternados por CSS (efeito de giro leve)
  const depths = [5, 8, 11, 8];
  const frames = depths.map((d, f) => {
    let top = '', side = '';
    const sorted = [...cells].sort((a, b) => b[0] - a[0] || a[1] - b[1]);
    for (const cell of sorted) {
      const [r, c] = cell, [x, y] = P(cell);
      if (!has.has(r - 1 + ',' + c)) top += `M${x} ${y}L${x + s} ${y}L${x + s + d} ${y - d}L${x + d} ${y - d}Z`;
      if (!has.has(r + ',' + (c + 1))) side += `M${x + s} ${y}L${x + s + d} ${y - d}L${x + s + d} ${y + s - d}L${x + s} ${y + s}Z`;
    }
    return `<g class="fr" style="animation-delay:${(f * 1.5).toFixed(1)}s"><path d="${top}" fill="#93c5fd"/><path d="${side}" fill="#1d4ed8"/></g>`;
  }).join('');
  const r = rng(11);
  const fronts = cells.map(cell => {
    const [x, y] = P(cell);
    return `<rect class="vx" x="${x}" y="${y}" width="${s}" height="${s}" fill="url(#sh)" stroke="${C.bg}" stroke-width="1.5" style="animation-delay:${(0.1 + r() * 0.7).toFixed(2)}s"/>`;
  }).join('');
  return { svg: `<g>${frames}${fronts}</g>`, width: cx * s };
}

function hero() {
  const H = 590, s = 17, v = voxels('vitor', 58, 92, s);
  const typed = '> desenvolvedor full stack', fs = 24, cw = fs * 0.6, tx = 58, ty = 262;
  const steps = typed.length, wv = [], xv = [];
  for (let i = 0; i <= steps; i++) { wv.push((i * cw).toFixed(1)); xv.push((tx + i * cw + 2).toFixed(1)); }
  const dur = (steps * 0.06).toFixed(2);
  const art = ART.code, r = rng(5);
  const artSvg = art.map((line, i) => {
    let out = '', k = 0;
    // alguns caracteres piscam em azul
    for (const ch of line) {
      if (ch !== ' ' && r() < 0.06) out += `<tspan class="tw" fill="${C.frost}" style="animation-delay:${(r() * 5).toFixed(2)}s">${esc(ch)}</tspan>`;
      else out += ch === ' ' ? '\u00a0' : esc(ch);
      k++;
    }
    return `<text x="548" y="${86 + i * 14}">${out}</text>`;
  }).join('');
  const ln = (y, txt, fill, d, size = 17) => `<text class="ln" x="58" y="${y}" font-size="${size}" fill="${fill}" style="animation-delay:${d}s">${txt}</text>`;
  const body = `
${v.svg}
<defs><clipPath id="ty"><rect x="${tx}" y="${ty - 24}" height="34" width="0"><animate attributeName="width" values="${wv.join(';')}" dur="${dur}s" begin=".9s" fill="freeze" calcMode="discrete"/></rect></clipPath>
<linearGradient id="sh" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="440" y2="0"><stop offset="0" stop-color="${C.white}"/><stop offset=".42" stop-color="${C.white}"/><stop offset=".5" stop-color="${C.light}"/><stop offset=".58" stop-color="${C.white}"/><stop offset="1" stop-color="${C.white}"/><animateTransform attributeName="gradientTransform" type="translate" values="-500 0;600 0" dur="5s" repeatCount="indefinite"/></linearGradient></defs>
<text x="${tx}" y="${ty}" font-size="${fs}" clip-path="url(#ty)"><tspan fill="${C.light}">&gt;</tspan><tspan fill="${C.text}">${esc(typed.slice(1))}</tspan></text>
<rect class="bk" x="${tx + 2}" y="${ty - 20}" width="12" height="25" fill="${C.accent}"><animate attributeName="x" values="${xv.join(';')}" dur="${dur}s" begin=".9s" fill="freeze" calcMode="discrete"/></rect>
<g font-size="12" fill="${C.light}" opacity=".9">${artSvg}</g>
${ln(338, 'interfaces limpas, apis sólidas e produtos que resolvem', C.text, 1.8)}
${ln(364, 'problemas de verdade.', C.text, 1.95)}
${ln(400, 'vitorkloy.vercel.app · in/vitor-kloy · são josé dos campos, sp', C.dim, 2.1, 15)}
<path class="mq" d="M58 432H822" stroke="${C.border}" stroke-dasharray="6 8"/>
${ln(470, '$ cat cargo.txt', C.mute, 2.3, 16)}
<text class="ln" x="58" y="500" font-size="17" style="animation-delay:2.45s"><tspan fill="${C.white}">assistente de programação </tspan><tspan fill="${C.light}">@ globalpac</tspan></text>
${ln(528, 'next.js, react e typescript no front; node, python e electron no back.', C.text, 2.6, 16)}
<text class="ln" x="58" y="560" font-size="17" fill="${C.mute}" style="animation-delay:2.75s">$</text><rect class="bk" x="76" y="545" width="10" height="19" fill="${C.accent}"/>`;
  return card({
    W, H, label: '~/vitor',
    right: `<tspan class="bk" fill="${C.accent}">●</tspan> são josé dos campos · sp`,
    title: 'vitor kloy de oliveira · desenvolvedor full stack · interfaces limpas, apis sólidas. Next.js, React e TypeScript no front; Node, Python e Electron no back. Assistente de programação na Globalpac, São José dos Campos - SP.',
    css: '.fr{opacity:0;animation:fr 6s steps(1,end) infinite}@keyframes fr{0%{opacity:1}25%,100%{opacity:0}}.vx{opacity:0;animation:vx .35s ease-out forwards}@keyframes vx{from{opacity:0}to{opacity:1}}.ln{opacity:0;animation:ln .5s ease forwards}@keyframes ln{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}.tw{animation:tw 5s steps(1,end) infinite}@keyframes tw{0%{opacity:.2}6%{opacity:1}12%{opacity:.4}16%,100%{opacity:1}}.mq{animation:mq 1.2s linear infinite}@keyframes mq{to{stroke-dashoffset:-14}}',
    body, rainOpts: { seed: 1, cols: 30 },
  });
}

// ---------- stack ----------
function stack() {
  const per = 8, H = 236, cellW = (W - 64) / per;
  const items = ICONS.map((ic, i) => {
    const col = i % per, row = Math.floor(i / per);
    const cx = 32 + col * cellW + cellW / 2, y = 72 + row * 82;
    return `<g class="ic" style="animation-delay:${(i * 0.18).toFixed(2)}s"><svg x="${(cx - 18).toFixed(1)}" y="${y}" width="36" height="36" viewBox="0 0 24 24"><title>${esc(ic.title)}</title><path d="${ic.path}" fill="${C.text}"/></svg></g><text x="${cx.toFixed(1)}" y="${y + 56}" font-size="12" fill="${C.mute}" text-anchor="middle">${esc(ic.title.toLowerCase())}</text>`;
  }).join('');
  const body = `<defs><linearGradient id="gl"><stop stop-color="${C.light}" stop-opacity="0"/><stop offset=".5" stop-color="${C.light}" stop-opacity=".09"/><stop offset="1" stop-color="${C.light}" stop-opacity="0"/></linearGradient></defs>
${items}
<g clip-path="url(#fc)"><rect class="gl" x="-220" y="47" width="160" height="${H - 48}" fill="url(#gl)"/></g>`;
  return card({
    W, H, label: '[03] $ ls ~/stack', right: `${ICONS.length} itens`,
    title: 'Stack: ' + ICONS.map(i => i.title).join(', '),
    css: '.ic{animation:ic 3.4s ease-in-out infinite}@keyframes ic{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}.gl{animation:gl 6s ease-in-out infinite}@keyframes gl{0%{transform:translateX(0) skewX(-12deg)}60%,100%{transform:translateX(1180px) skewX(-12deg)}}',
    body, rainOpts: { seed: 3, cols: 26, opacity: .14 },
  });
}

// ---------- contato ----------
function contato() {
  const H = 356, logo = ART.logo;
  const art = logo.map((l, i) => {
    const parts = l.replace(/[@#+]+/g, m => `\u0001${m}\u0002`).split(/(\u0001[^\u0002]*\u0002)/).map(p =>
      p.startsWith('\u0001') ? `<tspan fill="${C.white}">${esc(p.slice(1, -1))}</tspan>` : esc(p).replace(/ /g, '\u00a0')).join('');
    return `<text x="36" y="${70 + i * 11.4}">${parts}</text>`;
  }).join('');
  const body = `<g class="lg" font-size="11" fill="${C.accent}">${art}</g>
<text x="400" y="136" font-size="38" fill="${C.white}">bora conversar?</text>
<text x="402" y="174" font-size="16" fill="${C.mute}">vaga, projeto ou só trocar ideia.</text>
<text x="402" y="234" font-size="19"><tspan fill="${C.light}">&gt; </tspan><tspan fill="${C.text}">vitor.kloy08@gmail.com</tspan></text>
<text x="402" y="266" font-size="19"><tspan fill="${C.light}">&gt; </tspan><tspan fill="${C.text}">vitorkloy.vercel.app</tspan></text>
<rect class="bk" x="666" y="250" width="11" height="21" fill="${C.accent}"/>`;
  return card({
    W, H, label: '[06] ~/contato', right: '-- EOF --',
    title: 'bora conversar? vaga, projeto ou só trocar ideia — vitor.kloy08@gmail.com · vitorkloy.vercel.app',
    css: '.lg{animation:lg 4s ease-in-out infinite}@keyframes lg{0%,100%{opacity:.85}50%{opacity:1}}',
    body, rainOpts: { seed: 6, cols: 26 },
  });
}

// ---------- destaque e projetos ----------
function destaque() {
  const H = 214, tags = ['next.js', 'typescript', 'oauth', 'vercel'];
  let x = 40;
  const pills = tags.map(t => { const w = t.length * 7.8 + 22, s = `<rect x="${x}" y="146" width="${w}" height="26" rx="13" fill="none" stroke="${C.border}"/><text x="${x + w / 2}" y="164" font-size="13" fill="${C.frost}" text-anchor="middle">${t}</text>`; x += w + 10; return s; }).join('');
  const body = `<text x="40" y="96" font-size="30" fill="${C.white}">Painel de Repos</text>
<text x="40" y="126" font-size="15" fill="${C.mute}">dashboard de repositórios com github oauth: estatísticas e gestão de projetos.</text>
${pills}
<text class="nx" x="840" y="164" font-size="16" fill="${C.light}" text-anchor="end">visitar →</text>
<path class="mq" d="M758 174H840" stroke="${C.accent}" stroke-dasharray="4 4"/>`;
  return card({
    W, H, label: '[01] ~/destaque', right: 'painel-repos.vercel.app',
    title: 'Painel de Repos · dashboard de repositórios com GitHub OAuth, estatísticas e gestão de projetos · visitar',
    css: '.mq{animation:mq 1s linear infinite}@keyframes mq{to{stroke-dashoffset:-8}}.nx{animation:nx 2s ease-in-out infinite}@keyframes nx{0%,100%{transform:none}50%{transform:translateX(3px)}}',
    body, rainOpts: { seed: 8, cols: 26, opacity: .16 },
  });
}
function projeto(slug, name, desc, seed) {
  const H = 112;
  const body = `<text x="32" y="80" font-size="20" fill="${C.white}"><tspan fill="${C.accent}">▸ </tspan>${esc(name)}</text>
<text x="32" y="100" font-size="13" fill="${C.mute}">${esc(desc)}</text>
<text class="nx" x="848" y="88" font-size="22" fill="${C.light}" text-anchor="end">→</text>`;
  return card({
    W, H, label: `[02] ~/projetos/${slug}`, title: `${name} · ${desc}`,
    css: '.nx{animation:nx 2s ease-in-out infinite}@keyframes nx{0%,100%{transform:none}50%{transform:translateX(4px)}}',
    body, rainOpts: { seed, cols: 24, opacity: .12 },
  });
}

// ---------- botões ----------
function botao(icon, label) {
  const paths = BI[icon].map(d => `<path d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="156" height="44" viewBox="0 0 156 44" role="img" aria-labelledby="t" xml:space="preserve">
<title id="t">${esc(label)}</title>
<style>text{font-family:${MONO}}.ar{animation:ar 2.2s ease-in-out infinite}@keyframes ar{0%,100%{transform:none}50%{transform:translate(2px,-2px)}}</style>
<rect x=".5" y=".5" width="155" height="43" rx="8" fill="${C.bg}" stroke="${C.border}"/><svg x="16" y="13" width="18" height="18" viewBox="0 0 16 16" fill="${C.light}">${paths}</svg><text x="44" y="27.5" font-size="15" fill="${C.text}">${esc(label)}</text><path class="ar" d="M130 25L137 18M132 18H137V23" fill="none" stroke="${C.dim}" stroke-width="1.5"/>
</svg>
`;
}

save('hero.svg', hero());
save('stack.svg', stack());
save('contato.svg', contato());
save('destaque.svg', destaque());
save('proj-escrituracao.svg', projeto('escrituracao-fiscal', 'Escrituração Fiscal', 'app desktop (electron + next.js): chaves paginadas, download em lote', 21));
save('proj-ponto.svg', projeto('controle-ponto', 'Controle de Ponto', 'registro de jornada, relatórios pdf/excel e painel admin; web e desktop', 22));
save('proj-pedidos.svg', projeto('pedidos-online', 'Pedidos Online', 'pedidos para restaurantes com carrinho, whatsapp e painel admin', 23));
save('proj-defender.svg', projeto('desktop-defender', 'Desktop Defender', 'jogo de defesa de núcleo que roda direto no navegador', 24));
save('btn-portfolio.svg', botao('globe2', 'portfólio'));
save('btn-linkedin.svg', botao('linkedin', 'linkedin'));
save('btn-email.svg', botao('envelope', 'email'));
save('btn-instagram.svg', botao('instagram', 'instagram'));
save('btn-github.svg', botao('github', 'github'));
