"use client";

import { useState } from "react";
import SearchBox from "@/components/SearchBox";
import ExampleChips from "@/components/ExampleChips";
import AnswerCard from "@/components/AnswerCard";
import type { AskResponse } from "@/lib/types";

export default function Home() {
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(q?: string) {
    const question = (q ?? query).trim();
    if (!question) return;
    setQuery(question);
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setResult(data as AskResponse);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <p className="text-body text-gray-9 mb-6">
        Find and verify current NCAA Division I rules. Answers include the exact
        bylaw cite and the rule text. This is a research aid, not a compliance
        ruling.
      </p>

      <SearchBox
        value={query}
        onChange={setQuery}
        onSubmit={() => ask()}
        pending={pending}
      />

      {!result && !pending && !error && <ExampleChips onPick={(q) => ask(q)} />}

      <div aria-live="polite">
        {pending && (
          <p className="mt-8 text-body text-gray-7">Searching the Division I Manual...</p>
        )}
        {error && (
          <p className="mt-8 text-body text-caution" role="alert">
            {error}
          </p>
        )}
        {result && <AnswerCard result={result} />}
      </div>
    </div>
  );
}
