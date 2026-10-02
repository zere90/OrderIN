import { deviceSession, getSupabase } from "./supabase";
import { metaRu } from "../i18n/ru";
export class MessagingError extends Error {
  constructor(public code: string) {
    super(metaRu.errors[code] || metaRu.errors.unavailable);
  }
}
export const messagingErrorText = (error: unknown) =>
  error instanceof MessagingError ? error.message : metaRu.errors.unavailable;
export async function invokeMeta<T>(name: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const work = (async () => {
      await deviceSession();
      if (controller.signal.aborted) throw new MessagingError("unavailable");
      const { data, error } = await getSupabase().functions.invoke(name, {
        body: body as Record<string, unknown>,
        signal: controller.signal,
      });
      if (error) {
        let code = "unavailable";
        try {
          const payload = await error.context?.json();
          code = payload?.error || code;
        } catch { /* sanitized */ }
        throw new MessagingError(code);
      }
      if (data?.error) throw new MessagingError(data.error);
      return data as T;
    })();
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new MessagingError("unavailable"));
        }, 15000);
      }),
    ]);
  } catch (e) {
    throw e instanceof MessagingError ? e : new MessagingError("unavailable");
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export function checkDb(error: unknown) {
  if (error) throw new MessagingError("unavailable");
}
export function requestId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 3) | 8).toString(16);
  });
}
export function serviceWindowOpen(
  lastInbound?: string | null,
  now = Date.now(),
) {
  const at = lastInbound ? Date.parse(lastInbound) : NaN;
  return Number.isFinite(at) && at <= now && now - at < 86400000;
}
