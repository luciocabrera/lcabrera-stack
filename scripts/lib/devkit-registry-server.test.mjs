/*
 * The port handoff between the scratch registry and the gate that waits for it.
 */

import { spawn } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  parsedPort,
  portFrom,
  publishPort,
  registryFaultFindings,
  registryResponse,
  registryState,
  startedRegistry,
  withRegistryFindings,
} from './devkit-registry-server.mjs';

const directories = [];

const scratch = () => {
  const directory = mkdtempSync(join(tmpdir(), 'registry-port-'));
  directories.push(directory);
  return directory;
};

afterEach(() => {
  for (const directory of directories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('parsedPort', () => {
  it.each([
    ['4873', 4873],
    ['4873\n', 4873],
    ['1', 1],
    ['65535', 65_535],
  ])('reads %j as %d', (text, port) => {
    expect(parsedPort(text)).toBe(port);
  });

  it.each([undefined, '', '0', '65536', '48 73', '4873abc', '-1', '4.5'])(
    'refuses %j',
    (text) => {
      expect(parsedPort(text)).toBeUndefined();
    },
  );
});

describe('publishPort', () => {
  it('leaves only the finished port file behind', () => {
    const directory = scratch();
    const portFile = join(directory, 'port');
    publishPort({ port: 4873, portFile });
    expect(readFileSync(portFile, 'utf8')).toBe('4873');
    expect(() => readFileSync(`${portFile}.partial`)).toThrow();
  });
});

describe('portFrom', () => {
  it('waits past a port file that exists but is still empty', () => {
    const directory = scratch();
    const portFile = join(directory, 'port');
    const writer = spawn(
      process.execPath,
      [
        '-e',
        `const fs = require('node:fs');
         fs.writeFileSync(${JSON.stringify(portFile)}, '');
         setTimeout(() => fs.writeFileSync(${JSON.stringify(portFile)}, '4873'), 400);`,
      ],
      { stdio: 'ignore' },
    );
    try {
      expect(portFrom({ deadlineMs: 5000, portFile })).toBe(4873);
    } finally {
      writer.kill();
    }
  });

  it('fails loudly, naming the value, when the file never holds a port', () => {
    const directory = scratch();
    const portFile = join(directory, 'port');
    writeFileSync(portFile, 'not-a-port');
    expect(() => portFrom({ deadlineMs: 200, portFile })).toThrow(
      /"not-a-port" as its port/,
    );
  });

  it('fails loudly when the file never appears', () => {
    const directory = scratch();
    expect(() =>
      portFrom({ deadlineMs: 200, portFile: join(directory, 'port') }),
    ).toThrow(/did not start within 200 ms/);
  });
});

const PACKED = {
  file: 'lcabrera-api-1.2.3.tgz',
  integrity: 'sha512-abc',
  manifest: { name: '@lcabrera/api', version: '1.2.3' },
};

const INDEX = { '@lcabrera/api': PACKED };

const BASE_URL = 'http://127.0.0.1:4873';

describe('registryResponse', () => {
  it('serves the packument of a packed package under its encoded name', () => {
    const { body, status } = registryResponse({
      baseUrl: BASE_URL,
      index: INDEX,
      path: '/@lcabrera%2Fapi',
    });
    expect(status).toBe(200);
    expect(JSON.parse(body).versions['1.2.3'].dist.tarball).toBe(
      `${BASE_URL}/-/${PACKED.file}`,
    );
  });

  it('names the packed tarball for its own file', () => {
    expect(
      registryResponse({
        baseUrl: BASE_URL,
        index: INDEX,
        path: `/-/${PACKED.file}`,
      }),
    ).toMatchObject({ file: PACKED.file, status: 200 });
  });

  it.each([
    '/-/npm/v1/attestations/@lcabrera/api@1.2.3',
    '/-/npm/v1/security/advisories/bulk',
    '/-/lcabrera-api-9.9.9.tgz',
    '/@lcabrera%2Fmissing',
    '/%E0%A4%A',
    '/__proto__',
    '/',
  ])('answers %s with 404 rather than a file it does not hold', (path) => {
    expect(registryResponse({ baseUrl: BASE_URL, index: INDEX, path })).toEqual(
      {
        body: JSON.stringify({ error: 'not found' }),
        status: 404,
        type: 'application/json',
      },
    );
  });
});

describe('registryFaultFindings', () => {
  const url = BASE_URL;

  it('finds nothing while the registry is running and answers', () => {
    expect(registryFaultFindings({ probe: { status: 404 }, url })).toEqual([]);
  });

  it('names the registry, its exit and its last output when it exited', () => {
    const [finding] = registryFaultFindings({
      exit: { code: 1, signal: null },
      log: 'Error: ENOENT: no such file or directory',
      probe: { error: 'connect ECONNREFUSED' },
      url,
    });
    expect(finding).toMatch(
      /^the scratch registry at http:\/\/127\.0\.0\.1:4873 /,
    );
    expect(finding).toContain('it exited 1');
    expect(finding).toContain('not in the created tree');
    expect(finding).toContain('ENOENT');
  });

  it('names the registry when it is running but does not answer', () => {
    const [finding] = registryFaultFindings({
      probe: { error: 'The operation was aborted due to timeout' },
      url,
    });
    expect(finding).toContain('scratch registry');
    expect(finding).toContain('aborted due to timeout');
  });
});

describe('withRegistryFindings', () => {
  const url = BASE_URL;
  const stack = 'Error: EACCES: permission denied, open lcabrera-api-1.2.3.tgz';

  it('appends the registry log to a failing run whose registry still answers', () => {
    const findings = withRegistryFindings({
      findings: ['`vp install` exited 1 in the created tree'],
      log: stack,
      probe: { status: 404 },
      url,
    });
    expect(findings).toHaveLength(2);
    expect(findings[0]).toBe('`vp install` exited 1 in the created tree');
    expect(findings[1]).toContain(`the scratch registry at ${url}`);
    expect(findings[1]).toContain(stack);
  });

  it('adds nothing to a failing run whose registry wrote nothing', () => {
    expect(
      withRegistryFindings({
        findings: ['a tree finding'],
        log: '\n',
        probe: { status: 404 },
        url,
      }),
    ).toEqual(['a tree finding']);
  });

  it('keeps a passing run passing when the registry wrote something', () => {
    expect(
      withRegistryFindings({
        findings: [],
        log: stack,
        probe: { status: 404 },
        url,
      }),
    ).toEqual([]);
  });

  it('leads with a stopped registry and quotes its log once', () => {
    const findings = withRegistryFindings({
      exit: { code: 1, signal: null },
      findings: ['a tree finding'],
      log: stack,
      probe: { error: 'connect ECONNREFUSED' },
      url,
    });
    expect(findings).toHaveLength(2);
    expect(findings[0]).toContain('stopped answering (it exited 1)');
    expect(findings[1]).toBe('a tree finding');
  });
});

const SERVE_LAUNCHER = `
import process from 'node:process';
import { serveRegistry } from ${JSON.stringify(
  fileURLToPath(new URL('devkit-registry-server.mjs', import.meta.url)),
)};
const [indexPath, portFile] = process.argv.slice(2);
serveRegistry({ indexPath, portFile });
`;

const launchedRegistry = () => {
  const staging = scratch();
  const launcher = join(staging, 'serve.mjs');
  writeFileSync(launcher, SERVE_LAUNCHER);
  writeFileSync(join(staging, PACKED.file), 'tarball bytes');
  return startedRegistry({ launch: [launcher], packed: [PACKED], staging });
};

const stopped = (server) =>
  new Promise((resolve) => {
    server.once('exit', resolve);
    server.kill();
  });

describe('the scratch registry process', () => {
  it('keeps answering after a request for a path it does not serve', async () => {
    const { server, url } = launchedRegistry();
    try {
      const attestation = await fetch(
        `${url}/-/npm/v1/attestations/@lcabrera/api@1.2.3`,
      );
      expect(attestation.status).toBe(404);
      const packument = await fetch(`${url}/@lcabrera%2Fapi`);
      expect(packument.status).toBe(200);
      const tarball = await fetch(`${url}/-/${PACKED.file}`);
      expect(await tarball.text()).toBe('tarball bytes');
      expect(
        registryFaultFindings({
          ...(await registryState({ server, url })),
          url,
        }),
      ).toEqual([]);
    } finally {
      await stopped(server);
    }
  });

  it('puts the stack of a request it answered with 500 in a failing report', async () => {
    const { log, server, url } = launchedRegistry();
    try {
      unlinkSync(join(dirname(log), PACKED.file));
      const tarball = await fetch(`${url}/-/${PACKED.file}`);
      expect(tarball.status).toBe(500);
      const findings = withRegistryFindings({
        ...(await registryState({ server, url })),
        findings: ['a tree finding'],
        log: readFileSync(log, 'utf8'),
        url,
      });
      expect(findings[0]).toBe('a tree finding');
      expect(findings[1]).toContain(`the scratch registry at ${url}`);
      expect(findings[1]).toContain('ENOENT');
    } finally {
      await stopped(server);
    }
  });

  it('reports how it ended without the caller waiting for its exit', async () => {
    const { server, url } = launchedRegistry();
    process.kill(server.pid, 'SIGKILL');
    const [finding] = registryFaultFindings({
      ...(await registryState({ server, url })),
      url,
    });
    expect(finding).toContain('it was killed by SIGKILL');
  });

  it('is reported by name once it has stopped', async () => {
    const { log, server, url } = launchedRegistry();
    await stopped(server);
    const [finding] = registryFaultFindings({
      ...(await registryState({ server, url })),
      log: readFileSync(log, 'utf8'),
      url,
    });
    expect(finding).toContain(`the scratch registry at ${url}`);
    expect(finding).toContain('it was killed by SIGTERM');
  });
});
