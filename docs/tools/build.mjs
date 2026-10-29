/**
 * Construction des livrables : images (SVG/PNG), sources Mermaid, DDL SQL et
 * documents Markdown à partir des gabarits de `templates/`.
 *
 * Usage : node build.mjs
 */
import { instance } from '@viz-js/viz';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  entities,
  associations,
  domains,
  mctFlows,
  etats,
  vues,
  regles,
  rgpd,
  project,
} from './model.mjs';
import {
  mcdDot,
  mldDot,
  mctDot,
  etatsDot,
  mcdMermaid,
  mldMermaid,
  etatsMermaid,
  ddl,
  snake,
  tableColumns,
  fkColumns,
  pkOf,
} from './render.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const docs = resolve(here, '..');
const images = join(docs, 'images');
const sources = join(docs, 'sources');
const sqlDir = join(docs, 'sql');
const tmp = join(here, '.tmp');

for (const dir of [images, sources, sqlDir, tmp]) mkdirSync(dir, { recursive: true });

/* ------------------------------------------------------------------ */
/* 1. Rendu Graphviz                                                   */
/* ------------------------------------------------------------------ */

const viz = await instance();

function renderSvg(dot, name) {
  writeFileSync(join(sources, `${name}.dot`), dot, 'utf8');
  const svg = viz.renderString(dot, { format: 'svg', engine: 'dot' });
  writeFileSync(join(images, `${name}.svg`), svg, 'utf8');
  return svg;
}

function chromePath() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ];
  return candidates.find((p) => existsSync(p));
}

const CHROME = chromePath();

/** Convertit un SVG Graphviz en PNG via Chrome headless. */
function svgToPng(svg, name, upscale = 1.5) {
  const box = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  if (!box) throw new Error(`viewBox introuvable pour ${name}`);
  const w = Math.ceil(Number(box[3]));
  const h = Math.ceil(Number(box[4]));
  const MAX = 16000;
  const scale = Math.min(upscale, MAX / w, MAX / h);
  const outW = Math.round(w * scale);
  const outH = Math.round(h * scale);
  const body = svg.replace(/<svg([^>]*)>/, `<svg$1 width="${w}" height="${h}">`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:#fff;}
    #w{width:${outW}px;height:${outH}px;overflow:hidden;}
    #w svg{transform:scale(${scale});transform-origin:top left;display:block;}
  </style></head><body><div id="w">${body}</div></body></html>`;
  const file = join(tmp, `${name}.html`);
  writeFileSync(file, html, 'utf8');
  execFileSync(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--default-background-color=ffffffff',
    '--virtual-time-budget=2000',
    `--window-size=${outW},${outH}`,
    `--screenshot=${join(images, `${name}.png`)}`,
    `file:///${file.replace(/\\/g, '/')}`,
  ], { stdio: 'ignore' });
  return { w: outW, h: outH, svgW: w, svgH: h };
}

const diagrams = [
  ['mcd', mcdDot(), 1.5],
  ...domains.map((d) => [`mcd-${d.id}`, mcdDot(d.id), 2]),
  ['mld', mldDot(), 1.5],
  ['mct', mctDot(), 2],
  ['mct-1', mctDot(['M1', 'M2', 'M3', 'M4', 'M5']), 2],
  ['mct-2', mctDot(['M6', 'M7', 'M8', 'M9', 'M10']), 2],
  ['mct-etats', etatsDot(), 2],
];

const sizes = {};
for (const [name, dot, upscale] of diagrams) {
  const svg = renderSvg(dot, name);
  sizes[name] = svgToPng(svg, name, upscale);
  console.log(`✔ ${name}.svg / ${name}.png  (${sizes[name].w}×${sizes[name].h})`);
}

/* ------------------------------------------------------------------ */
/* 2. Sources Mermaid + SQL                                            */
/* ------------------------------------------------------------------ */

writeFileSync(join(sources, 'mcd.mmd'), mcdMermaid(), 'utf8');
writeFileSync(join(sources, 'mld.mmd'), mldMermaid(), 'utf8');
writeFileSync(join(sources, 'mct-etats.mmd'), etatsMermaid(), 'utf8');
writeFileSync(join(sqlDir, 'schema.sql'), ddl(), 'utf8');
console.log('✔ sources Mermaid + schema.sql');

/* ------------------------------------------------------------------ */
/* 3. Fragments Markdown                                               */
/* ------------------------------------------------------------------ */

const mdEscape = (s = '') => String(s).replace(/\|/g, '\\|');

