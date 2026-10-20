import { describe, expect, it } from 'vite-plus/test';

import { createLintConfig } from './vite.lint.shared.config.ts';

describe('createLintConfig', () => {
  const config = createLintConfig();

  it('fails the run on a warning and on a disable directive that silences nothing', () => {
    expect(config.options).toMatchObject({
      denyWarnings: true,
      reportUnusedDisableDirectives: 'error',
      respectEslintDisableDirectives: false,
    });
  });

  it.each([
    'promise/always-return',
    'react/exhaustive-effect-dependencies',
    'react/no-unstable-nested-components',
  ])('enables %s at error', (rule) => {
    expect(config.rules?.[rule]).toBe('error');
  });
});
