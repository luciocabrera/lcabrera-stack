import { describe, expect, it } from 'vite-plus/test';

import { renderFinding } from './react-doctor-finding.mjs';

const finding = (overrides) => ({
  line: 7,
  message: 'Avoid this.',
  normalizedFilePath: 'src/fallback.tsx',
  rule: 'no-thing',
  ...overrides,
});

describe('renderFinding', () => {
  it('names the repository path the id carries before its separator', () => {
    expect(renderFinding(finding({ id: 'src/real.tsx::no-thing::7' }))).toBe(
      '  src/real.tsx:7  no-thing\n      Avoid this.',
    );
  });

  it.each([
    ['null', JSON.parse('null')],
    ['missing', undefined],
    ['empty', ''],
  ])('falls back to the normalized path when the id is %s', (_label, id) => {
    expect(renderFinding(finding({ id }))).toBe(
      '  src/fallback.tsx:7  no-thing\n      Avoid this.',
    );
  });
});
