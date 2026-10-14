// Desenha as contribuições do GitHub em ASCII como um SVG animado.
// Uso: GITHUB_TOKEN=... node .github/scripts/contributions.mjs USUARIO SAIDA.svg
// Lê o calendário via GraphQL (contributionsCollection); Node 18+ sem dependências.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { C, esc, rng, card } from '../../tools/lib.mjs';

const [user = 'vitorkloy', out = 'src/ascii/contributions.svg'] = process.argv.slice(2);
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) { console.error('Defina GITHUB_TOKEN.'); process.exit(1); }

const query = `query($login:String!){user(login:$login){
  followers{totalCount}
  repositories(ownerAffiliations:OWNER,privacy:PUBLIC){totalCount}
  contributionsCollection{contributionCalendar{totalContributions
    weeks{contributionDays{date weekday contributionCount contributionLevel}}}}}}`;
const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'vitorkloy-readme' },
  body: JSON.stringify({ query, variables: { login: user } }),
});
const data = await res.json();
if (!res.ok || data.errors || !data.data?.user) { console.error(JSON.stringify(data)); process.exit(1); }
const u = data.data.user, cal = u.contributionsCollection.contributionCalendar;
const LV = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
const weeks = cal.weeks.map(w => w.contributionDays.map(d => ({ ...d, level: LV[d.contributionLevel] ?? 0 })));
const days = weeks.flat();

// sequências: dias seguidos com contribuição; hoje ainda vazio não quebra a atual
let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount ? run + 1 : 0; longest = Math.max(longest, run); }
let current = 0;
const tail = days.length && !days.at(-1).contributionCount ? days.slice(0, -1) : days;
for (let i = tail.length - 1; i >= 0 && tail[i].contributionCount; i--) current++;

const CHARS = '.:+#@';
const COLORS = ['#1e293b', '#1e40af', '#2563eb', '#60a5fa', '#dbeafe'];
const MONTHS = 'jan fev mar abr mai jun jul ago set out nov dez'.split(' ');
const W = 880, H = 316, x0 = 84, y0 = 140, rowH = 20, n = weeks.length;
const colW = (W - x0 - 32) / n, r = rng(7);

const grid = weeks.map((w, wi) => {
  const cells = w.map(d => {
    const tw = d.level >= 2 && r() < 0.08 ? ` class="tw" style="animation-delay:${(r() * 6).toFixed(2)}s"` : '';
    return `<text x="${(x0 + wi * colW + colW / 2).toFixed(1)}" y="${y0 + d.weekday * rowH + 15}" fill="${COLORS[d.level]}"${tw}>${esc(CHARS[d.level])}</text>`;
  }).join('');
  return `<g class="c" style="animation-delay:${(wi * 0.03).toFixed(2)}s">${cells}</g>`;
}).join('');

const labels = []; let lastMonth = -1, lastCol = -9;
weeks.forEach((w, wi) => {
  const m = Number(w[0].date.slice(5, 7)) - 1;
  if (m !== lastMonth) {
    if (wi - lastCol >= 3 && wi < n - 2) { labels.push(`<text x="${(x0 + wi * colW).toFixed(1)}" y="${y0 - 14}" font-size="14" fill="${C.mute}">${MONTHS[m]}</text>`); lastCol = wi; }
    lastMonth = m;
  }
});
for (const [wd, name] of [[1, 'seg'], [3, 'qua'], [5, 'sex']]) labels.push(`<text x="28" y="${y0 + wd * rowH + 15}" font-size="14" fill="${C.dim}">${name}</text>`);

const fmt = v => v.toLocaleString('pt-BR');
const dias = v => `${v} ${v === 1 ? 'dia' : 'dias'}`;
const followers = u.followers.totalCount, repos = u.repositories.totalCount;
const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
const legend = [...CHARS].map((ch, i) => `<tspan fill="${COLORS[i]}">${esc(ch)} </tspan>`).join('');
const gridW = n * colW;

const body = `<text x="28" y="88" font-size="17"><tspan fill="${C.white}">${fmt(cal.totalContributions)}</tspan><tspan fill="${C.mute}"> no último ano  ·  sequência atual </tspan><tspan fill="${C.light}">${dias(current)}</tspan><tspan fill="${C.mute}">  ·  maior </tspan><tspan fill="${C.light}">${dias(longest)}</tspan></text>
${labels.join('')}
<g class="g">${grid}</g>
<rect class="sc" x="${x0 - 60}" y="${y0 - 4}" width="60" height="${7 * rowH + 4}" fill="url(#band)"/>
<defs><linearGradient id="band"><stop stop-color="${C.light}" stop-opacity="0"/><stop offset=".7" stop-color="${C.light}" stop-opacity=".06"/><stop offset="1" stop-color="${C.light}" stop-opacity=".18"/></linearGradient></defs>
<text x="28" y="${H - 22}" font-size="14" fill="${C.dim}">atualizado em ${today}</text>
<text x="${W - 32}" y="${H - 22}" font-size="15" text-anchor="end"><tspan fill="${C.dim}">menos </tspan>${legend}<tspan fill="${C.dim}">mais</tspan></text>`;

const svg = card({
  W, H, label: '[04] ~/contribuições', right: `${followers} seguidores · ${repos} repositórios`,
  title: `${fmt(cal.totalContributions)} contribuições no último ano · ${followers} seguidores · ${repos} repositórios · sequência atual ${dias(current)} · maior ${dias(longest)}, desenhado em ASCII`,
  css: `.g text{font-size:18px;text-anchor:middle}.c{opacity:0;animation:in .5s ease forwards}@keyframes in{from{opacity:0}to{opacity:1}}.tw{animation:tw 6s steps(1,end) infinite}@keyframes tw{0%{opacity:.15}4%{opacity:1}8%{opacity:.35}10%,100%{opacity:1}}.sc{opacity:0;animation:sc 7s linear 2s infinite}@keyframes sc{0%{transform:translateX(0);opacity:1}100%{transform:translateX(${gridW.toFixed(0)}px);opacity:1}}`,
  body, rainOpts: { seed: 4, cols: 26, opacity: .12 },
});
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg, 'utf8');
console.log(`${out}: ${n} semanas, ${cal.totalContributions} contribuições, atual ${current}, maior ${longest}`);
