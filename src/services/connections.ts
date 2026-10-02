import { Business } from "../types";
import { aiConfigured, deviceSession, getSupabase } from "./supabase";
import { checkDb, invokeMeta } from "./metaApi";
export interface ChannelConnection {
  id: string;
  business_id: string;
  type: "instagram" | "whatsapp";
  external_id: string;
  display_name: string;
  status: string;
  token_expires_at: string | null;
  waba_id?: string;
}
export interface ConnectionsService {
  ensureBusiness(business: Business): Promise<string>;
  list(businessId: string): Promise<ChannelConnection[]>;
  instagram(businessId: string, redirectUri: string): Promise<{ url: string }>;
  whatsapp(businessId: string): Promise<void>;
}
export const mockConnectionsService: ConnectionsService = {
  async ensureBusiness(b) {
    return b.id;
  },
  async list() {
    return [];
  },
  async instagram() {
    return { url: "" };
  },
  async whatsapp() {},
};
export class SupabaseConnectionsService implements ConnectionsService {
  async ensureBusiness(b: Business) {
    const seller = await deviceSession();
    const db = getSupabase();
    const fields = {
      name: b.name,
      type: b.type,
      products: b.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        variants: p.size || p.color ? [{ size: p.size, color: p.color }] : [],
      })),
    };
    let { data, error } = await db.from("businesses").select("id").eq(
      "seller_id",
      seller,
    ).eq("local_key", b.id).maybeSingle();
    checkDb(error);
    if (!data) {
      const created = await db.from("businesses").insert({
        ...fields,
        seller_id: seller,
        local_key: b.id,
      }).select("id").single();
      if (created.error?.code === "23505") {
        const retry = await db.from("businesses").select("id").eq(
          "seller_id",
          seller,
        ).eq("local_key", b.id).single();
        checkDb(retry.error);
        data = retry.data;
      } else {
        checkDb(created.error);
        data = created.data;
      }
    }
    if (!data) throw Error("business");
    const updated = await db.from("businesses").update(fields).eq(
      "id",
      data.id,
    );
    checkDb(updated.error);
    return data.id as string;
  }
  async list(businessId: string) {
    await deviceSession();
    const { data, error } = await getSupabase().from("channels").select(
      "id,business_id,type,external_id,display_name,status,token_expires_at,waba_id",
    ).eq("business_id", businessId);
    checkDb(error);
    return (data || []) as ChannelConnection[];
  }
  instagram(businessId: string, redirectUri: string) {
    return invokeMeta<{ url: string }>("connect-instagram", {
      businessId,
      redirectUri,
    });
  }
  async whatsapp(businessId: string) {
    await invokeMeta("connect-whatsapp", { businessId });
  }
}
export const connectionsService: ConnectionsService = aiConfigured
  ? new SupabaseConnectionsService()
  : mockConnectionsService;
