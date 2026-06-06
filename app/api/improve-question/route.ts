import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

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
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}