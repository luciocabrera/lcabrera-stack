/**
 * Finding the agent-review verdict on a pull request.
 *
 * The verdict is a JSON document (`docs/agents/agent-review-contract.md` §2), and
 * it reaches CI as an ordinary timeline comment. Discovery has to be
 * deterministic or the gate reads whichever comment it happened to like: the
 * transport therefore reuses the shape §6 already established for an override —
 * a first line that is exactly a marker plus the head SHA — so a verdict is
 * located by its first line, never by grepping prose.
 *
 * Two rules here are load-bearing rather than tidy:
 *   - a marker naming any other commit is history (§2.5), so it does not answer
 *     for this head and the pull request reads as unreviewed;
 *   - two verdicts for one head is a contract breach (§7.5 forbids re-reviewing
 *     an unchanged commit), and picking "the newest" would let a `pass` be
 *     appended after a `fail`.
 *
 * Governed by .claude/rules/scripts.md.
 */

/** The first line of a verdict comment, before the head SHA. */
/**
 * Comment bodies above this are refused rather than parsed. The verdict is
 * untrusted input from a pull request comment, and a size cap is the one
 * defence that does not depend on the parser being well behaved.
 */
export const MAX_VERDICT_BODY_BYTES = 65_536;

const MARKER_LINE = /^Agent-review verdict: ([0-9a-f]{40})$/;

const FENCE = '```';
const OPENING_FENCE = `${FENCE}json`;

export const markerSha = (body) => {
  if (typeof body !== 'string') {
    return undefined;
  }
  const end = body.indexOf('\n');
  const firstLine = (end === -1 ? body : body.slice(0, end)).trim();
  return MARKER_LINE.exec(firstLine)?.[1];
};

export const jsonBlock = (body) => {
  const lines = body.split('\n');
  const open = lines.findIndex((line) => line.trim() === OPENING_FENCE);
  if (open === -1) {
    return undefined;
  }
  const close = lines.findIndex(
    (line, index) => index > open && line.trim() === FENCE,
  );
  return close === -1 ? undefined : lines.slice(open + 1, close).join('\n');
};

export const verdictComments = (comments) =>
  comments
    .map((comment) => ({ comment, sha: markerSha(comment?.body) }))
    .filter((entry) => entry.sha !== undefined);

export const selectVerdictComment = (comments, headSha) => {
  const candidates = verdictComments(comments);
  if (candidates.length === 0) {
    return { outcome: 'none' };
  }
  const forHead = candidates.filter((entry) => entry.sha === headSha);
  if (forHead.length === 0) {
    return { outcome: 'stale', otherSha: candidates.at(-1).sha };
  }
  if (forHead.length > 1) {
    return { outcome: 'duplicate', count: forHead.length };
  }
  return { outcome: 'one', entry: forHead[0] };
};

export const readVerdictDocument = (body) => {
  if (Buffer.byteLength(body, 'utf8') > MAX_VERDICT_BODY_BYTES) {
    return {
      errors: [
        `the verdict comment is larger than the ${MAX_VERDICT_BODY_BYTES}-byte cap`,
      ],
    };
  }
  const block = jsonBlock(body);
  if (block === undefined) {
    return {
      errors: ['the verdict comment carries no fenced `json` block'],
    };
  }
  try {
    const document = JSON.parse(block);
    if (
      document === null ||
      typeof document !== 'object' ||
      Array.isArray(document)
    ) {
      return { errors: ['the verdict is not a JSON object'] };
    }
    return { document };
  } catch (error) {
    return { errors: [`the verdict is not parseable JSON: ${error.message}`] };
  }
};
