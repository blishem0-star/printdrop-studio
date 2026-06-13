import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkLayer, calcArcPath, starPoints, TEMPLATES } from '../studio/helpers';
import { svgToDataUrl } from '../svgDataUrl';

test('mkLayer fills defaults and assigns a unique id', () => {
  const a = mkLayer({ type: 'text', content: 'Hi', x: 10, y: 20 });
  assert.equal(a.type, 'text');
  assert.equal(a.content, 'Hi');
  assert.equal(a.fontWeight, 'bold');
  assert.equal(a.opacity, 1);
  assert.equal(a.gradient, '');
  const b = mkLayer({ type: 'text', content: 'Hi', x: 10, y: 20 });
  assert.notEqual(a.id, b.id);
});

test('mkLayer overrides defaults from the partial', () => {
  const l = mkLayer({ type: 'shape', content: 'star', x: 0, y: 0, fontSize: 60, color: '#fff', gradient: 'holo' });
  assert.equal(l.fontSize, 60);
  assert.equal(l.gradient, 'holo');
});

test('calcArcPath returns a straight line below the arc threshold', () => {
  const p = calcArcPath(50, 50, 0, 5, 20);
  assert.match(p, /^M .* L /); // line command, not arc
});

test('calcArcPath returns an arc command when bowed', () => {
  const p = calcArcPath(50, 50, 60, 5, 20);
  assert.match(p, / A /); // SVG arc command
});

test('starPoints produces 10 vertices', () => {
  const pts = starPoints(40).trim().split(/\s+/);
  assert.equal(pts.length, 10);
});

test('every template builds at least one layer with a valid id', () => {
  for (const t of TEMPLATES) {
    const layers = t.build('#ffffff');
    assert.ok(layers.length >= 1, `${t.id} should build layers`);
    for (const l of layers) assert.ok(l.id && typeof l.x === 'number');
  }
});

test('svgToDataUrl is Unicode-safe (no btoa throw on emoji/Hebrew)', () => {
  const url = svgToDataUrl('<svg>★ עברית 🔥</svg>');
  assert.ok(url.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(decodeURIComponent(url.split(',')[1]).includes('עברית'));
});
