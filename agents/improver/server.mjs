#!/usr/bin/env node
// STYLX Improver — REAL control server.
//
// Serves a dashboard that actually controls agents/improver/run.mjs. Buttons trigger
// real cycles; the panel shows the real backlog, real git commits, and live output.
// This is NOT a simulation — every action runs real code.
//
//   node agents/improver/server.mjs        → open http://localhost:4317
//
import { createServer } from 'node:http';
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, '..', '..');
const BACKLOG = join(DIR, 'backlog.json');
const PORT = 4317;

let child = null;            // currently running cycle (child process)
let logBuf = [];             // live output lines (capped)
let current = { mode: null, task: null, startedAt: null };

const git = (cmd, def = '') => { try { return execSync('git ' + cmd, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return def; } };
const pushLog = s => { for (const line of s.split(/\r?\n/)) if (line.trim()) { logBuf.push(line); } logBuf = logBuf.slice(-400); };

function state() {
  let backlog = { tasks: [] };
  try { backlog = JSON.parse(readFileSync(BACKLOG, 'utf8')); } catch {}
  return {
    running: !!child,
    clean: git('status --porcelain') === '',
    current,
    backlog: backlog.tasks,
    commits: git('log --oneline -12').split('\n').filter(Boolean),
    log: logBuf.slice(-160),
  };
}

function startRun({ mode = 'dry', taskId = null }) {
  if (child) return { ok: false, error: 'A cycle is already running.' };
  const args = [join(DIR, 'run.mjs'), '--once'];
  if (mode === 'dry') args.push('--dry');
  if (taskId) args.push(`--task=${taskId}`);
  logBuf = [];
  current = { mode, task: taskId, startedAt: new Date().toISOString() };
  pushLog(`▶ starting ${mode.toUpperCase()} cycle${taskId ? ' for ' + taskId : ''}…`);
  child = spawn('node', args, { cwd: ROOT });
  child.stdout.on('data', d => pushLog(d.toString()));
  child.stderr.on('data', d => pushLog(d.toString()));
  child.on('exit', code => { pushLog(`■ cycle finished (exit ${code}).`); child = null; });
  child.on('error', e => { pushLog('error: ' + e.message); child = null; });
  return { ok: true };
}

function toggleTask(id) {
  const data = JSON.parse(readFileSync(BACKLOG, 'utf8'));
  const t = data.tasks.find(t => t.id === id);
  if (!t) return { ok: false };
  // pending <-> blocked (user can disable tasks they don't want the agent to touch)
  t.status = t.status === 'blocked' ? 'pending' : t.status === 'pending' ? 'blocked' : t.status;
  writeFileSync(BACKLOG, JSON.stringify(data, null, 2) + '\n');
  return { ok: true };
}

function body(req) { return new Promise(res => { let b = ''; req.on('data', c => b += c); req.on('end', () => { try { res(JSON.parse(b || '{}')); } catch { res({}); } }); }); }
const json = (r, o) => { r.writeHead(200, { 'Content-Type': 'application/json' }); r.end(JSON.stringify(o)); };

const server = createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'GET' && u.pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(HTML); }
  if (req.method === 'GET' && u.pathname === '/api/state') return json(res, state());
  if (req.method === 'POST' && u.pathname === '/api/run') { const b = await body(req); return json(res, startRun(b)); }
  if (req.method === 'POST' && u.pathname === '/api/stop') { if (child) { child.kill(); pushLog('■ stopped by user.'); } return json(res, { ok: true }); }
  if (req.method === 'POST' && u.pathname === '/api/toggle') { const b = await body(req); return json(res, toggleTask(b.id)); }
  res.writeHead(404); res.end('not found');
});
server.listen(PORT, () => console.log(`STYLX Improver control → http://localhost:${PORT}`));

