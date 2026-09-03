/**
 * What `repo-adr` writes to stdout, probed through the bin rather than through
 * the helper it calls.
 *
 * The dry run used to print the rendered record, so it wrote the bytes of the
 * ADR template to stdout — a file whose directory the host repository sets
 * through `registers.adrTemplateHome`. That is Sonar `jssecurity:S8689` and
 * issue #1056. A test over `scaffoldSummary` alone cannot see the defect: the
 * helper never receives a template, so it passes whether or not the dry-run
 * branch prints one. This runs the bin against a temporary host root whose
 * template carries a marker string, and the write path asserts the same marker
 * reaches the file — so the negative below fails if the record is ever printed
 * again, and cannot pass by the template going unread.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

const BIN = join(dirname(fileURLToPath(import.meta.url)), 'new-adr.mjs');

const MARKER = 'only-the-template-carries-this-line';

const template = (heading = '# ADR-NNN — <one line, in the imperative>') =>
  [
    '---',
    'governs:',
    '  - <repository, or one workspace directory name per line>',
    '---',
    '',
    '<!--',
    '  Instructions, which the scaffolded record drops.',
    '-->',
    '',
    heading,
    '',
    '## Context',
    '',
    MARKER,
    '',
  ].join('\n');

const roots = [];

const makeRoot = (contents = template()) => {
  const root = mkdtempSync(join(tmpdir(), 'repo-adr-'));
  mkdirSync(join(root, 'docs', 'decisions'), { recursive: true });
  writeFileSync(join(root, 'docs', 'decisions', '_TEMPLATE.md'), contents);
  roots.push(root);
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

const run = (root, args) =>
  spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, REPO_STANDARDS_HOST_ROOT: root },
  });

describe('repo-adr --dry-run', () => {
  it('reports the path and number it would take', () => {
    const result = run(makeRoot(), ['A decision', '--dry-run']);

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(
      'would write docs/decisions/ADR-001-a-decision.md as ADR-001 — A decision',
    );
  });

  it('prints nothing the template carries', () => {
    const result = run(makeRoot(), ['A decision', '--dry-run']);

    expect(result.stdout).not.toContain(MARKER);
    expect(result.stdout).not.toContain('governs:');
    expect(result.stdout).not.toContain('## Context');
  });

  it('writes no file', () => {
    const root = makeRoot();

    run(root, ['A decision', '--dry-run']);

    expect(existsSync(join(root, 'docs/decisions/ADR-001-a-decision.md'))).toBe(
      false,
    );
  });

  it('refuses a template that has lost its heading', () => {
    const result = run(makeRoot(template('# <one line>')), [
      'A decision',
      '--dry-run',
    ]);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'the ADR template no longer has an `# ADR-NNN — …` heading',
    );
  });
});

describe('repo-adr', () => {
  it('carries the template into the record it writes, and not into stdout', () => {
    const root = makeRoot();

    const result = run(root, ['A decision']);

    expect(result.status).toBe(0);
    expect(
      readFileSync(join(root, 'docs/decisions/ADR-001-a-decision.md'), 'utf8'),
    ).toContain(MARKER);
    expect(result.stdout).not.toContain(MARKER);
    expect(result.stdout).toContain(
      'Wrote docs/decisions/ADR-001-a-decision.md as ADR-001.',
    );
  });

  it('takes the next free number once one record is in the home', () => {
    const root = makeRoot();

    run(root, ['A decision']);
    const second = run(root, ['Another decision']);

    expect(second.status).toBe(0);
    expect(second.stdout).toContain(
      'Wrote docs/decisions/ADR-002-another-decision.md as ADR-002.',
    );
  });
});
