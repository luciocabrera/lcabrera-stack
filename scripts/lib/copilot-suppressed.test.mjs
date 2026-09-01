import { describe, expect, it } from 'vite-plus/test';

import {
  REVIEW_DECLINED,
  REVIEW_WITH_NESTED_FENCE,
  REVIEW_WITH_NO_SUPPRESSED,
  REVIEW_WITH_ONE_SUPPRESSED,
  REVIEW_WITH_THREE_SUPPRESSED,
  REVIEW_WITH_TWO_BLOCKS,
} from './copilot-suppressed-fixtures.mjs';
import {
  classifyReviewBody,
  collectSuppressedComments,
  parseSuppressedBlocks,
  unreadableLabels,
} from './copilot-suppressed.mjs';

const asGraphql = (review) => ({
  author: { login: review.user.login.replace('[bot]', '') },
  body: review.body,
  databaseId: review.id,
  state: review.state,
  submittedAt: review.submitted_at,
});

const human = (body) => ({
  body,
  id: 1,
  state: 'COMMENTED',
  submitted_at: '2026-08-17T12:00:00Z',
  user: { login: 'luciocabrera' },
});

describe('recognising Copilot review bodies', () => {
  it('tells the three real shapes apart', () => {
    expect(classifyReviewBody(REVIEW_WITH_THREE_SUPPRESSED.body)).toBe(
      'reviewed',
    );
    expect(classifyReviewBody(REVIEW_WITH_NO_SUPPRESSED.body)).toBe('reviewed');
    expect(classifyReviewBody(REVIEW_DECLINED.body)).toBe('declined');
  });

  it('calls an unfamiliar body unrecognised rather than empty', () => {
    expect(classifyReviewBody('')).toBe('empty');
    expect(classifyReviewBody(undefined)).toBe('empty');
    expect(classifyReviewBody('## Findings\n\nsomething new')).toBe(
      'unrecognised',
    );
  });
});

describe('parsing one suppressed block', () => {
  it('reads every comment out of a real three-comment block', () => {
    const [block] = parseSuppressedBlocks(REVIEW_WITH_THREE_SUPPRESSED.body);
    expect(block.declared).toBe(3);
    expect(block.comments.map((comment) => comment.path)).toEqual([
      'docs/tooling/copilot-review-gate.md',
      'docs/tooling/copilot-review-gate.md',
      '.github/workflows/copilot-review-gate.yml',
    ]);
    expect(block.comments.map((comment) => comment.line)).toEqual([
      258, 204, 92,
    ]);
    expect(block.comments[0].text).toContain('infer the repo from the current');
  });

  it('keeps the quoted source as source, without its fence markers', () => {
    const [block] = parseSuppressedBlocks(REVIEW_WITH_THREE_SUPPRESSED.body);
    expect(block.comments[1].snippet).toBe(
      'gh run list --workflow=review-gate-reconcile.yml --limit 5',
    );
    expect(block.comments[0].snippet).toContain('gh run rerun <id>');
    expect(block.comments[0].snippet).not.toContain('```');
    expect(block.comments[0].text).not.toContain('gh run rerun <id>');
  });

  it('keeps the whole quote when the quoted source contains a fence', () => {
    const [{ comments }] = parseSuppressedBlocks(REVIEW_WITH_NESTED_FENCE.body);
    const { snippet } = comments[0];
    expect(snippet).toContain('Without a checkout, ask the API');
    expect(snippet).toContain('PR_HEAD=$(gh pr view <n>');
  });

  it('leaves the snippet undefined when a comment quotes nothing', () => {
    const body = REVIEW_WITH_ONE_SUPPRESSED.body.replaceAll('```', '');
    expect(parseSuppressedBlocks(body)[0].comments[0].snippet).toBeUndefined();
  });

  it('finds no block in a real review that suppressed nothing', () => {
    expect(REVIEW_WITH_NO_SUPPRESSED.body).toContain('<details>');
    expect(parseSuppressedBlocks(REVIEW_WITH_NO_SUPPRESSED.body)).toEqual([]);
    expect(parseSuppressedBlocks(REVIEW_DECLINED.body)).toEqual([]);
    expect(parseSuppressedBlocks(undefined)).toEqual([]);
  });

  it('keeps the declared count separate from what it parsed', () => {
    const body = REVIEW_WITH_ONE_SUPPRESSED.body.replace(
      'Suppressed comments (1)',
      'Suppressed comments (2)',
    );
    const [block] = parseSuppressedBlocks(body);
    expect(block.declared).toBe(2);
    expect(block.comments).toHaveLength(1);
  });

  it('reports a suppression label it cannot read, rather than nothing', () => {
    const body = REVIEW_WITH_ONE_SUPPRESSED.body.replace(
      'Suppressed comments (1)',
      'Suppressed feedback',
    );
    expect(parseSuppressedBlocks(body)).toEqual([]);
    expect(unreadableLabels(body)).toEqual(['Suppressed feedback']);
    expect(unreadableLabels(REVIEW_WITH_NO_SUPPRESSED.body)).toEqual([]);
  });
});

