// Cấu trúc báo cáo chấm điểm: schema gửi cho AI + type dùng ở giao diện.
export type Report = {
  overall: number;
  summary: string;
  criteria: { knowledge: number; problemSolving: number; communication: number };
  strengths: string[];
  improvements: string[];
  questions: { question: string; score: number; feedback: string; betterAnswer: string }[];
};

const score = { type: "number", minimum: 0, maximum: 10 };
const strings = { type: "array", items: { type: "string" } };

export const reportSchema = {
  type: "object",
  properties: {
    overall: score,
    summary: { type: "string" },
    criteria: {
      type: "object",
      properties: { knowledge: score, problemSolving: score, communication: score },
      required: ["knowledge", "problemSolving", "communication"],
    },
    strengths: strings,
    improvements: strings,
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          score,
          feedback: { type: "string" },
          betterAnswer: { type: "string" },
        },
        required: ["question", "score", "feedback", "betterAnswer"],
      },
    },
  },
  required: ["overall", "summary", "criteria", "strengths", "improvements", "questions"],
};
