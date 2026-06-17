# STYLX Auto-Improver

A **real** autonomous improvement loop — not a simulation. Each cycle it picks the top task
from `backlog.json`, has a headless Claude implement it, runs `lint + test + build`, and
**commits only if everything passes** (otherwise it reverts). It never pushes.

## Files
- `IMPROVER.md` — the agent's protocol/brain (safety rules + what "highest level" means).
- `backlog.json` — prioritized, real, user-visible tasks. `blocked` tasks need external keys
  (Stripe / Resend / Anthropic) and are skipped automatically.
- `run.mjs` — the runner (guardrails: clean-tree check, verify gate, auto-revert, stop after
  3 failures).
- `log.md` — runtime history (git-ignored).

## Run it
```bash
# Safe demo — no Claude, no commits. Proves the orchestration:
node agents/improver/run.mjs --dry

# One real cycle (spawns `claude -p`, costs tokens, may commit if green):
node agents/improver/run.mjs --once

# Loop forever, 2h between cycles:
node agents/improver/run.mjs --interval=120
```

## Make it "always run" (no manual trigger)
**Windows Task Scheduler** → Create Task → Trigger: *At log on* (and/or daily) →
Action: `node` with argument `C:\Users\Avi\Desktop\Tsh-Web\agents\improver\run.mjs --once`,
Start in `C:\Users\Avi\Desktop\Tsh-Web`. It then runs every time the PC is on.
(Cloud alternative that runs even when the PC is off: a scheduled Claude Code routine.)

## The honest tradeoffs
- **Cost** — every real cycle spends tokens (it runs an LLM).
- **Supervision** — it auto-commits to the current branch. The guardrail is that nothing
  lands unless lint+test+build are green. For zero-risk operation, point it at a branch and
  review the commits, rather than letting it build on `develop` unattended.
- **Quality ceiling** — it is as good as the model doing the work; the protocol forces real,
  verified, user-visible changes and forbids weakening tests/security to pass.
