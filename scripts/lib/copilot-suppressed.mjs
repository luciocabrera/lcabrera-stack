/**
 * Reads Copilot's suppressed review comments out of a pull request's reviews.
 *
 * Why this exists: `required_review_thread_resolution` sees review THREADS, and
 * Copilot files its low-confidence findings in the review BODY instead, inside a
 * collapsed "Suppressed comments" block that never becomes a thread. Nothing
 * read them, so a pull request reached the merge bar clean while carrying
 * unanswered findings — several of them real defects (#750).
 *
 * A count of zero is the output this is designed against, because a wrong login
 * spelling, changed markup or an API shape shift all produce it and it reads as
 * "nothing to see". So this returns a STATE rather than a number — `no-reviews`,
 * `none`, `found` and `unreadable` are four different answers — and every parse
 * is cross-checked against the count GitHub itself declares in the block's
 * summary, which is the check that survives the markup moving.
 *
 * Rendering is `./copilot-suppressed-report.mjs`, the I/O shell is
 * `scripts/copilot-suppressed-comments.mjs`, and the behaviour is documented in
 * docs/tooling/copilot-review-gate.md.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { isCopilotReviewer, reviewerLogin } from './copilot-review.mjs';

const SUMMARY_OPEN = '<summary>';
const SUMMARY_CLOSE = '</summary>';
const DETAILS_CLOSE = '</details>';

/** The block label, with the count GitHub declares — the parser's own check. */
const DECLARED_LABEL = /^Suppressed comments \((\d+)\)$/i;

/** Anything else about suppression: a label that moved, not a block we can read. */
const SUPPRESSION_WORD = /suppress/i;

