'use client';
import { useEffect, useState, useCallback } from 'react';

const KEY = 'pd_favorites';

// Saved-designs list persisted locally. No account needed - favorites work
// for guests too, which is exactly who we want returning.
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // deferred load avoids synchronous setState cascades in the effect body
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setIds(parsed.filter(x => typeof x === 'string'));
        }
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => ids.includes(id), [ids]);
  return { favorites: ids, toggle, isFav };
}
