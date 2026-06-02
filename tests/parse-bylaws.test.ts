import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseManualText,
  parentPathOf,
  normalizeVerbatim,
  qaCheck,
} from "../scripts/seed/parse-bylaws";
import { SYNTHETIC_MANUAL_TEXT } from "../scripts/seed/fixtures/synthetic-manual";

test("parentPathOf builds ancestor chain", () => {
  assert.deepEqual(parentPathOf("11.1.1.1"), ["11", "11.1", "11.1.1"]);
  assert.deepEqual(parentPathOf("10"), []);
});

test("normalizeVerbatim de-hyphenates and collapses whitespace", () => {
  assert.equal(normalizeVerbatim("respon-\nsible   for\n  this"), "responsible for this");
});

test("parseManualText extracts bylaw sections from the fixture", () => {
  const sections = parseManualText(SYNTHETIC_MANUAL_TEXT);
  const numbers = sections.map((s) => s.bylawNumber);
  assert.ok(numbers.includes("11.1.1.1"), "should find 11.1.1.1");
  assert.ok(numbers.includes("10.3"), "should find 10.3");
  const head = sections.find((s) => s.bylawNumber === "11.1.1.1")!;
  assert.equal(head.title, "Responsibility of Head Coach");
  assert.ok(head.verbatimText.includes("presumed to be responsible"));
});

test("qaCheck passes on the fixture and flags duplicates", () => {
  const sections = parseManualText(SYNTHETIC_MANUAL_TEXT);
  assert.equal(qaCheck(sections, SYNTHETIC_MANUAL_TEXT.length).ok, true);

  const dup = [...sections, sections[0]];
  assert.equal(qaCheck(dup, SYNTHETIC_MANUAL_TEXT.length).ok, false);
});
