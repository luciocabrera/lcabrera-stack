import { describe, expect, it } from 'vite-plus/test';

import { configs } from './tsconfig.entries.ts';

const configFor = (suffix: string) => {
  const entry = configs.find(({ filePath }) => filePath.endsWith(suffix));

  if (!entry) {
    throw new Error(`no generated config ends with ${suffix}`);
  }

  return entry.config;
};

describe('the generated packages/ui config', () => {
  it('carries no path aliases at all', () => {
    expect(configFor('packages/ui/tsconfig.app.json')).not.toHaveProperty(
      'compilerOptions.paths',
    );
  });

  it('still type-checks both of the runtimes its src/ mixes', () => {
    expect(configFor('packages/ui/tsconfig.app.json')).toHaveProperty(
      'compilerOptions.types',
      ['vite/client', 'node'],
    );
  });
});

describe('the generated app configs', () => {
  it('alias @lcabrera/ui by bare specifier only, never by wildcard', () => {
    const aliases = configs.flatMap(({ config }) =>
      Object.keys(
        (config.compilerOptions as { readonly paths?: Record<string, unknown> })
          .paths ?? {},
      ),
    );

    expect(aliases).toContain('@lcabrera/ui');
    expect(aliases).not.toContain('@lcabrera/ui/*');
  });
});
