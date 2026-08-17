/**
 * Copilot review bodies, captured verbatim from this repository.
 *
 * Nothing here is hand-written: the markup is GitHub's, and a fixture someone
 * tidied would teach the parser a format that never existed. They live in a
 * sibling JSON file rather than as string literals so that "verbatim" survives —
 * a real body carries backticks, fenced code and Actions expressions, and none
 * of that has to be escaped or avoided to sit in a data file.
 *
 * Frozen bodies cannot notice the format moving, which is why the parser also
 * self-checks against the count GitHub declares — that check runs on live bodies
 * every time the gate does. Re-capture one with the command in
 * docs/tooling/copilot-review-gate.md; each body's provenance is in the JSON.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync } from 'node:fs';

const BODIES = JSON.parse(
  readFileSync(
    new URL('./copilot-suppressed-fixtures.json', import.meta.url),
    'utf8',
  ),
);

/** A captured body as the REST reviews endpoint returns it. */
const asRestReview = ({ body, id, login, submittedAt }) => ({
  body,
  id,
  state: 'COMMENTED',
  submitted_at: submittedAt,
  user: { login },
});

/** Three suppressed comments — two in one file, one in another. */
export const REVIEW_WITH_THREE_SUPPRESSED = asRestReview(
  BODIES.withThreeSuppressed,
);

/** One suppressed comment, in the shortest body that carries a block. */
export const REVIEW_WITH_ONE_SUPPRESSED = asRestReview(
  BODIES.withOneSuppressed,
);

/** A full review with a collapsed section of its own and no suppressed block. */
export const REVIEW_WITH_NO_SUPPRESSED = asRestReview(BODIES.withNoSuppressed);

/** Copilot refusing the review outright — no template, and no findings. */
export const REVIEW_DECLINED = asRestReview(BODIES.declined);
