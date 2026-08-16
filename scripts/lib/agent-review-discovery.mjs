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

/**
 * The whole of the transport: a first line that is exactly this marker and the
 * head SHA. Anchored, single-line, no alternation — nothing here can backtrack.
 */
const MARKER_LINE = /^Agent-review verdict: ([0-9a-f]{40})$/;

const FENCE = '```';
const OPENING_FENCE = `${FENCE}json`;

/**
 * The head SHA a comment claims to be a verdict for, or `undefined` when its
 * first line is not the marker. (pure)
 */
export const markerSha = (body) => {
  if (typeof body !== 'string') {
    return undefined;
  }
  const end = body.indexOf('\n');
  const firstLine = (end === -1 ? body : body.slice(0, end)).trim();
  return MARKER_LINE.exec(firstLine)?.[1];
};

/**
 * The contents of the first fenced `json` block, or `undefined`.
 *
 * **Both fences are whole lines**, and that is the correctness of this function
 * rather than a nicety. Matched as substrings instead, an opening ```` ```jsonc ````
 * is accepted — `'```jsonc'` starts with `'```json'` — and its contents are then
 * parsed as JSON; and the closer is the first ```` ``` `` anywhere after the
 * content, so a verdict whose `summary` quotes a code fence truncates its own
 * document. Both yield `error` rather than a false pass, so neither is a hole —
 * they are false positives, and a reviewer whose honest verdict is rejected
 * because its prose contained a backtick is how a gate like this stops being
 * read (#697 §3).
 *
 * A JSON string cannot contain a raw newline, so a fence quoted inside the
 * document can never be alone on a line — which is why matching whole lines
 * settles that case completely rather than narrowing it.
 *
 * Still no regex: the delimiter hunt written as one is the classic backtracking
 * shape (Sonar S8786), and this is attacker-influenced text. (pure)
 */
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

/**
 * Every comment whose first line is the marker, in the order given, each paired
 * with the head SHA it names. (pure)
 */
export const verdictComments = (comments) =>
  comments
    .map((comment) => ({ comment, sha: markerSha(comment?.body) }))
    .filter((entry) => entry.sha !== undefined);

/**
 * Which verdict comment answers for `headSha`.
 *
 * `outcome` is one of:
 *   - `none`     — nothing on the pull request carries the marker
 *   - `stale`    — markers exist, none names this head (§2.5: history, not a
 *                  verdict), carrying the newest other SHA for the report
 *   - `duplicate`— more than one names this head
 *   - `one`      — exactly one, returned as `entry`
 * (pure)
 */
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

/**
 * The verdict document carried by a comment body, or the reasons it carries
 * none. Implements §2.4 step 1 — existence and parseability — and the size cap
 * §7's security note asks for. (pure)
 */
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
