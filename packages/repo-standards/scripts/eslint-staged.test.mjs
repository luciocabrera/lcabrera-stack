import { describe, expect, it } from 'vite-plus/test';

import {
  eslintArguments,
  findConfigDirectory,
  isLintablePath,
  parseArguments,
  planLintGroups,
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
