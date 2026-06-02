# Design notes

Intentional deviations from the seed style guide, and the reasoning. Kept brief;
a long list means the system has drifted.

## Typeface registers
- Single sans-serif family for command and organization; serif (`--font-serif`)
  used only for quoted verbatim bylaw text in `CitationBlock`, to signal that the
  block is a quotation rather than generated UI prose. This follows the
  "two families when there is substantial prose" guidance without adding a second
  display family.

## Em dashes
- The no-em-dash rule applies to generated prose (model answers and UI copy). It
  does NOT apply to verbatim NCAA bylaw text, which is a quotation shown exactly
  as published. `CitationBlock` renders verbatim text untouched; the API route
  only strips em dashes from the model-generated `answer` field, never from the
  re-attached `verbatimText`. Do not "fix" quoted text.

## Color
- One semantic accent (`--accent`, UC San Diego blue) used only for meaning
  (links/cited-bylaw label, primary action). `--status-caution` marks "uncovered"
  and "model unavailable" states and is always paired with an uppercase text
  label, never used as the sole signal.

## Fixture data banner
- When the index is built with the offline mock embedder / synthetic fixture, the
  footer shows a caution-colored "Fixture data, not real rules" label so the
  state is never mistaken for authoritative output.
