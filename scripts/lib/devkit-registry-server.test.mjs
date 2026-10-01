/*
 * The port handoff between the scratch registry and the gate that waits for it.
 */

import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  parsedPort,
  portFrom,
  publishPort,
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
