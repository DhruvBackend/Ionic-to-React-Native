// Shared source scanning for the Ionic 3 app (read-only). Used by scripts/screen-card.mjs,
// scripts/build-inventory.mjs and scripts/inventory-md.mjs. Regex + brace matching, no TypeScript parser:
// good enough for this code base, and every result carries a file:line so a reviewer can check it.
import fs from 'node:fs';
import path from 'node:path';

export const IONIC_SRC = (process.env.IONIC_SRC || 'C:/Migrations/Topbath_App_loyalty/src').replace(/\\/g, '/');

export const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
export const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
export const lineCount = f => {
  const t = read(f);
  return t.split('\n').length - (t.endsWith('\n') ? 1 : 0);
};
export const collapse = s => s.replace(/\s+/g, ' ').trim();

const blank = s => s.replace(/[^\n]/g, ' ');

/**
 * Returns { clean, masked }. Both have the same length and line structure as `src`.
 * clean: comments blanked. masked: comments AND the contents of string / template literals blanked
 * (quotes kept), so braces and parentheses inside text never confuse matching.
 */
export function maskTs(src) {
  let clean = '';
  let masked = '';
  let i = 0;
  const n = src.length;
  // A "/" starts a regex literal (not division) after one of these.
  const regexAfter = /[(,=:[!&|?{};+\-*%<>~^]\s*$|^\s*$|\breturn\s*$/;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') {
      let j = src.indexOf('\n', i);
      if (j < 0) j = n;
      clean += blank(src.slice(i, j));
      masked += blank(src.slice(i, j));
      i = j;
    } else if (c === '/' && d === '*') {
      let j = src.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      clean += blank(src.slice(i, j));
      masked += blank(src.slice(i, j));
      i = j;
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === '\\') j++;
        if (c !== '`' && src[j] === '\n') break;
        j++;
      }
      j = Math.min(j + 1, n);
      const lit = src.slice(i, j);
      clean += lit;
      masked += lit[0] + lit.slice(1, -1).replace(/[^\n]/g, 'x') + lit.slice(-1);
      i = j;
    } else if (c === '/' && regexAfter.test(clean.slice(-30).split('\n').pop())) {
      let j = i + 1;
      let inClass = false;
      while (j < n && (src[j] !== '/' || inClass) && src[j] !== '\n') {
        if (src[j] === '\\') j++;
        else if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        j++;
      }
      j = Math.min(j + 1, n);
      clean += src.slice(i, j);
      masked += src.slice(i, j).replace(/[^\n]/g, 'x');
      i = j;
    } else {
      clean += c;
      masked += c;
      i++;
    }
  }
  return { clean, masked };
}

export const stripHtmlComments = html => html.replace(/<!--[\s\S]*?-->/g, m => blank(m));
export const stripScssComments = s =>
  s.replace(/\/\*[\s\S]*?\*\//g, m => blank(m)).replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));

/** index of the bracket matching the one at masked[open] */
export function matchClose(masked, open) {
  const pairs = { '(': ')', '{': '}', '[': ']' };
  const o = masked[open];
  const cl = pairs[o];
  let depth = 0;
  for (let i = open; i < masked.length; i++) {
    if (masked[i] === o) depth++;
    else if (masked[i] === cl && --depth === 0) return i;
  }
  return -1;
}

/** split masked[a..b) at top-level commas; returns [{start,end}] */
export function splitArgs(masked, a, b) {
  const out = [];
  let depth = 0;
  let s = a;
  for (let i = a; i < b; i++) {
    const c = masked[i];
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) {
      out.push({ start: s, end: i });
      s = i + 1;
    }
  }
  if (masked.slice(s, b).trim()) out.push({ start: s, end: b });
  return out;
}

