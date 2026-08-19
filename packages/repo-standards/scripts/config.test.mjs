import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_CONVENTIONS, resolveConventions } from './config.mjs';

describe('resolveConventions', () => {
  it('an absent config is the documented default, not an error', () => {
    expect(resolveConventions(undefined)).toEqual(DEFAULT_CONVENTIONS);
  });

  it('a config with no conventions block is also the default', () => {
    expect(resolveConventions(JSON.stringify({ profile: 'agent' }))).toEqual(
      DEFAULT_CONVENTIONS,
    );
  });

  it('overrides only the keys it names', () => {
    const resolved = resolveConventions(
      JSON.stringify({ conventions: { defaultBranch: 'trunk' } }),
    );
    expect(resolved.defaultBranch).toBe('trunk');
    expect(resolved.sharedBranchesDir).toBe(
      DEFAULT_CONVENTIONS.sharedBranchesDir,
    );
  });

  it('treats an empty or non-string value as unset rather than adopting it', () => {
    const resolved = resolveConventions(
      JSON.stringify({
        conventions: { defaultBranch: '', sharedBranchesDir: 7 },
      }),
    );
    expect(resolved).toEqual(DEFAULT_CONVENTIONS);
  });

  it('fails on a non-object config rather than falling back', () => {
    expect(() => resolveConventions(JSON.stringify(['main']))).toThrow(
      /JSON object/,
    );
  });
});
