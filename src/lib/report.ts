// Cấu trúc báo cáo chấm điểm: schema gửi cho AI + type dùng ở giao diện.

/** Điểm dưới mức này là câu yếu -> đưa vào lịch ôn. */
export const WEAK = 5;
export type Report = {
  overall: number;
  summary: string;
  criteria: { knowledge: number; problemSolving: number; communication: number };
  strengths: string[];
  improvements: string[];
  /** related: id câu cùng ý trong ngân hàng (server đã kiểm tra), không có thì bỏ trống. */
  questions: { question: string; score: number; answer: string; feedback: string; betterAnswer: string; nextTime: string; related?: string }[];
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
          answer: { type: "string" },
          feedback: { type: "string" },
          betterAnswer: { type: "string" },
          nextTime: { type: "string" },
          related: { type: "string" },
        },
        required: ["question", "score", "answer", "feedback", "betterAnswer", "nextTime", "related"],
      },
    },
  },
  required: ["overall", "summary", "criteria", "strengths", "improvements", "questions"],
};
