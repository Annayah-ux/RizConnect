/**
 * Rendu des diagrammes Merise à partir de `model.mjs`.
 *
 * Sorties : DOT (Graphviz), Mermaid, DDL SQL.
 * Les images (SVG/PNG) sont produites par `build.mjs`.
 */
import { entities, associations, domains, mctFlows, etats, vues } from './model.mjs';

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

export const snake = (id) => id.toLowerCase();

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const entityById = new Map(entities.map((e) => [e.id, e]));
const domainById = new Map(domains.map((d) => [d.id, d]));

/** Colonne porteuse de la clé primaire d'une entité. */
export const pkOf = (entityId) => {
  const e = entityById.get(entityId);
  const pk = e.attrs.filter((a) => a.k.includes('PK'));
  return pk.length ? pk[0] : e.attrs[0];
};

/** Colonnes clés étrangères d'une entité (dérivées des associations). */
export function fkColumns(entityId) {
  return associations
    .filter((a) => (a.on === 'b' ? a.b === entityId : a.a === entityId))
    .map((a) => {
      const target = a.on === 'b' ? a.a : a.b;
      const t = pkOf(target);
      const card = a.on === 'b' ? a.cardB : a.cardA;
      return {
        n: a.fk,
        t: t.t,
        k: 'FK',
        d: `${a.nom} → ${target}`,
        ref: `${snake(target)}.${t.n}`,
        nullable: card.startsWith('0'),
        assoc: a.id,
      };
    });
}

/** Liste complète des colonnes logiques : colonnes propres + clés étrangères. */
export function tableColumns(entity) {
  return [...entity.attrs, ...fkColumns(entity.id)];
}

/** Type Mermaid : on retire les précisions de type entre parenthèses. */
const mermaidType = (t) => t.replace(/\(.*\)$/, '').replace(/[[\]]/g, '');

/* ------------------------------------------------------------------ */
/* DOT — MCD                                                            */
/* ------------------------------------------------------------------ */

function mcdNode(e, muted = false) {
  const d = domainById.get(e.domain);
  const border = muted ? '#94a3b8' : d.border;
  const head = muted ? '#f1f5f9' : d.color;
  const rows = e.attrs
    .map((a) => {
      const name = a.k.includes('PK') ? `<U><B>${esc(a.n)}</B></U>` : esc(a.n);
      return `<TR><TD ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="8">${name} <FONT COLOR="#64748b">: ${esc(a.t)}</FONT></FONT></TD></TR>`;
    })
    .join('');
  return `  ${e.id} [shape=plaintext, tooltip="${esc(e.desc)}", label=<
    <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="3" COLOR="${border}" BGCOLOR="#ffffff">
      <TR><TD BGCOLOR="${head}" ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="9.5"><B>${esc(e.id)}</B></FONT><BR/><FONT POINT-SIZE="7.5" COLOR="#334155">${esc(e.label)}</FONT></TD></TR>
      ${rows}
    </TABLE>>];`;
}

/**
 * Diagramme conceptuel.
 * @param {string|null} filter code de domaine : produit alors une vue détaillée
 *        (entités du domaine + entités de contexte reliées).
 */