const tableEntityByDomain = domains
  .map((d) => {
    const list = entities.filter((e) => e.domain === d.id);
    return [
      `### ${d.id} — ${d.label} (${d.modules})`,
      '',
      '| Code | Entité | Rôle dans le système |',
      '| --- | --- | --- |',
      ...list.map((e) => `| **${e.id}** | ${mdEscape(e.label)} | ${mdEscape(e.desc)} |`),
      '',
    ].join('\n');
  })
  .join('\n');

const tableAssociations = domains
  .map((d) => {
    const list = associations.filter((a) => {
      const ea = entities.find((e) => e.id === a.a);
      const eb = entities.find((e) => e.id === a.b);
      return ea.domain === d.id || eb.domain === d.id;
    });
    return [
      `### ${d.id} — ${d.label}`,
      '',
      '| Id | Entité A | Card. | Entité B | Card. | Association | Justification |',
      '| --- | --- | :--: | --- | :--: | --- | --- |',
      ...list.map(
        (a) => `| ${a.id} | ${a.a} | ${a.cardA} | ${a.b} | ${a.cardB} | **${mdEscape(a.nom)}** | ${mdEscape(a.d)} |`,
      ),
      '',
    ].join('\n');
  })
  .join('\n');

const dictionnaire = entities
  .map((e) => {
    const rows = e.attrs.map((a) => {
      const vals = a.en ? a.en.map((v) => `\`${v}\``).join(', ') : '';
      return `| \`${a.n}\` | \`${a.t}\` | ${a.k || '—'} | ${mdEscape(a.d)} | ${vals} |`;
    });
    return [
      `#### ${e.id} — ${e.label}`,
      '',
      mdEscape(e.desc),
      '',
      '| Attribut | Type | Clé | Description | Valeurs |',
      '| --- | --- | :--: | --- | --- |',
      ...rows,
      '',
    ].join('\n');
  })
  .join('\n');

const reglesTable = [
  '| Règle | Énoncé du cahier des charges | Traduction dans le modèle |',
  '| --- | --- | --- |',
  ...regles.map((r) => `| **${r[0]}** | ${mdEscape(r[1])} | ${mdEscape(r[2])} |`),
  '',
].join('\n');

const rgpdTable = [
  '| Principe | Mise en œuvre |',
  '| --- | --- |',
  ...rgpd.map((r) => `| **${r[0]}** | ${mdEscape(r[1])} |`),
  '',
].join('\n');

/* --------------------------- MLD fragments ------------------------- */

const mldTables = domains
  .map((d) => {
    const list = entities.filter((e) => e.domain === d.id);
    return [
      `### ${d.id} — ${d.label}`,
      '',
      '| Table | Colonnes | Clé primaire | Clés étrangères | Description |',
      '| --- | --: | --- | --- | --- |',
      ...list.map((e) => {
        const cols = tableColumns(e);
        const pk = e.attrs.filter((a) => a.k.includes('PK')).map((a) => `\`${a.n}\``).join(', ');
        const fks = fkColumns(e.id).map((f) => `\`${f.n}\` → ${f.ref}`).join('<br/>') || '—';
        return `| [\`${snake(e.id)}\`](#${snake(e.id)}) | ${cols.length} | ${pk} | ${fks} | ${mdEscape(e.label)} |`;
      }),
      '',
    ].join('\n');
  })
  .join('\n');

const mldDetail = entities
  .map((e) => {
    const cols = tableColumns(e);
    const pk = e.attrs.filter((a) => a.k.includes('PK')).map((a) => a.n);
    const uk = e.attrs.filter((a) => a.k.includes('UK')).map((a) => a.n);
    const rows = cols.map((a) => {
      const key = a.k.includes('PK') && a.k.includes('FK') ? 'PK, FK' : a.k || '—';
      const nul = a.opt || (a.k.includes('FK') && a.nullable) ? 'oui' : 'non';
      return `| \`${a.n}\` | \`${a.t}\` | ${key} | ${mdEscape(a.d)} | ${nul} |`;
    });
    const checks = e.attrs
      .filter((a) => a.en)
      .map((a) => `\`CHECK (${a.n} IN (${a.en.map((v) => `'${v}'`).join(', ')}))\``);
    const notes = [];
    if (pk.length === 1) notes.push(`Clé primaire : \`${pk[0]}\`.`);
    if (uk.length) notes.push(`Clés candidates : ${uk.map((u) => `\`${u}\``).join(', ')}.`);
    if (checks.length) notes.push(`Contraintes de domaine : ${checks.join(' ; ')}.`);
    if (e.id === 'EXPLOITATION') notes.push('`superficie_totale_ha` est dénormalisée (recalculée par trigger ou batch).');
    if (e.id === 'RECOLTE') notes.push('`rendement_t_ha` est calculé à l’enregistrement (`quantite_paddy_kg / 1000 / superficie_ha`).');
    if (e.id === 'NOTIFICATION') notes.push('`message` conserve une copie du texte envoyé (instantané historique).');
    return [
      `#### ${snake(e.id)}`,
      '',
      mdEscape(e.desc),
      '',
      '| Colonne | Type | Clé | Description | NULL |',
      '| --- | --- | :--: | --- | :--: |',
      ...rows,
      '',
      notes.join(' '),
      '',
    ].join('\n');
  })
  .join('\n');

