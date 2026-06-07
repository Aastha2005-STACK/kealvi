import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 10;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const offset = Number(searchParams.get("offset") ?? 0);

  // 🔥 SEARCH
  if (q) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, body, author")
      .ilike("body", `%${q}%`)
      .range(0, PAGE_SIZE - 1);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const questions = await attachVotes(data ?? []);

    return Response.json({
      questions,
      hasMore: false,
    });
  }

  // 🔥 PAGINATION
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const questions = await attachVotes(data ?? []);

  return Response.json({
    questions,
    hasMore: (data?.length ?? 0) === PAGE_SIZE,
  });
}

// 🔥 VOTE ATTACHER (SAFE FIX)
async function attachVotes(questions: any[]) {
  const { data: votes } = await supabase
    .from("votes")
    .select("question_id");

  const map: Record<string, number> = {};

  (votes ?? []).forEach((v) => {
    map[v.question_id] = (map[v.question_id] || 0) + 1;
  });

  return questions.map((q) => ({
    ...q,
    votes: map[q.id] || 0,
  }));
}

// CREATE QUESTION
export async function POST(req: Request) {
  const { body, author } = await req.json();

  const { data, error } = await supabase
    .from("questions")
    .insert({ body, author })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    ...data,
    votes: 0,
  });
}
