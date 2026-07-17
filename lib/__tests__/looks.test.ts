import test from 'node:test';
import assert from 'node:assert/strict';
import { LOOKS, buildLookLayers, restyleLayers, pickShuffleLook } from '../studio/looks';
import { TEMPLATES, mkLayer } from '../studio/helpers';
import { GRADIENT_PRESETS } from '../studio/constants';
import { SHIRT_COLORS } from '../mockData';

test('every look references a real template, shirt color, and gradient', () => {
  for (const look of LOOKS) {
    assert.ok(TEMPLATES.some(t => t.id === look.templateId), `template ${look.templateId} exists`);
    assert.ok(SHIRT_COLORS.some(c => c.id === look.colorId), `color ${look.colorId} exists`);
    if (look.gradient) assert.ok(GRADIENT_PRESETS[look.gradient], `gradient ${look.gradient} exists`);
  }
});

test('look ids are unique', () => {
  assert.equal(new Set(LOOKS.map(l => l.id)).size, LOOKS.length);
});

test('buildLookLayers builds layers and applies the gradient to the hero text', () => {
  for (const look of LOOKS) {
    const layers = buildLookLayers(look, '#fff');
    assert.ok(layers.length > 0, `${look.id} builds layers`);
    if (look.gradient) {
      const hero = layers.filter(l => l.type === 'text').sort((a, b) => b.fontSize - a.fontSize)[0];
      assert.equal(hero.gradient, look.gradient, `${look.id} hero carries gradient`);
    }
  }
});

test('restyleLayers keeps content, changes style only', () => {
  const layers = [
    mkLayer({ type: 'text', content: 'MY WORDS', x: 50, y: 40, fontSize: 30 }),
    mkLayer({ type: 'text', content: 'small line', x: 50, y: 70, fontSize: 10 }),
    mkLayer({ type: 'shape', content: 'ring', x: 50, y: 50, fontSize: 60 }),
  ];
  const look = LOOKS.find(l => l.gradient)!;
  const out = restyleLayers(layers, look, '#000');
  assert.equal(out[0].content, 'MY WORDS');
  assert.equal(out[1].content, 'small line');
  assert.equal(out[0].gradient, look.gradient);
  assert.equal(out[1].gradient, '');
  assert.equal(out[1].color, '#000');
  assert.deepEqual(out[2], layers[2]); // non-text untouched
});

test('pickShuffleLook never returns the excluded look', () => {
  for (let i = 0; i < 50; i++) {
    assert.notEqual(pickShuffleLook('holo-stack').id, 'holo-stack');
  }
});
