# Accessibility statement

## Conformance target
This application targets **WCAG 2.1 Level AA** at minimum, with WCAG 2.2 AA as the
working target, consistent with the seed style guide and the ADA Title II (2024)
baseline.

## Measures in place
- Semantic HTML: `header`/`main`/`footer`/`section`, a single `h1`, ordered
  headings, real `<button>` and `<label>` elements, and `<details>` disclosure
  for verbatim rule text.
- Visible high-contrast focus ring on every interactive element (`:focus-visible`,
  2px, accent color).
- Color is never the sole signal: "uncovered" and "model unavailable" states pair
  a left-edge accent with an uppercase text label.
- Grayscale-first palette; one muted accent. Light and dark themes via
  `prefers-color-scheme`.
- `prefers-reduced-motion` honored globally; transitions are confirm-only
  (120 to 240ms); no entrance animations.
- Status updates announced via an `aria-live="polite"` region.
- Relative type units; layout uses a single readable column that reflows at
  200 and 400 percent zoom.

## Known limitations
- Automated and manual accessibility audits are pending for the first release
  (axe/Lighthouse + keyboard and screen-reader walkthrough). See CI workflow.
- This is a BETA research aid.

## Last audit
Not yet audited. Date this section when the first audit is completed.

## Contact
Report accessibility issues to the UC San Diego Athletics compliance office (see
docs/rights-and-appeal.md).
