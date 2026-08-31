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

const DECLARED_LABEL = /^Suppressed comments \((\d+)\)$/i;

const SUPPRESSION_WORD = /suppress/i;

const OVERVIEW_ANCHOR = /^#{1,6} +Pull request overview *$/im;
const DECLINED_ANCHOR = /Copilot wasn['’]t able to review/i;

const HEADING = /^\*\*([^\n*]+)\*\*$/m;
const PATH_AND_LINE = /^(.+):(\d+)$/;

const submittedAt = (review) => review?.submitted_at ?? review?.submittedAt;
const reviewId = (review) => review?.id ?? review?.databaseId;

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

const locationFrom = (heading) => {
  const match = PATH_AND_LINE.exec(heading);
  return match === null
    ? { line: undefined, path: heading }
    : { line: Number(match[2]), path: match[1] };
};

const FENCE = '```';

const fencedSource = (text, fence) => {
  const opened = fence === -1 ? -1 : text.indexOf('\n', fence + 1);
  if (opened === -1) {
    return undefined;
  }
  const closed = text.lastIndexOf(`\n${FENCE}`);
  const source = (
    closed <= opened ? text.slice(opened + 1) : text.slice(opened + 1, closed)
  ).trimEnd();
  return source === '' ? undefined : source;
};

const splitProse = (text) => {
  const fence = text.indexOf(`\n${FENCE}`);
  const prose = (fence === -1 ? text : text.slice(0, fence)).trim();
  return {
    snippet: fencedSource(text, fence),
    text: prose.startsWith('* ') ? prose.slice(2).trim() : prose,
  };
};

const KEEPS_ITS_LINES = new Set(['snippet']);

const singleLine = (value) => String(value).replaceAll(/\s+/gu, ' ').trim();

export const fromReviewBody = (fields) =>
  Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      typeof value === 'string' && !KEEPS_ITS_LINES.has(key)
        ? singleLine(value)
        : value,
    ]),
  );

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

const declaredCount = (label) => {
  const [, digits] = DECLARED_LABEL.exec(label) ?? [];

  return digits === undefined ? undefined : Number(digits);
};

export const parseSuppressedBlocks = (body) => {
  if (typeof body !== 'string') {
    return [];
  }

  const blocks = [];

  for (const section of summarySections(body)) {
    const declared = declaredCount(section.label);

    if (declared === undefined) {
      continue;
    }

    const close = body.indexOf(DETAILS_CLOSE, section.start);
    const end = close === -1 ? body.length : close;

    blocks.push({
      comments: commentsIn(body.slice(section.start, end)),
      declared,
      truncated: close === -1,
    });
  }

  return blocks;
};

export const unreadableLabels = (body) =>
  summarySections(typeof body === 'string' ? body : '')
    .filter(
      (section) =>
        SUPPRESSION_WORD.test(section.label) &&
        !DECLARED_LABEL.test(section.label),
    )
    .map((section) => section.label);

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
  const counted = blocks.flatMap((block, index) =>
    blockProblems(block, blocks.length > 1 ? `${at} block ${index + 1}` : at),
  );
  return [...labels, ...shape, ...counted].map(singleLine);
};

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

const suppressedState = ({ comments, problems, reviews }) => {
  if (problems.length > 0) {
    return 'unreadable';
  }
  if (reviews.length === 0) {
    return 'no-reviews';
  }
  return comments.length > 0 ? 'found' : 'none';
};

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
