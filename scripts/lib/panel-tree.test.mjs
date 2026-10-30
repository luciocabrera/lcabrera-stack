import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { runGitStatus } from '../../packages/repo-standards/scripts/git-exec.mjs';
import { hashLines } from './false-positive-markers.mjs';
import { exportCaseTree, STRIPPED_FROM_EXPORT } from './panel-tree.mjs';

const NOTE = 'BUILDER-NOTE the finding is wrong because I say so';

const made = [];

afterEach(() => {
  for (const path of made.splice(0))
    rmSync(path, { force: true, recursive: true });
});

const git = (root, args) => {
  const result = runGitStatus({
    args: [
      '-c',
      'user.name=t',
      '-c',
      'user.email=t@t',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    cwd: root,
  });
  expect(result.status).toBe(0);
  return result.stdout;
};

const repository = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panel-tree-')));
  made.push(root);
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  write('src/a.ts', 'export const a = 1;\nexport const b = 2;\n');
  write('docs/coordination/tasks/claim.md', `${NOTE}\n`);
  write('docs/coordination/branches/shared.md', `${NOTE}\n`);
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', NOTE]);
  return { head: git(root, ['rev-parse', 'HEAD']), root };
};

const caseFile = ({ head, lines = ['export const b = 2;'] }) => ({
  case: {
    case_id: 'FP-0001',
    content_hash: hashLines(lines),
    file: 'src/a.ts',
    head_sha: head,
  },
  code: { end: 2, start: 2 },
});

const allText = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? allText(path)
      : [readFileSync(path, 'utf8')];
  });

describe('exportCaseTree', () => {
  it('exports the commit with no .git, no claims and no trace of the commit message', () => {
    const { head, root } = repository();
    const into = exportCaseTree({
      caseFile: caseFile({ head }),
      casePath: 'docs/agents/adjudications/FP-0001/case.json',
      root,
    });
    made.push(into);
    expect(existsSync(join(into, '.git'))).toBe(false);
    expect(readFileSync(join(into, 'src/a.ts'), 'utf8')).toContain(
      'export const b',
    );
    for (const path of STRIPPED_FROM_EXPORT) {
      expect(existsSync(join(into, path))).toBe(false);
    }
    expect(
      JSON.parse(
        readFileSync(
          join(into, 'docs/agents/adjudications/FP-0001/case.json'),
          'utf8',
        ),
      ).case.case_id,
    ).toBe('FP-0001');
    expect(allText(into).some((text) => text.includes('BUILDER-NOTE'))).toBe(
      false,
    );
  });

  it('refuses a case whose flagged lines are not in the commit', () => {
    const { head, root } = repository();
    expect(() =>
      exportCaseTree({
        caseFile: caseFile({ head, lines: ['export const b = 3;'] }),
        casePath: 'docs/agents/adjudications/FP-0001/case.json',
        root,
      }),
    ).toThrow('does not hold the flagged lines');
  });

  it('refuses a head that is not a commit sha', () => {
    const { root } = repository();
    expect(() =>
      exportCaseTree({
        caseFile: caseFile({ head: '--output=/tmp/x' }),
        casePath: 'x.json',
        root,
      }),
    ).toThrow('is not a commit sha');
  });

  it('refuses a case path that leaves the export', () => {
    const { head, root } = repository();
    expect(() =>
      exportCaseTree({
        caseFile: caseFile({ head }),
        casePath: '../escape.json',
        root,
      }),
    ).toThrow('resolves outside the repository');
  });
});
