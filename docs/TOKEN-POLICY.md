# Token policy (from 2026-11-03, Dhruv's request)

Token use was the main cost of sessions 1–3. These rules apply to the lead and every subagent. They do **not** relax the 1:1 checks: every pair is still looked at, every screen is still reviewed.

## 1. Screenshot review: triage first, then look

- Run `npm run parity:triage -- --only <Screen>.` (or no `--only` for everything) **before any model looks at an image**. It writes `parity/out/triage/`:
  - `DIFF` pairs (above 1%): one **cropped** ref | rn image per pair, holding only the bands that differ (phone status/gesture bars masked). Review each one.
  - `OK` pairs (1% or less): thumbnails on **contact sheets** (`_ok-<n>.png`, 12 pairs per sheet). One look per sheet confirms that both sides show the same state (S6: a low diff % alone is not proof).
  - The text list (`triage.json`) is the input for reviewers. Never send them the raw 1080x2400 PNGs, and never the whole `out/` folder.
- Layout or text questions are settled with `uiautomator dump` / the Ionic DOM probe (text), not with more screenshots.
- A reviewer agent gets **only its DIFF crops + its contact sheets** and answers in at most 10 lines per pair.

## 2. Subagents

| Job | Model | Input it gets | Report limit |
|---|---|---|---|
| Implementer (one screen, or 2–3 simple screens) | Sonnet | `docs/IMPLEMENTER-BRIEF.md` + the screen card(s) + Ionic file paths | 150 words |
| S8 reviewer | Sonnet | `docs/REVIEWER-BRIEF.md` + `git diff master...screen/<Name>` + card + Ionic files | PASS, or a numbered list of misses (file:line both sides), at most 250 words |
| Capture reviewer (contact sheets, DIFF crops) | Sonnet; Haiku only for the OK contact sheets | triage images + `triage.json` lines | 10 lines per DIFF pair, 1 line per OK sheet |
| Mechanical (gen scripts, gates, worktree set-up) | none: the lead runs the commands | | |

- **Batch simple screens:** a screen with at most one endpoint, no form and no overlay (for example About, Contact, VideoCategory) goes 2–3 to one implementer and one reviewer.
- **Diff-only review:** the reviewer reads the RN diff and the Ionic files. It does not explore the RN repo except for a kit file the diff calls.
- **Agents never paste file contents or full logs into their report.** They write file:line references and the one-line gate results from `npm run gates`.
- **The plan is not agent input.** Its Global Constraints, S-task and S5 rules are condensed into the briefs. If a brief is missing a rule, fix the brief (one place) instead of sending the plan.
- **The lead does not redo verified work.** After an agent reports green gates, the lead runs `npm run gates` once on master after the merge, not per file.

## 4. Quiet gates

- `npm run gates`: jest (`--silent --maxWorkers=2`, generators first), tsc, eslint, parity:test. One line each when green; errors only (at most 20 lines, 5 jest failures) when red.
- Per screen: `npm run gates -- --only jest,tsc,eslint --jest src/screens/<Name> --eslint src/screens/<Name>`.
- Never run `npx jest` / `npx eslint .` bare in an agent: the full output is thousands of lines.

## Lead habits

- Read files by range (`offset/limit`, `sed -n`), search with `grep`; never read the 1,000-line plan whole (headings: `grep -n '^##' <plan>`).
- Start a new session at a phase boundary with `docs/HANDOFF.md` instead of letting one session grow.
