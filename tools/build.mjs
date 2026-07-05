// Inkblade single-file build (S1-D023). Concatenates src/*.js in filename
// order into src/shell.html, injecting the default pack and the BUILD_ID
// (read from the BUILD_ID file — bump it there before any build that leaves
// your hands). Dependency-free by design: the build must stay auditable.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');

const buildId = read('BUILD_ID').trim();
if (!/^S1-M\w+-b\d+-\d{8}$/.test(buildId)) throw new Error('malformed BUILD_ID: ' + buildId);

const pack = read('packs/core.json');
JSON.parse(pack); // sanity: the embedded pack must be valid JSON

const files = readdirSync(new URL('src', root)).filter(f => /^\d\d-.*\.js$/.test(f)).sort();
if (!files.length) throw new Error('no src modules found');
const scripts = files.map(f => `/* ==== src/${f} ==== */\n` + read('src/' + f)).join('\n');
if (/'use strict'/.test(scripts)) throw new Error("modules must not re-declare 'use strict' (shell provides it)");

const stepNote = process.argv[2] || 'pipeline-generated pack';
const html = read('src/shell.html')
  .replaceAll('{{BUILD_ID}}', buildId)
  .replaceAll('{{MILESTONE}}', buildId.match(/^S1-(M[^-]+)-b/)[1])
  .replace('{{STEP_NOTE}}', stepNote)
  .replace('{{PACK}}', () => pack.trim())
  .replace('{{SCRIPTS}}', () => scripts);

const outName = 'inkblade-' + buildId.match(/^S1-(M[^-]+)-b/)[1].toLowerCase() + '.html';
writeFileSync(new URL(outName, root), html);
console.log(outName, 'written —', buildId, '—', files.length, 'modules,', (html.length / 1024).toFixed(0) + 'KB');
