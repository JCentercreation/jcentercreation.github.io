import { useEffect, useState } from 'react';
import { appleCompanies, automotiveCompanies } from '@/content';

/** Loaded company logo images, keyed by company id. Missing/failed logos are simply absent. */
const loaded = new Map<string, HTMLImageElement>();
let pending: Promise<void> | null = null;

function loadAll(): Promise<void> {
  if (pending) return pending;
  const all = [...appleCompanies, ...automotiveCompanies].filter((c) => c.logo);
  pending = Promise.all(
    all.map(
      (c) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            loaded.set(c.id, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `${import.meta.env.BASE_URL}${c.logo!.replace(/^\//, '')}`;
        }),
    ),
  ).then(() => undefined);
  return pending;
}

export function getLogo(id: string) {
  return loaded.get(id) ?? null;
}

/** Re-render trigger once any logo files have loaded. */
export function useLogosVersion() {
  const [v, setV] = useState(loaded.size);
  useEffect(() => {
    let alive = true;
    void loadAll().then(() => alive && setV(loaded.size));
    return () => {
      alive = false;
    };
  }, []);
  return v;
}
