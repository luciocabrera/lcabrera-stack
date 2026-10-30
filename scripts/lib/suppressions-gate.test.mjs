import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

const GATE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'verify-suppressions.mjs',
);

const SUPPRESSED_FILE = 'packages/ui/src/probe.util.ts';

const OUTSIDE_FILE = 'apps/harness/src/probe.util.ts';

const ENTRY = {
  count: 1,
  key: `inline ${SUPPRESSED_FILE} NOSONAR`,
  reason: 'A fixture suppression, with a reason long enough to clear the bar.',
  ref: 'issue #510',
};

const REPO_WIDE_BIOME = `${JSON.stringify({
  overrides: [
    {
      includes: ['**/probe.util.ts'],
      linter: { rules: { suspicious: { noShadow: 'off' } } },
    },
  ],
})}\n`;

const REPO_WIDE_ENTRY = {
  count: 1,
  key: 'biome **/probe.util.ts noShadow',
  reason:
    'A fixture repo-wide policy, argued at length enough to clear the bar.',
  ref: 'ADR-035 §7',
};

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

const writeIn = (root) => (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

const REGISTER = 'docs/agents/public-package-suppressions.json';

const writeRegister = (root, lanes) =>
  writeIn(root)(
    REGISTER,
    JSON.stringify({ acknowledged: [], approved: [], ...lanes }),
  );

const setStatus = (root, status) =>
  writeRegister(root, { approved: [{ ...ENTRY, status }] });

const makeFixtureRepo = ({ biome = '{}\n' } = {}) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'suppressions-gate-')));
  temporaryDirectories.push(root);
  const write = writeIn(root);
  write('packages/ui/.gitignore', 'eslint-suppressions.json\n');
  write(SUPPRESSED_FILE, 'export const probe = () => 1; // NOSONAR\n');
  write(OUTSIDE_FILE, 'export const outside = () => 1;\n');
  write('biome.jsonc', biome);
  write('doctor.config.jsonc', '{}\n');
  return root;
};

const runGate = (root) =>
  spawnSync(process.execPath, [GATE], { cwd: root, encoding: 'utf8' });

describe('verify-suppressions exit code', () => {
  it('fails on a provisional entry and passes once it is settled', () => {
    const root = makeFixtureRepo();

    setStatus(root, 'provisional');
    const parked = runGate(root);
    expect(parked.status).not.toBe(0);
    expect(parked.stdout).toContain(ENTRY.key);
    expect(parked.stdout).toContain('delete the entry');
    expect(parked.stdout).toContain('permanent');

    setStatus(root, 'permanent');
    const settled = runGate(root);
    expect(settled.status).toBe(0);
    expect(settled.stdout).not.toContain('provisional');
  });

  it('fails on an approved entry that declares no status, and passes once it does', () => {
    const root = makeFixtureRepo();

    writeRegister(root, { approved: [ENTRY] });
    const silent = runGate(root);
    expect(silent.status).not.toBe(0);
    expect(silent.stdout).toContain(ENTRY.key);
    expect(silent.stdout).toContain('status: (absent)');

    setStatus(root, 'permanent');
    const declared = runGate(root);
    expect(declared.status).toBe(0);
  });

  it('fails on an approved entry whose status is not recognised', () => {
    const root = makeFixtureRepo();
    setStatus(root, 'pending');
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(ENTRY.key);
    expect(result.stdout).toContain('status: pending');
  });

  it('passes an acknowledged entry that carries no status', () => {
    const root = makeFixtureRepo({ biome: REPO_WIDE_BIOME });
    writeRegister(root, {
      acknowledged: [REPO_WIDE_ENTRY],
      approved: [{ ...ENTRY, status: 'permanent' }],
    });
    const result = runGate(root);
    expect(result.stdout).toContain('1 inherited from repo-wide policy');
    expect(result.status).toBe(0);
  });

  it('still fails an unapproved suppression, so the fixture proves something', () => {
    const root = makeFixtureRepo();
    writeRegister(root, {});
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(ENTRY.key);
  });
});

const FP_CASE = 'FP-0042';
const FP_FILE = 'packages/ui/src/flagged.util.ts';
const FP_LINE = 'export const flagged = (value) => value;';
const FP_MARKER = `// eslint-disable-next-line some/rule -- false positive, case ${FP_CASE}: the rule misreads this`;

const fpVerifier = (model, role) => ({
  agent_prompt_hash: 'a'.repeat(64),
  cost_usd: null,
  duration_ms: 1,
  evidence: 'Checked the rule against this code; it does not apply.',
  model,
  role,
  tokens_in: 1,
  tokens_out: 1,
  verdict: 'FALSE_POSITIVE',
});

const writeFalsePositiveCase = (root, { expires, marker = FP_MARKER }) => {
  const write = writeIn(root);
  const contentHash = createHash('sha256').update(FP_LINE).digest('hex');
  const createdAt = new Date(Date.now() - 86_400_000).toISOString();
  write(FP_FILE, `${marker}\n${FP_LINE}\n`);
  write(
    `docs/agents/adjudications/${FP_CASE}.json`,
    JSON.stringify({
      case: {
        analyzer: 'eslint',
        base_sha: '1'.repeat(40),
        case_id: FP_CASE,
        content_hash: contentHash,
        created_at: createdAt,
        file: FP_FILE,
        finding_id: `${FP_FILE}:1:some/rule`,
        head_sha: '2'.repeat(40),
        pr: null,
        rule: 'some/rule',
      },
      outcome: 'dismissed',
      schema_version: 1,
      verifiers: [
        fpVerifier('model-a', 'judge'),
        fpVerifier('model-b', 'judge'),
        fpVerifier('model-c', 'adversary'),
      ],
    }),
  );
  write(
    'docs/agents/false-positives.json',
    JSON.stringify([
      {
        analyzer: 'eslint',
        case: FP_CASE,
        contentHash,
        evidence: `docs/agents/adjudications/${FP_CASE}.json`,
        expires:
          expires ??
          new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
        file: FP_FILE,
        lines: 1,
        rule: 'some/rule',
      },
    ]),
  );
};

describe('verify-suppressions — panel-confirmed false positives', () => {
  const settledRoot = () => {
    const root = makeFixtureRepo();
    writeRegister(root, { approved: [{ ...ENTRY, status: 'permanent' }] });
    return root;
  };

  it('passes a marker in a public package that matches a live, unanimous case, with no register entry', () => {
    const root = settledRoot();
    writeFalsePositiveCase(root, {});
    const result = runGate(root);
    expect(result.stdout).toContain('1 false-positive marker(s)');
    expect(result.status).toBe(0);
  });

  it('fails the same marker once its entry has expired', () => {
    const root = settledRoot();
    writeFalsePositiveCase(root, { expires: '2020-01-01' });
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('[expired]');
  });

  it('fails a marker naming a case the list does not hold', () => {
    const root = settledRoot();
    writeFalsePositiveCase(root, {
      marker: FP_MARKER.replace(FP_CASE, 'FP-0043'),
    });
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('[unlisted]');
    expect(result.stdout).toContain('[unmarked]');
  });

  it('fails an unadjudicated marker outside the public packages', () => {
    const root = settledRoot();
    writeIn(root)(
      OUTSIDE_FILE,
      '// eslint-disable-next-line no-console -- noisy\nconsole.log(1);\n',
    );
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(`${OUTSIDE_FILE}:1  no-console`);
  });
});
