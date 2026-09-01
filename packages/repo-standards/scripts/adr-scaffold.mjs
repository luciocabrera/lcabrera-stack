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

const LEADING_COMMENT = /^\s*<!--[\s\S]*?-->\s*/;

const HEADING_LINE = /^#[ \t]*ADR-NNN[ \t]*—.*$/m;

export const pad = (number) => String(number).padStart(3, '0');

export const slugify = (title) =>
  title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');

export const adrFilename = (number, title) =>
  `ADR-${pad(number)}-${slugify(title)}.md`;

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
  return block === '' ? record : `${block}\n${record}`;
};

export const resolveHome = (homes, tier) =>
  homes.find((home) => home.tier === tier);
