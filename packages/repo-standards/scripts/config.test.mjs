import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  CONFIG_FILE_NAME,
  DEFAULT_CONVENTIONS,
  DEFAULT_REGISTERS,
  readCoordinationPaths,
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

// These gates write and delete — the ADR scaffolder writes, the index and the
// board are overwritten, the claim closer unlinks. A configured location that
// leaves the repository must be refused by name, not normalised into something
// that quietly points somewhere else.
describe('containment of the configured locations', () => {
  const tasksDir = (value) =>
    resolveRegisters(
      JSON.stringify({ registers: { coordinationTasksDir: value } }),
    ).coordinationTasksDir;

  it('refuses a value that climbs out of the repository', () => {
    expect(() => tasksDir('../../etc')).toThrow(/leaves it/);
  });

  it('refuses an absolute value rather than nesting it under the root', () => {
    expect(() => tasksDir('/tmp/claims')).toThrow(/must be relative/);
  });

  it('keeps a value whose `..` stays inside', () => {
    expect(tasksDir('docs/../ops/claims')).toBe('docs/../ops/claims');
  });

  it('holds an ADR home to the same rule, since one writes files', () => {
    expect(() =>
      resolveRegisters(
        JSON.stringify({
          registers: { adrHomes: [{ dir: '../outside', tier: 'repo' }] },
        }),
      ),
    ).toThrow(/leaves it/);
  });

  it('holds the shared-branches directory to it too', () => {
    expect(() =>
      resolveConventions(
        JSON.stringify({ conventions: { sharedBranchesDir: '../x' } }),
      ),
    ).toThrow(/leaves it/);
  });

  it('trims a padded value and falls back on a blank one', () => {
    expect(tasksDir(' ops/claims ')).toBe('ops/claims');
    expect(tasksDir('   ')).toBe(DEFAULT_REGISTERS.coordinationTasksDir);
  });
});

describe('readCoordinationPaths', () => {
  const withConfig = (config) => {
    const root = mkdtempSync(join(tmpdir(), 'repo-standards-config-'));
    if (config !== undefined) {
      writeFileSync(join(root, CONFIG_FILE_NAME), JSON.stringify(config));
    }
    return root;
  };

  it('resolves the three register locations against the given root', () => {
    const root = withConfig(undefined);
    const paths = readCoordinationPaths(root);

    expect(paths.tasksDir).toBe(join(root, 'docs/coordination/tasks'));
    expect(paths.branchesDir).toBe(join(root, 'docs/coordination/branches'));
    expect(paths.boardDoc).toBe(join(root, 'docs/coordination/BOARD.md'));
  });

  // The regression: the closer read `coordinationTasksDir` for its message and
  // joined a hardcoded `docs/coordination/tasks` for the delete, so a consumer
  // who moved the register was told one path and had another one read.
  it('moves the directory it reads, not only the one it prints', () => {
    const root = withConfig({
      conventions: { sharedBranchesDir: 'ops/branches' },
      registers: {
        coordinationBoardDoc: 'ops/BOARD.md',
        coordinationTasksDir: 'ops/claims',
      },
    });
    const paths = readCoordinationPaths(root);

    expect(paths.tasksDir).toBe(join(root, 'ops/claims'));
    expect(paths.tasksRel).toBe('ops/claims');
    expect(paths.branchesDir).toBe(join(root, 'ops/branches'));
    expect(paths.boardDoc).toBe(join(root, 'ops/BOARD.md'));
    expect(paths.boardRel).toBe('ops/BOARD.md');
  });
});
