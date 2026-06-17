#!/usr/bin/env node
// STYLX Auto-Improver runner.
//
// Real autonomous improvement loop with safety guardrails. Each cycle picks the
// top task from backlog.json, has Claude implement it, verifies lint+test+build,
// and commits ONLY if everything is green — otherwise reverts. Never pushes.
//
// Usage:
//   node agents/improver/run.mjs --dry            one cycle, no Claude, no commits (safe demo)
//   node agents/improver/run.mjs --once           one real cycle (spawns `claude -p`)
//   node agents/improver/run.mjs --interval=120   loop forever, 120 min between cycles
//   node agents/improver/run.mjs --checks         (with --dry) also run the real lint/test/build
//
// Make it "always run": Windows Task Scheduler → action `node …\run.mjs --once`
// (or the loop variant). See README.md.

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..', '..');
const BACKLOG = join(DIR, 'backlog.json');
const LOG = join(DIR, 'log.md');
const PROMPT_FILE = join(DIR, 'IMPROVER.md');

const args = process.argv.slice(2);
const has = f => args.includes(f);
const intervalArg = args.find(a => a.startsWith('--interval='));
const INTERVAL_MIN = intervalArg ? Number(intervalArg.split('=')[1]) : null;
const DRY = has('--dry');
const RUN_CHECKS = has('--checks');

const sh = (cmd, opts = {}) => execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', ...opts });
const log = (...a) => console.log(`[improver ${new Date().toLocaleTimeString()}]`, ...a);

function cleanTree() {
  try { return sh('git status --porcelain').trim() === ''; } catch { return false; }
}
function pickTask() {
  const data = JSON.parse(readFileSync(BACKLOG, 'utf8'));
  const t = data.tasks
    .filter(t => t.status === 'pending')
    .sort((a, b) => a.priority - b.priority)[0];
  return { data, task: t };
}
function setTaskStatus(data, id, status, extra = {}) {
  const t = data.tasks.find(t => t.id === id);
  if (t) Object.assign(t, { status, ...extra });
  writeFileSync(BACKLOG, JSON.stringify(data, null, 2) + '\n');
}
function appendLog(line) {
  appendFileSync(LOG, `- ${new Date().toISOString()} · ${line}\n`);
}

// Run the verification gate. Returns {ok, summary}.
function verify() {
  const steps = [['lint', 'npm run lint'], ['test', 'npm test'], ['build', 'npm run build']];
  for (const [name, cmd] of steps) {
    log(`verify: ${name}…`);
    const r = spawnSync(cmd, { cwd: ROOT, shell: true, encoding: 'utf8' });
    if (r.status !== 0) return { ok: false, summary: `${name} FAILED` };
  }
  return { ok: true, summary: 'lint+test+build green' };
}

function revert() {
  try { sh('git checkout -- .'); sh('git clean -fd'); } catch {}
}

function doRealWork(task) {
  // Hand the task to a headless Claude Code agent. It reads IMPROVER.md and implements
  // the task. acceptEdits lets it edit files but still runs hooks; it must self-verify too.
  const prompt =
    `Follow the protocol in ${PROMPT_FILE} exactly.\n` +
    `Your single task this run: "${task.title}" (id: ${task.id}, area: ${task.area}).\n` +
    `Implement it at the highest quality, then ensure npm run lint, npm test and npm run build ` +
    `all pass. Do NOT commit — the runner will verify and commit. If you cannot make it pass, ` +
    `revert your own changes and say so.`;
  log(`spawning claude for: ${task.id}`);
  const r = spawnSync('claude', ['-p', prompt, '--permission-mode', 'acceptEdits'],
    { cwd: ROOT, encoding: 'utf8', stdio: 'inherit' });
  return r.status === 0;
}

function cycle() {
  log('cycle start');
  if (!cleanTree()) { log('SKIP: working tree is dirty — commit your work first.'); return 'skip'; }
  const { data, task } = pickTask();
  if (!task) { log('backlog empty of pending tasks. Nothing to do.'); return 'empty'; }
  log(`picked [P${task.priority}] ${task.id} — ${task.title}`);

  if (DRY) {
    log('DRY: would now run Claude to implement this, then verify + commit.');
    if (RUN_CHECKS) { const v = verify(); log('DRY checks:', v.summary); }
    log('DRY: no changes made, nothing committed.');
    return 'dry';
  }

  const worked = doRealWork(task);
  if (!worked) { log('agent reported failure — reverting.'); revert(); appendLog(`FAILED ${task.id} (agent error) — reverted`); return 'fail'; }

  const v = verify();
  if (!v.ok) { log(`verification failed: ${v.summary} — reverting.`); revert(); appendLog(`FAILED ${task.id} (${v.summary}) — reverted`); return 'fail'; }
  if (cleanTree()) { log('no changes produced — skipping commit.'); appendLog(`NOOP ${task.id} — no changes`); return 'noop'; }

  sh('git add -A');
  sh(`git commit -m "auto: ${task.area} — ${task.title}\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`);
  const hash = sh('git rev-parse --short HEAD').trim();
  setTaskStatus(data, task.id, 'done', { commit: hash, doneAt: new Date().toISOString() });
  appendLog(`DONE ${task.id} → ${hash} (${v.summary})`);
  log(`committed ${hash} ✓`);
  return 'done';
}

async function main() {
  if (!existsSync(BACKLOG)) { console.error('backlog.json missing'); process.exit(1); }
  log(DRY ? 'mode: DRY (no Claude, no commits)' : INTERVAL_MIN ? `mode: LOOP every ${INTERVAL_MIN}m` : 'mode: ONCE');

  if (!INTERVAL_MIN || DRY) { cycle(); return; }

  let fails = 0;
  for (;;) {
    const r = cycle();
    fails = r === 'fail' ? fails + 1 : 0;
    if (fails >= 3) { log('3 consecutive failures — stopping for safety.'); break; }
    log(`sleeping ${INTERVAL_MIN}m…`);
    await new Promise(res => setTimeout(res, INTERVAL_MIN * 60_000));
  }
}
main();
