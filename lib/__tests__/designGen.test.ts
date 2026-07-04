import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateDesign, generateBatch, GENERATABLE_CATEGORIES } from '../designGen';

test('generateDesign produces valid currentColor SVG for every category', () => {
  for (const cat of GENERATABLE_CATEGORIES) {
    const d = generateDesign(cat, 42)!;
    assert.ok(d, cat);
    assert.match(d.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 200 200">/);
    assert.ok(d.svg.includes('currentColor'), `${cat} recolors with shirt`);
    assert.ok(d.title.length >= 5);
    assert.ok(d.price >= 9.99 && d.price <= 999.99);
    assert.ok(!d.svg.includes('NaN') && !d.svg.includes('undefined'), `${cat} has clean numbers`);
  }
});

test('same seed reproduces the same design; different seeds vary', () => {
  const a = generateDesign('Urban', 7)!;
  const b = generateDesign('Urban', 7)!;
  const c = generateDesign('Urban', 8)!;
  assert.equal(a.svg, b.svg);
  assert.equal(a.title, b.title);
  assert.notEqual(a.svg, c.svg);
});

test('generateBatch returns n designs with unique titles', () => {
  const batch = generateBatch('Nature', 5, 1000);
  assert.equal(batch.length, 5);
  assert.equal(new Set(batch.map(d => d.title)).size, 5);
});

test('unknown category returns null / empty', () => {
  assert.equal(generateDesign('Bogus', 1), null);
  assert.deepEqual(generateBatch('Bogus', 3), []);
});
