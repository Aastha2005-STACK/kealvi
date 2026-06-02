import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pollId } = await params;

    const body = await req.json();
    const { option_id, user_id } = body;

    if (!option_id || !user_id) {
      return NextResponse.json(
        { error: "Missing option_id or user_id" },
        { status: 400 }
      );
    }

    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId)
      .eq("user_id", user_id)
      .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingVote) {
      return NextResponse.json(
        { error: "You already voted" },
        { status: 409 }
      );
    }

    // Insert vote
    const { data, error } = await supabase
      .from("poll_votes")
      .insert([
        {
          poll_id: pollId,
          option_id,
          user_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      vote: data,
    });
  } catch (err: any) {
    console.error("VOTE ERROR:", err);

    return NextResponse.json(
      {
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}