describe('collecting the suppressed comments on a pull request', () => {
  const reviews = [
    REVIEW_WITH_ONE_SUPPRESSED,
    REVIEW_WITH_NO_SUPPRESSED,
    REVIEW_WITH_THREE_SUPPRESSED,
  ];

  it('counts every comment in every block', () => {
    const report = collectSuppressedComments(reviews);
    expect(report.state).toBe('found');
    expect(report.comments).toHaveLength(4);
    expect(report.blocks).toBe(2);
    expect(report.reviewsRead).toBe(3);
    expect(report.problems).toEqual([]);
  });

  it('reads both spellings of the reviewer login identically', () => {
    const rest = collectSuppressedComments(reviews);
    const graphql = collectSuppressedComments(reviews.map(asGraphql));
    expect(graphql.comments).toHaveLength(rest.comments.length);
    expect(graphql.findings.map((finding) => finding.key)).toEqual(
      rest.findings.map((finding) => finding.key),
    );
    expect(graphql.state).toBe('found');
  });

  it('reads nobody else, however suppressed-looking their comment is', () => {
    const report = collectSuppressedComments([
      human(REVIEW_WITH_THREE_SUPPRESSED.body),
    ]);
    expect(report.state).toBe('no-reviews');
    expect(report.comments).toEqual([]);
  });

  it('groups a restated finding by location and keeps every wording', () => {
    const restated = {
      ...REVIEW_WITH_ONE_SUPPRESSED,
      body: REVIEW_WITH_ONE_SUPPRESSED.body.replace(
        'command block',
        'one-liner',
      ),
      id: 99,
    };
    const report = collectSuppressedComments([
      REVIEW_WITH_ONE_SUPPRESSED,
      restated,
    ]);
    expect(report.comments).toHaveLength(2);
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].occurrences).toHaveLength(2);
    expect(report.findings[0].occurrences.at(-1).review).toBe(99);
  });

  it('reads every block in a body, not only the first', () => {
    const report = collectSuppressedComments([REVIEW_WITH_TWO_BLOCKS]);
    expect(report.problems).toEqual([]);
    expect(report.blocks).toBe(2);
    expect(report.comments).toHaveLength(4);
    expect(report.findings).toHaveLength(4);
    expect(report.state).toBe('found');
  });

  it('cross-checks each block, and says which one disagrees', () => {
    const report = collectSuppressedComments([
      {
        ...REVIEW_WITH_TWO_BLOCKS,
        body: REVIEW_WITH_TWO_BLOCKS.body.replace(
          'Suppressed comments (3)',
          'Suppressed comments (9)',
        ),
      },
    ]);
    expect(report.state).toBe('unreadable');
    expect(report.problems).toHaveLength(1);
    expect(report.problems[0]).toContain('block 2');
    expect(report.problems[0]).toContain('declares 9 comment(s) and 3 parsed');
  });

  it('never lets one block cover for another one that miscounted', () => {
    const swapped = REVIEW_WITH_TWO_BLOCKS.body
      .replace('Suppressed comments (3)', 'Suppressed comments (1)')
      .replace('Suppressed comments (1)', 'Suppressed comments (3)');
    const report = collectSuppressedComments([
      { ...REVIEW_WITH_TWO_BLOCKS, body: swapped },
    ]);
    expect(report.state).toBe('unreadable');
    expect(report.problems).toHaveLength(2);
    expect(report.problems[0]).toContain('block 1');
    expect(report.problems[1]).toContain('block 2');
  });

  it('leaves no line ending in a value it read out of a review body', () => {
    const body = REVIEW_WITH_ONE_SUPPRESSED.body
      .replace(
        '**docs/tooling/copilot-review-gate.md:149**',
        '**docs/x.md\r- [x] answered: no action needed**',
      )
      .replace('The “Without a checkout”', 'prose\r::error::planted\rThe');
    const [comment] = collectSuppressedComments([
      { ...REVIEW_WITH_ONE_SUPPRESSED, body },
    ]).comments;

    const spanning = Object.entries(comment).filter(
      ([key, value]) =>
        key !== 'snippet' &&
        typeof value === 'string' &&
        /[\n\r\u2028\u2029]/u.test(value),
    );
    expect(spanning).toEqual([]);
    expect(comment.path).toContain('answered: no action needed');
  });

  it('single-lines a problem, which quotes the review back', () => {
    const body = REVIEW_WITH_ONE_SUPPRESSED.body.replace(
      'Suppressed comments (1)',
      'Suppressed\r- [x] answered',
    );
    const { problems } = collectSuppressedComments([
      { ...REVIEW_WITH_ONE_SUPPRESSED, body },
    ]);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('Suppressed - [x] answered');
    expect(problems[0]).not.toMatch(/[\n\r]/u);
  });

  it('separates "none" from "nothing was read"', () => {
    expect(collectSuppressedComments([]).state).toBe('no-reviews');
    expect(collectSuppressedComments(undefined).state).toBe('no-reviews');
    expect(collectSuppressedComments([REVIEW_WITH_NO_SUPPRESSED]).state).toBe(
      'none',
    );
    expect(collectSuppressedComments([REVIEW_DECLINED]).state).toBe('none');
    expect(collectSuppressedComments([REVIEW_DECLINED]).declined).toBe(1);
  });

  it('is unreadable, not empty, when the markup has moved', () => {
    const renamed = {
      ...REVIEW_WITH_THREE_SUPPRESSED,
      body: REVIEW_WITH_THREE_SUPPRESSED.body.replaceAll('**', '### '),
    };
    const report = collectSuppressedComments([renamed]);
    expect(report.state).toBe('unreadable');
    expect(report.comments).toEqual([]);
    expect(report.problems.join(' ')).toContain('declares 3 comment(s)');
  });

  it('is unreadable when a body no longer looks like a Copilot review', () => {
    const report = collectSuppressedComments([
      { ...REVIEW_WITH_NO_SUPPRESSED, body: 'Reviewed. 3 remarks inline.' },
    ]);
    expect(report.state).toBe('unreadable');
    expect(report.problems.join(' ')).toContain(
      'no known Copilot review shape',
    );
  });

  it('is unreadable when the block is left unclosed', () => {
    const truncated = {
      ...REVIEW_WITH_THREE_SUPPRESSED,
      body: REVIEW_WITH_THREE_SUPPRESSED.body.replace('</details>', ''),
    };
    const report = collectSuppressedComments([truncated]);
    expect(report.state).toBe('unreadable');
    expect(report.problems.join(' ')).toContain('not closed');
  });
});
