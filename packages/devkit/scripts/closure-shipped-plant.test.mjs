/*
 * The shipped closure has to report a blueprint import that only `create`
 * would satisfy.
 *
 * `init` and `sync` place the same rung into a repository whose manifest this
 * kit never wrote, so a package declared only by the manifest `create` writes
 * is not provided there. A copy of this package with such an import planted in
 * its blueprint is the probe: the closure must call it an escape.
 */

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import { DEVKIT_PACKAGE, TOOLCHAIN_RANGES } from './create.mjs';
import { WORKSPACE_DEPENDENCIES } from './workspace.mjs';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const scratches = [];

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) rmSync(root, { force: true, recursive: true });
});

const copyOfPackage = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-closure-plant-'));
  scratches.push(root);
  for (const entry of ['assets', 'scripts', 'package.json']) {
    cpSync(join(PACKAGE_ROOT, entry), join(root, entry), { recursive: true });
  }
  symlinkSync(join(PACKAGE_ROOT, 'node_modules'), join(root, 'node_modules'));
  return root;
};

const shippedClosure = (root, profile = 'monorepo') =>
  spawnSync(
    process.execPath,
    [
      join(root, 'scripts', 'devkit.mjs'),
      'closure',
      '--profile',
      profile,
      '--shipped',
    ],
    { cwd: root, encoding: 'utf8' },
  );

const appendTo = (path, text) =>
  writeFileSync(path, `${readFileSync(path, 'utf8')}${text}`);

const replaceIn = ({ from, path, to }) => {
  const content = readFileSync(path, 'utf8');
  if (!content.includes(from)) throw new Error(`${path} lacks ${from}`);
  writeFileSync(
    path,
    content.replace(from, () => to),
  );
};

describe('a shipped script reference that resolves nowhere', () => {
  test('the unplanted copy is self-contained, so a plant is what fails it', () => {
    const { status, stderr, stdout } = shippedClosure(copyOfPackage(), 'full');

    expect(`${stdout}${stderr}`).not.toContain('runs nonexistent');
    expect(status).toBe(0);
  });

  test('is reported when a shipped skill runs it inline', () => {
    const root = copyOfPackage();
    appendTo(
      join(root, 'assets', 'skills', 'worktree-housekeeping', 'SKILL.md'),
      '\nThen run `node scripts/moved-away.mjs`.\n',
    );
    const { status, stderr, stdout } = shippedClosure(root, 'full');

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toMatch(
      /worktree-housekeeping\/SKILL\.md:\d+ {2}runs nonexistent scripts\/moved-away\.mjs/,
    );
  });

  test('is reported when a shipped workflow step runs it', () => {
    const root = copyOfPackage();
    replaceIn({
      from: 'run: corepack enable',
      path: join(root, 'assets', 'workflows', 'check.yml'),
      to: 'run: node scripts/ghost-not-anywhere.mjs',
    });
    const { status, stderr, stdout } = shippedClosure(root, 'full');

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toMatch(
      /check\.yml:\d+ {2}runs nonexistent scripts\/ghost-not-anywhere\.mjs/,
    );
  });
});

describe('a hook seed', () => {
  test('running a script only the source repository has is an escape', () => {
    const root = copyOfPackage();
    replaceIn({
      from: 'exec "$GATE" "$1"',
      path: join(root, 'assets', 'hooks', 'commit-msg'),
      to: 'node scripts/closure.mjs\nexec "$GATE" "$1"',
    });
    const { status, stderr, stdout } = shippedClosure(root, 'repo');

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toMatch(
      /\.githooks\/commit-msg:\d+ {2}needs scripts\/closure\.mjs/,
    );
  });

  test('running a script that exists nowhere is reported missing', () => {
    const root = copyOfPackage();
    replaceIn({
      from: 'exec "$GATE" "$1"',
      path: join(root, 'assets', 'hooks', 'commit-msg'),
      to: 'node scripts/moved-away.mjs\nexec "$GATE" "$1"',
    });
    const { status, stderr, stdout } = shippedClosure(root, 'repo');

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toMatch(
      /\.githooks\/commit-msg:\d+ {2}runs nonexistent scripts\/moved-away\.mjs/,
    );
  });
});

describe('a shipped file of a kind no resolver reads', () => {
  test('is listed as unchecked under each profile that ships it', () => {
    const root = copyOfPackage();
    writeFileSync(
      join(root, 'assets', 'workspace', 'scripts', 'planted.sql'),
      'select 1;\n',
    );
    const { status, stdout } = shippedClosure(root);

    expect(status).toBe(0);
    expect(stdout).toMatch(
      /✓ monorepo — \d+ shipped file\(s\), \d+ read, \d+ unchecked/,
    );
    expect(stdout).toContain(
      'unchecked  scripts/planted.sql  no resolver for its kind',
    );
  });
});

