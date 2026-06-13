import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSvg } from '../sanitizeSvg';

test('keeps benign SVG shapes', () => {
  const out = sanitizeSvg('<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4" fill="red"/></svg>');
  assert.match(out, /<circle/);
});

test('strips script tags', () => {
  const out = sanitizeSvg('<svg><script>alert(1)</script><rect width="2" height="2"/></svg>');
  assert.doesNotMatch(out, /script|alert/);
  assert.match(out, /<rect/);
});

test('strips event handlers including spaced/cased variants', () => {
  for (const payload of [
    '<svg onload="alert(1)"><rect/></svg>',
    '<svg OnLoAd="alert(1)"><rect/></svg>',
    '<svg><rect onclick="alert(1)"/></svg>',
  ]) {
    assert.doesNotMatch(sanitizeSvg(payload), /alert/i);
  }
});

test('strips foreignObject HTML smuggling', () => {
  const out = sanitizeSvg('<svg><foreignObject><iframe src="javascript:alert(1)"></iframe></foreignObject></svg>');
  assert.doesNotMatch(out, /foreignObject|iframe|javascript/i);
});

test('strips use/href external references', () => {
  const out = sanitizeSvg('<svg><use href="https://evil.example/x.svg#p"/><use xlink:href="#local"/></svg>');
  assert.doesNotMatch(out, /href/i);
});

test('strips animate-based attribute injection', () => {
  const out = sanitizeSvg('<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>');
  assert.doesNotMatch(out, /animate|javascript/i);
});
