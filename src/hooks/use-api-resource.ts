import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/auth/session";
export function useApiResource<T>(path: string, refreshToken?: number) {
  const [value, setValue] = useState<{ path: string; data: T } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const active = useRef<AbortController | null>(null);
  const refreshQueued = useRef(false);
  const reload = useCallback(() => {
    // Coalesce polling/manual refreshes without aborting a slow response.
    if (active.current) refreshQueued.current = true;
    else setRevision((v) => v + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    refreshQueued.current = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api.request<T>(path, { signal: controller.signal });
        if (!controller.signal.aborted) setValue({ path, data });
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Unable to load data.");
      } finally {
        if (!controller.signal.aborted && active.current === controller) {
          active.current = null;
          setLoading(false);
          if (refreshQueued.current) {
            refreshQueued.current = false;
            setRevision((v) => v + 1);
          }
        }
      }
    }
    void load();
    return () => {
      controller.abort();
      if (active.current === controller) active.current = null;
    };
  }, [path, revision, refreshToken]);
  return {
    data: value?.path === path ? value.data : null,
    error,
    loading,
    reload,
  };
}
