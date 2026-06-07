import { supabase } from "@/lib/supabase";

export async function getQuestionsPage(offset: number, limit: number) {
  const { data: questionsData, error: qError } = await supabase
    .from("questions")
    .select("id, body, author, created_at")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1); // 🔥 FIXED

  if (qError) {
    console.error("QUESTIONS ERROR:", qError);
    return { questions: [], hasMore: false };
  }

  const { data: votesData } = await supabase
    .from("poll_votes")
    .select("question_id");

  const voteCountMap: Record<string, number> = {};

  (votesData ?? []).forEach((v) => {
    voteCountMap[v.question_id] =
      (voteCountMap[v.question_id] || 0) + 1;
  });

  const rows = (questionsData ?? []).map((q) => ({
    id: q.id,
    body: q.body,
    author: q.author,
    votes: voteCountMap[q.id] || 0,
  }));

  return {
    questions: rows,
    hasMore: (questionsData?.length ?? 0) === limit,
  };
}

export async function searchQuestions(q: string, limit: number) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, body, author, created_at")
    .textSearch("body", q, { type: "websearch", config: "english" })
    .limit(limit);

  if (error) {
    console.error("SEARCH ERROR:", error);
    return [];
  }

  const { data: votesData } = await supabase
    .from("poll_votes")
    .select("question_id");

  const voteCountMap: Record<string, number> = {};

  (votesData ?? []).forEach((v) => {
    voteCountMap[v.question_id] =
      (voteCountMap[v.question_id] || 0) + 1;
  });

  return (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    author: row.author,
    votes: voteCountMap[row.id] || 0,
  }));
}
