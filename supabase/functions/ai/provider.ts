import { z } from "zod";
import { type Input, outputSchemas } from "./schemas.ts";
import { prompts } from "./prompts.ts";
export interface ProviderResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}
export interface Provider {
  generate(
    input: Input,
    signal: AbortSignal,
    repair: boolean,
  ): Promise<ProviderResult>;
}
export function createProvider(
  env: (name: string) => string | undefined = (n) => Deno.env.get(n),
  request: typeof fetch = fetch,
): Provider {
  const provider = env("AI_PROVIDER") || "gemini";
  if (!["gemini", "anthropic"].includes(provider)) throw Error("configuration");
  const key = env(
    provider === "gemini" ? "GEMINI_API_KEY" : "ANTHROPIC_API_KEY",
  );
  const model =
    env(provider === "gemini" ? "GEMINI_MODEL" : "ANTHROPIC_MODEL") ||
    (provider === "gemini" ? "gemini-3.5-flash-lite" : "claude-haiku-4-5");
  if (!key) throw Error("configuration");
  return {
    async generate(input, signal, repair) {
      const schema = z.toJSONSchema(outputSchemas[input.task]);
      const system = prompts[input.task] +
        `\nOutput schema: ${JSON.stringify(schema)}` +
        (repair
          ? "\nThe previous attempt failed validation. Re-read the input and strictly satisfy the schema and catalog constraints."
          : "");
      const { image, ...safeInput } = input.task === "read_invoice"
        ? input
        : { ...input, image: undefined };
      const content = JSON.stringify(safeInput);
      let response: Response;
      if (provider === "gemini") {
        response = await request(
          `https://generativelanguage.googleapis.com/v1beta/models/${
            encodeURIComponent(model)
          }:generateContent`,
          {
            method: "POST",
            signal,
            headers: {
              "content-type": "application/json",
              "x-goog-api-key": key,
            },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: system }] },
              contents: [{
                role: "user",
                parts: [
                  { text: content },
                  ...(image
                    ? [{ inlineData: { mimeType: "image/jpeg", data: image } }]
                    : []),
                ],
              }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
                maxOutputTokens: 4096,
              },
            }),
          },
        );
      } else {
        response = await request("https://api.anthropic.com/v1/messages", {
          method: "POST",
          signal,
          headers: {
            "content-type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            temperature: 0.2,
            system,
            messages: [{
              role: "user",
              content: [
                ...(image
                  ? [{
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: "image/jpeg",
                      data: image,
                    },
                  }]
                  : []),
                { type: "text", text: content },
              ],
            }],
          }),
        });
      }
      if (!response.ok) throw Error("provider unavailable"); // never expose/log provider bodies
      const data = await response.json();
      return provider === "gemini"
        ? {
          text:
            data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) =>
              p.text || ""
            ).join("") || "",
          inputTokens: data.usageMetadata?.promptTokenCount || 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        }
        : {
          text: data.content?.filter((p: { type: string }) => p.type === "text")
            .map((p: { text: string }) => p.text).join("") || "",
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
        };
    },
  };
}