describe('a blueprint import only the created manifest declares', () => {
  test('is a package the rung itself does not add', () => {
    expect(Object.keys(TOOLCHAIN_RANGES)).toContain(DEVKIT_PACKAGE);
    expect(Object.keys(WORKSPACE_DEPENDENCIES)).not.toContain(DEVKIT_PACKAGE);
  });

  test('is reported as an escape by the shipped closure', () => {
    const root = copyOfPackage();
    writeFileSync(
      join(root, 'assets', 'workspace', 'scripts', 'planted.mjs'),
      `import { resolveConfig } from '${DEVKIT_PACKAGE}/config';\n\nexport const planted = resolveConfig;\n`,
    );
    const { status, stderr, stdout } = shippedClosure(root);

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toContain(
      `scripts/planted.mjs:1  imports ${DEVKIT_PACKAGE}/config`,
    );
  });
});

const skill = (root) =>
  join(root, 'assets', 'skills', 'worktree-housekeeping', 'SKILL.md');

describe('a shipped instruction running a task the receiving repository lacks', () => {
  test('is reported inline and fenced', () => {
    const root = copyOfPackage();
    appendTo(
      skill(root),
      '\nThen run `npm run harness:verify`.\n\n```bash\nnpm run fallow:dead-code:verify\n```\n',
    );
    const { status, stderr } = shippedClosure(root, 'agent');

    expect(status).toBe(1);
    expect(stderr).toMatch(
      /worktree-housekeeping\/SKILL\.md:\d+ {2}runs the undefined task harness:verify/,
    );
    expect(stderr).toMatch(
      /worktree-housekeeping\/SKILL\.md:\d+ {2}runs the undefined task fallow:dead-code:verify/,
    );
  });

  test('passes for a task the profile wires into the manifest', () => {
    const root = copyOfPackage();
    appendTo(
      skill(root),
      '\nRun `npm run commit:verify` and `{{commands.run}} branch:verify`.\n',
    );

    expect(shippedClosure(root, 'agent').status).toBe(0);
  });

  test('passes for a task the shipped command reference documents, only where it ships', () => {
    const root = copyOfPackage();
    appendTo(
      join(root, 'assets', 'root', 'COMMANDS.md'),
      '\n- `{{commands.run}} planted:task` — a task this repository adds.\n',
    );
    appendTo(skill(root), '\nRun `npm run planted:task`.\n');

    expect(shippedClosure(root, 'repo').status).toBe(0);
    expect(shippedClosure(root, 'agent').stderr).toContain(
      'runs the undefined task planted:task',
    );
  });

  test.each([
    ['repo', 'root'],
    ['full', 'full'],
  ])(
    'reads the command reference where %s places it under a configured paths.%s',
    (profile, group) => {
      const root = copyOfPackage();
      writeFileSync(
        join(root, 'devkit.config.json'),
        `${JSON.stringify({ paths: { full: 'docs', root: 'docs' } })}\n`,
      );
      appendTo(
        join(root, 'assets', group, 'COMMANDS.md'),
        '\n- `{{commands.run}} planted:task` — a task this repository adds.\n',
      );
      appendTo(skill(root), '\nRun `npm run planted:task`.\n');
      const { stderr, stdout } = shippedClosure(root, profile);

      expect(`${stdout}${stderr}`).toContain(`${profile} — `);
      expect(stderr).not.toContain('runs the undefined task');
    },
  );

  test('passes for a task the consumer names in its own commands block', () => {
    const root = copyOfPackage();
    writeFileSync(
      join(root, 'devkit.config.json'),
      `${JSON.stringify({
        commands: {
          audit: 'pnpm audit --audit-level moderate',
          check: 'pnpm run check',
          install: 'pnpm install --frozen-lockfile',
          run: 'pnpm run',
          test: 'pnpm run test',
        },
      })}\n`,
    );
    const { stderr, stdout } = shippedClosure(root, 'repo');

    expect(`${stdout}${stderr}`).toContain('repo — ');
    expect(stderr).not.toContain('runs the undefined task');
  });

  test('is reported after the configured runner is substituted in', () => {
    const root = copyOfPackage();
    writeFileSync(
      join(root, 'devkit.config.json'),
      `${JSON.stringify({ commands: { run: 'pnpm' } })}\n`,
    );
    appendTo(skill(root), '\nRun `{{commands.run}} harness:verify`.\n');
    const { status, stderr } = shippedClosure(root, 'agent');

    expect(status).toBe(1);
    expect(stderr).toContain('runs the undefined task harness:verify');
  });
});
