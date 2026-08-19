import { describe, expect, it } from 'vite-plus/test';

import { annotationData } from './workflow-annotation.mjs';

describe('annotationData', () => {
  it('leaves a message with nothing to escape alone', () => {
    expect(
      annotationData('Cannot release: devkit.config.json is not JSON'),
    ).toBe('Cannot release: devkit.config.json is not JSON');
  });

  it('escapes the three characters a workflow command reads as structure', () => {
    expect(annotationData('a\nb\rc%d')).toBe('a%0Ab%0Dc%25d');
  });

  // The order is the whole subtlety: escaping the line breaks first would leave
  // `%0A` for the percent pass to turn into `%250A`, and the runner would print
  // the escape rather than break the line.
  it('escapes the percent sign before the escapes it introduces', () => {
    expect(annotationData('\n')).toBe('%0A');
    expect(annotationData('%0A')).toBe('%250A');
  });

  // What the escaping is for: a thrown value carrying a newline could otherwise
  // close the annotation and have the rest read as a command of its own.
  it('keeps a second command in the message inert', () => {
    const escaped = annotationData('boom\n::error::injected');

    expect(escaped).not.toContain('\n');
    expect(escaped).toBe('boom%0A::error::injected');
  });

  it('accepts a thrown value that is not a string', () => {
    expect(annotationData(undefined)).toBe('undefined');
  });
});
