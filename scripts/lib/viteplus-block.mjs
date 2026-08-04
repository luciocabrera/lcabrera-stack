/**
 * Pure core of the Vite+ managed-block gate (`scripts/verify-viteplus-block.mjs`).
 *
 * Vite+ owns the region between its two markers in AGENTS.md and rewrites it in
 * place whenever it syncs agent instructions — which `vp install` does, so every
 * fresh worktree gets the upstream template back. That template's Review
 * Checklist tells agents to run `vp test`, which this repo forbids (AGENTS.md
 * §4), so the refill actively contradicts the file it lands in.
 *
 * The invariant is "the region renders to nothing", not "the region does not
 * match today's upstream text": upstream wording changes, and anything rendered
 * there is content nobody in this repo reviewed.
 *
 * Governed by .claude/rules/scripts.md.
 */

export const START_MARKER = '<!--VITE PLUS START-->';
export const END_MARKER = '<!--VITE PLUS END-->';

/** Every HTML comment, including multi-line ones. */
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

/**
 * Locate the managed region.
 *
 * `absent` is a PASS, not a failure: with no markers Vite+'s sync is a no-op
 * (its own `updateExistingAgentInstructions` documents "No Vite+ markers → no
 * writes"), so a repo that deleted them is already safe.
 */
export const findRegion = (text) => {
  const start = text.indexOf(START_MARKER);
  const end = text.indexOf(END_MARKER);
  if (start === -1 && end === -1) return { kind: 'absent' };
  if (start === -1 || end === -1 || end < start) return { kind: 'unpaired' };
  return {
    kind: 'present',
    innerStart: start + START_MARKER.length,
    innerEnd: end,
    inner: text.slice(start + START_MARKER.length, end),
  };
};

/** What the region actually renders: itself, minus comments and whitespace. */
export const renderedContent = (inner) =>
  inner.replace(HTML_COMMENT, '').trim();

/** The offending lines, for an error message that points at the problem. */
export const renderedLines = (inner) =>
  inner
    .replace(HTML_COMMENT, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/** Replace the region's body, keeping both markers exactly where they were. */
export const withEmptiedRegion = (text, region, body) =>
  `${text.slice(0, region.innerStart)}${body}${text.slice(region.innerEnd)}`;
