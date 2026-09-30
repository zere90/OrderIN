import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
export const aiConfigured = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);
let client: SupabaseClient | undefined;
let signingIn: Promise<string> | undefined;
export function getSupabase() {
  if (!aiConfigured || typeof window === "undefined") throw Error("demo");
  return client ||= createClient(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    },
  );
}
export async function deviceSession(): Promise<string> {
  const c = getSupabase();
  const { data } = await c.auth.getSession();
  if (data.session) return data.session.user.id;
  if (!signingIn) {
    signingIn = c.auth.signInAnonymously().then(({ data, error }) => {
      if (error || !data.user) throw Error("auth");
      return data.user.id;
    }).finally(() => {
      signingIn = undefined;
    });
  }
  return signingIn;
}
