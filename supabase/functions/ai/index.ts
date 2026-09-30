import { createClient } from "@supabase/supabase-js";
import { createHandler } from "./handler.ts";
import { createProvider } from "./provider.ts";
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
Deno.serve(createHandler({
  async authenticate(token) {
    const { data, error } = await admin.auth.getUser(token);
    return error ? null : data.user?.id || null;
  },
  async rateLimit(deviceId) {
    const { data, error } = await admin.rpc("take_ai_request", {
      p_device_id: deviceId,
    });
    if (error) throw Error("rate limit unavailable");
    return data === true;
  },
  provider: () => createProvider(),
  log: (record) => console.log(JSON.stringify(record)),
}));
