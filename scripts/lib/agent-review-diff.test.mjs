import { describe, expect, it } from 'vite-plus/test';

import { addedLines, diffIndex, isAddedLine } from './agent-review-diff.mjs';

const PATCH = [
  '@@ -1,4 +1,5 @@',
  ' unchanged one',
  '-removed two',
  '+added two',
  '+added three',
  ' unchanged four',
  ' unchanged five',
].join('\n');

describe('addedLines', () => {
  it('records the new-file numbers of added lines only', () => {
    expect([...addedLines(PATCH)]).toEqual([2, 3]);
  });

  it('does not record a context line', () => {
    // §2.4 step 5: a context line is code this change did not introduce, and
    // §3 forbids blocking on that — so admitting one would break the anchor.
    const added = addedLines(PATCH);
    expect(added.has(1)).toBe(false);
    expect(added.has(4)).toBe(false);
  });

  it('handles several hunks, each with its own offset', () => {
    const patch = [
      '@@ -1,2 +1,2 @@',
      ' one',
      '+two',
      '-two old',
      '@@ -40,3 +40,4 @@ some context header',
      ' forty',
      '+forty one',
      ' forty two',
    ].join('\n');
    expect([...addedLines(patch)]).toEqual([2, 41]);
  });

  it('ignores the no-newline marker, which occupies no line', () => {
    const patch = [
      '@@ -1 +1 @@',
      '-old',
      '\\ No newline at end of file',
      '+new',
    ].join('\n');
    expect([...addedLines(patch)]).toEqual([1]);
  });

  it('is empty for a pure deletion', () => {
    expect([...addedLines('@@ -1,2 +0,0 @@\n-one\n-two')]).toEqual([]);
  });
});

describe('diffIndex', () => {
  it('indexes each patched file', () => {
    const index = diffIndex([{ changes: 3, filename: 'a.ts', patch: PATCH }]);
    expect(isAddedLine(index, 'a.ts', 2)).toBe(true);
    expect(isAddedLine(index, 'a.ts', 4)).toBe(false);
    expect(isAddedLine(index, 'other.ts', 2)).toBe(false);
  });

  it('marks a changed file whose patch GitHub withheld as unreadable', () => {
    // Failing open here would admit any line number in a large or binary file.
    const index = diffIndex([{ changes: 9000, filename: 'huge.json' }]);
    expect(index.unreadable.has('huge.json')).toBe(true);
    expect(isAddedLine(index, 'huge.json', 1)).toBe(false);
  });

  it('treats a pure rename as readable with no added lines', () => {
    const index = diffIndex([
      { changes: 0, filename: 'moved.ts', previous_filename: 'old.ts' },
    ]);
    expect(index.unreadable.has('moved.ts')).toBe(false);
    expect(isAddedLine(index, 'moved.ts', 1)).toBe(false);
  });
});
