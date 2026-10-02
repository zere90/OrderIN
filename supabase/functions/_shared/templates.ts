import { graph } from "./meta.ts";
export type Template = {
  name: string;
  language: string;
  body: string;
  parameterCount: number;
};
export function approvedTemplates(data: unknown): Template[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((t) => {
    if (
      t.status !== "APPROVED" || typeof t.name !== "string" ||
      typeof t.language !== "string" || !Array.isArray(t.components)
    ) return [];
    // This first implementation supports text-body templates, without dynamic headers/buttons.
    if (
      t.components.some((c: { type: string; format?: string; text?: string }) =>
        !["BODY", "FOOTER"].includes(c.type) &&
        !(c.type === "HEADER" && c.format === "TEXT" &&
          typeof c.text === "string" && !c.text.includes("{{"))
      )
    ) return [];
    const body = t.components.find((c: { type: string }) => c.type === "BODY")
      ?.text;
    if (typeof body !== "string") return [];
    const slots = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    const count = Math.max(0, ...slots);
    if (count > 10 || new Set(slots).size !== count || /\{\{[^\d]/.test(body)) {
      return [];
    }
    return [{
      name: t.name,
      language: t.language,
      body,
      parameterCount: count,
    }];
  });
}
export async function templates(waba: string, token: string) {
  const data = await graph(
    `${
      encodeURIComponent(waba)
    }/message_templates?fields=name,language,status,components&limit=100`,
    token,
  );
  return approvedTemplates(data.data);
}
