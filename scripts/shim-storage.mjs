// Hors navigateur, le site n'a ni localStorage ni sessionStorage : on en donne
// une version en mémoire pour que les contrôles exercent les mêmes chemins.

function memory() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
  };
}

globalThis.localStorage ??= memory();
globalThis.sessionStorage ??= memory();
