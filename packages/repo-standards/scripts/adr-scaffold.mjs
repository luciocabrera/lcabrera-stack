/**
 * Turning a title into a new ADR, as pure functions over strings. The effectful
 * half — reading the homes, writing the file — is `scripts/new-adr.mjs`.
 *
 * Why a scaffold at all: the two things a new ADR gets wrong are its number and
 * its home, and both are mechanical. `adr:verify` already knows the next free
 * number and the homes; this hands them to the author instead of asking them to
 * read the gate's output and retype it. See
 * docs/decisions/ADR-048-adr-taxonomy-and-one-sequence.md.
 */

import { adrBody } from './adr-content.mjs';

/** A leading `<!-- … -->` block, which the template uses for its own
 *  instructions. Stripped so a scaffolded ADR does not inherit them. */
const LEADING_COMMENT = /^\s*<!--[\s\S]*?-->\s*/;

/** `ADR-NNN` wherever it appears in the heading line, and the placeholder title
 *  after it. Kept as two substitutions so a template edit that rewords the
 *  placeholder still produces a correct heading number. */
const HEADING_LINE = /^#[ \t]*ADR-NNN[ \t]*—.*$/m;

export const pad = (number) => String(number).padStart(3, '0');

/**
 * A title to the slug half of a filename: lowercase, ASCII words joined by
 * single dashes. Matches the `ADR-NNN-kebab-slug.md` shape `adr-registry.mjs`
 * enforces, so a scaffolded file passes the gate that named it.
 *
 * Punctuation is dropped rather than transliterated — ADR-051's title contains
 * `` `withTransaction` `` and its filename does not. Anything outside `[a-z0-9]`
 * goes the same way, so a non-ASCII title needs the slug passed explicitly.
 */
export const slugify = (title) =>
  title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    // Single `-`, not `-+`: the collapse above cannot leave two in a row, and an
    // anchored `-+$` backtracks across a run of dashes for no gain (S8786).
    .replaceAll(/^-|-$/g, '');

export const adrFilename = (number, title) =>
  `ADR-${pad(number)}-${slugify(title)}.md`;

/**
 * The template with its instructions removed and its heading filled in.
 *
 * The section bodies keep their `<!-- … -->` prompts on purpose: they are what
 * tells the author what belongs there, and an author who deletes them has read
 * them. Only the file-level block at the top is dropped.
 *
 * The classification block is carried through VERBATIM, placeholders included.
 * A scaffolded record therefore fails `adr:verify` until its author says what
 * the decision governs — which is the point of asking, and is why the leading
 * comment is found after the block rather than at byte zero.
 */
export const renderAdr = ({ number, template, title }) => {
  const body = adrBody(template);
  const block = template.slice(0, template.length - body.length);
  const withoutInstructions = body.replace(LEADING_COMMENT, '');
  if (!HEADING_LINE.test(withoutInstructions)) {
    throw new Error(
      'the ADR template no longer has an `# ADR-NNN — …` heading to fill in',
    );
  }
  const record = withoutInstructions.replace(
    HEADING_LINE,
    `# ADR-${pad(number)} — ${title}`,
  );
  // The stripped comment took the blank line after the block with it; markdown
  // does not need it back, but every other record in the home has one.
  return block === '' ? record : `${block}\n${record}`;
};

/**
 * The home a `--home` key names. Keyed by `tier` rather than by directory, so
 * the answer stays correct if a directory moves. The tiers are whatever the
 * consumer's `adrHomes` declares.
 */
export const resolveHome = (homes, tier) =>
  homes.find((home) => home.tier === tier);
