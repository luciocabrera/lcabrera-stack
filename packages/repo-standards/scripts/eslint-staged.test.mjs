import { describe, expect, it } from 'vite-plus/test';

import {
  argumentError,
  eslintArguments,
  exitCodeFor,
  findConfigDirectory,
  isLintablePath,
  lintScriptOf,
  parseArguments,
  planLintGroups,
  spawnOutcome,
  workspaceEslintFlags,
} from './eslint-staged.mjs';

const REPO_ROOT = '/repo';

const CONFIGS = new Set([
  '/repo/packages/ui/eslint.config.mjs',
  '/repo/packages/utils/eslint.config.mjs',
]);

const exists = (path) => CONFIGS.has(path);

describe('isLintablePath', () => {
  it('accepts every extension ESLint is wired to read', () => {
    for (const path of ['a.ts', 'a.tsx', 'a.mjs', 'a.cjs', 'a.js', 'a.jsx']) {
      expect(isLintablePath(path)).toBe(true);
    }
  });

  it('rejects what ESLint would refuse anyway', () => {
    for (const path of ['README.md', 'data.json', 'run.sh', 'Makefile']) {
      expect(isLintablePath(path)).toBe(false);
    }
  });

  it('does not read a dotfile name as an extension', () => {
    expect(isLintablePath('/repo/.ts')).toBe(false);
  });
});

describe('findConfigDirectory', () => {
  it('walks up to the nearest config', () => {
    expect(
      findConfigDirectory({
        exists,
        filePath: '/repo/packages/ui/src/deep/Thing.tsx',
        repoRoot: REPO_ROOT,
      }),
    ).toBe('/repo/packages/ui');
  });

  it('returns nothing for a path outside every workspace', () => {
    expect(
      findConfigDirectory({
        exists,
        filePath: '/repo/scripts/tool.mjs',
        repoRoot: REPO_ROOT,
      }),
    ).toBeUndefined();
  });

  it('does not escape the repository root', () => {
    expect(
      findConfigDirectory({
        exists: () => true,
        filePath: '/elsewhere/thing.ts',
        repoRoot: REPO_ROOT,
      }),
    ).toBeUndefined();
  });
});

describe('planLintGroups', () => {
  it('groups paths by their governing config and relativises them', () => {
    expect(
      planLintGroups({
        exists,
        paths: [
          '/repo/packages/ui/src/A.tsx',
          '/repo/packages/utils/src/b.util.ts',
          '/repo/packages/ui/src/C.tsx',
        ],
        repoRoot: REPO_ROOT,
      }),
    ).toEqual([
      { directory: '/repo/packages/ui', files: ['src/A.tsx', 'src/C.tsx'] },
      { directory: '/repo/packages/utils', files: ['src/b.util.ts'] },
    ]);
  });

  it('drops unlintable files and files no config governs', () => {
    expect(
      planLintGroups({
        exists,
        paths: [
          '/repo/packages/ui/README.md',
          '/repo/scripts/tool.mjs',
          '/repo/docs/notes.md',
        ],
        repoRoot: REPO_ROOT,
      }),
    ).toEqual([]);
  });
});

describe('eslintArguments', () => {
  it('fixes by default and reports under --check', () => {
    expect(eslintArguments({ files: ['a.ts'], fix: true })).toContain('--fix');
    expect(eslintArguments({ files: ['a.ts'], fix: false })).not.toContain(
      '--fix',
    );
  });

  it('ends the options before the files, so a leading dash is a path', () => {
    const args = eslintArguments({ files: ['-weird.ts'], fix: false });
    expect(args.indexOf('--')).toBeLessThan(args.indexOf('-weird.ts'));
  });

  it('leaves a path the config ignores to the config', () => {
    expect(eslintArguments({ files: ['dist/a.js'], fix: false })).toContain(
      '--no-warn-ignored',
    );
  });

  it('never lets a warning pass', () => {
    const args = eslintArguments({ files: ['a.ts'], fix: false });
    expect(
      args.slice(
        args.indexOf('--max-warnings'),
        2 + args.indexOf('--max-warnings'),
      ),
    ).toEqual(['--max-warnings', '0']);
  });
});

describe('parseArguments', () => {
  it('reads bare paths and the one flag', () => {
    expect(parseArguments(['--check', 'a.ts', 'b.ts'])).toEqual({
      check: true,
      paths: ['a.ts', 'b.ts'],
      unknown: [],
    });
  });

  it('fixes when --check is absent', () => {
    expect(parseArguments(['a.ts']).check).toBe(false);
  });

  it('takes everything after -- as a path, dash or not', () => {
    expect(parseArguments(['--check', '--', '-weird.ts', '--check'])).toEqual({
      check: true,
      paths: ['-weird.ts', '--check'],
      unknown: [],
    });
  });

  it('reports an unrecognised option rather than dropping it', () => {
    expect(parseArguments(['--fix', 'a.ts']).unknown).toEqual(['--fix']);
  });

  it('does not silently swallow a dash-led filename given without --', () => {
    const { paths, unknown } = parseArguments(['-weird.ts']);
    expect(paths).toEqual([]);
    expect(unknown).toEqual(['-weird.ts']);
  });
});