/** All calls `<recv>.name(...)` / `name(...)` whose name matches nameRe (a regex source). */
export function findCalls(clean, masked, nameRe) {
  const re = new RegExp(`(?<![\\w$])(?:([\\w$.()\\[\\]]*?)\\.)?(${nameRe})\\s*\\(`, 'g');
  const calls = [];
  let m;
  while ((m = re.exec(masked))) {
    const open = m.index + m[0].length - 1;
    const close = matchClose(masked, open);
    if (close < 0) continue;
    const args = splitArgs(masked, open + 1, close).map(a => clean.slice(a.start, a.end).trim());
    calls.push({ recv: m[1] || '', name: m[2], index: m.index, open, close, args, line: lineOf(clean, m.index) });
  }
  return calls;
}

/** Parse the exported class: methods, plus the class-level text outside methods (field initialisers). */
export function parseClass(clean, masked) {
  const cm = /export\s+class\s+(\w+)[^{]*\{/.exec(masked);
  if (!cm) return null;
  const bodyOpen = cm.index + cm[0].length - 1;
  const bodyClose = matchClose(masked, bodyOpen);
  const methods = new Map();
  let fields = '';
  let headerStart = bodyOpen + 1;
  let depth = 0;
  for (let i = bodyOpen + 1; i < bodyClose; i++) {
    const c = masked[i];
    if (depth === 0 && c === ';') {
      fields += clean.slice(headerStart, i + 1);
      headerStart = i + 1;
    } else if (c === '{' && depth === 0) {
      const close = matchClose(masked, i);
      const header = masked.slice(headerStart, i);
      const mm =
        /(?:^|\s)(?:(?:public|private|protected|static|async|get|set)\s+)*([A-Za-z_$][\w$]*)\s*\([^]*$/.exec(header) ||
        /(?:^|\s)([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*(?:async\s*)?(?:\([^]*\)|[\w$]+)\s*(?::\s*[\w<>[\]]+\s*)?=>\s*$/.exec(header);
      if (mm && !/^(if|for|while|switch)$/.test(mm[1]) && header.trim() !== '') {
        const st = headerStart + header.search(/\S/);
        methods.set(mm[1], { name: mm[1], start: st, end: close, line: lineOf(clean, st), text: clean.slice(st, close + 1) });
      } else {
        fields += clean.slice(headerStart, close + 1);
      }
      i = close;
      headerStart = close + 1;
    } else if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
  }
  fields += clean.slice(headerStart, bodyClose);
  return { name: cm[1], methods, fields, bodyOpen, bodyClose };
}

export function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name).split(path.sep).join('/');
    return e.isDirectory() ? walk(p) : [p];
  });
}

/** Every Ionic page class: [{ ionicClass, name, dir (relative to IONIC_SRC), tsFile }] */
export function listPages(src = IONIC_SRC) {
  const pages = [];
  for (const f of walk(src + '/pages').sort()) {
    if (!f.endsWith('.ts') || /\.(module|spec)\.ts$/.test(f)) continue;
    const t = read(f);
    for (const m of t.matchAll(/^\s*export class (\w+)/gm)) {
      pages.push({
        ionicClass: m[1],
        name: m[1].replace(/Page$/, ''),
        dir: path.posix.relative(src, path.posix.dirname(f)),
        tsFile: path.posix.relative(src, f),
      });
    }
  }
  return pages;
}

export const SERVER_NAMES = { rootUrl: 'root', rootUrlSfa: 'sfa', server_url: 'server_url', upload_url: 'root' };

export function serverOf(arg) {
  if (arg == null) return 'root';
  const m = /\b(rootUrlSfa|rootUrl|server_url|upload_url)\b/.exec(arg);
  return m ? SERVER_NAMES[m[1]] : `<${collapse(arg)}>`;
}

/** dbservice call sites in one TS file */
export function findApiCalls(clean, masked, file) {
  const out = [];
  for (const c of findCalls(clean, masked, 'onPostRequestDataFromApi|onGetRequestDataFromApi|post_rqst|get_rqst')) {
    let body = null;
    let fnArg;
    let serverArg;
    if (c.name === 'onPostRequestDataFromApi') [body, fnArg, serverArg] = c.args;
    else if (c.name === 'onGetRequestDataFromApi') [fnArg, serverArg] = c.args;
    else if (c.name === 'post_rqst') [body, fnArg] = c.args;
    else [fnArg] = c.args;
    const lit = /^(['"])([^'"]*)\1$/.exec(fnArg || '');
    let endpoint = lit ? lit[2] : null;
    if (!endpoint && fnArg) {
      const tl = /^`([^`$]*)`$/.exec(fnArg);
      endpoint = tl ? tl[1] : `<${collapse(fnArg)}>`;
    }
    out.push({
      helper: c.name,
      endpoint,
      server: serverOf(serverArg),
      body: body == null ? null : collapse(body),
      file,
      line: c.line,
          index: c.index,
      response: responseFields(clean, masked, c.close),
    });
  }
  return out;
}

/** property chains read on the parameter of the .subscribe callback that follows a call */
function responseFields(clean, masked, closeIdx) {
  const m = /^\s*\.\s*subscribe\s*\(/.exec(masked.slice(closeIdx + 1, closeIdx + 60));
  if (!m) return [];
  const open = closeIdx + 1 + m[0].length - 1;
  const close = matchClose(masked, open);
  const cb = clean.slice(open + 1, close);
  const first = /^\s*(?:async\s*)?(?:\(\s*([\w$]+)|([\w$]+)\s*=>)/.exec(cb);
  const v = first && (first[1] || first[2]);
  if (!v) return [];
  const fields = new Set();
  const re = new RegExp(
    `(?<![\\w$.])${v.replace('$', '\\$')}((?:\\s*\\.\\s*[A-Za-z_$][\\w$]*|\\s*\\[\\s*(['"])[^'"]+\\2\\s*\\]|\\s*\\[\\s*\\d+\\s*\\])+)`,
    'g',
  );
  for (const r of cb.matchAll(re)) {
    const chain = r[1]
      .replace(/\s+/g, '')
      .replace(/\[(['"])([^'"]+)\1\]/g, '.$2')
      .replace(/^\./, '');
    fields.add(chain);
  }
  return [...fields].sort();
}

/** navigation targets in one TS source: [{ kind, target, params, line }] */
export function findNavTargets(clean, masked) {
  const out = [];
  const pageRef = a => {
    const m = /^(?:(['"])(\w+Page)\1|(\w+Page))$/.exec((a || '').trim());
    return m ? m[2] || m[3] : null;
  };
  for (const c of findCalls(clean, masked, 'push|setRoot|insert|setPages|create')) {
    const recvLast = (c.recv.match(/([\w$]+)\s*(?:\(\s*\))?$/) || [])[1] || '';
    const isNav = /nav|^app$|^root$|getRootNav|getActiveNav|parent/i.test(c.recv);
    const target = pageRef(c.args[0]);
    if (c.name === 'create') {
      if (/modal|popover/i.test(recvLast)) {
        out.push({
          kind: /popover/i.test(recvLast) ? 'popover' : 'modal',
          target: target || `<${collapse(c.args[0] || '')}>`,
          params: c.args[1] ? collapse(c.args[1]) : null,
          line: c.line,
          index: c.index,
        });
      }
      continue;
    }
    if (!isNav && !target) continue;
    out.push({
      kind: c.name,
      target: target || `<${collapse(c.args[0] || '')}>`,
      params: c.args[1] ? collapse(c.args[1]) : null,
      line: c.line,
          index: c.index,
    });
  }
  for (const c of findCalls(clean, masked, 'select')) {
    if (/parent|getActiveChildNavs|tabs/i.test(c.recv)) {
      out.push({ kind: 'tabSelect', target: `<tab ${collapse(c.args[0] || '')}>`, params: null, line: c.line, index: c.index });
    }
  }
  for (const c of findCalls(clean, masked, 'popToRoot')) {
    out.push({ kind: 'popToRoot', target: '<root of nav>', params: null, line: c.line });
  }
  return out;
}

/** Page class names mentioned as values anywhere in `text` */
export function pageRefs(text) {
  const refs = [];
  for (const m of text.matchAll(/(?<![\w$.'"])(?:(['"])([A-Z]\w*Page)\1|([A-Z]\w*Page))(?![\w$])/g)) {
    refs.push({ ref: m[2] || m[3], index: m.index });
  }
  return refs;
}
