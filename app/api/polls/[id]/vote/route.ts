import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/polls/:id/vote
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;

    const body = await req.json();
    const { option_id, voter_id } = body;
    if (!option_id || !voter_id) {
      return NextResponse.json(
        { error: "Missing option_id or voter_id" },
        { status: 400 }
      );
    }

    // 🔒 Check if user already voted (prevents double voting)
    const { data: existingVote } = await supabase
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId)
      .eq("voter_id", voter_id)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: "You already voted" },
        { status: 409 }
      );
    }

    // ✅ Insert vote
    const { data, error } = await supabase
      .from("poll_votes")
      .insert([
        {
          poll_id: pollId,
          option_id,
          voter_id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      vote: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}