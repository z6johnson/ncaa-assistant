import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseManualText,
  parentPathOf,
  normalizeVerbatim,
  qaCheck,
  stripFrontMatter,
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

test("parseManualText ignores bare-number footnotes and list items", () => {
  // The PDF prints footnote markers and enumerated items as a bare integer at
  // the start of a line ("2 See Bylaw ..."); only dotted numbers are bylaws.
  const text =
    "\n13.2.1 General Rule. An institution shall not provide impermissible benefits.\n" +
    "2 See Bylaw 17.12.6.1 for the applicable limit on contests.\n" +
    "13.2.2 Exception. A representative may not provide compensation to a coach.";
  const numbers = parseManualText(text).map((s) => s.bylawNumber);
  assert.deepEqual(numbers, ["13.2.1", "13.2.2"]);
});

test("qaCheck allows a reused number with different text but flags identical repeats", () => {
  const mk = (bylawNumber: string, verbatimText: string) => ({
    bylawNumber,
    parentPath: [],
    title: "Length of Playing Season",
    verbatimText,
  });
  // Genuine parallel provisions (e.g. men's vs women's Article 17): same number,
  // different text -> legitimate, must pass.
  const parallel = [mk("17.22.1", "Men's soccer season is 132 days."), mk("17.22.1", "Women's soccer season is 144 days.")];
  const totalLen = parallel.reduce((n, s) => n + s.verbatimText.length, 0);
  assert.equal(qaCheck(parallel, totalLen).ok, true);
  // Real double-extraction: same number AND identical text -> flagged.
  const repeated = [mk("17.22.1", "Identical text."), mk("17.22.1", "Identical text.")];
  const qa = qaCheck(repeated, repeated[0].verbatimText.length * 2);
  assert.equal(qa.ok, false);
  assert.ok(qa.problems.some((p) => p.includes("duplicate")));
});

test("stripFrontMatter removes a table of contents so it can't shadow real bylaws", () => {
  // A TOC entry that lands at the top of a page (preceded by a newline) matches
  // the heading regex and collides with the real bylaw of the same number. Real
  // manuals only avoid duplicates because this front matter is stripped first.
  const tocEntries = [
    "13.17 Recruiting Calendars. 124",
    ...Array.from({ length: 11 }, (_, i) => `13.${i + 1} Some Heading Number ${i + 1}. ${130 + i}`),
  ].join("  ");
  const body =
    "\n13.17 Recruiting Calendars. 13.17.1 Baseball. The following periods of " +
    "recruiting shall apply to baseball as adopted by the membership.";
  const manual = tocEntries + body;

  const stripped = stripFrontMatter(manual);
  assert.ok(!stripped.includes("124"), "page numbers from the TOC should be gone");

  const sections = parseManualText(manual);
  assert.equal(
    sections.filter((s) => s.bylawNumber === "13.17").length,
    1,
    "13.17 should be parsed once, not duplicated by the TOC",
  );
  const dupProblems = qaCheck(sections, stripFrontMatter(manual).length).problems.filter((p) =>
    p.includes("duplicate"),
  );
  assert.deepEqual(dupProblems, [], "no duplicate-number problems after stripping the TOC");
});

test("stripFrontMatter leaves a TOC-less manual untouched", () => {
  assert.equal(stripFrontMatter(SYNTHETIC_MANUAL_TEXT), SYNTHETIC_MANUAL_TEXT);
});

test("qaCheck passes on the fixture and flags duplicates", () => {
  const sections = parseManualText(SYNTHETIC_MANUAL_TEXT);
  assert.equal(qaCheck(sections, SYNTHETIC_MANUAL_TEXT.length).ok, true);

  const dup = [...sections, sections[0]];
  assert.equal(qaCheck(dup, SYNTHETIC_MANUAL_TEXT.length).ok, false);
});
