import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);

    const { question } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Rewrite this question in a concise and clear way. Return only the improved question.

Question:
${question}`,
    });

    return Response.json({
      improved: res.text,
    });
  } catch (error: any) {
    console.error("GEMINI ERROR:", error);

    return Response.json(
      {
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
