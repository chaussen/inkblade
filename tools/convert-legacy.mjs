// Inkblade M1a Step-1 one-off: carry the hand-authored v1 roster verbatim
// out of inkblade-m075.html (BUILD_ID S1-M075-b2-20260705) into a v2 pack.
// Geometry is extracted from the verified build, never retyped — the Step-1
// gate depends on bit-identical stroke coordinates. Retired at Step 2 when
// pipeline/build-packs.mjs emits packs from real median data (S1-D029).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../inkblade-m075.html', import.meta.url), 'utf8');

function extract(name) {
  const start = html.indexOf(`const ${name} = [`);
  if (start < 0) throw new Error(`${name} not found`);
  const open = html.indexOf('[', start);
  let depth = 0, i = open;
  for (;; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) break; }
  }
  return vm.runInNewContext(html.slice(open, i + 1));
}

const CHARS = extract('CHARS');
const INTRO = extract('INTRO');
if (CHARS.length !== 14) throw new Error('expected 14 chars, got ' + CHARS.length);

// char → world element mapping, transcribed from spawnWorldFor() in the same
// build (the 14-case switch this pack deletes). Params vocabulary per S1-D024:
// scale (base size multiplier), vary:false (no per-instance size variance),
// offsets (extra members at base.x+dx), memberScale defaults 0.9.
const WORLD = {
  '一': { tier: 1, kind: 'horizon', params: { vary: false } },
  '二': { tier: 1, kind: 'ridge', params: {} },
  '三': { tier: 1, kind: 'terrace', params: {} },
  '十': { tier: 1, kind: 'path', params: {} },
  '大': { tier: 1, kind: 'peak', params: { scale: 1.1 } },
  '人': { tier: 1, kind: 'walker', params: {} },
  '木': { tier: 1, kind: 'tree', params: {} },
  '火': { tier: 1, kind: 'fire', params: {} },
  '休': { tier: 1, kind: 'resttree', params: {} },
  '众': { tier: 1, kind: 'crowd', params: {} },
  '林': { tier: 1, kind: 'tree', params: { offsets: [0.06] } },
  '炎': { tier: 1, kind: 'fire', params: { scale: 1.5 } },
  '森': { tier: 1, kind: 'tree', params: { scale: 1.05, offsets: [-0.06, 0.07] } },
  '焱': { tier: 1, kind: 'fire', params: { scale: 2.0 } },
};

// Matter classes + tags per S1-D020 (assignments live in data, world layer only)
const KINDS = {
  tree:     { cls: 'structure', tags: ['flammable', 'shelter'] },
  resttree: { cls: 'structure', tags: ['flammable', 'shelter'] },
  peak:     { cls: 'structure', tags: [] },
  ridge:    { cls: 'structure', tags: [] },
  terrace:  { cls: 'structure', tags: [] },
  horizon:  { cls: 'structure', tags: [] },
  path:     { cls: 'structure', tags: [] },
  seal:     { cls: 'structure', tags: [] },
  walker:   { cls: 'agent', tags: ['living'] },
  crowd:    { cls: 'agent', tags: ['living'] },
  fire:     { cls: 'event', tags: ['heat', 'mortal'] },
};

const toVerb = t => (t === 'na' || t === 'dian') ? 'dr' : t;

const pack = {
  version: 2,
  meta: {
    id: 'core',
    generated: '2026-07-05',
    source: 'hand-authored v1 roster, legacy carry from S1-M075-b2-20260705',
    intro: INTRO,
  },
  kinds: KINDS,
  chars: CHARS.map(c => ({
    ch: c.ch, pinyin: c.pinyin, gloss: c.gloss,
    fx: { type: c.fx, n: c.n || 1 },
    strokes: c.strokes.map(s => {
      const st = { verbs: toVerb(s.t), pts: [s.a, s.b] };
      if (s.t === 'pie' || s.t === 'na') st.form = s.t; // legacy 2-pt render bow
      return st;
    }),
    comps: c.comps.map(r => ({ range: r })),
    world: WORLD[c.ch] || null,
  })),
};

mkdirSync(new URL('../packs', import.meta.url), { recursive: true });
writeFileSync(new URL('../packs/core.json', import.meta.url), JSON.stringify(pack, null, 1));
console.log('packs/core.json written:', pack.chars.length, 'chars,', Object.keys(KINDS).length, 'kinds');
