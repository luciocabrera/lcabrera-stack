/*
 * The declare-field probe has to tell a build that kept the field from one that
 * dropped it, so each case below writes a stand-in server bundle in both shapes
 * and runs the same import the gate runs against the created tree.
 */

import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { afterAll, afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  APP_CONFIG,
  placedConfigFieldFindings,
  plantedProbeFindings,
  PROBE_FIELD,
  PROBE_FILE,
  PROBE_MODULE,
  PROBE_SOURCE,
  probeVerdictFindings,
  ROUTES_FILE,
  shippedBlueprints,
  withProbeRoute,
  workspaceConfigFieldFindings,
} from './devkit-tree-declare-field.mjs';
import { BUILT_SERVER_ENTRY } from './devkit-workspace.mjs';

const scratch = mkdtempSync(join(tmpdir(), 'devkit-declare-field-'));

const ROUTES = [
  "import { route } from '@react-router/dev/routes';",
  '',
  'export default [',
  "  route('/', 'routes/orders/root.ts'),",
  '] satisfies RouteConfig;',
  '',
].join('\n');

const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const treeWithBundle = (name, holder) => {
  const tree = join(scratch, name);
  write(
    join(tree, BUILT_SERVER_ENTRY),
    [
      `class DeclareFieldProbe { ${holder} }`,
      'export const routes = {',
      `  ${JSON.stringify(PROBE_MODULE)}: { module: { loader: () => ({`,
      `    kept: Object.hasOwn(new DeclareFieldProbe(), ${JSON.stringify(PROBE_FIELD)}),`,
      '  }) } },',
      '};',
      '',
    ].join('\n'),
  );
  return tree;
};

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('withProbeRoute', () => {
  it('adds the probe route as the last entry of the route list', () => {
    const routed = withProbeRoute(ROUTES);

    expect(routed).toContain(
      `  route('/', 'routes/orders/root.ts'),\n  route('_probe/declare-field', '${PROBE_MODULE}.ts'),\n] satisfies RouteConfig;`,
    );
  });

  it('refuses a route file it cannot find the end of', () => {
    expect(withProbeRoute('export default [];\n')).toBeUndefined();
  });
});

describe('PROBE_SOURCE', () => {
  it('declares the field with no initializer, which is the shape the preset drops', () => {
    expect(PROBE_SOURCE).toContain(`  ${PROBE_FIELD}: string | undefined;\n`);
    expect(PROBE_SOURCE).not.toContain(`${PROBE_FIELD} =`);
  });
});

describe('probeVerdictFindings', () => {
  const verdict = (answer) =>
    probeVerdictFindings({
      blueprint: 'full',
      output: `vite noise\ndeclare-field-probe:${JSON.stringify(answer)}\n`,
      status: 0,
    });

  it('passes a build whose instance owns the field', () => {
    expect(verdict({ kept: true })).toEqual([]);
  });

  it('names the config and the option when the field is gone', () => {
    const [finding] = verdict({ kept: false });

    expect(finding).toContain(
      "the `full` blueprint's `apps/web/vite.config.ts`",
    );
    expect(finding).toContain('allowDeclareFields');
  });

  it('reports a bundle that has no probe route', () => {
    expect(verdict(null)[0]).toContain('never reached the server bundle');
  });

  it('reports an import that failed rather than reading it as a pass', () => {
    const [finding] = probeVerdictFindings({
      blueprint: 'workspace',
      output: 'Cannot find module',
      status: 1,
    });

    expect(finding).toContain('Cannot find module');
  });
});

describe('placedConfigFieldFindings', () => {
  it('passes the bundle of a class that kept its field', () => {
    const tree = treeWithBundle('kept', `${PROBE_FIELD};`);

    expect(placedConfigFieldFindings({ tree })).toEqual([]);
  });

  it('fails the bundle of a class that lost it, though the name is still in it', () => {
    const tree = treeWithBundle('dropped', '');

    expect(readFileSync(join(tree, BUILT_SERVER_ENTRY), 'utf8')).toContain(
      PROBE_FIELD,
    );
    expect(placedConfigFieldFindings({ tree })[0]).toContain(
      'dropped a class field that has no initializer',
    );
  });
});

describe('plantedProbeFindings', () => {
  it('commits the probe and its route so no later check sees a modified file', () => {
    const tree = join(scratch, 'planted');
    write(join(tree, ROUTES_FILE), ROUTES);
    const git = (...args) =>
      execFileSync('git', args, { cwd: tree, encoding: 'utf8' });
    git('init', '--quiet');
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init');

    expect(plantedProbeFindings({ tree })).toEqual([]);
    expect(readFileSync(join(tree, PROBE_FILE), 'utf8')).toBe(PROBE_SOURCE);
    expect(readFileSync(join(tree, ROUTES_FILE), 'utf8')).toContain(
      `${PROBE_MODULE}.ts`,
    );
    expect(git('status', '--porcelain')).toBe('');
  });

  it('reports a route file it cannot extend', () => {
    const tree = join(scratch, 'unroutable');
    write(join(tree, ROUTES_FILE), 'export default [];\n');

    expect(plantedProbeFindings({ tree })[0]).toContain(ROUTES_FILE);
  });
});

describe('shippedBlueprints', () => {
  it('finds the assets of the devkit package a holder installed the bin from', () => {
    expect(shippedBlueprints('/holder/node_modules/.bin/devkit')).toBe(
      '/holder/node_modules/@lcabrera/devkit/assets',
    );
  });
});

describe('workspaceConfigFieldFindings', () => {
  it('builds under the workspace config and puts the placed one back', () => {
    const bin = join(scratch, 'bin');
    write(join(bin, 'vp'), `#!/bin/sh\ncat ${APP_CONFIG} >&2\nexit 1\n`);
    chmodSync(join(bin, 'vp'), 0o755);
    vi.stubEnv('PATH', `${bin}:${process.env.PATH}`);
    const holder = join(scratch, 'holder', 'node_modules');
    write(
      join(holder, '@lcabrera', 'devkit', 'assets', 'workspace', APP_CONFIG),
      'workspace config\n',
    );
    const tree = join(scratch, 'swapped');
    write(join(tree, APP_CONFIG), 'full config\n');

    const [finding] = workspaceConfigFieldFindings({
      devkit: join(holder, '.bin', 'devkit'),
      tree,
    });

    expect(finding).toContain('workspace config');
    expect(readFileSync(join(tree, APP_CONFIG), 'utf8')).toBe('full config\n');
  });
});
