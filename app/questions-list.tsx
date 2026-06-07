"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Question = {
  id: string;
  body: string;
  author: string | null;
  votes: number;
};

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [votedId, setVotedId] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const id = setTimeout(async () => {
      const url = query
        ? `/api/questions?q=${encodeURIComponent(query)}`
        : `/api/questions`;

      const res = await fetch(url);
      const data = await res.json();

      setQuestions(data.questions);
      setHasMore(data.hasMore);
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  const totalVotes = questions.reduce((sum, q) => sum + q.votes, 0);

  async function submit() {
    if (!draft.trim()) return;

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });

    const created = await res.json();

    setQuestions((qs) => [{ ...created, votes: 0 }, ...qs]);
    setDraft("");
  }

  async function improveQuestion() {
    if (!draft.trim()) return;

    try {
      setImproving(true);

      const res = await fetch("/api/improve-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: draft,
        }),
      });

      const data = await res.json();

      if (data.improved) {
        setDraft(data.improved);
      }
    } catch (error) {
      console.error("Improve error:", error);
      alert("Failed to improve question");
    } finally {
      setImproving(false);
    }
  }

  async function upvote(id: string) {
    setVotedId(id);

    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id ? { ...q, votes: q.votes + 1 } : q
      )
    );

    const res = await fetch(`/api/questions/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voterId: getVoterId() }),
    });

    if (!res.ok) {
      setVotedId(null);

      setQuestions((qs) =>
        qs.map((q) =>
          q.id === id ? { ...q, votes: q.votes - 1 } : q
        )
      );
    }
  }

  async function loadMore() {
    setLoading(true);

    const res = await fetch(
      `/api/questions?offset=${questions.length}`
    );

    const data = await res.json();

    setQuestions((qs) => [...qs, ...data.questions]);
    setHasMore(data.hasMore);

    setLoading(false);
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      <p className="text-sm text-gray-500">
        {hydrated ? "Interactive ✓" : "Loading interactivity…"}
      </p>

      {/* INPUT SECTION */}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-xl border px-4 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={improveQuestion}
          disabled={improving || !draft.trim()}
          className="rounded-xl border px-4 py-2 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
        >
          {improving ? "Improving..." : "✨ Improve"}
        </button>

        <button
          onClick={submit}
          className="rounded-xl border px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          Ask
        </button>
      </div>

      {/* SEARCH */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search questions…"
        className="w-full rounded-xl border px-4 py-2 shadow-sm"
      />

      {/* QUESTIONS LIST */}
      <ul className="space-y-3">
        {questions.map((q) => (
          <li
            key={`${q.id}-${q.body}`}
            className="flex items-center gap-3 rounded-xl border p-4 bg-white shadow-sm hover:shadow-md transition"
          >
            {/* VOTE BUTTON */}
            <button
              onClick={() => upvote(q.id)}
              className={`rounded-md border px-3 py-1 font-mono transition ${
                votedId === q.id
                  ? "bg-blue-500 text-white border-blue-500"
                  : "hover:bg-gray-100"
              }`}
            >
              ▲ {q.votes}
            </button>

            {/* QUESTION + PROGRESS BAR */}
            <div className="flex-1">
              <p className="font-medium">{q.body}</p>

              <div className="h-2 bg-gray-200 rounded mt-2 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{
                    width:
                      totalVotes === 0
                        ? "0%"
                        : `${(q.votes / totalVotes) * 100}%`,
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {totalVotes === 0
                  ? "0%"
                  : `${Math.round(
                      (q.votes / totalVotes) * 100
                    )}%`}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* LOAD MORE */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="rounded-xl border px-4 py-2 w-full bg-gray-50 hover:bg-gray-100 transition disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
