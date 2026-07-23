import { describe, expect, it } from 'vite-plus/test';

import { deriveAllowedTools } from './deriveAllowedTools.util.ts';

describe('deriveAllowedTools', () => {
  it('returns an empty array when allowed-tools is absent', () => {
    expect(deriveAllowedTools({ frontmatter: {} })).toEqual([]);
  });

  it('expands a condensed multi-pattern group into one entry per pattern', () => {
    expect(
      deriveAllowedTools({
        frontmatter: {
          'allowed-tools': 'Bash(cat:*,date:*,git:*,mkdir:*,node:*,tee:*)',
        },
      }),
    ).toEqual([
      'Bash(cat:*)',
      'Bash(date:*)',
      'Bash(git:*)',
      'Bash(mkdir:*)',
      'Bash(node:*)',
      'Bash(tee:*)',
    ]);
  });

  it('passes bare tool names through unchanged', () => {
    expect(
      deriveAllowedTools({ frontmatter: { 'allowed-tools': 'Read, Grep' } }),
    ).toEqual(['Read', 'Grep']);
  });

  it('handles a mix of grouped-pattern and bare-name entries', () => {
    expect(
      deriveAllowedTools({
        frontmatter: { 'allowed-tools': 'Bash(node:*), Read, Grep' },
      }),
    ).toEqual(['Bash(node:*)', 'Read', 'Grep']);
  });

  it('handles a single-pattern group the same as a bare grouped list', () => {
    expect(
      deriveAllowedTools({ frontmatter: { 'allowed-tools': 'Bash(node:*)' } }),
    ).toEqual(['Bash(node:*)']);
  });
});
