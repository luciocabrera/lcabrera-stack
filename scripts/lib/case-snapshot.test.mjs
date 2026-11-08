import { toCurrentAdjudication } from '@repo/eval-history/envelope/toCurrentAdjudication.util';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { runGitStatus } from '../../packages/repo-standards/scripts/git-exec.mjs';
import { openCase } from './adjudicate-command.mjs';
import { listEntryFor } from './adjudication-panel.mjs';
import {
  findClaimedMarkers,
  hashLines,
  markerSpelling,
} from './false-positive-markers.mjs';
import { checkFalsePositives } from './false-positives.mjs';
import { verifier } from './false-positives-fixtures.mjs';
import { caseCommit, stashSnapshot, textAt } from './case-snapshot.mjs';
import { exportCaseTree } from './panel-tree.mjs';

const FILE = 'src/grid.tsx';
const RULE = 'lint/a11y/noNoninteractiveElementToInteractiveRole';
const CLEAN = ['export const Grid = () => (', '  <div>cells</div>', ');', ''];
const FLAGGED = "  <div role='grid'>cells</div>";
const PLANTED = [CLEAN[0], FLAGGED, ...CLEAN.slice(2)];

const made = [];

afterEach(() => {
  for (const path of made.splice(0))
    rmSync(path, { force: true, recursive: true });
});

const git = (root, args) =>
  runGitStatus({
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

const repository = () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'case-snapshot-')));
  made.push(root);
  const write = (path, text) => {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  };
  write(FILE, CLEAN.join('\n'));
  git(root, ['init', '-q', '-b', 'main']);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '-m', 'clean']);
  return { head: git(root, ['rev-parse', 'HEAD']).stdout, root, write };
};

const HOOKS = {
  'post-checkout': 'exit 0',
  'pre-commit': 'exit 1',
  'reference-transaction': 'exit 0',
};

const refusingHook = (root) => {
  const hooks = join(root, '.hooks');
  const sentinel = join(root, '.hook-ran');
  mkdirSync(hooks);
  for (const [name, exit] of Object.entries(HOOKS)) {
    writeFileSync(
      join(hooks, name),
      `#!/bin/sh\necho ${name} >> '${sentinel}'\n${exit}\n`,
    );
    chmodSync(join(hooks, name), 0o755);
  }
  git(root, ['config', 'core.hooksPath', hooks]);
  return sentinel;
};

const refState = (root) => ({
  head: git(root, ['rev-parse', 'HEAD']).stdout,
  index: git(root, ['diff', '--cached', '--name-only']).stdout,
  refs: git(root, ['for-each-ref']).stdout,
  stash: git(root, ['stash', 'list']).stdout,
  status: git(root, ['status', '--porcelain', '--untracked-files=all']).stdout,
});

const reportFor = ({ file, root }) => [
  {
    filePath: join(root, file),
    messages: [{ line: 2, message: 'grid', ruleId: RULE }],
  },
];

const openOn = (root, file = FILE) => {
  const written = [];
  const out = [];
  openCase({
    argv: ['--', 'eslint', `${file}:2:${RULE}`],
    effects: {
      caseNames: () => [],
      isRepoFile: () => true,
      now: () => new Date().toISOString(),
      readText: () => readFileSync(join(root, file), 'utf8'),
      run: () => ({
        status: 1,
        stdout: JSON.stringify(reportFor({ file, root })),
      }),
      shas: () => {
        const head = git(root, ['rev-parse', 'HEAD']).stdout;
        return { base: head, head };
      },
      snapshot: () => stashSnapshot({ root }),
      textAt: ({ file: path, sha }) => textAt({ file: path, root, sha }),
      workspaceOf: () => '.',
      write: (text) => out.push(text),
      writeJson: (_path, value) => written.push(value),
    },
  });
  return { caseFile: written[0], out: out.join('') };
};

const FLAGGED_CODE = {
  content_hash: hashLines([FLAGGED]),
  end: 2,
  start: 2,
};

const decide = ({ snapshot = '', texts }) =>
  caseCommit({
    code: FLAGGED_CODE,
    file: FILE,
    head: 'head',
    snapshot: () => snapshot,
    textAt: (sha) => texts[sha],
  });

