import { chromium } from 'playwright';
import fs from 'fs';

const axe = fs.readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => localStorage.setItem('pd_session', JSON.stringify({ type: 'guest', name: 'Guest' })));

const pages = [
  ['/', 'landing'],
  ['/catalog', 'catalog'],
  ['/design', 'studio'],
  ['/catalog/mountain-geo', 'product'],
  ['/orders/unknown', 'order-tracking'],
];

const seen = new Map(); // ruleId -> {impact, nodes:Set, help}
for (const [path, name] of pages) {
  await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await page.addScriptTag({ content: axe });
  const res = await page.evaluate(async () => {
    // @ts-ignore
    return await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
  });
  console.log(`\n=== ${name} (${path}) — ${res.violations.length} violations ===`);
  for (const v of res.violations) {
    const nodes = v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ');
    console.log(`  [${v.impact}] ${v.id} (${v.nodes.length}) — ${v.help}`);
    console.log(`      e.g. ${nodes}`);
    if (!seen.has(v.id)) seen.set(v.id, { impact: v.impact, count: 0, help: v.help, sample: v.nodes[0]?.html?.slice(0, 120) });
    seen.get(v.id).count += v.nodes.length;
  }
}
console.log('\n\n=== DEDUPED BY RULE ===');
for (const [id, d] of [...seen.entries()].sort((a, b) => ({critical:0,serious:1,moderate:2,minor:3}[a[1].impact] - {critical:0,serious:1,moderate:2,minor:3}[b[1].impact]))) {
  console.log(`[${d.impact}] ${id} ×${d.count} — ${d.help}`);
  console.log(`    sample: ${d.sample}`);
}
await browser.close();