const HTML = /* html */`<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>STYLX · Improver Control</title><style>
:root{--bg:#050507;--surf:rgba(255,255,255,.03);--bd:rgba(255,255,255,.09);--t:#fff;--t2:rgba(255,255,255,.55);--t3:rgba(255,255,255,.32);--teal:#00E5C8;--green:#10B981;--amber:#F59E0B;--red:#FF5A5A;--blue:#0099FF}
*{box-sizing:border-box;margin:0;padding:0}body{background:radial-gradient(ellipse at 50% -10%,#0d0d1a,#050507 55%);color:var(--t);font-family:'Segoe UI',system-ui,sans-serif;padding:20px;max-width:1100px;margin:0 auto}
h1{font-size:1.2rem}h1 b{color:var(--teal)}h1 small{display:block;font-size:.6rem;color:var(--t3);letter-spacing:.18em;text-transform:uppercase;margin-top:2px}
.bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid var(--bd);border-radius:16px;padding:14px 16px;background:var(--surf);margin-bottom:16px}
.pill{font-size:.66rem;font-weight:800;padding:4px 10px;border-radius:999px;border:1px solid}
.pill.clean{color:var(--green);border-color:rgba(16,185,129,.4);background:rgba(16,185,129,.08)}
.pill.dirty{color:var(--amber);border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.08)}
.pill.run{color:var(--teal);border-color:rgba(0,229,200,.4);background:rgba(0,229,200,.08)}
.pill.idle{color:var(--t3);border-color:var(--bd)}
.sp{flex:1}
button{font-family:inherit;font-weight:700;font-size:.8rem;border-radius:10px;padding:9px 15px;cursor:pointer;border:1px solid var(--bd);background:rgba(255,255,255,.05);color:var(--t);transition:.15s}
button:hover{border-color:rgba(255,255,255,.3)}button:disabled{opacity:.4;cursor:not-allowed}
button.dry{border-color:rgba(0,153,255,.4);color:var(--blue);background:rgba(0,153,255,.07)}
button.real{background:var(--teal);color:#03241f;border-color:var(--teal)}
button.stop{color:var(--red);border-color:rgba(255,90,90,.3);background:rgba(255,90,90,.06)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:820px){.grid{grid-template-columns:1fr}}
.panel{border:1px solid var(--bd);border-radius:16px;background:var(--surf);padding:14px;margin-bottom:16px}
.panel h3{font-size:.62rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--t3);margin-bottom:10px}
.task{display:flex;align-items:center;gap:9px;padding:8px 0;border-bottom:1px solid var(--bd);font-size:.74rem}
.task:last-child{border:0}.task .ti{flex:1;min-width:0}.task .tt{color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.s{font-size:.5rem;font-weight:800;text-transform:uppercase;padding:2px 6px;border-radius:5px;flex-shrink:0}
.s.pending{background:rgba(245,158,11,.12);color:var(--amber)}.s.done{background:rgba(16,185,129,.12);color:var(--green)}.s.blocked{background:rgba(255,90,90,.1);color:var(--red)}
.mini{font-size:.6rem;padding:4px 8px;border-radius:7px}
.console{font-family:'SFMono-Regular',Consolas,monospace;font-size:.7rem;line-height:1.5;background:#04040a;border:1px solid var(--bd);border-radius:12px;padding:12px;height:300px;overflow:auto;white-space:pre-wrap;color:var(--t2)}
.commit{font-family:'SFMono-Regular',Consolas,monospace;font-size:.68rem;color:var(--t2);padding:3px 0}
.commit b{color:var(--teal)}
.note{font-size:.64rem;color:var(--t3);line-height:1.6;border:1px dashed var(--bd);border-radius:11px;padding:10px 12px;margin-top:4px}
</style></head><body>
<h1>STYLX <b>·</b> Improver Control<small>Real autonomous agent — not a simulation</small></h1>
<div class="bar">
  <span class="pill" id="p-tree">…</span>
  <span class="pill" id="p-run">…</span>
  <span class="sp"></span>
  <button class="dry" id="b-dry">הרץ מחזור יבש (בטוח · בלי AI)</button>
  <button class="real" id="b-real">הרץ מחזור אמיתי (AI · commit)</button>
  <button class="stop" id="b-stop">עצור</button>
</div>
<div class="grid">
  <div>
    <div class="panel"><h3>תור משימות (backlog אמיתי)</h3><div id="tasks"></div>
      <div class="note">לחיצה על "הרץ" ליד משימה תריץ מחזור אמיתי עליה. "חסום/הפעל" שולט אילו משימות הסוכן רשאי לגעת בהן. מחזור אמיתי מריץ <b>claude</b> ועושה commit רק אם lint+test+build ירוקים.</div>
    </div>
    <div class="panel"><h3>commits אחרונים (אמיתי)</h3><div id="commits"></div></div>
  </div>
  <div class="panel"><h3>פלט חי</h3><div class="console" id="console">—</div></div>
</div>
<script>
let lastLog='';
async function api(p,m='GET',b){const r=await fetch(p,{method:m,headers:{'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined});return r.json();}
function render(s){
  document.getElementById('p-tree').className='pill '+(s.clean?'clean':'dirty');
  document.getElementById('p-tree').textContent=s.clean?'● עץ נקי':'● עץ מלוכלך — commit/stash קודם';
  document.getElementById('p-run').className='pill '+(s.running?'run':'idle');
  document.getElementById('p-run').textContent=s.running?('● רץ'+(s.current.task?' · '+s.current.task:'')):'○ במנוחה';
  document.getElementById('b-dry').disabled=s.running;
  document.getElementById('b-real').disabled=s.running||!s.clean;
  document.getElementById('b-stop').disabled=!s.running;
  document.getElementById('tasks').innerHTML=s.backlog.map(t=>\`<div class="task"><span class="s \${t.status}">\${t.status}</span><div class="ti"><div class="tt" title="\${t.title.replace(/"/g,'&quot;')}">\${t.title}</div>\${t.commit?'<span style="color:var(--green);font-size:.58rem">✓ '+t.commit+'</span>':''}</div>\${t.status!=='done'?\`<button class="mini" onclick="run('\${t.id}')" \${s.running||!s.clean?'disabled':''}>הרץ</button><button class="mini" onclick="toggle('\${t.id}')">\${t.status==='blocked'?'הפעל':'חסום'}</button>\`:''}</div>\`).join('');
  document.getElementById('commits').innerHTML=s.commits.map(c=>{const i=c.indexOf(' ');return '<div class="commit"><b>'+c.slice(0,i)+'</b> '+c.slice(i+1)+'</div>';}).join('');
  const log=s.log.join('\\n')||'—';if(log!==lastLog){lastLog=log;const c=document.getElementById('console');c.textContent=log;c.scrollTop=c.scrollHeight;}
}
async function tick(){try{render(await api('/api/state'));}catch{}}
async function run(taskId){await api('/api/run','POST',{mode:'real',taskId});tick();}
async function toggle(id){await api('/api/toggle','POST',{id});tick();}
document.getElementById('b-dry').onclick=async()=>{await api('/api/run','POST',{mode:'dry'});tick();};
document.getElementById('b-real').onclick=async()=>{if(confirm('מחזור אמיתי ירוץ claude (עולה טוקנים) ויעשה commit אם נקי. להמשיך?')){await api('/api/run','POST',{mode:'real'});tick();}};
document.getElementById('b-stop').onclick=async()=>{await api('/api/stop','POST');tick();};
tick();setInterval(tick,1000);
</script></body></html>`;
