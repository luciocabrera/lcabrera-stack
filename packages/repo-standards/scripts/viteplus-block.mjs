/**
 * Pure core of the Vite+ managed-block gate (`./verify-viteplus-block.mjs`).
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

const HTML_COMMENT = /<!--[\s\S]*?-->/g;

const stripComments = (text) => {
  let current = text;
  let previous;
  do {
    previous = current;
    current = current.replace(HTML_COMMENT, '');
  } while (current !== previous);
  return current;
};

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

export const renderedContent = (inner) => stripComments(inner).trim();

export const renderedLines = (inner) =>
  stripComments(inner)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const withEmptiedRegion = (text, region, body) =>
  `${text.slice(0, region.innerStart)}${body}${text.slice(region.innerEnd)}`;
