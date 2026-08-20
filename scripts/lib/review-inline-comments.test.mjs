import { describe, expect, it } from 'vite-plus/test';

import { diffIndex } from './agent-review-diff.mjs';
import {
  bodyWithNote,
  bodyWithUnanchored,
  partitionFindings,
  reviewPayload,
} from './review-inline-comments.mjs';

// Adds new-file lines 2 and 3 in src/a.ts; src/big.ts changed but GitHub withheld
// its patch, which is the case that must fail closed rather than anchor blindly.
const FILES = [
  {
    filename: 'src/a.ts',
    patch: ['@@ -1,3 +1,4 @@', ' one', '+two', '+three', ' four'].join('\n'),
  },
  { changes: 40, filename: 'src/big.ts' },
];

const INDEX = diffIndex(FILES);

const finding = (over = {}) => ({
  body: 'this is wrong',
  line: 2,
  path: 'src/a.ts',
  ...over,
});

describe('partitionFindings', () => {
  it('anchors a finding on a line the diff added', () => {
    const { anchored, unanchored } = partitionFindings([finding()], INDEX);
    expect(unanchored).toHaveLength(0);
    expect(anchored).toEqual([
      { body: 'this is wrong', line: 2, path: 'src/a.ts', side: 'RIGHT' },
    ]);
  });

  // The whole reason this module exists: the API rejects the entire review over
  // one bad line, so a line the diff did not add must never reach it. Deleting
  // the isAddedLine check makes this fail.
  it('refuses a line the diff did not add', () => {
    const { anchored, unanchored } = partitionFindings(
      [finding({ line: 4 })],
      INDEX,
    );
    expect(anchored).toHaveLength(0);
    expect(unanchored[0].reason).toContain('not a line this diff added');
  });

  it('refuses a line in a file whose patch GitHub withheld', () => {
    const { anchored, unanchored } = partitionFindings(
      [finding({ line: 3, path: 'src/big.ts' })],
      INDEX,
    );
    expect(anchored).toHaveLength(0);
    expect(unanchored[0].reason).toContain('withheld the patch');
  });

  it('refuses a file the diff never mentions', () => {
    const { anchored } = partitionFindings(
      [finding({ path: 'src/absent.ts' })],
      INDEX,
    );
    expect(anchored).toHaveLength(0);
  });

  it.each([
    ['not an object', 'nope', 'not an object'],
    ['no path', finding({ path: '' }), 'names no file'],
    ['no body', finding({ body: '   ' }), 'no comment text'],
    ['no line', finding({ line: undefined }), 'names no line'],
    ['a line below one', finding({ line: 0 }), 'names no line'],
    ['a non-integer line', finding({ line: 2.5 }), 'names no line'],
  ])('refuses %s', (_label, bad, reason) => {
    const { anchored, unanchored } = partitionFindings([bad], INDEX);
    expect(anchored).toHaveLength(0);
    expect(unanchored[0].reason).toContain(reason);
  });

  it('moves comments past the API cap into the body rather than cutting them', () => {
    const many = Array.from({ length: 102 }, () => finding());
    const { anchored, unanchored } = partitionFindings(many, INDEX);
    expect(anchored).toHaveLength(100);
    expect(unanchored).toHaveLength(2);
    expect(unanchored[0].reason).toContain('the most the API accepts');
  });

  it('treats a missing findings array as no findings', () => {
    expect(partitionFindings(undefined, INDEX)).toEqual({
      anchored: [],
      unanchored: [],
    });
  });
});

describe('bodyWithUnanchored', () => {
  it('leaves the body alone when everything anchored', () => {
    expect(bodyWithUnanchored('summary', [])).toBe('summary');
  });

  it('appends an unanchored finding with its reason and its text', () => {
    const out = bodyWithUnanchored('summary', [
      { finding: finding({ line: 9 }), reason: 'line 9 is not in the diff' },
    ]);
    expect(out).toContain('summary');
    expect(out).toContain('`src/a.ts` line 9');
    expect(out).toContain('line 9 is not in the diff');
    expect(out).toContain('this is wrong');
  });

  // A reader's first question about a finding is whether it holds the merge, and
  // for these the answer differs from the inline ones on the same review.
  it('says these findings hold nothing', () => {
    const out = bodyWithUnanchored('summary', [
      { finding: finding(), reason: 'whatever' },
    ]);
    expect(out).toContain('hold no merge');
  });

  it('survives a finding carrying no usable text', () => {
    const out = bodyWithUnanchored('summary', [
      { finding: { path: '' }, reason: 'it names no file' },
    ]);
    expect(out).toContain('an unnamed location');
    expect(out).toContain('carried no text');
  });
});

describe('reviewPayload', () => {
  it('submits COMMENT, never APPROVE or REQUEST_CHANGES', () => {
    const { payload } = reviewPayload({
      body: 'summary',
      commitSha: 'a'.repeat(40),
      findings: [finding()],
      index: INDEX,
    });
    expect(payload.event).toBe('COMMENT');
    expect(payload.commit_id).toBe('a'.repeat(40));
  });

  it('carries the anchored findings as comments and reports the split', () => {
    const { payload, stats } = reviewPayload({
      body: 'summary',
      commitSha: 'b'.repeat(40),
      findings: [finding(), finding({ line: 99 })],
      index: INDEX,
    });
    expect(payload.comments).toHaveLength(1);
    expect(stats).toEqual({ anchored: 1, unanchored: 1 });
    expect(payload.body).toContain('could not be anchored');
  });

  it('posts a clean review with no comments and an untouched body', () => {
    const { payload, stats } = reviewPayload({
      body: 'Nothing to flag.',
      commitSha: 'c'.repeat(40),
      findings: [],
      index: INDEX,
    });
    expect(payload.comments).toEqual([]);
    expect(payload.body).toBe('Nothing to flag.');
    expect(stats).toEqual({ anchored: 0, unanchored: 0 });
  });
});

describe('bodyWithNote', () => {
  it('leaves the body alone when the findings file was read', () => {
    expect(bodyWithNote('summary', undefined)).toBe('summary');
  });

  // The failure this exists for: without the note, a review whose findings file
  // was lost is a summary paragraph, which reads exactly like a clean review.
  it('leads with the note so the summary is read in its light', () => {
    const out = bodyWithNote('summary', 'it is not valid JSON');
    expect(out.startsWith('> **Note:**')).toBe(true);
    expect(out).toContain('it is not valid JSON');
    expect(out).toContain('missing from it');
    expect(out).toContain('summary');
  });

  it('is carried through reviewPayload onto the posted body', () => {
    const { payload } = reviewPayload({
      body: 'summary',
      commitSha: 'd'.repeat(40),
      findings: [],
      index: INDEX,
      note: 'the findings file is not a JSON array',
    });
    expect(payload.body).toContain('the findings file is not a JSON array');
  });
});
