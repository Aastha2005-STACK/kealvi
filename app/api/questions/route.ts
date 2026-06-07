import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 10;

// GET QUESTIONS
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const offset = Number(searchParams.get("offset") ?? 0);

  // 🔥 SEARCH MODE
  if (q) {
    const { data, error } = await supabase
      .from("questions")
      .select(`
        id,
        body,
        author,
        poll_votes(count)
      `)
      .ilike("body", `%${q}%`)
      .limit(PAGE_SIZE);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const questions = data.map((item: any) => ({
      id: item.id,
      body: item.body,
      author: item.author,
      votes: item.poll_votes?.length || 0,
    }));

    return Response.json({
      questions,
      hasMore: false,
    });
  }

  // 🔥 PAGINATION MODE
  const { data, error } = await supabase
    .from("questions")
    .select(`
      id,
      body,
      author,
      poll_votes(count)
    `)
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const questions = data.map((item: any) => ({
    id: item.id,
    body: item.body,
    author: item.author,
    votes: item.poll_votes?.length || 0,
  }));

  return Response.json({
    questions,
    hasMore: data.length === PAGE_SIZE,
  });
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