export function mcdDot(filter = null) {
  let sets;
  if (filter) {
    const focus = entities.filter((e) => e.domain === filter);
    const focusIds = new Set(focus.map((e) => e.id));
    const rel = associations.filter((a) => focusIds.has(a.a) || focusIds.has(a.b));
    const ids = new Set(focusIds);
    rel.forEach((a) => {
      ids.add(a.a);
      ids.add(a.b);
    });
    const dom = domainById.get(filter);
    sets = [
      { dom, title: `${dom.id} — ${dom.label}`, sub: `Modules ${dom.modules}`, list: focus, main: true },
      {
        dom: null,
        title: 'Entités de contexte (autres domaines)',
        list: entities.filter((e) => !focusIds.has(e.id) && ids.has(e.id)),
        main: false,
      },
    ].filter((s) => s.list.length);
    sets.assocs = rel;
  } else {
    sets = domains.map((d) => ({
      dom: d,
      title: `${d.id} — ${d.label}`,
      sub: `Modules ${d.modules}`,
      list: entities.filter((e) => e.domain === d.id),
      main: true,
    }));
    sets.assocs = associations;
  }

  const clusters = sets
    .map((s, i) => {
      const color = s.main ? s.dom.border : '#94a3b8';
      const bg = s.main ? '#ffffff' : '#f8fafc';
      return `  subgraph cluster_${s.dom ? s.dom.id : 'CTX'} {
    label=<<B>${esc(s.title)}</B>${s.sub ? `<BR/><FONT POINT-SIZE="8">${s.sub}</FONT>` : ''}>;
    fontsize=${s.main ? 11 : 9}; fontcolor="${color}"; color="${color}"; style="rounded,dashed"; penwidth=1.2; margin=14; bgcolor="${bg}";
${s.list.map((e) => mcdNode(e, !s.main)).join('\n')}
  }`;
    })
    .join('\n\n');

  const edges = sets.assocs
    .map(
      (a) => `  ${a.a} -> ${a.b} [label=<<FONT POINT-SIZE="7">${esc(a.nom)}</FONT>>, taillabel=<<B>${a.cardA}</B>>, headlabel=<<B>${a.cardB}</B>>, labeldistance=1.1, labelangle=0, taillabeldistance=1.6, headlabeldistance=1.6, tooltip="${esc(a.id)} — ${esc(a.d)}"];`,
    )
    .join('\n');

  const title = filter
    ? `<B>MCD — ${esc(domainById.get(filter).id)} ${esc(domainById.get(filter).label)}</B> <FONT POINT-SIZE="9">· vue détaillée (modules ${domainById.get(filter).modules})</FONT>`
    : '<B>MCD — RizConnect Madagascar</B> <FONT POINT-SIZE="9">· notation Merise · cardinalités (min,max) · PK soulignée</FONT>';

  return `digraph MCD {
  graph [rankdir=TB, splines=true, overlap=false, nodesep=0.35, ranksep=1.0, pad=0.35, bgcolor="white", fontname="Helvetica", labelloc="b", labeljust="l",
    label=<
      <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5" COLOR="#94a3b8">
        <TR><TD ALIGN="LEFT" BGCOLOR="#f1f5f9">${title}</TD></TR>
        ${filter ? '' : domains.map((d) => `<TR><TD ALIGN="LEFT" BGCOLOR="${d.color}"><FONT POINT-SIZE="8"><B>${d.id}</B> ${esc(d.label)} · ${d.modules}</FONT></TD></TR>`).join('')}
      </TABLE>>];
  node [fontname="Helvetica", fontsize=9, margin=0];
  edge [fontname="Helvetica", fontsize=7.5, color="#64748b", fontcolor="#334155", penwidth=1.1, arrowsize=0.7];

${clusters}

${edges}
}`;
}

/* ------------------------------------------------------------------ */
/* DOT — MLD                                                            */
/* ------------------------------------------------------------------ */

