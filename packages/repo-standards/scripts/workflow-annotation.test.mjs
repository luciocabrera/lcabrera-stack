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

  it('escapes the percent sign before the escapes it introduces', () => {
    expect(annotationData('\n')).toBe('%0A');
    expect(annotationData('%0A')).toBe('%250A');
  });

  it('keeps a second command in the message inert', () => {
    const escaped = annotationData('boom\n::error::injected');

    expect(escaped).not.toContain('\n');
    expect(escaped).toBe('boom%0A::error::injected');
  });

  it('accepts a thrown value that is not a string', () => {
    expect(annotationData(undefined)).toBe('undefined');
  });
});
