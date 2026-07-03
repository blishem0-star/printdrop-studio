import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeDesignShare, decodeDesignShare, type ShareableDesign } from '../studio/shareCode';

const sample: ShareableDesign = {
  version: 1,
  colorId: 'black',
  size: 'L',
  activeView: 'front',
  printArea: { x: 62, y: 82, w: 76, h: 92 },
  printBg: null,
  layers: [{
    id: 'a1', type: 'text', content: 'NO RULES - שלום', x: 50, y: 44,
    fontSize: 30, fontFamily: 'Impact', color: '#ffffff', fontWeight: 'bold',
    italic: false, rotation: 0, opacity: 1, letterSpacing: 2, strokeColor: '',
    strokeWidth: 0, arcAngle: 0, textTransform: 'none', shadowDx: 2, shadowDy: 2,
    shadowBlur: 0, shadowColor: '', glowBlur: 0, glowColor: '', flipH: false,
    flipV: false, hidden: false, locked: false, gradient: '',
  }],
};

test('share code round-trips a design subset (Unicode-safe)', () => {
  const code = encodeDesignShare(sample);
  assert.ok(code, 'encodes');
  assert.match(code!, /^[A-Za-z0-9_-]+$/, 'URL-safe alphabet');
  const decoded = decodeDesignShare(code!);
  assert.ok(decoded);
  assert.equal(decoded!.colorId, 'black');
  assert.equal(decoded!.layers![0].content, 'NO RULES - שלום');
});

test('decode rejects garbage, oversized, and wrong-version payloads', () => {
  assert.equal(decodeDesignShare('%%%not-base64%%%'), null);
  assert.equal(decodeDesignShare('x'.repeat(7000)), null);
  const v2 = encodeDesignShare({ ...sample, version: 2 as unknown as 1 });
  assert.equal(decodeDesignShare(v2!), null);
});

test('decode strips uploads/aiSvg from forged payloads', () => {
  const forged = { ...sample, uploads: { front: 'data:evil' }, aiSvg: '<svg onload=x>' };
  const code = encodeDesignShare(forged as ShareableDesign);
  const decoded = decodeDesignShare(code!)!;
  assert.equal((decoded as Record<string, unknown>).uploads, undefined);
  assert.equal((decoded as Record<string, unknown>).aiSvg, undefined);
});

test('encode returns null when the payload is too large to be a URL', () => {
  const huge = { ...sample, layers: Array.from({ length: 400 }, (_, i) => ({ ...sample.layers[0], id: `l${i}` })) };
  assert.equal(encodeDesignShare(huge), null);
});
