import { useEffect, useState } from "react";

/** Carrega dados assíncronos expondo os estados "loading" | "error" | "ok". */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [s, set] = useState<{ st: "loading" | "error" | "ok"; data?: T }>({ st: "loading" });
  const [n, setN] = useState(0);
  useEffect(() => {
    let off = false;
    set({ st: "loading" });
    fn().then(data => { if (!off) set({ st: "ok", data }); }).catch(() => { if (!off) set({ st: "error" }); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, n]);
  return { ...s, reload: () => setN(x => x + 1) };
}
