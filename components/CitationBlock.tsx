import type { Citation } from "@/lib/types";

// One bylaw citation: the exact cite in the system register, plus a disclosure
// for the verbatim rule text so users can verify. The verbatim text is quoted
// source and is shown exactly as published (em dashes preserved).
export default function CitationBlock({ citation }: { citation: Citation }) {
  return (
    <div className="border-l-2 border-gray-4 pl-4 py-1">
      <details>
        <summary className="cursor-pointer list-none">
          <span className="text-meta font-bold uppercase tracking-wide text-accent">
            Bylaw {citation.bylawNumber}
          </span>
          <span className="text-body text-gray-11"> {citation.title}</span>
          <span className="text-meta text-gray-7"> &middot; show rule text</span>
        </summary>
        <blockquote className="mt-3 font-serif text-body text-gray-11 whitespace-pre-wrap">
          {citation.verbatimText}
        </blockquote>
      </details>
    </div>
  );
}
