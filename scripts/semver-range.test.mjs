import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import semver from 'semver';
import { describe, expect, it } from 'vite-plus/test';
import { parseAllDocuments } from 'yaml';

const require = createRequire(import.meta.url);
const { satisfies } = require('./lib/semver-range.cjs');

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const OPERATORS = ['', '=', '>', '>=', '<', '<=', '~', '~>', '^'];

const BOUNDS = [
  '6.0.3',
  '0.0.3',
  '0.2.3',
  '1.2.3',
  '1.2.3-beta.1',
  '6',
  '6.1',
  '0',
  '0.0',
  '0.2',
  '6.x',
  '6.1.x',
  '6.X.*',
  '*',
  'x',
  'v6.0.3',
];

const VERSIONS = [
  '0.0.0',
  '0.0.3',
  '0.0.4',
  '0.1.0',
  '0.2.3',
  '0.3.0',
  '1.2.3',
  '1.2.3-alpha',
  '1.2.3-beta.1',
  '1.2.3-beta.2',
  '1.2.3-beta.11',
  '1.3.0',
  '2.0.0-0',
  '5.6.1-rc',
  '5.9.3',
  '6.0.0-rc',
  '6.0.0',
  '6.0.3',
  '6.1.0',
  '6.1.5',
  '6.2.0',
  '7.0.0-0',
  '7.0.0',
  '7.0.2',
  '7.1.0-beta',
  '10.0.0',
];

const COMPOSED = [
  '>=4.8.4 <6.1.0',
  '>= 4.8.4  < 6.1.0',
  '>=4.8.4',
  '^5.1.0 || ^6.0.0 || ^7.0.0',
  '^5.0.0 || ^6.0.0 || ^7.0.0',
  '>=5',
  '>=3 <5',
  '1.2 - 2.3',
  '1.2.3 - 6',
  '* - 6.1',
  '6 - *',
  '1.2.3-beta.1 - 1.2.3',
  '<=6 || >7.0.0',
  '',
  ' || 6.0.3',
  '>=1.2.x-beta',
  '~1.2.3-beta',
  '<1.2.3-beta',
  '=v1.2.3',
  '>= v1.2.3',
  '~ 1.2',
  '^ 1.2',
  '1.2.3+build',
  '<1.2.3+b',
  '1.2.3 - 2.3.4 || 7',
  '^0.0.0',
  '^0.0.x',
  '^0.x',
  '>=1.2.3 <1.2.3',
  '*.*.*',
  '^1.2.3-0',
];

const lockfileTypeScriptRanges = () => {
  const documents = parseAllDocuments(
    readFileSync(join(REPO_ROOT, 'pnpm-lock.yaml'), 'utf8'),
  ).map((document) => document.toJS());
  return documents
    .flatMap((document) => Object.values(document?.packages ?? {}))
    .map((entry) => entry?.peerDependencies?.typescript)
    .filter((range) => typeof range === 'string');
};

const RANGES = [
  ...OPERATORS.flatMap((operator) =>
    BOUNDS.map((bound) => `${operator}${bound}`),
  ),
  ...COMPOSED,
  ...lockfileTypeScriptRanges(),
];

const validRanges = [...new Set(RANGES)].filter(
  (range) => semver.validRange(range) !== null,
);

describe('satisfies agrees with semver.satisfies', () => {
  it('covers every operator with full, partial and prerelease bounds', () => {
    expect(validRanges.length).toBeGreaterThan(
      OPERATORS.length * BOUNDS.length - 10,
    );
  });

  it.each(validRanges)('on %j', (range) => {
    const disagreements = VERSIONS.filter(
      (version) =>
        satisfies(version, range) !== semver.satisfies(version, range),
    );
    expect(disagreements).toStrictEqual([]);
  });
});

describe('satisfies refuses what it cannot read', () => {
  it('throws on every table range semver rejects', () => {
    const guessed = [...new Set(RANGES)]
      .filter((range) => semver.validRange(range) === null)
      .filter((range) => {
        try {
          satisfies('6.0.3', range);
          return true;
        } catch {
          return false;
        }
      });
    expect(guessed).toStrictEqual([]);
  });

  it.each([
    'latest',
    '1.2.3.4',
    'foo',
    '>=a',
    '^1.2.3 junk',
    '01.2.3',
    '1.2.3 - ',
    '1.x.3',
    'x.2.3',
  ])('throws on the range %j', (range) => {
    expect(() => satisfies('6.0.3', range)).toThrow(/cannot read/);
  });

  it.each(['6', '6.0', 'latest', '6.0.3.1'])(
    'throws on the version %j',
    (version) => {
      expect(() => satisfies(version, '*')).toThrow(/cannot read the version/);
    },
  );
});
