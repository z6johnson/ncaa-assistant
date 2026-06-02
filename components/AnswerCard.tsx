import type { AskResponse } from "@/lib/types";
import CitationBlock from "./CitationBlock";
import Disclaimer from "./Disclaimer";

// Information hierarchy: the plain answer (signal) first, then citations
// (context), then the disclaimer/provenance. An uncovered answer is flagged
// with a text label and a left-edge accent, never color alone.
export default function AnswerCard({ result }: { result: AskResponse }) {
  const uncovered = result.coverage === "uncovered";
  return (
    <section
      aria-label="Answer"
      className={`mt-8 pt-6 border-t border-gray-3 ${uncovered ? "border-l-2 border-l-caution pl-4" : ""}`}
    >
      {result.fallbackUsed && (
        <p className="text-meta font-bold uppercase tracking-wide text-caution mb-2">
          Model unavailable, showing most relevant bylaws
        </p>
      )}
      {uncovered && (
        <p className="text-meta font-bold uppercase tracking-wide text-caution mb-2">
          Not clearly covered
        </p>
      )}

      <p className="text-lead text-gray-12">{result.answer}</p>

      {result.citations.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="text-meta font-bold uppercase tracking-widest text-gray-7">
            Cited bylaws
          </h2>
          {result.citations.map((c) => (
            <CitationBlock key={c.bylawNumber} citation={c} />
          ))}
        </div>
      )}

      <Disclaimer />
    </section>
  );
}
