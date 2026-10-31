import "server-only";
import { GoogleGenAI } from "@google/genai";
import { headers } from "next/headers";

// Mọi lời gọi AI đi qua file này. Đổi sang Claude API sau này: chỉ sửa thân hàm ask().
export type Turn = { role: "user" | "model"; text: string };
/** File đính kèm lượt đầu tiên (vd CV dạng PDF), data là base64. */
export type Attachment = { mimeType: string; data: string };

export class MissingKeyError extends Error {}

export async function ask(system: string, turns: Turn[], jsonSchema?: object, files: Attachment[] = []): Promise<string> {
  // App mobile gửi "X-Client: app" để dùng key riêng (tách chi phí); chưa đặt key riêng thì dùng chung key web.
  const fromApp = (await headers()).get("x-client") === "app";
  const apiKey = (fromApp && process.env.GEMINI_API_KEY_APP) || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingKeyError();
  const client = new GoogleGenAI({ apiKey });

  const res = await client.models.generateContent({
    // Tên model Gemini đổi thường xuyên; "gemini-flash-latest" luôn trỏ tới bản Flash mới nhất.
    model: process.env.GEMINI_MODEL || "gemini-flash-latest",
    contents: turns.map((t, i) => ({
      role: t.role,
      parts: [...(i === 0 ? files.map((f) => ({ inlineData: f })) : []), { text: t.text }],
    })),
    config: {
      systemInstruction: system,
      ...(jsonSchema && { responseMimeType: "application/json", responseJsonSchema: jsonSchema }),
    },
  });
  return res.text ?? "";
}