/** The two Copilot review bodies seen here, each recognised by its own anchor. */
const OVERVIEW_ANCHOR = /^#{1,6} +Pull request overview *$/im;
const DECLINED_ANCHOR = /Copilot wasn['’]t able to review/i;

/** One suppressed comment's heading: the file, and usually a line within it. */
const HEADING = /^\*\*([^\n*]+)\*\*$/m;
const PATH_AND_LINE = /^(.+):(\d+)$/;

const submittedAt = (review) => review?.submitted_at ?? review?.submittedAt;
const reviewId = (review) => review?.id ?? review?.databaseId;

/**
 * Every `<summary>` in a body, with the offset its block starts at.
 *
 * Scanned with `indexOf` rather than a lazy `<summary>(.*?)</summary>` regex:
 * that shape is the backtracking one Sonar S8786 rejects, and a review body is
 * attacker-adjacent text — it quotes the diff.
 */
const summarySections = (body) => {
  const sections = [];
  let open = body.indexOf(SUMMARY_OPEN);
  while (open !== -1) {
    const close = body.indexOf(SUMMARY_CLOSE, open);
    if (close === -1) {
      break;
    }
    const start = close + SUMMARY_CLOSE.length;
    sections.push({
      label: body.slice(open + SUMMARY_OPEN.length, close).trim(),
      start,
    });
    open = body.indexOf(SUMMARY_OPEN, start);
  }
  return sections;
};

/** A heading's file path and line, tolerating a file-level comment with no line. */
const locationFrom = (heading) => {
  const match = PATH_AND_LINE.exec(heading);
  return match === null
    ? { line: undefined, path: heading }
    : { line: Number(match[2]), path: match[1] };
};

/** Copilot quotes the source under a suppressed comment, in a fenced block. */
const FENCE = '```';

/**
 * The quoted source, without its fence markers, or `undefined` when the comment
 * carries none.
 *
 * Stored as the source rather than as the markup around it because both
 * renderers in `./copilot-suppressed-report.mjs` print it, and what a reader
 * does with it is search the file for it: the line number in the heading is the
 * one Copilot saw, on a commit the pull request has usually moved past, and the
 * quoted text survives that where a number does not.
 */
const fencedSource = (text, fence) => {
  const opened = fence === -1 ? -1 : text.indexOf('\n', fence + 1);
  if (opened === -1) {
    return undefined;
  }
  // The LAST fence closes it, not the next one. Copilot quotes the source
  // verbatim, so quoting a fenced example nests a fence inside the block and
  // leaves it unbalanced — measured on #740, one comment in ten. Closing at the
  // next fence drops the rest of the quote, which is where the flagged line
  // usually is; closing at the last one costs nothing, because a suppressed
  // comment ends with its quote (no comment in that sample carries prose after
  // it).
  const closed = text.lastIndexOf(`\n${FENCE}`);
  const source = (
    closed <= opened ? text.slice(opened + 1) : text.slice(opened + 1, closed)
  ).trimEnd();
  return source === '' ? undefined : source;
};

/** One suppressed comment's prose, and the source quoted under it, apart. */
const splitProse = (text) => {
  const fence = text.indexOf(`\n${FENCE}`);
  const prose = (fence === -1 ? text : text.slice(0, fence)).trim();
  return {
    snippet: fencedSource(text, fence),
    text: prose.startsWith('* ') ? prose.slice(2).trim() : prose,
  };
};

/**
 * The comments in one block.
 *
 * `String.split` on a capturing pattern yields `[before, heading, body, …]`, so
 * the odd positions are the headings and each is followed by its own text. A
 * heading the markup no longer produces therefore parses as zero comments, which
 * the declared count then contradicts rather than letting it pass as none.
 */
const commentsIn = (block) => {
  const parts = block.split(HEADING);
  return parts
    .map((part, index) =>
      index % 2 === 1
        ? {
            ...locationFrom(part.trim()),
            ...splitProse(parts[index + 1] ?? ''),
          }
        : undefined,
    )
    .filter((comment) => comment !== undefined);
};

/** Which of Copilot's review-body shapes this is — `unrecognised` is a problem. */
export const classifyReviewBody = (body) => {
  const text = typeof body === 'string' ? body.trim() : '';
  if (text === '') {
    return 'empty';
  }
  if (OVERVIEW_ANCHOR.test(text)) {
    return 'reviewed';
  }
  return DECLINED_ANCHOR.test(text) ? 'declined' : 'unrecognised';
};

/**
 * The suppressed-comment block in one review body, or `undefined`.
 *
 * `declared` is GitHub's own count and `comments` is what this parsed; the
 * caller compares them. They are returned separately on purpose — reconciling
 * them here would let the parser report the number it was told rather than the
 * one it found.
 */
export const parseSuppressedBlock = (body) => {
  if (typeof body !== 'string') {
    return undefined;
  }
  const sections = summarySections(body);
  const section = sections.find((entry) => DECLARED_LABEL.test(entry.label));
  if (section === undefined) {
    return undefined;
  }
  const end = body.indexOf(DETAILS_CLOSE, section.start);
  const block = body.slice(section.start, end === -1 ? undefined : end);
  return {
    comments: commentsIn(block),
    declared: Number(DECLARED_LABEL.exec(section.label)?.[1]),
    truncated: end === -1,
  };
};

/** Labels that talk about suppression in a shape this cannot read. */
export const unreadableLabels = (body) =>
  summarySections(typeof body === 'string' ? body : '')
    .filter(
      (section) =>
        SUPPRESSION_WORD.test(section.label) &&
        !DECLARED_LABEL.test(section.label),
    )
    .map((section) => section.label);

const problemsIn = ({ block, body, id }) => {
  const at = `review ${id ?? '(unknown)'}`;
  const labels = unreadableLabels(body).map(
    (label) =>
      `${at}: a block labelled "${label}" is about suppression and did not parse`,
  );
  const shape =
    classifyReviewBody(body) === 'unrecognised'
      ? [
          `${at}: the body matches no known Copilot review shape, so it was not read`,
        ]
      : [];
  if (block === undefined) {
    return [...labels, ...shape];
  }
  const counted =
    block.declared === block.comments.length
      ? []
      : [
          `${at}: the block declares ${block.declared} comment(s) and ${block.comments.length} parsed`,
        ];
  const cut = block.truncated
    ? [`${at}: the suppressed block is not closed, so it may be incomplete`]
    : [];
  return [...labels, ...shape, ...counted, ...cut];
};

/** One finding per location; Copilot restates the same one across re-reviews. */
const groupByLocation = (comments) =>
  [
    ...comments.reduce((found, comment) => {
      const key = `${comment.path}:${comment.line ?? ''}`;
      const seen = found.get(key) ?? {
        line: comment.line,
        occurrences: [],
        path: comment.path,
      };
      found.set(key, { ...seen, occurrences: [...seen.occurrences, comment] });
      return found;
    }, new Map()),
  ].map(([key, finding]) => ({ ...finding, key }));

/**
 * The four answers, ordered so a partial read can never report a clean count.
 *
 * `unreadable` outranks everything: a parser that matched nothing and a pull
 * request with nothing to match produce the same zero, and only one of them is
 * an answer.
 */
const suppressedState = ({ comments, problems, reviews }) => {
  if (problems.length > 0) {
    return 'unreadable';
  }
  if (reviews.length === 0) {
    return 'no-reviews';
  }
  return comments.length > 0 ? 'found' : 'none';
};

/**
 * Every suppressed comment Copilot filed on one pull request.
 *
 * Both login spellings are accepted through `isCopilotReviewer` — REST says
 * `…[bot]` and GraphQL does not, and a filter written for one silently reads
 * zero on the other.
 *
 * Every Copilot review counts here whatever its state, which is deliberately the
 * opposite of the whitelist `decideReviewStatus` applies. There, an unfamiliar
 * state must not count as a review, because an absent verdict has to block; here
 * it must not hide a finding, because this reports rather than blocks.
 */
export const collectSuppressedComments = (reviews = []) => {
  const mine = (Array.isArray(reviews) ? reviews : []).filter((review) =>
    isCopilotReviewer(reviewerLogin(review)),
  );
  const read = mine.map((review) => {
    const body = review?.body;
    const block = parseSuppressedBlock(body);
    const id = reviewId(review);
    return {
      block,
      comments: (block?.comments ?? []).map((comment) => ({
        ...comment,
        review: id,
        submittedAt: submittedAt(review),
      })),
      problems: problemsIn({ block, body, id }),
      shape: classifyReviewBody(body),
    };
  });

  const comments = read.flatMap((entry) => entry.comments);
  const problems = read.flatMap((entry) => entry.problems);
  return {
    blocks: read.filter((entry) => entry.block !== undefined).length,
    comments,
    declined: read.filter((entry) => entry.shape === 'declined').length,
    findings: groupByLocation(comments),
    problems,
    reviewsRead: read.length,
    state: suppressedState({ comments, problems, reviews: read }),
  };
};
