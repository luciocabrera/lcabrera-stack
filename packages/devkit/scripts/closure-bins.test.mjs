import { describe, expect, test } from 'vite-plus/test';

import { extractBinInvocations } from './closure-bins.mjs';

describe('extractBinInvocations', () => {
  test('reads a name written as an install path', () => {
    expect(
      extractBinInvocations('GATE="./node_modules/.bin/repo-verify-commit"\n'),
    ).toEqual([{ line: 1, name: 'repo-verify-commit' }]);
  });

  test('reads a name reached through a variable holding the directory', () => {
    const content = [
      '    env:',
      '      GATES: ./node_modules/.bin',
      '    steps:',
      "      - run: '$GATES/repo-verify-adrs'",
    ].join('\n');

    expect(extractBinInvocations(content)).toEqual([
      { line: 4, name: 'repo-verify-adrs' },
    ]);
  });

  test('reads the braced spelling of that variable too', () => {
    const content = [
      'GATES="node_modules/.bin"',
      `exec "\${GATES}/repo-adr"`,
    ].join('\n');

    expect(extractBinInvocations(content)).toEqual([
      { line: 2, name: 'repo-adr' },
    ]);
  });

  test('a variable bound to something else names no executable', () => {
    const content = ['BIN=./scripts', 'exec "$BIN/build.mjs"'].join('\n');

    expect(extractBinInvocations(content)).toEqual([]);
  });

  test('prose naming the directory without a file names no executable', () => {
    expect(
      extractBinInvocations(
        '# a run step does not inherit node_modules/.bin\n',
      ),
    ).toEqual([]);
  });
});
