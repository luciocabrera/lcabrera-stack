import { describe, expect, it } from 'vite-plus/test';

import { codeSpan } from './codeSpan.util.ts';

describe('codeSpan', () => {
  it('wraps the text in backticks', () => {
    expect(codeSpan('react-19/trigger')).toBe('`react-19/trigger`');
  });
});
