'use client';
import { useSyncExternalStore } from 'react';

// UI-only session hint mirrored from localStorage (`pd_session`).
// Real auth lives in the httpOnly cookie — this is for display/routing only.
//
// useSyncExternalStore (instead of setState-in-effect) keeps lint clean and
// hydration safe: the server snapshot is `undefined` ("still loading"), so
// pages can distinguish loading from logged-out (`null`) and avoid premature
// redirects during hydration.

export type ClientSession = {
  type: 'guest' | 'user';
  customerId?: string;
  name: string;
  email?: string;
  role?: string;
};

let cache: { raw: string | null; parsed: ClientSession | null } = { raw: '', parsed: null };

function getSnapshot(): ClientSession | null {
  let raw: string | null = null;
  try { raw = localStorage.getItem('pd_session'); } catch { /* storage unavailable */ }
  if (raw !== cache.raw) {
    let parsed: ClientSession | null = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { parsed = null; }
    cache = { raw, parsed };
  }
  return cache.parsed;
}

const LOCAL_EVENT = 'pd-session-change';

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);        // other tabs
  window.addEventListener(LOCAL_EVENT, cb);      // this tab
  return () => {
    window.removeEventListener('storage', cb);
    window.removeEventListener(LOCAL_EVENT, cb);
  };
}

/** `undefined` = not hydrated yet, `null` = logged out, object = session hint. */
export function useLocalSession(): ClientSession | null | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}

export function setLocalSession(s: ClientSession | null) {
  try {
    if (s) localStorage.setItem('pd_session', JSON.stringify(s));
    else localStorage.removeItem('pd_session');
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}
