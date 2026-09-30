import { createClient } from "@supabase/supabase-js";
export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
export class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}
export const secret = (key: string) => {
  const v = Deno.env.get(key);
  if (!v) throw new HttpError(503, "configuration");
  return v;
};
export const admin = () =>
  createClient(secret("SUPABASE_URL"), secret("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
export async function user(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, "unauthorized");
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "unauthorized");
  return data.user;
}
export async function owns(businessId: string, sellerId: string) {
  const { data, error } = await admin().from("businesses").select(
    "id,name,type,products",
  ).eq("id", businessId).eq("seller_id", sellerId).single();
  if (error || !data) throw new HttpError(403, "forbidden");
  return data;
}
export async function limitedBody(req: Request, max = 65536) {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_input");
  let n = 0;
  const parts: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > max) {
      await reader.cancel();
      throw new HttpError(413, "too_large");
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(n);
  let i = 0;
  for (const p of parts) {
    bytes.set(p, i);
    i += p.length;
  }
  return bytes;
}
export async function body(req: Request) {
  try {
    return JSON.parse(new TextDecoder().decode(await limitedBody(req)));
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(400, "invalid_input");
  }
}
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    try {
      return await handler(req);
    } catch (e) {
      return json(
        { error: e instanceof HttpError ? e.code : "unavailable" },
        e instanceof HttpError ? e.status : 503,
      );
    }
  });
}
export async function checked<T>(
  result: PromiseLike<{ data: T; error: unknown }>,
): Promise<T> {
  const { data, error } = await result;
  if (error) throw new HttpError(503, "database");
  return data;
}
export const version = () => Deno.env.get("META_GRAPH_VERSION") || "v25.0";
export async function graph(
  path: string,
  token: string,
  options: { instagram?: boolean; method?: string; data?: unknown } = {},
) {
  const host = options.instagram
    ? "https://graph.instagram.com"
    : "https://graph.facebook.com";
  const response = await fetch(`${host}/${version()}/${path}`, {
    method: options.method || "GET",
    signal: AbortSignal.timeout(10000),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    ...(options.data ? { body: JSON.stringify(options.data) } : {}),
  });
  if (!response.ok) {
    let code: number | undefined;
    try {
      const error = await response.json();
      code = error?.error?.code;
    } catch { /* ignore raw body */ }
    if (code === 190) throw new HttpError(409, "reconnect");
    throw new HttpError(response.status === 400 ? 400 : 502, "meta_rejected");
  }
  return response.json(); // Never log URLs, request bodies, or Meta error/token responses.
}
export const channelColumns =
  "id,business_id,type,external_id,display_name,status,token_expires_at,waba_id";