function mldNode(e) {
  const d = domainById.get(e.domain);
  const cols = tableColumns(e);
  const rows = cols
    .map((a) => {
      const isPk = a.k.includes('PK');
      const isFk = a.k.includes('FK');
      const isUk = a.k.includes('UK');
      const name = isPk
        ? `<U><B>${esc(a.n)}</B></U>`
        : isFk
          ? `<I>${esc(a.n)}</I>`
          : esc(a.n);
      const badges = [
        isPk ? '<FONT COLOR="#b91c1c"><B>PK</B></FONT>' : '',
        isFk ? '<FONT COLOR="#1d4ed8"><B>FK</B></FONT>' : '',
        isUk ? '<FONT COLOR="#047857"><B>UK</B></FONT>' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `<TR><TD ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="8">${name}${badges ? ' ' + badges : ''}</FONT></TD><TD ALIGN="LEFT" BALIGN="LEFT"><FONT POINT-SIZE="7.5" COLOR="#475569">${esc(a.t)}</FONT></TD></TR>`;
    })
    .join('');
  return `  ${e.id} [shape=plaintext, tooltip="${esc(e.desc)}", label=<
    <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="3" COLOR="${d.border}" BGCOLOR="#ffffff">
      <TR><TD COLSPAN="2" BGCOLOR="${d.color}" ALIGN="LEFT"><FONT POINT-SIZE="9.5"><B>${snake(e.id)}</B></FONT> <FONT POINT-SIZE="7.5" COLOR="#334155">${esc(e.label)}</FONT></TD></TR>
      ${rows}
    </TABLE>>];`;
}

export function mldDot() {
  const clusters = domains
    .map((d) => {
      const list = entities.filter((e) => e.domain === d.id);
      return `  subgraph cluster_${d.id} {
    label=<<B>${d.id}</B> — ${esc(d.label)}<BR/><FONT POINT-SIZE="8">Modules ${d.modules}</FONT>>;
    fontsize=11; fontcolor="${d.border}"; color="${d.border}"; style="rounded,dashed"; penwidth=1.2; margin=14;
${list.map(mldNode).join('\n')}
  }`;
    })
    .join('\n\n');

  const edges = associations
    .map((a) => {
      const parent = a.on === 'b' ? a.a : a.b;
      const child = a.on === 'b' ? a.b : a.a;
      const cardChild = a.on === 'b' ? a.cardB : a.cardA;
      return `  ${parent} -> ${child} [label=<<FONT POINT-SIZE="7">${cardChild}</FONT>>, arrowhead=crow, arrowtail=none, labeldistance=1.2, color="#94a3b8", penwidth=0.9, tooltip="${esc(a.id)} — ${esc(a.fk)}"];`;
    })
    .join('\n');

  return `digraph MLD {
  graph [rankdir=TB, splines=true, overlap=false, nodesep=0.3, ranksep=1.0, pad=0.35, bgcolor="white", fontname="Helvetica", labelloc="b", labeljust="l",
    label=<
      <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5" COLOR="#94a3b8">
        <TR><TD COLSPAN="2" ALIGN="LEFT" BGCOLOR="#f1f5f9"><B>MLD — RizConnect Madagascar</B> <FONT POINT-SIZE="9">· PostgreSQL 16 / PostGIS · PK = clé primaire, FK = clé étrangère, UK = clé candidate</FONT></TD></TR>
        <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="8">Relation 1,N</FONT></TD><TD ALIGN="LEFT"><FONT POINT-SIZE="8">patte de corbeau côté table porteuse de la clé étrangère</FONT></TD></TR>
      </TABLE>>];
  node [fontname="Helvetica", fontsize=9, margin=0];
  edge [fontname="Helvetica", fontsize=7.5, color="#94a3b8"];

${clusters}

${edges}
}`;
}

/* ------------------------------------------------------------------ */
/* DOT — MCT                                                           */
/* ------------------------------------------------------------------ */

export function mctDot(modules = null) {
  const flows = modules ? mctFlows.filter((m) => modules.includes(m.module)) : mctFlows;
  const clusters = flows
    .map((mod) => {
      const nodes = [];
      const edges = [];
      let idx = 0;
      for (const chain of mod.chains) {
        const prefix = `${mod.module}_${idx}`;
        const eId = `${prefix}_E`;
        const rId = `${prefix}_R`;
        nodes.push(`    ${eId} [shape=ellipse, style="filled", fillcolor="#fef9c3", color="#a16207", label=<<B>${chain.event[0]}</B><BR/><FONT POINT-SIZE="7.5">${esc(chain.event[1])}</FONT>>];`);
        let prev = eId;
        chain.ops.forEach((op, j) => {
          const oId = `${prefix}_O${j}`;
          nodes.push(`    ${oId} [shape=box, style="rounded,filled", fillcolor="#dbeafe", color="#1d4ed8", label=<<B>${op[0]}</B><BR/><FONT POINT-SIZE="7.5">${esc(op[1])}</FONT>>];`);
          edges.push(`    ${prev} -> ${oId};`);
          prev = oId;
        });
        if (chain.sync) {
          const sId = `${prefix}_S`;
          nodes.push(`    ${sId} [shape=box, style="filled", fillcolor="#0f172a", color="#0f172a", width=0.75, height=0.1, label="", tooltip="${chain.sync}"];`);
          edges.push(`    ${prev} -> ${sId};`);
          prev = sId;
        }
        nodes.push(`    ${rId} [shape=box, style="rounded,filled", fillcolor="#dcfce7", color="#15803d", label=<<B>${chain.result[0]}</B><BR/><FONT POINT-SIZE="7.5">${esc(chain.result[1])}</FONT>>];`);
        edges.push(`    ${prev} -> ${rId};`);
        idx += 1;
      }
      return `  subgraph cluster_${mod.module} {
    label=<<B>${mod.module}</B> — ${esc(mod.label)}>;
    fontsize=10.5; fontcolor="#0f172a"; color="#cbd5e1"; style="rounded"; penwidth=1.1; margin=12;
${nodes.join('\n')}
${edges.join('\n')}
  }`;
    })
    .join('\n\n');

  return `digraph MCT {
  graph [rankdir=LR, splines=spline, overlap=false, nodesep=0.22, ranksep=0.55, pad=0.3, bgcolor="white", fontname="Helvetica", labelloc="b", labeljust="l",
    label=<
      <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="5" COLOR="#94a3b8">
        <TR><TD ALIGN="LEFT" BGCOLOR="#f1f5f9"><B>MCT — RizConnect Madagascar${modules ? ` · modules ${modules[0]} à ${modules[modules.length - 1]}` : ''}</B> <FONT POINT-SIZE="9">· E = événement, O = opération, barre = synchronisation, R = résultat</FONT></TD></TR>
        <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="8">Les barres noires (S1 à S7) marquent les points de synchronisation entre opérations concurrentes ou différées.</FONT></TD></TR>
      </TABLE>>];
  node [fontname="Helvetica", fontsize=8];
  edge [fontname="Helvetica", fontsize=7, color="#64748b", arrowsize=0.6, penwidth=0.9];

${clusters}
}`;
}

/* ------------------------------------------------------------------ */
/* DOT — états                                                         */
/* ------------------------------------------------------------------ */

export function etatsDot() {
  const clusters = Object.entries(etats)
    .map(([label, def], i) => {
      const nodes = [];
      const edges = [];
      const states = new Set([def.initial]);
      def.transitions.forEach(([from, to]) => {
        states.add(from);
        states.add(to);
      });
      nodes.push(`    start_${i} [shape=point, width=0.12, color="#0f172a"];`);
      nodes.push(
        `    s_${i}_${def.initial} [shape=box, style="rounded,filled", fillcolor="#0f172a", fontcolor="#ffffff", color="#0f172a", label=<<B>${esc(def.initial)}</B>>];`,
      );
      for (const s of states) {
        if (s === def.initial) continue;
        nodes.push(`    s_${i}_${s} [shape=box, style="rounded,filled", fillcolor="#f1f5f9", color="#475569", label=<<B>${esc(s)}</B>>];`);
      }
      edges.push(`    start_${i} -> s_${i}_${def.initial};`);
      for (const [from, to, lbl] of def.transitions) {
        edges.push(`    s_${i}_${from} -> s_${i}_${to} [label=<<FONT POINT-SIZE="7">${esc(lbl)}</FONT>>];`);
      }
      return `  subgraph cluster_e${i} {
    label=<<B>${esc(label)}</B> <FONT POINT-SIZE="8">(${snake(def.entite)}.${def.champ})</FONT>>;
    fontsize=10; color="#cbd5e1"; style="rounded"; margin=10;
${nodes.join('\n')}
${edges.join('\n')}
  }`;
    })
    .join('\n\n');

  return `digraph ETATS {
  graph [rankdir=TB, splines=spline, nodesep=0.25, ranksep=0.5, pad=0.3, bgcolor="white", fontname="Helvetica", labelloc="b",
    label=<<B>Cycles de vie — RizConnect</B> <FONT POINT-SIZE="9">· états issus des contraintes de gestion RG-04 à RG-06</FONT>>];
  node [fontname="Helvetica", fontsize=8.5];
  edge [fontname="Helvetica", fontsize=7, color="#64748b", arrowsize=0.6];

${clusters}
}`;
}

/* ------------------------------------------------------------------ */
/* Mermaid                                                             */
/* ------------------------------------------------------------------ */

const mermaidCard = (c) => ({ '0,1': 'o|', '1,1': '||', '0,n': 'o{', '1,n': '|{' })[c] ?? '||';

export function mcdMermaid() {
  const lines = ['erDiagram'];
  for (const e of entities) {
    lines.push(`  %% ${e.id} — ${e.label} (${e.domain}, ${e.desc})`);
    lines.push(`  ${e.id} {`);
    for (const a of e.attrs) {
      const keys = a.k ? ` ${a.k}` : '';
      lines.push(`    ${mermaidType(a.t)} ${a.n}${keys}`);
    }
    lines.push('  }');
  }
  for (const a of associations) {
    lines.push(`  ${a.a} ${mermaidCard(a.cardA)}--${mermaidCard(a.cardB)} ${a.b} : "${a.id} ${a.nom} (${a.cardA} / ${a.cardB})"`);
  }
  return lines.join('\n');
}

export function mldMermaid() {
  const lines = ['erDiagram'];
  for (const e of entities) {
    lines.push(`  %% ${snake(e.id)} — ${e.label}`);
    lines.push(`  ${e.id} {`);
    for (const a of tableColumns(e)) {
      const keys = a.k ? ` ${a.k}` : '';
      lines.push(`    ${mermaidType(a.t)} ${a.n}${keys}`);
    }
    lines.push('  }');
  }
  for (const a of associations) {
    lines.push(`  ${a.a} ${mermaidCard(a.cardA)}--${mermaidCard(a.cardB)} ${a.b} : "${a.fk}"`);
  }
  return lines.join('\n');
}

export function etatsMermaid() {
  return Object.entries(etats)
    .map(([label, def]) => {
      const out = [`## ${label}`, '', '```mermaid', 'stateDiagram-v2', `  [*] --> ${def.initial}`];
      for (const [from, to, lbl] of def.transitions) {
        out.push(`  ${from} --> ${to} : ${lbl}`);
      }
      out.push('```', '');
      return out.join('\n');
    })
    .join('\n');
}

/* ------------------------------------------------------------------ */
/* DDL SQL                                                             */
/* ------------------------------------------------------------------ */

const cascade = (id) =>
  [
    'UTILISATEUR_ROLE',
    'MEDIA',
    'CHOIX_REPONSE',
    'CIBLAGE_ALERTE',
    'CIBLAGE_MESSAGE',
    'PHOTO_SINISTRE',
    'POSSESSION_MATERIEL',
    'ETAPE_PLANIFIEE',
    'GARANTIE_STOCK',
    'RECU',
  ].includes(id);

export function ddl() {
  const out = [];
  out.push('-- RizConnect Madagascar — schéma relationnel (MLD)');
  out.push('-- Généré depuis docs/tools/model.mjs — ne pas modifier à la main.');
  out.push('-- PostgreSQL 16 + PostGIS');
  out.push('');
  out.push('CREATE EXTENSION IF NOT EXISTS postgis;');
  out.push('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  out.push('');

  for (const d of domains) {
    out.push('-- ==================================================================');
    out.push(`-- ${d.id} — ${d.label} (modules ${d.modules})`);
    out.push('-- ==================================================================');
    out.push('');
    for (const e of entities.filter((x) => x.domain === d.id)) {
      const name = snake(e.id);
      const fks = fkColumns(e.id);
      const defs = [...e.attrs, ...fks].map((a) => {
        let def = `  ${a.n.padEnd(28)} ${a.t}`;
        if (a.k.includes('PK') && a.t === 'uuid') def += ' DEFAULT gen_random_uuid()';
        const nullable = a.opt || (a.k.includes('FK') && a.nullable);
        if (!nullable && !a.k.includes('PK')) def += ' NOT NULL';
        return def;
      });
      const pkCols = e.attrs.filter((a) => a.k.includes('PK')).map((a) => a.n);
      const uniques = e.attrs.filter((a) => a.k.includes('UK')).map((a) => a.n);
      const fkDefs = fks.map(
        (f) =>
          `  CONSTRAINT fk_${name}_${f.n} FOREIGN KEY (${f.n}) REFERENCES ${f.ref.split('.')[0]}(${f.ref.split('.')[1]})${cascade(e.id) ? ' ON DELETE CASCADE' : ''}`,
      );
      const checks = e.attrs
        .filter((a) => a.en)
        .map((a) => `  CONSTRAINT ck_${name}_${a.n} CHECK (${a.n} IN (${a.en.map((v) => `'${v}'`).join(', ')}))`);
      const body = [...defs];
      if (pkCols.length) body.push(`  CONSTRAINT pk_${name} PRIMARY KEY (${pkCols.join(', ')})`);
      uniques.forEach((u) => body.push(`  CONSTRAINT uk_${name}_${u} UNIQUE (${u})`));
      body.push(...checks, ...fkDefs);
      out.push(`CREATE TABLE ${name} (`);
      out.push(body.join(',\n'));
      out.push(');');
      out.push(`COMMENT ON TABLE ${name} IS '${e.desc.replace(/'/g, "''")}';`);
      for (const a of e.attrs.filter((x) => x.d)) {
        out.push(`COMMENT ON COLUMN ${name}.${a.n} IS '${a.d.replace(/'/g, "''")}';`);
      }
      for (const f of fks) {
        out.push(`CREATE INDEX idx_${name}_${f.n} ON ${name} (${f.n});`);
      }
      out.push('');
    }
  }

  out.push('-- ==================================================================');
  out.push('-- VUES ET CALCULS DÉRIVÉS');
  out.push('-- ==================================================================');
  out.push('');
  for (const v of vues) {
    out.push(`-- ${v.nom} : ${v.but}`);
    out.push(v.sql);
    out.push('');
  }
  return out.join('\n');
}
