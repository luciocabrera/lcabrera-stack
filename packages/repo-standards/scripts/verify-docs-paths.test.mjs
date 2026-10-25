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

const LINK_FORMS = [
  { form: 'an inline link', markdown: (target) => `[facts](${target})\n` },
  {
    form: 'a reference-style definition',
    markdown: (target) => `See [the facts][facts].\n\n[facts]: ${target}\n`,
  },
];

describe('repo-verify-docs-paths', () => {
  it.each(LINK_FORMS)('fails on $form to a missing file', ({ markdown }) => {
    const result = run(makeRoot(markdown('does-not-exist.json')));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${DOC}: \`does-not-exist.json\``);
  });

  it.each(LINK_FORMS)(
    'passes $form once its target exists beside the doc',
    ({ markdown }) => {
      const root = makeRoot(markdown('facts.json'));
      writeIn(root)('docs/agents/facts.json', '{}\n');

      const result = run(root);

      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Documented-path gate passed');
    },
  );
});
