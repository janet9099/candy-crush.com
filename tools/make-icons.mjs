// Generates the Crystal Cascade app icons (SVG source + PNG sizes).
// Usage: node tools/make-icons.mjs   (needs the `sharp` package)
import { writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { console.error('Install sharp first:  npm install --no-save sharp'); process.exit(1); }

const OUT = new URL('../public/icons/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const hx = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mix = (a, b, t) => { t = Math.max(0, Math.min(1, t)); const A = hx(a), B = hx(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
const P = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
const poly = (n, r, rot, cx, cy) => Array.from({ length: n }, (_, i) => { const a = (rot + i * 360 / n) * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

// Same faceting approach the game uses for its gems.
function gem(id, pts, pal, { t: ts = .5, shine = true } = {}) {
  const n = pts.length, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
  const R = Math.max(...pts.map(p => Math.hypot(p[0] - cx, p[1] - cy)));
  const T = pts.map(([x, y]) => [cx + (x - cx) * ts, cy + (y - cy) * ts - R * .04]);
  const sh = t => t < .5 ? mix(pal[0], pal[1], t * 2) : mix(pal[1], pal[2], (t - .5) * 2);
  const defs = `<linearGradient id="t${id}" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="${pal[2]}"/><stop offset="1" stop-color="${pal[1]}"/></linearGradient>`;
  let s = `<polygon points="${P(pts)}" fill="${pal[0]}"/>`;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n], A = T[i], B = T[(i + 1) % n];
    const mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy, l = Math.hypot(mx, my) || 1;
    const t = ((-.55 * mx - .83 * my) / l + 1) / 2, c1 = sh(.08 + t * .88), c2 = sh(t * .88 - .04);
    s += `<polygon points="${P([a, b, B])}" fill="${c1}" stroke="${c1}" stroke-width="1"/><polygon points="${P([a, B, A])}" fill="${c2}" stroke="${c2}" stroke-width="1"/>`;
  }
  const w = R * .05;
  s += `<polygon points="${P(T)}" fill="url(#t${id})" stroke="#fff" stroke-opacity=".5" stroke-width="${w * .4}"/>`;
  s += `<polygon points="${P(pts)}" fill="none" stroke="${pal[0]}" stroke-width="${w}" stroke-linejoin="round"/>`;
  if (shine) {
    const ex = cx - R * .2, ey = cy - R * .25;
    s += `<ellipse cx="${ex}" cy="${ey}" rx="${R * .19}" ry="${R * .085}" transform="rotate(-35 ${ex} ${ey})" fill="#fff" opacity=".85"/>`;
  }
  return { defs, s };
}
const sparkle = (x, y, r, o = 1) => `<path d="M${x} ${y - r}L${x + r * .22} ${y - r * .22}L${x + r} ${y}L${x + r * .22} ${y + r * .22}L${x} ${y + r}L${x - r * .22} ${y + r * .22}L${x - r} ${y}L${x - r * .22} ${y - r * .22}Z" fill="#fff" opacity="${o}"/>`;

function icon({ detail = true, rounded = false } = {}) {
  const S = 1024;
  const hero = gem('h', poly(12, detail ? 250 : 330, -90, 512, detail ? 600 : 520), ['#0b5866', '#4fdcec', '#ffffff'], { t: .52 });
  const ruby = gem('r', poly(6, 92, -90, 318, 318), ['#6d0820', '#e3264d', '#ffb0c0']);
  const gold = gem('c', [[712, 196], [790, 290], [712, 384], [634, 290]], ['#8a5200', '#ffb21f', '#fff0b8']);
  let defs = `
  <radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#1f6470"/><stop offset=".55" stop-color="#0c3138"/><stop offset="1" stop-color="#05171a"/></radialGradient>
  <radialGradient id="halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#9ff4ff" stop-opacity=".75"/><stop offset=".45" stop-color="#4fdcec" stop-opacity=".25"/><stop offset="1" stop-color="#4fdcec" stop-opacity="0"/></radialGradient>
  <linearGradient id="trail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
  <linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff8ff" stop-opacity=".22"/><stop offset="1" stop-color="#bff8ff" stop-opacity="0"/></linearGradient>
  ${hero.defs}${ruby.defs}${gold.defs}`;
  let body = `<rect width="${S}" height="${S}" ${rounded ? 'rx="228"' : ''} fill="url(#bg)"/>`;
  // light falling from the cave mouth
  body += `<g>${[-34, -14, 6, 26].map((a, i) => `<polygon points="512,-40 ${512 + Math.tan((a - 6) * Math.PI / 180) * 1100},1060 ${512 + Math.tan((a + 6) * Math.PI / 180) * 1100},1060" fill="url(#ray)" opacity="${[.6, 1, .8, .5][i]}"/>`).join('')}</g>`;
  // crystal shards at the base
  const shard = (x, w, h, r, o) => { const pts = [[x - w, 1100], [x - w, 1100 - h], [x, 1100 - h - w * 1.4], [x + w, 1100 - h], [x + w, 1100]]; const g = gem('s' + x, pts, ['#082b30', '#17565f', '#5fc9d6'], { t: .35, shine: false }); defs += g.defs; return `<g transform="rotate(${r} ${x} 1100)" opacity="${o}">${g.s}</g>`; };
  if (detail) body += shard(70, 70, 300, -14, .9) + shard(180, 40, 170, 6, .8) + shard(960, 80, 340, 12, .9) + shard(850, 42, 180, -8, .8);
  const cx = 512, cy = detail ? 600 : 520, hr = detail ? 250 : 330;
  body += `<circle cx="${cx}" cy="${cy}" r="${hr * 1.75}" fill="url(#halo)"/>`;
  body += `<ellipse cx="${cx}" cy="${cy + hr * 1.02}" rx="${hr * .78}" ry="${hr * .1}" fill="#000" opacity=".45"/>`;
  if (detail) {
    // the cascade: two gems tumbling in with motion trails
    body += `<rect x="290" y="70" width="56" height="200" rx="28" fill="url(#trail)" transform="rotate(-8 318 270)"/>`;
    body += `<rect x="690" y="40" width="44" height="170" rx="22" fill="url(#trail)" transform="rotate(10 712 210)"/>`;
    body += `<g transform="rotate(-12 318 318)">${ruby.s}</g><g transform="rotate(10 712 290)">${gold.s}</g>`;
  }
  body += hero.s;
  body += sparkle(cx + hr * .42, cy - hr * .5, hr * .2) + sparkle(cx - hr * .62, cy + hr * .36, hr * .1, .8);
  if (detail) body += sparkle(860, 520, 30, .85) + sparkle(170, 560, 22, .7);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><defs>${defs}</defs>${body}</svg>`;
}

const full = icon();                       // full-bleed: maskable + Apple touch icon
const round = icon({ rounded: true });     // rounded square for "any" purpose
const simple = icon({ detail: false, rounded: true }); // bolder hero-only version for tiny sizes
writeFileSync(OUT + 'icon.svg', round);
writeFileSync(OUT + 'favicon.svg', simple);
const png = (svg, size, name) => sharp(Buffer.from(svg), { density: 72 * size / 1024 * 4 }).resize(size, size).png({ compressionLevel: 9 }).toFile(OUT + name);
await Promise.all([
  png(round, 192, 'icon-192.png'),
  png(round, 512, 'icon-512.png'),
  png(full, 192, 'icon-maskable-192.png'),
  png(full, 512, 'icon-maskable-512.png'),
  png(full, 180, 'apple-touch-icon.png'),
  png(simple, 32, 'favicon-32.png'),
  png(full, 1024, 'icon-1024.png'),
]);
console.log('icons written to', OUT);