const mldMapping = [
  '| Association | Cardinalités | Règle de passage | Résultat |',
  '| --- | --- | --- | --- |',
  ...associations.map((a) => {
    const parent = a.on === 'b' ? a.a : a.b;
    const child = a.on === 'b' ? a.b : a.a;
    const card = a.on === 'b' ? a.cardB : a.cardA;
    const rule = card.startsWith('0')
      ? 'FKnullable côté « N » (0,1)'
      : 'FK obligatoire côté « N » (1,1)';
    return `| ${a.id} ${a.nom} | ${a.cardA} / ${a.cardB} | ${rule} | \`${snake(child)}.${a.fk}\` → \`${snake(parent)}.${pkOf(parent).n}\` |`;
  }),
  '',
].join('\n');

const vuesMd = vues
  .map(
    (v) => [
      `### ${v.nom}`,
      '',
      v.but,
      '',
      '```sql',
      v.sql,
      '```',
      '',
    ].join('\n'),
  )
  .join('\n');

const indexList = entities
  .flatMap((e) => fkColumns(e.id).map((f) => `\`idx_${snake(e.id)}_${f.n}\``))
  .join(', ');

/* --------------------------- MCT fragments ------------------------- */

const allChains = mctFlows.flatMap((m) => m.chains.map((c) => ({ module: m.module, moduleLabel: m.label, ...c })));

const evenements = [
  '| Code | Événement | Module | Opérations déclenchées |',
  '| --- | --- | :--: | --- |',
  ...mctFlows
    .map((m) =>
      m.chains
        .map((c) => `| **${c.event[0]}** | ${mdEscape(c.event[1])} | ${m.module} | ${c.ops.map((o) => o[0]).join(', ')} |`)
        .join('\n'),
    )
    .join('\n'),
  '',
].join('\n');

const operations = [
  '| Code | Opération | Module | Entités / vues utilisées | Résultat produit |',
  '| --- | --- | :--: | --- | --- |',
  ...allChains
    .map((c) =>
      c.ops
        .map((o) => `| **${o[0]}** | ${mdEscape(o[1])} | ${c.module} | ${o[2]} | ${c.result[0]} ${mdEscape(c.result[1])} |`)
        .join('\n'),
    )
    .join('\n'),
  '',
].join('\n');

const synchros = [
  ['S1', 'Inscription (M1)', 'Le compte n’est activé qu’après vérification du code SMS ; la création de l’exploitation attend la validation du compte.'],
  ['S2', 'Calendrier cultural (M3)', 'Les dates générées, puis les décalages validés, sont appliqués en une seule transaction : aucune étape partiellement replanifiée.'],
  ['S3', 'Diffusion d’alerte (M5)', 'Toutes les notifications d’une alerte sont créées avant l’envoi effectif : une alerte est diffusée intégralement ou rejouée (RG-04).'],
  ['S4', 'Dépôt au GCV (M7)', 'Le mouvement de stock et son reçu numérique sont écrits ensemble : pas de dépôt sans reçu (RF-32).'],
  ['S5', 'Crédit de campagne (M7)', 'La garantie en stock est bloquée avant la décision de l’IMF ; le déblocage suit la décision.'],
  ['S6', 'Sinistre (M9)', 'Le sinistre et sa transmission au BNGRC sont séparés : un sinistre peut rester en attente de réseau (mode hors ligne).'],
  ['S7', 'Synchronisation (M10)', 'Les écritures hors ligne sont rejouées dans l’ordre, avec journalisation des conflits.'],
  '',
].map((s) => `| **${s[0]}** | ${s[1]} | ${s[2]} |`).join('\n');

const synchrosTable = ['| Barre | Processus | Règle de synchronisation |', '| --- | --- | --- |', synchros, ''].join('\n');

const etatsTables = Object.entries(etats)
  .map(([label, def]) => {
    const rows = def.transitions
      .map(([from, to, lbl]) => `| \`${from}\` | \`${to}\` | ${mdEscape(lbl)} |`)
      .join('\n');
    return [
      `### ${label} (\`${snake(def.entite)}.${def.champ}\`)`,
      '',
      `État initial : \`${def.initial}\`.`,
      '',
      '| De | Vers | Déclencheur |',
      '| --- | --- | --- |',
      rows,
      '',
    ].join('\n');
  })
  .join('\n');