describe('findConfigDirectory at the repository root', () => {
  it('finds a config sitting at the root itself', () => {
    expect(
      findConfigDirectory({
        exists: (path) => path === '/repo/eslint.config.mjs',
        filePath: '/repo/scripts/a.mjs',
        repoRoot: REPO_ROOT,
      }),
    ).toBe('/repo');
  });

  it('still returns nothing when no config is above the file', () => {
    expect(
      findConfigDirectory({
        exists: () => false,
        filePath: '/repo/scripts/a.mjs',
        repoRoot: REPO_ROOT,
      }),
    ).toBeUndefined();
  });

  it('prefers the nearest config over the root one', () => {
    expect(
      findConfigDirectory({
        exists: (path) =>
          path === '/repo/eslint.config.mjs' ||
          path === '/repo/packages/ui/eslint.config.mjs',
        filePath: '/repo/packages/ui/src/a.ts',
        repoRoot: REPO_ROOT,
      }),
    ).toBe('/repo/packages/ui');
  });
});

describe('workspaceEslintFlags', () => {
  it('carries a workspace flag this runner does not set', () => {
    expect(
      workspaceEslintFlags(
        'eslint . --config eslint.config.mjs --max-warnings 0 --no-inline-config',
      ),
    ).toEqual(['--max-warnings', '0', '--no-inline-config']);
  });

  it('drops the flags the runner owns, and their values', () => {
    expect(
      workspaceEslintFlags(
        'eslint . --config eslint.config.mjs --fix --max-warnings 0',
      ),
    ).toEqual(['--max-warnings', '0']);
  });

  it('falls back to failing on a warning when there is no script', () => {
    expect(workspaceEslintFlags(undefined)).toEqual(['--max-warnings', '0']);
  });

  it('reaches eslintArguments before the file list', () => {
    const args = eslintArguments({
      files: ['a.ts'],
      fix: false,
      workspaceFlags: ['--max-warnings', '0', '--no-inline-config'],
    });
    expect(args.indexOf('--no-inline-config')).toBeLessThan(args.indexOf('--'));
  });
});

describe('argumentError', () => {
  const clean = { missing: [], paths: ['a.ts'], unknown: [] };

  it('says nothing when the arguments are usable', () => {
    expect(argumentError(clean)).toBeUndefined();
  });

  it('names the option it did not recognise', () => {
    expect(argumentError({ ...clean, unknown: ['-weird.ts'] })).toContain(
      '-weird.ts',
    );
  });

  it('asks for files when none were given', () => {
    expect(argumentError({ ...clean, paths: [] })).toContain('usage:');
  });

  it('names a path that is not there rather than dropping it', () => {
    expect(argumentError({ ...clean, missing: ['src/nope.ts'] })).toContain(
      'src/nope.ts',
    );
  });

  it('reports the unusable arguments before the missing files', () => {
    expect(
      argumentError({ missing: ['a'], paths: [], unknown: ['-x'] }),
    ).toContain('-x');
  });
});

describe('lintScriptOf', () => {
  it('prefers the check script over the fixing one', () => {
    expect(
      lintScriptOf({
        'lint:eslint': 'eslint --fix',
        'lint:eslint:check': 'eslint',
      }),
    ).toBe('eslint');
  });

  it('falls back to the fixing script', () => {
    expect(lintScriptOf({ 'lint:eslint': 'eslint --fix' })).toBe(
      'eslint --fix',
    );
  });

  it('is undefined for a workspace with neither', () => {
    expect(lintScriptOf(undefined)).toBeUndefined();
    expect(lintScriptOf({})).toBeUndefined();
  });
});

describe('spawnOutcome', () => {
  it("maps only ESLint's own two outcomes", () => {
    expect(spawnOutcome(0)).toBe('clean');
    expect(spawnOutcome(1)).toBe('findings');
  });

  it('treats a config error and a failed spawn as could-not-run', () => {
    expect(spawnOutcome(2)).toBe('broken');
    expect(spawnOutcome(null)).toBe('broken');
  });
});

describe('exitCodeFor', () => {
  it('is clean when every group is', () => {
    expect(exitCodeFor(['clean', 'clean'])).toBe(0);
  });

  it('is 1 for findings', () => {
    expect(exitCodeFor(['clean', 'findings'])).toBe(1);
  });

  it('lets could-not-run outrank findings, because it is not a finding', () => {
    expect(exitCodeFor(['findings', 'broken'])).toBe(2);
  });
});
