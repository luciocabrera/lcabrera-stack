import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, test } from 'vite-plus/test';

import {
  CONFIG_FILE_NAME,
  INGEST_ENV,
  MISSING_INGEST_MESSAGE,
  readEnvFiles,
  resolveIngestConfig,
} from './ingest-configuration.mjs';

const makeHostRoot = (files = {}) => {
  const hostRoot = mkdtempSync(join(tmpdir(), 'scan-report-'));
  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(hostRoot, name), contents, 'utf8');
  }
  return hostRoot;
};

const writeConfig = (ingest) =>
  makeHostRoot({ [CONFIG_FILE_NAME]: JSON.stringify({ ingest }) });

describe('resolveIngestConfig', () => {
  test('is undefined when nothing is configured — the skip path', () => {
    expect(
      resolveIngestConfig({ env: {}, hostRoot: makeHostRoot() }),
    ).toBeUndefined();
  });

  test('is undefined when a config file exists but declares no command', () => {
    expect(
      resolveIngestConfig({ env: {}, hostRoot: writeConfig({ args: ['x'] }) }),
    ).toBeUndefined();
  });

  test('reads command, args, envFiles and cwd from the config file', () => {
    const hostRoot = writeConfig({
      args: ['--flag', 'cli.ts'],
      command: 'node',
      cwd: 'tools',
      envFiles: ['a.env', 'b.env'],
    });
    expect(resolveIngestConfig({ env: {}, hostRoot })).toEqual({
      args: ['--flag', 'cli.ts'],
      command: 'node',
      cwd: 'tools',
      envFiles: ['a.env', 'b.env'],
    });
  });

  test('defaults cwd to the host root when the file omits it', () => {
    const hostRoot = writeConfig({ command: 'ingest-cli' });
    expect(resolveIngestConfig({ env: {}, hostRoot })?.cwd).toBe('.');
  });

  test('the environment wins over a checked-in config file', () => {
    const hostRoot = writeConfig({ command: 'from-file' });
    expect(
      resolveIngestConfig({
        env: { [INGEST_ENV.command]: 'from-env' },
        hostRoot,
      })?.command,
    ).toBe('from-env');
  });

  test('accepts a comma-separated argument list from the environment', () => {
    expect(
      resolveIngestConfig({
        env: {
          [INGEST_ENV.args]: '--one, --two',
          [INGEST_ENV.command]: 'ingest-cli',
        },
        hostRoot: makeHostRoot(),
      })?.args,
    ).toEqual(['--one', '--two']);
  });

  test('accepts a JSON array, for an argument that legitimately contains a comma', () => {
    expect(
      resolveIngestConfig({
        env: {
          [INGEST_ENV.args]: '["--list=a,b","--two"]',
          [INGEST_ENV.command]: 'ingest-cli',
        },
        hostRoot: makeHostRoot(),
      })?.args,
    ).toEqual(['--list=a,b', '--two']);
  });

  test('honours SCAN_REPORT_CONFIG pointing at another file', () => {
    const hostRoot = makeHostRoot({
      'elsewhere.json': JSON.stringify({ ingest: { command: 'chosen' } }),
      [CONFIG_FILE_NAME]: JSON.stringify({ ingest: { command: 'default' } }),
    });
    expect(
      resolveIngestConfig({
        env: { [INGEST_ENV.configFile]: 'elsewhere.json' },
        hostRoot,
      })?.command,
    ).toBe('chosen');
  });
});

describe('readEnvFiles', () => {
  test('merges every existing file and ignores the missing ones', () => {
    const hostRoot = makeHostRoot({
      'one.env': 'FIRST=1\nSHARED=from-one\n',
      'two.env': 'SHARED=from-two\nSECOND=2\n',
    });
    expect(
      readEnvFiles({
        envFiles: ['one.env', 'absent.env', 'two.env'],
        hostRoot,
      }),
    ).toEqual({ FIRST: '1', SECOND: '2', SHARED: 'from-two' });
  });

  test('contributes nothing when no file is configured', () => {
    expect(readEnvFiles({ envFiles: [], hostRoot: makeHostRoot() })).toEqual(
      {},
    );
  });
});

describe('MISSING_INGEST_MESSAGE', () => {
  test('names both places a consumer can configure the command', () => {
    expect(MISSING_INGEST_MESSAGE).toContain(INGEST_ENV.command);
    expect(MISSING_INGEST_MESSAGE).toContain(CONFIG_FILE_NAME);
  });
});
