import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { Business } from "../types";
import { connectionsService } from "../services/connections";
import {
  remoteMessagingService,
  RemoteSnapshot,
} from "../services/remoteMessaging";
import { metaRu } from "../i18n/ru";
export function useRemoteMessaging(b: Business) {
  const [state, setState] = useState<
    { localId: string; data: RemoteSnapshot } | null
  >(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const catalog = JSON.stringify(
    b.products.map((p) => [p.id, p.name, p.price, p.size, p.color]),
  );
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let refreshing = false;
    let queued = false;
    setLoading(true);
    setError("");
    const fail = () => {
      if (active) setError(metaRu.errors.unavailable);
    };
    void (async () => {
      try {
        const businessId = await connectionsService.ensureBusiness(b);
        if (!active) return;
        const load = async () => {
          if (refreshing) {
            queued = true;
            return;
          }
          refreshing = true;
          do {
            queued = false;
            try {
              const data = await remoteMessagingService.snapshot(businessId);
              if (active) {
                setState({ localId: b.id, data });
                setError("");
              }
            } catch {
              fail();
            } finally {
              if (active) setLoading(false);
            }
          } while (queued && active);
          refreshing = false;
        };
        const schedule = () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => void load(), 100);
        };
        stop = remoteMessagingService.subscribe(businessId, schedule, fail);
        await load();
      } catch {
        if (active) {
          fail();
          setLoading(false);
        }
      }
    })();
    const listener = AppState.addEventListener("change", (s) => {
      if (s === "active" && active) setRetry((v) => v + 1);
    });
    return () => {
      active = false;
      stop?.();
      if (timer) clearTimeout(timer);
      listener.remove();
    };
  }, [b.id, catalog, retry]);
  return {
    snapshot: state?.localId === b.id ? state.data : null,
    error,
    loading,
    refresh: useCallback(() => setRetry((v) => v + 1), []),
  };
}
