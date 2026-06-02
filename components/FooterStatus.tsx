"use client";

import { useEffect, useState } from "react";

// Ambient status (style guide section 9): manual version + AI-in-use indicator,
// persistent in the footer, not a modal or toast.
interface Health {
  seeded: boolean;
  model: string;
  manualVersion: string | null;
  mockEmbeddings?: boolean;
}

export default function FooterStatus() {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <footer className="border-t border-gray-3 mt-12">
      <div className="mx-auto w-full max-w-prose px-4 py-4 flex flex-wrap gap-x-6 gap-y-1 text-meta text-gray-7">
        <span>
          {health?.seeded
            ? `Source: ${health.manualVersion}`
            : "Manual not loaded"}
        </span>
        <span>AI-assisted &middot; model: {health?.model ?? "unknown"}</span>
        {health?.mockEmbeddings && (
          <span className="font-bold uppercase tracking-wide text-caution">
            Fixture data, not real rules
          </span>
        )}
        <span className="ml-auto">UC San Diego Athletics</span>
      </div>
    </footer>
  );
}
