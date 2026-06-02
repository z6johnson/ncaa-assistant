"use client";

import { useId } from "react";

export default function SearchBox({
  value,
  onChange,
  onSubmit,
  pending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  const id = useId();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id} className="block text-body text-gray-11 mb-2">
        Ask an NCAA Division I rules question
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Can a coach text a recruit?"
          autoComplete="off"
          className="flex-1 border border-gray-5 bg-gray-0 text-gray-12 rounded-sm px-3 py-2 text-body placeholder:text-gray-6"
        />
        <button
          type="submit"
          disabled={pending || value.trim().length === 0}
          className="bg-accent text-gray-0 rounded-sm px-5 py-2 text-body font-semibold disabled:opacity-50 transition-opacity duration-confirm"
        >
          {pending ? "Asking" : "Ask"}
        </button>
      </div>
    </form>
  );
}
