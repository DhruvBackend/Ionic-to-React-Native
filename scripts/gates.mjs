// Quiet gates (docs/TOKEN-POLICY.md, point 4): one line per gate when green,
// short failure details only when red. Exit code 1 if any gate fails.
//
// Usage: node scripts/gates.mjs [--only jest,tsc,eslint,parity] [--jest <path>] [--eslint <path>]
//   npm run gates                          (all four, like the merge gate)
//   npm run gates -- --jest src/screens/Category --eslint src/screens/Category
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const only = (opt('only', 'jest,tsc,eslint,parity') || '').split(',');
const jestPath = opt('jest', '');
const eslintPath = opt('eslint', '.');
const MAX_LINES = 20;

const run = cmd => {
  const r = spawnSync(cmd, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
};
const head = (text, n = MAX_LINES) => {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.slice(0, n).join('\n') + (lines.length > n ? `\n  … ${lines.length - n} more lines` : '');
};
let failed = false;
const report = (name, ok, line, details) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(7)} ${line}`);
  if (!ok) { failed = true; if (details) console.log(details.replace(/^/gm, '    ')); }
};

if (only.includes('jest')) {
  // Same generators as `npm test`'s pretest.
  const gen = run('node scripts/gen-fixtures.mjs && node scripts/gen-routes.mjs');
  if (gen.code !== 0) report('gen', false, 'gen-fixtures / gen-routes failed', head(gen.out));
  const outFile = path.join(os.tmpdir(), `jest-gates-${process.pid}.json`);
  const r = run(`npx jest ${jestPath} --silent --maxWorkers=2 --json --outputFile="${outFile}"`);
  let j = null;
  try { j = JSON.parse(fs.readFileSync(outFile, 'utf8')); } catch { /* jest crashed before writing */ }
  fs.rmSync(outFile, { force: true });
  if (!j) report('jest', false, 'jest did not produce results', head(r.out));
  else {
    const fails = [];
    for (const s of j.testResults) {
      if (s.status === 'failed' && !s.assertionResults.some(a => a.status === 'failed')) {
        fails.push(`${path.relative(process.cwd(), s.name)}: suite failed\n${head(s.message, 8)}`);
      }
      for (const a of s.assertionResults.filter(x => x.status === 'failed')) {
        fails.push(`${path.relative(process.cwd(), s.name)} > ${a.fullName}\n${head((a.failureMessages || []).join('\n'), 6)}`);
      }
    }
    const shown = fails.slice(0, 5).join('\n') + (fails.length > 5 ? `\n… ${fails.length - 5} more failures` : '');
    report('jest', j.success, `${j.numPassedTests}/${j.numTotalTests} tests, ${j.numTotalTestSuites} suites`, shown);
  }
}

if (only.includes('tsc')) {
  const r = run('npx tsc --noEmit --pretty false');
  const errs = r.out.split(/\r?\n/).filter(l => /error TS\d+/.test(l));
  report('tsc', r.code === 0, r.code === 0 ? 'clean' : `${errs.length} errors`, head(errs.join('\n') || r.out));
}

if (only.includes('eslint')) {
  // One run; print errors only, and just the warning count so it can be tracked.
  const r = run(`npx eslint ${eslintPath} -f json`);
  let files = null;
  try { files = JSON.parse(r.out.slice(r.out.indexOf('['), r.out.lastIndexOf(']') + 1)); } catch { /* crash */ }
  if (!files) report('eslint', false, 'eslint did not produce results', head(r.out));
  else {
    const errs = files.flatMap(f => f.messages.filter(m => m.severity === 2)
      .map(m => `${path.relative(process.cwd(), f.filePath)}:${m.line}:${m.column} ${m.message} (${m.ruleId})`));
    const warnings = files.reduce((t, f) => t + f.warningCount, 0);
    report('eslint', errs.length === 0, `${errs.length} errors, ${warnings} warnings`, head(errs.join('\n')));
  }
}

if (only.includes('parity')) {
  const r = run('node --test --test-reporter=tap parity/reference/capture.test.mjs parity/report.test.mjs parity/ready.test.mjs');
  const num = k => (r.out.match(new RegExp(`^# ${k} (\\d+)`, 'm')) || [])[1] || '?';
  const notOk = r.out.split(/\r?\n/).filter(l => /^\s*not ok/.test(l));
  report('parity', r.code === 0, `${num('pass')}/${num('tests')} tests`, head(notOk.join('\n') || r.out));
}

process.exit(failed ? 1 : 0);
