import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: polls, error } = await supabase
    .from("polls")
    .select(`
      *,
      poll_options (*)
    `)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const poll = polls?.[0];

  // 🔥 GET ALL VOTES
  const { data: votes } = await supabase
    .from("poll_votes")
    .select("poll_id, option_id");

  const voteCount: Record<string, number> = {};
  let totalVotes = 0;

  (votes ?? []).forEach((v) => {
    if (v.poll_id === poll?.id) {
      voteCount[v.option_id] = (voteCount[v.option_id] || 0) + 1;
      totalVotes++;
    }
  });

  return NextResponse.json({
    poll: poll
      ? {
          ...poll,
          options: poll.poll_options.map((opt: any) => ({
            ...opt,
            votes: voteCount[opt.id] || 0,
          })),
          totalVotes,
        }
      : null,
  });
}
// POST /api/polls
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { question, options } = body;

    if (!question || !options || options.length < 2) {
      return NextResponse.json(
        { error: "Invalid poll data" },
        { status: 400 }
      );
    }

    // 1. Insert poll question
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert([{ question }])
      .select()
      .single();

    if (pollError) throw pollError;

    // 2. Insert options
    const optionsInsert = options.map((opt: string) => ({
      poll_id: poll.id,
      option_text: opt,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsInsert);

    if (optionsError) throw optionsError;

    return NextResponse.json({
      success: true,
      poll,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
