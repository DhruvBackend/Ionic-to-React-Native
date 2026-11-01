// Reachability tracing over the Ionic page graph. Used by scripts/build-inventory.mjs.
// For every page: which methods can run (constructor, lifecycle hooks, handlers bound in the template,
// everything those call through `this.`), and which navigation targets those methods reach.
// Commented-out code (TS and HTML) is ignored, so commented-out buttons are not edges.
import path from 'node:path';
import fs from 'node:fs';
import {
  IONIC_SRC,
  read,
  maskTs,
  stripHtmlComments,
  parseClass,
  findNavTargets,
  findCalls,
  pageRefs,
  lineOf,
  listPages,
  matchClose,
} from './ionic-scan.mjs';

export const ROLES = ['Plumber', 'Sales_Boy', 'Dealer', 'Sales_Executive', 'Customer', 'Retailer'];

const VOID = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'col', 'area', 'base', 'embed', 'param', 'track', 'wbr']);

/** roles for which an *ngIf condition can be true, looking only at `...type == 'Role'` comparisons */
export function rolesForCondition(cond) {
  const atom = /(?:[\w$.?[\]'"]*\.)?\btype\s*(===?|!==?)\s*'(\w+)'|'(\w+)'\s*(===?|!==?)\s*(?:[\w$.?[\]'"]*\.)?\btype\b/g;
  if (!atom.test(cond)) return new Set(ROLES);
  const out = new Set();
  for (const role of ROLES) {
    let expr = cond.replace(atom, (_m, op1, val1, val2, op2) => {
      const val = val1 || val2;
      const op = op1 || op2;
      if (!ROLES.includes(val)) return 'U';
      const eq = role === val;
      return String(op.startsWith('!') ? !eq : eq);
    });
    // unknown atoms count as true; a negation directly in front of one is dropped
    expr = expr
      .split(/(\|\||&&|\(|\))/)
      .map(tok => (/^\s*(\|\||&&|\(|\))\s*$/.test(tok) || /^\s*$/.test(tok) || /^\s*(!?)\s*(true|false)\s*$/.test(tok) ? tok : 'true'))
      .join('');
    let ok = true;
    try {
      ok = Function(`return (${expr})`)();
    } catch {
      ok = true;
    }
    if (ok) out.add(role);
  }
  return out;
}

/** [{ name, roles:Set }] for every `name(` that appears in a template binding, with *ngIf role gating */
export function templateCalls(html) {
  const out = [];
  const stack = []; // { tag, roles }
  const re = /<(\/?)([\w-]+)((?:[^>"']|"[^"]*"|'[^']*')*)>|{{([\s\S]*?)}}/g;
  let m;
  const rolesNow = () => {
    let r = new Set(ROLES);
    for (const s of stack) r = new Set([...r].filter(x => s.roles.has(x)));
    return r;
  };
  const addCalls = (text, roles) => {
    for (const c of text.matchAll(/(?<![\w$.])([A-Za-z_$][\w$]*)\s*\(/g)) out.push({ name: c[1], roles });
    for (const c of text.matchAll(/\bthis\.([A-Za-z_$][\w$]*)/g)) out.push({ name: c[1], roles });
  };
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      addCalls(m[4], rolesNow());
      continue;
    }
    const [, close, tag, attrs] = m;
    if (close) {
      let k = stack.length - 1;
      while (k >= 0 && stack[k].tag !== tag) k--;
      if (k >= 0) stack.length = k;
      continue;
    }
    const ngIf = /\*ngIf\s*=\s*"([^"]*)"|\*ngIf\s*=\s*'([^']*)'/.exec(attrs);
    const own = ngIf ? rolesForCondition(ngIf[1] ?? ngIf[2]) : new Set(ROLES);
    const here = new Set([...rolesNow()].filter(x => own.has(x)));
    for (const a of attrs.matchAll(/(?:\(([\w.]+)\)|\[[\w.]+\]|\*ng\w+|\[\(\w+\)\])\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) addCalls(a[2] ?? a[3] ?? '', here);
    for (const a of attrs.matchAll(/"([^"]*{{[^"]*}}[^"]*)"/g)) addCalls(a[1], here);
    for (const a of attrs.matchAll(/\[(?:navPush|navPop)\]\s*=\s*"([^"]*)"/g)) out.push({ name: `__navPush:${a[1].trim()}`, roles: here });
    if (!VOID.has(tag) && !/\/\s*$/.test(attrs)) stack.push({ tag, roles: own });
  }
  return out;
}

const ENTRY = /^(constructor|ionView\w+|ngOn\w+|ngAfter\w+|ngDoCheck|canEnter|canLeave)$/;

/** Parse one page into { methodsRoles: Map<method, Set<role>>, edges: [...] } */
export function tracePage(page, src = IONIC_SRC, { ignoreTemplate = false } = {}) {
  const tsPath = `${src}/${page.tsFile}`;
  const { clean, masked } = maskTs(read(tsPath));
  const cls = parseClass(clean, masked);
  const htmlPath = tsPath.replace(/\.ts$/, '.html');
  const html = fs.existsSync(htmlPath) ? stripHtmlComments(read(htmlPath)) : '';
  const tcalls = ignoreTemplate ? [] : templateCalls(html);
  const roles = new Map(); // method -> Set<role>
  const add = (name, rs) => {
    const cur = roles.get(name) || new Set();
    const before = cur.size;
    for (const r of rs) cur.add(r);
    roles.set(name, cur);
    return cur.size !== before;
  };
  const all = new Set(ROLES);
  add('<fields>', all);
  for (const name of cls.methods.keys()) if (ENTRY.test(name)) add(name, all);
  for (const c of tcalls) if (cls.methods.has(c.name)) add(c.name, c.roles);
  // propagate through this.method references
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, rs] of [...roles]) {
      const text = name === '<fields>' ? cls.fields : cls.methods.get(name)?.text || '';
      for (const m of text.matchAll(/\bthis\.([A-Za-z_$][\w$]*)/g)) {
        if (cls.methods.has(m[1]) && m[1] !== name && add(m[1], rs)) changed = true;
      }
    }
  }
  const edges = [];
  const push = (e, via, rs) => edges.push({ ...e, via, roles: rs, file: page.tsFile });
  for (const [name, rs] of roles) {
    if (name === '<fields>') {
      for (const r of pageRefs(cls.fields)) {
        if (r.ref !== page.ionicClass) push({ kind: 'field', target: r.ref, params: null, line: lineOf(clean, cls.bodyOpen + r.index) }, name, rs);
      }
      continue;
    }
    const meth = cls.methods.get(name);
    const mm = maskTs(meth.text).masked;
    // line numbers: offset by the method's first line
    // edges inside a push-notification handler (.on('notification').subscribe(...)) are PUSH-ONLY entries
    const ranges = [];
    for (const c of findCalls(meth.text, mm, 'on')) {
      if (!/^['"]notification['"]$/.test(c.args[0] || '')) continue;
      const sm = /^\s*\.\s*subscribe\s*\(/.exec(mm.slice(c.close + 1, c.close + 40));
      if (!sm) continue;
      const open = c.close + sm[0].length;
      ranges.push([c.index, matchClose(mm, open)]);
    }
    for (const t of findNavTargets(meth.text, mm)) {
      const inPush = ranges.some(([a, b]) => t.index >= a && t.index <= b);
      push({ ...t, line: t.line + meth.line - 1, pushHandler: inPush }, name, rs);
    }
  }
  // navigation written in methods that nothing calls or binds (dead code)
  const deadEdges = [];
  for (const [name, meth] of cls.methods) {
    if (roles.has(name)) continue;
    const mm = maskTs(meth.text).masked;
    for (const t of findNavTargets(meth.text, mm)) deadEdges.push({ ...t, line: t.line + meth.line - 1, via: name, file: page.tsFile });
  }
  for (const c of tcalls) {
    if (c.name.startsWith('__navPush:')) {
      const t = c.name.slice(10);
      const q = /^(\w+Page)$/.exec(t);
      edges.push({ kind: 'navPush', target: q ? q[1] : `<${t}>`, params: null, line: 0, via: 'template', roles: c.roles, file: page.tsFile.replace(/\.ts$/, '.html') });
    }
  }
  // event publishers (side menu etc.)
  const publishes = [];
  for (const [name, rs] of roles) {
    const text = name === '<fields>' ? cls.fields : cls.methods.get(name)?.text || '';
    const mk = maskTs(text);
    for (const c of findCalls(text, mk.masked, 'publish')) {
      if (/events/i.test(c.recv)) publishes.push({ event: c.args[0], via: name, roles: rs, line: c.line + (cls.methods.get(name)?.line || 1) - 1 });
    }
  }
  return { page, edges, deadEdges, publishes, methodRoles: roles, classInfo: cls };
}

export function traceAll(src = IONIC_SRC) {
  const pages = listPages(src);
  const traces = new Map();
  for (const p of pages) traces.set(p.ionicClass, tracePage(p, src));
  return { pages, traces };
}

export const rel = f => path.posix.relative(src0(), f);
const src0 = () => IONIC_SRC;
