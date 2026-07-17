// Fire-and-forget usage tracking. Never blocks or breaks the UI.
export type TrackType = 'favorite' | 'remix' | 'order' | 'filter' | 'studio_start' | 'first_layer' | 'size_picked';

export function track(type: TrackType, data?: { category?: string; designId?: string }) {
  try {
    const payload = JSON.stringify({ type, ...data });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch { /* analytics must never break the product */ }
}
