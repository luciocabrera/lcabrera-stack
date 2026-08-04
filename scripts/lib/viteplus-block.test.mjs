import { describe, expect, it } from 'vite-plus/test';

import {
  END_MARKER,
  findRegion,
  renderedContent,
  renderedLines,
  START_MARKER,
  withEmptiedRegion,
} from './viteplus-block.mjs';

// The gate's whole job is telling "a comment nobody renders" apart from "content
// Vite+ injected". Both look like text between two markers, so comment-stripping
// is the part that must not drift, and it fails in two opposite directions:
// under-matching (a multi-line comment read as content) makes the gate fail
// noisily on a clean tree, while over-matching (injected content swallowed as a
// comment) makes it pass on everything — the silent, dangerous direction. Both
// are asserted below.

const wrap = (inner) => `# Doc\n\n${START_MARKER}${inner}${END_MARKER}\n`;

describe('findRegion', () => {
  it('reports absent when neither marker is there', () => {
    expect(findRegion('# Doc\n').kind).toBe('absent');
  });

  it('reports unpaired when only one marker is there', () => {
    expect(findRegion(`# Doc\n${START_MARKER}\n`).kind).toBe('unpaired');
    expect(findRegion(`# Doc\n${END_MARKER}\n`).kind).toBe('unpaired');
  });

  it('reports unpaired when the end marker precedes the start', () => {
    expect(findRegion(`${END_MARKER}\nx\n${START_MARKER}`).kind).toBe(
      'unpaired',
    );
  });

  it('captures the inner text when both markers are present', () => {
    expect(findRegion(wrap('\nhello\n')).inner).toBe('\nhello\n');
  });
});

describe('renderedContent', () => {
  it('treats a single-line comment as rendering nothing', () => {
    expect(renderedContent('\n<!-- note -->\n')).toBe('');
  });

  it('treats a MULTI-line comment as rendering nothing', () => {
    expect(renderedContent('\n<!-- one\n   two\n   three -->\n')).toBe('');
  });

  it('treats several comments as rendering nothing', () => {
    expect(renderedContent('<!-- a -->\n\n<!-- b\nc -->')).toBe('');
  });

  it('sees real content outside a comment', () => {
    expect(renderedContent('<!-- a -->\n# Using Vite+\n')).toBe(
      '# Using Vite+',
    );
  });

  it('sees content that FOLLOWS a comment on the same line', () => {
    expect(renderedContent('<!-- a --> trailing')).toBe('trailing');
  });

  // Stripping runs to a fixpoint. Removing an inner comment can splice its
  // neighbours into a NEW valid comment, which one `replace` pass would leave
  // behind — the residue CodeQL flags as incomplete sanitization. Here `<!` and
  // `-- y -->` become `<!-- y -->` only after the inner match is removed, so a
  // single-pass implementation returns that instead of ''.
  it('strips a comment spliced together by removing an inner one', () => {
    expect(renderedContent('<!<!-- x -->-- y -->')).toBe('');
  });

  // Residue that is NOT a comment stays, and is reported as content. The gate
  // fails closed: malformed markup is something nobody reviewed either.
  it('keeps a dangling close marker as content', () => {
    expect(renderedContent('<!--<!-- inner -->-->')).toBe('-->');
  });

  it('keeps an unterminated open marker as content', () => {
    expect(renderedContent('<!-- ok -->\n<!--')).toBe('<!--');
  });
});

describe('renderedLines', () => {
  it('lists only the rendered lines, trimmed', () => {
    const inner = '\n<!-- ignored -->\n# Heading\n\n- [ ] Run `vp test`\n';
    expect(renderedLines(inner)).toEqual(['# Heading', '- [ ] Run `vp test`']);
  });

  it('is empty for a comment-only region', () => {
    expect(renderedLines('\n<!-- just a note -->\n')).toEqual([]);
  });
});

describe('withEmptiedRegion', () => {
  it('replaces the body and keeps both markers', () => {
    const text = wrap('\n# Injected\n');
    const region = findRegion(text);
    const out = withEmptiedRegion(text, region, '\n<!-- empty -->\n');
    expect(out).toContain(START_MARKER);
    expect(out).toContain(END_MARKER);
    expect(out).not.toContain('# Injected');
    expect(renderedLines(findRegion(out).inner)).toEqual([]);
  });

  it('leaves text outside the region untouched', () => {
    const text = `before\n${START_MARKER}\nx\n${END_MARKER}\nafter\n`;
    const out = withEmptiedRegion(text, findRegion(text), '\n');
    expect(out.startsWith('before\n')).toBe(true);
    expect(out.endsWith('\nafter\n')).toBe(true);
  });
});
