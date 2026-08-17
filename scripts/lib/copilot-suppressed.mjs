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
  // leaves it unbalanced; closing at the next fence drops the rest of the quote,
  // which is where the flagged line usually is. Closing at the last one costs
  // nothing while a suppressed comment ends with its quote — re-check either
  // half against real bodies with the review read in
  // docs/tooling/copilot-review-gate.md.
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
 * Everything a review contributes, and what makes each of them safe to render.
 *
 * The renderers' guards all rest on one property — a value cannot begin a line —
 * and it is established HERE, once, rather than at each place a value is
 * printed. Guarding per field is what let three of them escape in turn: the
 * quoted snippet, then prose's line endings, then the finding's own path, each
 * fixed where it was found while the next one waited.
 *
 * | Value                   | Comes from          | What makes it safe           |
 * | ----------------------- | ------------------- | ---------------------------- |
 * | `path`, `text`          | the review body     | single-lined below           |
 * | `review`, `submittedAt` | the reviews API     | single-lined below           |
 * | `line`, `declared`      | a digits-only match | cannot hold anything else    |
 * | a block's summary label | the review body     | single-lined into `problems` |
 * | `snippet`               | the review body     | THE exception — see below    |
 *
 * `snippet` is quoted source and its line breaks are the point, so it is the one
 * value that keeps them — and the renderers earn that by transforming every one
 * of its lines. Adding a key to `KEEPS_ITS_LINES` is therefore a decision to
 * guard that value at every render site, not a formatting preference.
 */
const KEEPS_ITS_LINES = new Set(['snippet']);

/**
 * One value with no line ending left in it. `\s` covers every terminator a
 * consumer might split on — CR, LF, CRLF and the Unicode ones — so what comes
 * out cannot begin a line anywhere.
 */
const singleLine = (value) => String(value).replaceAll(/\s+/gu, ' ').trim();

/**
 * A record of values a review contributed, each single-lined unless it is the
 * declared exception. A field added later is covered by having been passed
 * through here, which is the point — so build these records nowhere else.
 */
export const fromReviewBody = (fields) =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      typeof value === 'string' && !KEEPS_ITS_LINES.has(key)
        ? singleLine(value)
        : value,
    ]),
  );

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
        ? fromReviewBody({
            ...locationFrom(part.trim()),
            ...splitProse(parts[index + 1] ?? ''),
          })
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
 * Every suppressed-comment block in one review body, in the order they appear.
 *
 * `declared` is GitHub's own count and `comments` is what this parsed; the
 * caller compares them. They are returned separately on purpose — reconciling
 * them here would let the parser report the number it was told rather than the
 * one it found.
 *
 * **Every block, not the first one that matches.** Bodies with two are not a
 * shape GitHub emits today, and that is not a property this can rely on: taking
 * the first would drop the rest silently, and no check here would notice,
 * because each block's declared count agrees with its own parse. A confident
 * undercount is the exact answer this module exists to refuse.
 */
/**
 * The count a block's own label declares, or `undefined` when the label is not
 * one of those.
 *
 * Parsed once. `test` to select and `exec` to read runs the same match twice,
 * and the second result reads as possibly-absent even where the first has just
 * proved it is not — so the count it produces is `NaN` for a compiler and a
 * number in fact. Selecting on this instead keeps the two answers the same one.
 */
const declaredCount = (label) => {
  const [, digits] = DECLARED_LABEL.exec(label) ?? [];

  return digits === undefined ? undefined : Number(digits);
};

export const parseSuppressedBlocks = (body) => {
  if (typeof body !== 'string') {
    return [];
  }

  return summarySections(body)
    .map((section) => ({ declared: declaredCount(section.label), section }))
    .filter(({ declared }) => declared !== undefined)
    .map(({ declared, section }) => {
      const end = body.indexOf(DETAILS_CLOSE, section.start);

      return {
        comments: commentsIn(
          body.slice(section.start, end === -1 ? undefined : end),
        ),
        declared,
        truncated: end === -1,
      };
    });
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

/** What one block cannot account for, named so the reader knows which block. */
const blockProblems = (block, at) => [
  ...(block.declared === block.comments.length
    ? []
    : [
        `${at}: the block declares ${block.declared} comment(s) and ${block.comments.length} parsed`,
      ]),
  ...(block.truncated
    ? [`${at}: the suppressed block is not closed, so it may be incomplete`]
    : []),
];

const problemsIn = ({ blocks, body, id }) => {
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
  // Numbered only when there is more than one, so the usual message stays the
  // one people have read before, and an unusual body says which half is wrong.
  const counted = blocks.flatMap((block, index) =>
    blockProblems(block, blocks.length > 1 ? `${at} block ${index + 1}` : at),
  );
  // Single-lined here rather than at each template above: a problem quotes a
  // block's summary label, which is the review's text, and the next message
  // someone adds will quote something too. The label itself is left raw for the
  // matching above — normalising before classification would let a label broken
  // across lines match the shape this is meant to notice.
  return [...labels, ...shape, ...counted].map(singleLine);
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
    const blocks = parseSuppressedBlocks(body);
    const id = reviewId(review);
    return {
      blocks,
      comments: blocks.flatMap((block) =>
        block.comments.map((comment) =>
          // Through the same door as the body's own values: an id and a
          // timestamp are the API's, not this repository's, and a renderer
          // cannot tell which of a comment's fields came from where.
          fromReviewBody({
            ...comment,
            review: id,
            submittedAt: submittedAt(review),
          }),
        ),
      ),
      problems: problemsIn({ blocks, body, id }),
      shape: classifyReviewBody(body),
    };
  });

  const comments = read.flatMap((entry) => entry.comments);
  const problems = read.flatMap((entry) => entry.problems);
  return {
    blocks: read.flatMap((entry) => entry.blocks).length,
    comments,
    declined: read.filter((entry) => entry.shape === 'declined').length,
    findings: groupByLocation(comments),
    problems,
    reviewsRead: read.length,
    state: suppressedState({ comments, problems, reviews: read }),
  };
};
