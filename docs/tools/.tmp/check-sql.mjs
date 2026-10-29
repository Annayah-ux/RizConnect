import { readFileSync } from 'node:fs';

const sql = readFileSync('sql/schema.sql', 'utf8');
const lines = sql.split('\n');

const tables = new Map();
let current = null;
for (const l of lines) {
  const m = l.match(/^CREATE TABLE (\w+) \(/);
  if (m) { current = m[1]; tables.set(current, new Set()); continue; }
  if (current) {
    if (l.startsWith(');')) { current = null; continue; }
    const c = l.match(/^  (\w+)\s+\S/);
    if (c) tables.get(current).add(c[1]);
  }
}
const views = [...sql.matchAll(/^CREATE (?:MATERIALIZED )?VIEW (\w+)/gm)].map((m) => m[1]);

const idx = [...sql.matchAll(/^CREATE (UNIQUE )?INDEX (\w+) ON (\w+)(?: (?:USING (\w+))? ?\(([^)]*)\))?( INCLUDE \(([^)]*)\))?( WHERE (.*))?;/gm)]
  .map((m) => ({ unique: !!m[1], name: m[2], table: m[3], method: m[4] || 'btree', cols: m[5] || '', include: m[7] || '', where: m[9] || '' }));

const problems = [];
const names = new Set();
for (const i of idx) {
  if (names.has(i.name)) problems.push(`doublon d'index : ${i.name}`);
  names.add(i.name);
  const cols = tables.get(i.table);
  if (!cols && !views.includes(i.table)) problems.push(`table/vue inconnue : ${i.table}`);
  if (cols) {
    for (const raw of i.cols.split(',')) {
      const c = raw.trim().split(/\s+/)[0];
      if (c && !cols.has(c)) problems.push(`${i.name} : colonne inconnue ${i.table}.${c}`);
    }
    for (const raw of i.include.split(',')) {
      const c = raw.trim();
      if (c && !cols.has(c)) problems.push(`${i.name} : INCLUDE inconnu ${i.table}.${c}`);
    }
  }
  if (i.include && i.method !== 'btree') problems.push(`${i.name} : INCLUDE interdit en ${i.method}`);
  if (i.where && i.where.includes('statut')) {
    const table = tables.get(i.table);
    const enums = readFileSync('sql/schema.sql', 'utf8').match(new RegExp(`CHECK \\(${i.table}[^)]*statut IN \\(([^)]*)\\)\\)`));
    if (enums) {
      const allowed = enums[1].split(',').map((s) => s.trim().replace(/'/g, ''));
      for (const v of [...i.where.matchAll(/'([^']+)'/g)].map((x) => x[1])) {
        if (!allowed.includes(v)) problems.push(`${i.name} : valeur '${v}' absente de ${i.table}.statut`);
      }
    }
  }
}

const alters = [...sql.matchAll(/^ALTER TABLE (\w+) SET \((.*)\);/gm)];
for (const a of alters) if (!tables.has(a[1])) problems.push(`ALTER TABLE inconnue : ${a[1]}`);

const matIdx = idx.filter((i) => views.includes(i.table));
const hasUniqueMat = matIdx.some((i) => i.unique && i.cols.includes('zone_id') && i.cols.includes('campagne_id'));

console.log('tables          :', tables.size);
console.log('vues            :', views.length, views.join(', '));
console.log('index           :', idx.length, '(dont FK :', idx.filter((i) => i.name.startsWith('idx_') && [...tables].some(([t, c]) => i.name === `idx_${t}_${i.cols.trim().split(/\s+/)[0]}`)).length + ')');
console.log('  uniques       :', idx.filter((i) => i.unique).length);
console.log('  partiels      :', idx.filter((i) => i.where).length);
console.log('  INCLUDE       :', idx.filter((i) => i.include).length);
console.log('  gist/gin/brin :', ['gist', 'gin', 'brin'].map((m) => `${m}=${idx.filter((i) => i.method === m).length}`).join(' '));
console.log('  matview       :', matIdx.length, 'dont unique sur (zone_id, campagne_id) :', hasUniqueMat);
console.log('ALTER TABLE SET :', alters.length);
console.log('conflits        :', problems.length);
for (const p of problems) console.log('  ✗', p);

const docs = ['MCD.md', 'MLD.md', 'MCT.md', 'README.md', 'sql/schema.sql'];
for (const f of docs) {
  const t = readFileSync(f, 'utf8');
  const ph = (t.match(/\{\{[A-Z0-9_.]+\}\}/g) || []).length;
  const bad = (t.match(/\uFFFD/g) || []).length;
  if (ph || bad) console.log(`✗ ${f} placeholders=${ph} invalid=${bad}`);
}
console.log('documents : OK si aucune ligne ✗ ci-dessus');
