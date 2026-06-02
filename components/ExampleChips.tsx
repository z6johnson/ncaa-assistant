"use client";

// Conversation starters. Real copy (no placeholders). Each is a button that
// fills the search box.
const STARTERS = [
  "Is a head coach responsible for a violation by an assistant who reports to them?",
  "Can our athletics staff bet on professional sports?",
  "Can a booster help pay one of our coaches' salaries?",
  "What are the rules on employing someone who still coaches at a local high school?",
];

export default function ExampleChips({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mt-6">
      <p className="text-meta font-bold uppercase tracking-widest text-gray-7 mb-3">
        Try
      </p>
      <ul className="flex flex-col gap-2">
        {STARTERS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="text-left text-body text-accent hover:text-gray-12 transition-colors duration-confirm"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
