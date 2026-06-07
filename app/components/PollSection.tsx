"use client";

import { useEffect, useState } from "react";
import { getVoterId } from "@/lib/voter";

export default function PollSection() {
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  const voterId = getVoterId();

  useEffect(() => {
    fetchPoll();
  }, []);

  async function fetchPoll() {
    try {
      const res = await fetch("/api/polls");

      if (!res.ok) {
        throw new Error(`Failed to fetch poll: ${res.status}`);
      }

      const data = await res.json();

      console.log("Poll API Response:", data);
      console.log("Poll ID:", data?.poll?.id);

      setPoll(data.poll);
    } catch (error) {
      console.error("Fetch poll error:", error);
    }
  }

  async function vote(optionId: string) {
    console.log("Poll Object:", poll);
    console.log("Poll ID:", poll?.id);
    console.log("Option ID:", optionId);

    if (!poll?.id) {
      alert("Poll ID is undefined");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          option_id: optionId,
          user_id: voterId,
        }),
      });

      const text = await res.text();

      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error("Invalid JSON response:", text);
        alert("Server returned invalid response");
        return;
      }

      if (!res.ok) {
        console.error("Status:", res.status);
        console.error("Vote API error:", data);

        alert(
          `Status: ${res.status}\n${data?.error || "Failed to submit vote"}`
        );
        return;
      }

      if (data.success) {
        setVoted(true);
        await fetchPoll();
      }
    } catch (error) {
      console.error("Vote error:", error);
      alert("Something went wrong while voting");
    } finally {
      setLoading(false);
    }
  }

  if (!poll) {
    return <div className="p-4 border rounded">Loading poll...</div>;
  }

  return (
    <div className="p-4 border rounded space-y-3">
      <h2 className="text-lg font-bold">{poll.question}</h2>

      {poll.options?.map((opt: any) => {
        const percent =
          poll.totalVotes > 0
            ? Math.round((opt.votes / poll.totalVotes) * 100)
            : 0;

        return (
          <button
            key={opt.id}
            disabled={loading || voted}
            onClick={() => vote(opt.id)}
            className="w-full text-left border p-2 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <div className="flex justify-between">
              <span>{opt.option_text}</span>
              <span>{percent}%</span>
            </div>

            <div className="h-2 bg-gray-200 mt-1 rounded">
              <div
                className="h-2 bg-blue-500 rounded"
                style={{ width: `${percent}%` }}
              />
            </div>
          </button>
        );
      })}

      {voted && (
        <p className="text-green-600 text-sm">
          ✔ You already voted
        </p>
      )}
    </div>
  );
}
