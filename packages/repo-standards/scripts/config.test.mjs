import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  CONFIG_FILE_NAME,
  DEFAULT_CONVENTIONS,
  DEFAULT_GATES,
  DEFAULT_PUBLISHING,
  DEFAULT_ADR_COMMANDS,
  DEFAULT_REGISTERS,
  readCoordinationPaths,
  resolveConventions,
  resolveGates,
  resolvePublishing,
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

  // The gates print a single line, so `Unexpected end of JSON input` on its own
  // would leave a reader with nothing to open. Asserted for every block, since
  // which one a consumer reaches first depends only on which gate they ran.
  it('names the file when the config is not valid JSON at all', () => {
    for (const resolve of [
      resolveConventions,
      resolvePublishing,
      resolveRegisters,
    ]) {
      expect(() => resolve('{ "publishing": ')).toThrow(
        /devkit\.config\.json is not valid JSON: /,
      );
    }
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
    ).toEqual(
      // Every home carries the repository's command spellings, because the index
      // renderer takes a home and nothing else.
      homes.map((home) => ({ ...home, commands: DEFAULT_ADR_COMMANDS })),
    );
  });

  it('drops a home with nowhere to be or nothing to call itself', () => {
    const resolved = resolveRegisters(
      JSON.stringify({
        registers: {
          adrHomes: [{ dir: '', tier: 'repo' }, { dir: 'd', tier: '' }, 'nope'],
        },
      }),
    );
    expect(resolved.adrHomes).toEqual(
      DEFAULT_REGISTERS.adrHomes.map((home) => ({
        ...home,
        commands: DEFAULT_ADR_COMMANDS,
      })),
    );
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

  // One spelling per location: these values are compared as strings, not only
  // joined onto a root. An ADR home spelled `docs/decisions/` matched nothing
  // in the stray check, so every ADR in it was reported as a stray.
  it('canonicalises the spellings that would otherwise fail to match', () => {
    expect(tasksDir('docs/coordination/tasks/')).toBe(
      'docs/coordination/tasks',
    );
    expect(tasksDir('./ops/claims')).toBe('ops/claims');
    expect(tasksDir('docs/../ops/claims')).toBe('ops/claims');
    expect(tasksDir('ops//claims')).toBe('ops/claims');
    expect(tasksDir(String.raw`ops\claims`)).toBe('ops/claims');
  });

  // The value is checked into git and read wherever the gate runs, so the
  // verdict must not depend on the host's separator. Parsing with the platform
  // `normalize` made this guard inert on Windows: `../../etc` became
  // `..\..\etc`, which the segment check read as one ordinary name.
  it('refuses a backslash-separated climb the way it refuses a slashed one', () => {
    expect(() => tasksDir(String.raw`..\..\etc`)).toThrow(/leaves it/);
  });

  it('refuses a drive letter and a UNC share, on any host', () => {
    expect(() => tasksDir('C:/claims')).toThrow(/must be relative/);
    expect(() => tasksDir(String.raw`C:\claims`)).toThrow(/must be relative/);
    expect(() => tasksDir('//server/share')).toThrow(/must be relative/);
  });

  // `..` only climbs when it is a whole segment. A directory whose NAME starts
  // with two dots stays put, so matching the prefix would refuse a location
  // that never left.
  it('keeps a directory whose name merely starts with two dots', () => {
    expect(tasksDir('..data/claims')).toBe('..data/claims');
    expect(tasksDir('...claims')).toBe('...claims');
  });

  it('still refuses a bare `..`', () => {
    expect(() => tasksDir('..')).toThrow(/leaves it/);
  });

  // The tier is a lookup key (`--home <tier>`), so a padded one would pass
  // validation and then match nothing a caller asks for.
  it('trims an ADR home tier so it can still be looked up', () => {
    const [home] = resolveRegisters(
      JSON.stringify({
        registers: { adrHomes: [{ dir: 'docs/decisions', tier: 'repo ' }] },
      }),
    ).adrHomes;

    expect(home.tier).toBe('repo');
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

describe('resolvePublishing', () => {
  const publishing = (block) => resolvePublishing(JSON.stringify(block));

  it('an absent config is the documented default, not an error', () => {
    expect(resolvePublishing(undefined)).toEqual(DEFAULT_PUBLISHING);
  });

  // The roster cannot be guessed, so it defaults to empty — and every gate that
  // reads it refuses to run on empty rather than passing over nothing. A
  // default roster would turn that loud state into a wrong one.
  it('leaves an unconfigured roster empty rather than inventing one', () => {
    expect(resolvePublishing(undefined).publicPackageDirs).toEqual([]);
    expect(publishing({ publishing: {} }).publicPackageDirs).toEqual([]);
    expect(
      publishing({ publishing: { publicPackageDirs: [] } }).publicPackageDirs,
    ).toEqual([]);
  });

  it('keeps the declared roster in the order it was declared', () => {
    expect(
      publishing({ publishing: { publicPackageDirs: ['ui', 'api'] } })
        .publicPackageDirs,
    ).toEqual(['ui', 'api']);
  });

  it('reads each location, and falls back per key rather than per block', () => {
    const resolved = publishing({
      publishing: { apiSurfaceDir: 'artifacts/surface' },
    });

    expect(resolved.apiSurfaceDir).toBe('artifacts/surface');
    expect(resolved.packagesDir).toBe(DEFAULT_PUBLISHING.packagesDir);
    expect(resolved.workspaceDirs).toEqual(DEFAULT_PUBLISHING.workspaceDirs);
  });

  // These gates write: the surface gate writes a snapshot per package and the
  // publish gate rewrites a manifest. A location that leaves the repository is
  // refused by name, not normalised into something harmless.
  it('refuses a location that leaves the repository', () => {
    expect(() =>
      publishing({ publishing: { apiSurfaceDir: '../../elsewhere' } }),
    ).toThrow(/must stay inside the repository/);
    expect(() =>
      publishing({ publishing: { packagesDir: '/var/packages' } }),
    ).toThrow(/must be relative to the repository root/);
    expect(() =>
      publishing({ publishing: { releaseWorkflow: 'C:/publish.yml' } }),
    ).toThrow(/must be relative to the repository root/);
  });

  // A roster entry is joined onto the packages directory, so it escapes the
  // same way — `a/../..` climbs out of both once they are joined.
  it('holds every roster and workspace entry to the same rule', () => {
    expect(() =>
      publishing({ publishing: { publicPackageDirs: ['ui', '../../etc'] } }),
    ).toThrow(/must stay inside the repository/);
    expect(() =>
      publishing({ publishing: { publicPackageDirs: ['a/../../etc'] } }),
    ).toThrow(/must stay inside the repository/);
    expect(() =>
      publishing({ publishing: { workspaceDirs: ['..\\..\\etc'] } }),
    ).toThrow(/must stay inside the repository/);
  });

  // One spelling per location: the snapshot path is built by string
  // concatenation, so `reports/api-surface/` would name `…//ui.txt`.
  it('canonicalises a location to one spelling', () => {
    expect(
      publishing({ publishing: { apiSurfaceDir: 'reports/api-surface/' } })
        .apiSurfaceDir,
    ).toBe('reports/api-surface');
    expect(
      publishing({ publishing: { publicPackageDirs: ['./ui/'] } })
        .publicPackageDirs,
    ).toEqual(['ui']);
  });

  // `..data` is an ordinary name; only a whole `..` segment climbs.
  it('does not mistake a leading-dots name for a parent', () => {
    expect(
      publishing({ publishing: { packagesDir: '..packages' } }).packagesDir,
    ).toBe('..packages');
  });
});

describe('resolveGates', () => {
  const gates = (block) => resolveGates(JSON.stringify({ gates: block }));

  it('an absent config is the documented default, not an error', () => {
    expect(resolveGates(undefined)).toEqual(DEFAULT_GATES);
  });

  it('a config with no gates block is also the default', () => {
    expect(resolveGates(JSON.stringify({ profile: 'agent' }))).toEqual(
      DEFAULT_GATES,
    );
  });

  it('overrides only the keys it names', () => {
    const resolved = gates({ scriptSize: { ceiling: 200 } });

    expect(resolved.scriptSize.ceiling).toBe(200);
    expect(resolved.scriptSize.baselineFile).toBe(
      DEFAULT_GATES.scriptSize.baselineFile,
    );
    expect(resolved.strayConfigs).toEqual(DEFAULT_GATES.strayConfigs);
  });

  it('refuses a ceiling that is not a positive whole number', () => {
    // A typo here does not make the gate stricter or looser, it makes every
    // file breach or none — so it is named rather than coerced.
    for (const ceiling of [0, -1, 12.5, '350']) {
      expect(() => gates({ scriptSize: { ceiling } })).toThrow(
        /gates\.scriptSize\.ceiling/,
      );
    }
  });

  it('refuses a baseline path that leaves the repository', () => {
    expect(() =>
      gates({ scriptSize: { baselineFile: '../outside.json' } }),
    ).toThrow(/must stay inside the repository/);
    expect(() => gates({ docsPaths: { baselineFile: '/etc/passwd' } })).toThrow(
      /must be relative to the repository root/,
    );
  });

  it('keeps a match fragment exactly as written, trailing slash and all', () => {
    // The distinction that matters most in this block. These values are
    // compared as substrings against paths already collected, so nothing joins
    // them onto a root and there is nothing to canonicalise. Canonicalising
    // them anyway strips the trailing slash, and the slash IS the meaning:
    // `reports/` excludes a directory, `reports` excludes every document whose
    // name contains the word — which silently dropped one out of the corpus.
    const resolved = gates({
      docsPaths: {
        expectedAbsentPrefixes: ['docker/local/'],
        ignoredDocs: ['reports/'],
      },
    });

    expect(resolved.docsPaths.ignoredDocs).toEqual(['reports/']);
    expect(resolved.docsPaths.expectedAbsentPrefixes).toEqual([
      'docker/local/',
    ]);
  });

  it('canonicalises the values that really are paths', () => {
    const resolved = gates({
      docsPaths: { expectedAbsent: ['docs//generated/BOARD.md'] },
    });

    expect(resolved.docsPaths.expectedAbsent).toEqual([
      'docs/generated/BOARD.md',
    ]);
  });

  it("reads every stray-config key, so an empty roster is the consumer's choice", () => {
    const resolved = gates({
      strayConfigs: {
        configuredIn: 'the root config',
        skipDirs: ['.cache'],
        unreadNames: ['.oxfmtrc.json'],
        unreadPrefixes: ['.prettierrc'],
      },
    });

    expect(resolved.strayConfigs).toEqual({
      configuredIn: 'the root config',
      skipDirs: ['.cache'],
      unreadNames: ['.oxfmtrc.json'],
      unreadPrefixes: ['.prettierrc'],
    });
  });

  it('reads every docs-path key', () => {
    const resolved = gates({
      docsPaths: {
        baselineFile: 'tools/baseline.json',
        expectedAbsent: ['local/only.md'],
        expectedAbsentPrefixes: ['generated/'],
        ignoredDocs: ['vendor/'],
        onDemandReportDirs: ['reports/lint'],
        repoRoots: ['src', 'docs'],
      },
    });

    expect(resolved.docsPaths).toEqual({
      baselineFile: 'tools/baseline.json',
      expectedAbsent: ['local/only.md'],
      expectedAbsentPrefixes: ['generated/'],
      ignoredDocs: ['vendor/'],
      onDemandReportDirs: ['reports/lint'],
      repoRoots: ['src', 'docs'],
    });
  });

  it('ignores a non-array where a list belongs rather than crashing', () => {
    expect(
      gates({ docsPaths: { repoRoots: 'docs' } }).docsPaths.repoRoots,
    ).toEqual(DEFAULT_GATES.docsPaths.repoRoots);
  });

  it('drops empty strings from a list rather than matching everything', () => {
    // An empty fragment is a substring of every path, so one left in a list
    // would exempt the entire corpus.
    expect(
      gates({ docsPaths: { ignoredDocs: ['', '  ', 'vendor/'] } }).docsPaths
        .ignoredDocs,
    ).toEqual(['vendor/']);
  });
});
