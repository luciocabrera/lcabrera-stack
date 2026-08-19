import { describe, expect, it } from 'vite-plus/test';

import {
  DEFAULT_CONVENTIONS,
  DEFAULT_REGISTERS,
  resolveConventions,
  resolveRegisters,
} from './config.mjs';

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

describe('resolveRegisters', () => {
  it('defaults to a single ADR home, because that is all a repository is assumed to have', () => {
    expect(resolveRegisters(undefined)).toEqual(DEFAULT_REGISTERS);
    expect(resolveRegisters(JSON.stringify({})).adrHomes).toHaveLength(1);
  });

  it('takes the homes a repository declares, in the order it declares them', () => {
    const homes = [
      { dir: 'docs/decisions', tier: 'repo' },
      { dir: 'apps/x/docs/decisions', tier: 'app' },
    ];
    expect(
      resolveRegisters(JSON.stringify({ registers: { adrHomes: homes } }))
        .adrHomes,
    ).toEqual(homes);
  });

  it('drops a home with nowhere to be or nothing to call itself', () => {
    const resolved = resolveRegisters(
      JSON.stringify({
        registers: {
          adrHomes: [{ dir: '', tier: 'repo' }, { dir: 'd', tier: '' }, 'nope'],
        },
      }),
    );
    expect(resolved.adrHomes).toEqual(DEFAULT_REGISTERS.adrHomes);
  });

  it('overrides the template home and the tasks directory independently', () => {
    const resolved = resolveRegisters(
      JSON.stringify({ registers: { coordinationTasksDir: 'ops/claims' } }),
    );
    expect(resolved.coordinationTasksDir).toBe('ops/claims');
    expect(resolved.adrTemplateHome).toBe(DEFAULT_REGISTERS.adrTemplateHome);
  });
});
