import { DISCLAIMER } from "@/lib/types";

// Persistent, plain-language disclaimer shown with every answer (Responsible AI
// transparency + human-values: the tool never makes a binding determination).
export default function Disclaimer() {
  return (
    <p className="text-meta text-gray-8 mt-4">
      <span className="font-bold uppercase tracking-wide text-gray-9">Note</span>{" "}
      {DISCLAIMER}
    </p>
  );
}
