const encoder = new TextEncoder();
export async function verifySignature(
  raw: Uint8Array,
  signature: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signature || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const bytes = Uint8Array.from(
    signature.slice(7).match(/../g)!.map((x) => parseInt(x, 16)),
  );
  return crypto.subtle.verify("HMAC", key, bytes, new Uint8Array(raw));
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
}
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function aes(encodedKey: string) {
  const raw = bytes(encodedKey);
  if (raw.length !== 32) throw Error("invalid encryption key");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}
export async function encryptToken(
  token: string,
  key: string,
  context: string,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(context) },
    await aes(key),
    encoder.encode(token),
  );
  return `v1.${b64(iv)}.${b64(new Uint8Array(data))}`;
}
export async function decryptToken(
  token: string,
  key: string,
  context: string,
) {
  const [v, iv, data] = token.split(".");
  if (v !== "v1") throw Error("invalid ciphertext");
  return new TextDecoder().decode(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytes(iv),
        additionalData: encoder.encode(context),
      },
      await aes(key),
      bytes(data),
    ),
  );
}