describe('caseCommit', () => {
  it('keeps HEAD when HEAD holds the flagged lines, and makes no snapshot', () => {
    expect(
      caseCommit({
        code: FLAGGED_CODE,
        file: FILE,
        head: 'head',
        snapshot: () => {
          throw new Error('no snapshot should be made');
        },
        textAt: () => PLANTED.join('\n'),
      }),
    ).toEqual({ sha: 'head', snapshot: false });
  });

  it('takes the snapshot when only the working tree holds the lines', () => {
    expect(
      decide({
        snapshot: 'snap',
        texts: { head: CLEAN.join('\n'), snap: PLANTED.join('\n') },
      }),
    ).toEqual({ sha: 'snap', snapshot: true });
  });

  it('refuses cleanly when there is nothing to snapshot', () => {
    expect(() => decide({ texts: { head: CLEAN.join('\n') } })).toThrow(
      `HEAD does not hold the flagged lines of ${FILE}, and there is nothing to snapshot`,
    );
  });

  it('refuses a snapshot that does not hold the lines either', () => {
    expect(() =>
      decide({ snapshot: 'snap', texts: { head: undefined, snap: undefined } }),
    ).toThrow('neither HEAD nor the working-tree snapshot snap');
  });
});

describe('a flagged line that is only in the working tree', () => {
  it('opens the case on a git stash create snapshot, moving no ref and running no hook', () => {
    const { head, root, write } = repository();
    const sentinel = refusingHook(root);
    write(FILE, PLANTED.join('\n'));
    expect(git(root, ['commit', '-q', '-am', 'flagged']).status).not.toBe(0);
    expect(existsSync(sentinel)).toBe(true);
    rmSync(sentinel);
    const before = refState(root);

    const { caseFile, out } = openOn(root);

    expect(refState(root)).toEqual(before);
    expect(before.head).toBe(head);
    expect(before.stash).toBe('');
    expect(existsSync(sentinel)).toBe(false);
    expect(caseFile.case.head_sha).toMatch(/^[0-9a-f]{40}$/u);
    expect(caseFile.case.head_sha).not.toBe(head);
    expect(caseFile.case.base_sha).toBe(head);
    expect(out).toContain(
      'a snapshot of the working tree made with git stash create',
    );

    const tree = exportCaseTree({
      caseFile,
      casePath: 'docs/agents/adjudications/FP-0001/case.json',
      root,
    });
    made.push(tree);
    expect(readFileSync(join(tree, FILE), 'utf8')).toContain(FLAGGED);
    expect(refState(root)).toEqual(before);
  });

  it('records HEAD itself when HEAD holds the flagged lines', () => {
    const { root, write } = repository();
    write(FILE, PLANTED.join('\n'));
    git(root, ['commit', '-q', '-am', 'flagged']);
    const { caseFile, out } = openOn(root);
    expect(caseFile.case.head_sha).toBe(
      git(root, ['rev-parse', 'HEAD']).stdout,
    );
    expect(out).not.toContain('git stash create');
  });

  it('refuses a new untracked file, and opens the case once it is staged', () => {
    const { root, write } = repository();
    const other = 'src/new-grid.tsx';
    write(other, PLANTED.join('\n'));
    const openOther = () => openOn(root, other).caseFile;
    expect(openOther).toThrow('there is nothing to snapshot');
    write(FILE, `${CLEAN.join('\n')}// touched\n`);
    expect(openOther).toThrow('neither HEAD nor the working-tree snapshot');
    git(root, ['add', other]);
    expect(openOther().case.head_sha).toMatch(/^[0-9a-f]{40}$/u);
    expect(git(root, ['stash', 'list']).stdout).toBe('');
  });

  it('records the line hash the gate computes once the marker is committed above the same lines', () => {
    const { root, write } = repository();
    write(FILE, PLANTED.join('\n'));
    const { caseFile } = openOn(root);
    const marker = markerSpelling({
      analyzer: 'eslint',
      caseId: caseFile.case.case_id,
      reason: 'a grid is an interactive widget role',
      rule: RULE,
    });
    write(FILE, [PLANTED[0], marker, ...PLANTED.slice(1)].join('\n'));
    git(root, ['commit', '-q', '-am', 'marked']);
    const committed = textAt({ file: FILE, root, sha: 'HEAD' });
    const evidence = `docs/agents/adjudications/${caseFile.case.case_id}.json`;
    const envelope = {
      case: caseFile.case,
      outcome: 'dismissed',
      schema_version: 1,
      verifiers: [
        verifier('model-a', 'judge'),
        verifier('model-b', 'judge'),
        verifier('model-c', 'adversary'),
      ],
    };
    expect(
      checkFalsePositives({
        entries: [listEntryFor({ caseFile, evidence })],
        markers: findClaimedMarkers({ file: FILE, text: committed }),
        readCase: () => toCurrentAdjudication({ input: envelope }),
        readText: () => committed,
        today: new Date().toISOString().slice(0, 10),
      }),
    ).toEqual([]);
  });
});
