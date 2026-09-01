"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function useOnClickOutside<T extends HTMLElement | null>(
  ref: RefObject<T>,
  handler: () => void
) {
  useEffect(() => {
    function listener(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    }
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") handler();
    }
    document.addEventListener("mousedown", listener);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("keydown", esc);
    };
  }, [ref, handler]);
}

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