const mermaidEtats = etatsMermaid();

/* ------------------------------------------------------------------ */
/* 4. Fusion des gabarits                                              */
/* ------------------------------------------------------------------ */

const counts = {
  ENTITES: entities.length,
  ASSOCIATIONS: associations.length,
  TABLES: entities.length,
  COLONNES: entities.reduce((n, e) => n + tableColumns(e).length, 0),
  MODULES: mctFlows.length,
  EVENEMENTS: allChains.length,
  OPERATIONS: allChains.reduce((n, c) => n + c.ops.length, 0),
  ETATS: Object.keys(etats).length,
  VUES: vues.length,
  REGLES: regles.length,
};

const fragments = {
  PROJECT: project,
  COUNTS: counts,
  ...Object.fromEntries(Object.entries(counts).map(([k, v]) => [`COUNTS.${k}`, String(v)])),
  TABLE_DOMAINES: [
    '| Domaine | Contenu | Modules du cahier des charges | Entités |',
    '| --- | --- | :--: | --: |',
    ...domains.map(
      (d) =>
        `| **${d.id}** | ${mdEscape(d.label)} | ${d.modules} | ${entities.filter((e) => e.domain === d.id).length} |`,
    ),
    '',
  ].join('\n'),
  TABLE_ENTITES: tableEntityByDomain,
  TABLE_ASSOCIATIONS: tableAssociations,
  DICTIONNAIRE: dictionnaire,
  REGLES: reglesTable,
  RGPD: rgpdTable,
  MLD_TABLES: mldTables,
  MLD_DETAIL: mldDetail,
  MLD_MAPPING: mldMapping,
  VUES: vuesMd,
  INDEX_LIST: indexList,
  MERMAID_MCD: '```mermaid\n' + mcdMermaid() + '\n```',
  MERMAID_MLD: '```mermaid\n' + mldMermaid() + '\n```',
  MERMAID_ETATS: mermaidEtats,
  EVENEMENTS: evenements,
  OPERATIONS: operations,
  SYNCHROS: synchrosTable,
  ETATS_TABLES: etatsTables,
  IMAGE_MCD: `![MCD RizConnect](images/mcd.png)`,
  IMAGE_MLD: `![MLD RizConnect](images/mld.png)`,
  IMAGE_MCT: `![MCT RizConnect](images/mct.png)`,
  IMAGE_MCT1: `![MCT modules M1 à M5](images/mct-1.png)`,
  IMAGE_MCT2: `![MCT modules M6 à M10](images/mct-2.png)`,
  IMAGE_ETATS: `![Cycles de vie RizConnect](images/mct-etats.png)`,
  MCD_DOMAIN_IMAGES: domains
    .map((d) => {
      const key = `mcd-${d.id}`;
      const n = entities.filter((e) => e.domain === d.id).length;
      return [
        `#### ${d.id} — ${d.label}`,
        '',
        `Modules ${d.modules} · ${n} entités. Les entités grisées relèvent d'autres domaines : elles ne figurent là que pour lire les associations.`,
        '',
        `![MCD ${d.id}](images/${key}.png)`,
        '',
        `*\`docs/images/${key}.png\` (${sizes[key].w} × ${sizes[key].h} px) — source : \`docs/sources/${key}.dot\`.*`,
        '',
      ].join('\n');
    })
    .join('\n'),
  SIZES_MCD: `${sizes.mcd.w} × ${sizes.mcd.h} px`,
  SIZES_MLD: `${sizes.mld.w} × ${sizes.mld.h} px`,
  SIZES_MCT: `${sizes.mct.w} × ${sizes.mct.h} px`,
  SIZES_MCT1: `${sizes['mct-1'].w} × ${sizes['mct-1'].h} px`,
  SIZES_MCT2: `${sizes['mct-2'].w} × ${sizes['mct-2'].h} px`,
  SIZES_ETATS: `${sizes['mct-etats'].w} × ${sizes['mct-etats'].h} px`,
};

const templates = ['MCD.md', 'MLD.md', 'MCT.md', 'README.md'];
for (const tpl of templates) {
  let text = readFileSync(join(here, 'templates', tpl), 'utf8');
  for (const [key, value] of Object.entries(fragments)) {
    const rendered = typeof value === 'string' ? value : JSON.stringify(value);
    text = text.replaceAll(`{{${key}}}`, rendered);
  }
  writeFileSync(join(docs, tpl), text, 'utf8');
  console.log(`✔ ${tpl}`);
}

rmSync(tmp, { recursive: true, force: true });
