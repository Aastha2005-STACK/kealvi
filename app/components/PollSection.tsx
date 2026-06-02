"use client";

import { useEffect, useState } from "react";

export default function PollSection() {
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(false);

  // demo voter id (baad me auth se replace hoga)
  const voterId = "user_1";

  useEffect(() => {
    fetchPoll();
  }, []);

  async function fetchPoll() {
    const res = await fetch("/api/polls");
    const data = await res.json();
    setPoll(data.poll);
  }

  async function vote(optionId: string) {
    setLoading(true);

    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        option_id: optionId,
        voter_id: voterId,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setVoted(true);
      fetchPoll(); // refresh results
    }

    setLoading(false);
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
            className="w-full text-left border p-2 rounded hover:bg-gray-100"
          >
            <div className="flex justify-between">
              <span>{opt.option_text}</span>
              <span>{percent}%</span>
            </div>

            {/* result bar */}
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