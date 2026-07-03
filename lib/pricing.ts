import { SHIPPING_PRICE } from './mockData';

// Single source of truth for order pricing. Used by the studio checkout UI
// and by /api/orders - the server never trusts a client-computed total.

export const MAX_ORDER_QTY = 10;

// Volume discount tiers: buy more shirts, save more. Sorted by minQty desc.
export const QTY_DISCOUNTS: { minQty: number; pct: number }[] = [
  { minQty: 5, pct: 15 },
  { minQty: 3, pct: 10 },
  { minQty: 2, pct: 5 },
];

export function qtyDiscountPct(qty: number): number {
  for (const t of QTY_DISCOUNTS) if (qty >= t.minQty) return t.pct;
  return 0;
}

export type OrderQuote = {
  qty: number;
  unitPrice: number;
  subtotal: number;
  discountPct: number;
  discount: number;
  shipping: number;
  total: number;
};

export function quoteOrder(unitPrice: number, qty: number): OrderQuote {
  const q = Math.max(1, Math.min(MAX_ORDER_QTY, Math.floor(qty) || 1));
  const subtotal = unitPrice * q;
  const discountPct = qtyDiscountPct(q);
  const discount = +(subtotal * (discountPct / 100)).toFixed(2);
  const total = +(subtotal - discount + SHIPPING_PRICE).toFixed(2);
  return { qty: q, unitPrice, subtotal: +subtotal.toFixed(2), discountPct, discount, shipping: SHIPPING_PRICE, total };
}

/** The savings a customer unlocks by increasing quantity - used for upsell hints. */
export function nextTierHint(qty: number): { addQty: number; pct: number } | null {
  const next = [...QTY_DISCOUNTS].reverse().find(t => t.minQty > qty);
  return next ? { addQty: next.minQty - qty, pct: next.pct } : null;
}
