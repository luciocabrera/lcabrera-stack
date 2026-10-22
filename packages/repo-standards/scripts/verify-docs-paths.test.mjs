import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { createFixtureRoots, writeIn } from './repo-fixtures.mjs';

const BIN = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-docs-paths.mjs',
);

const DOC = 'docs/agents/triage.md';

const fixtures = createFixtureRoots('repo-docs-paths-');

afterEach(fixtures.removeAll);

const makeRoot = (markdown) => {
  const root = fixtures.make();
  writeIn(root)(DOC, markdown);
  return root;
};

const run = (root) =>
  spawnSync(process.execPath, [BIN], {
    encoding: 'utf8',
    env: { ...process.env, REPO_STANDARDS_HOST_ROOT: root },
  });

describe('repo-verify-docs-paths', () => {
  it('fails on a bare relative link to a missing non-markdown file', () => {
    const result = run(makeRoot('[gone](does-not-exist.json)\n'));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${DOC}: \`does-not-exist.json\``);
  });

  it('passes the same link once its target exists beside the doc', () => {
    const root = makeRoot('[facts](facts.json)\n');
    writeIn(root)('docs/agents/facts.json', '{}\n');

    const result = run(root);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Documented-path gate passed');
  });
});
