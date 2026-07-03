'use client';

import { useCallback, useRef } from 'react';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type HistoryOptions = {
  onUndo?: () => void;
  onRedo?: () => void;
};

export function useDesignHistory<T>(initialValue: T, setValue: (value: T) => void, options: HistoryOptions = {}) {
  const historyRef = useRef<T[]>([clone(initialValue)]);
  const indexRef = useRef(0);

  const push = useCallback((nextValue: T) => {
    historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    historyRef.current.push(clone(nextValue));
    indexRef.current = historyRef.current.length - 1;
  }, []);

  const setWithHistory = useCallback((nextValue: T) => {
    push(nextValue);
    setValue(nextValue);
  }, [push, setValue]);

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current -= 1;
    setValue(clone(historyRef.current[indexRef.current]));
    options.onUndo?.();
  }, [options, setValue]);

  const redo = useCallback(() => {
    if (indexRef.current >= historyRef.current.length - 1) return;
    indexRef.current += 1;
    setValue(clone(historyRef.current[indexRef.current]));
    options.onRedo?.();
  }, [options, setValue]);

  return { undo, redo, setWithHistory };
}
