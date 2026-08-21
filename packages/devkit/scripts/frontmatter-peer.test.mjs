import { describe, expect, test } from 'vite-plus/test';

import { requiredPeers } from './frontmatter.mjs';

const withFrontmatter = (...lines) =>
  ['---', ...lines, '---', '', '# Heading', ''].join('\n');

describe('requiredPeers', () => {
  test('reads a scoped name and its range out of a lone scalar', () => {
    expect(
      requiredPeers(
        withFrontmatter("peer: '@lcabrera/repo-standards@>=0.1.0 <1.0.0'"),
      ),
    ).toEqual([{ name: '@lcabrera/repo-standards', range: '>=0.1.0 <1.0.0' }]);
  });

  test('splits at the last @, so a scoped name survives', () => {
    // The one thing this spelling has to get right: a scoped name opens with an
    // `@` and a range never contains one. Splitting at the FIRST would read the
    // package as `repo/repo-standards@>=1` and never resolve anything.
    expect(
      requiredPeers(withFrontmatter('peer: "@scope/name@^2.3.4"')),
    ).toEqual([{ name: '@scope/name', range: '^2.3.4' }]);
    expect(requiredPeers(withFrontmatter('peer: unscoped@^2.3.4'))).toEqual([
      { name: 'unscoped', range: '^2.3.4' },
    ]);
  });

  test('reads the same declaration however the spelling is styled', () => {
    // A restyle is an edit nobody reviews as a behaviour change, so it must not
    // be one. A spelling this cannot see reads as no declaration at all — the
    // file is written into a consumer whose runtime cannot run it, silently.
    const spellings = {
      'block sequence': [
        'peer:',
        "  - '@repo/a@^1.0.0'",
        "  - '@repo/b@^2.0.0'",
      ],
      'block sequence at the key indent': [
        'peer:',
        "- '@repo/a@^1.0.0'",
        "- '@repo/b@^2.0.0'",
      ],
      'block sequence behind a blank line and a note': [
        'peer:',
        '',
        '  # the gate runtimes it shells out to',
        "  - '@repo/a@^1.0.0'",
        "  - '@repo/b@^2.0.0'",
      ],
      'flow array': ["peer: ['@repo/a@^1.0.0', '@repo/b@^2.0.0']"],
      'flow array opening on the next line': [
        'peer:',
        "  ['@repo/a@^1.0.0',",
        "   '@repo/b@^2.0.0']",
      ],
    };
    const read = Object.entries(spellings).map(([spelling, lines]) => [
      spelling,
      requiredPeers(withFrontmatter(...lines, 'name: demo')),
    ]);
    expect(Object.fromEntries(read)).toEqual(
      Object.fromEntries(
        Object.keys(spellings).map((spelling) => [
          spelling,
          [
            { name: '@repo/a', range: '^1.0.0' },
            { name: '@repo/b', range: '^2.0.0' },
          ],
        ]),
      ),
    );
  });

  test('reads a range whose operators would end any single-line matcher', () => {
    expect(
      requiredPeers(withFrontmatter("peer: '@repo/a@1.x || >=2.5.0 <3.0.0'")),
    ).toEqual([{ name: '@repo/a', range: '1.x || >=2.5.0 <3.0.0' }]);
  });

  test('reads past a note between items, and drops one trailing an entry', () => {
    expect(
      requiredPeers(
        withFrontmatter(
          'peer:',
          "  - '@repo/a@^1.0.0' # the gate runtime",
          '  # and the second one',
          "  - '@repo/b@^2.0.0'",
        ),
      ),
    ).toEqual([
      { name: '@repo/a', range: '^1.0.0' },
      { name: '@repo/b', range: '^2.0.0' },
    ]);
  });

  test('a name with no range still has to be installed', () => {
    expect(requiredPeers(withFrontmatter("peer: '@repo/a'"))).toEqual([
      { name: '@repo/a', range: '*' },
    ]);
    expect(requiredPeers(withFrontmatter("peer: '@repo/a@'"))).toEqual([
      { name: '@repo/a', range: '*' },
    ]);
  });

  test('names each peer once, keeping the range declared first', () => {
    expect(
      requiredPeers(
        withFrontmatter("peer: ['@repo/a@^1.0.0', '@repo/a@^9.0.0']"),
      ),
    ).toEqual([{ name: '@repo/a', range: '^1.0.0' }]);
  });

  test('declares nothing when the value is absent or only a note', () => {
    expect(requiredPeers(withFrontmatter('peer:', 'name: demo'))).toEqual([]);
    expect(
      requiredPeers(withFrontmatter('peer:', '  # nothing yet', 'name: demo')),
    ).toEqual([]);
  });

  test('finds nothing without frontmatter, and nothing without the key', () => {
    expect(requiredPeers("# Heading\n\npeer: '@repo/a@^1.0.0'")).toEqual([]);
    expect(requiredPeers(withFrontmatter('name: demo'))).toEqual([]);
    expect(requiredPeers('')).toEqual([]);
  });

  test('is not fooled by a key that merely starts with the same letters', () => {
    expect(requiredPeers(withFrontmatter("peers: ['@repo/a@^1.0.0']"))).toEqual(
      [],
    );
  });

  test('never adopts a value that belongs to another key', () => {
    expect(
      requiredPeers(withFrontmatter('peer:', 'paths:', "  - '@repo/a@^1.0.0'")),
    ).toEqual([]);
  });

  test('reads a block closed with CRLF, so a checkout style cannot disable it', () => {
    expect(
      requiredPeers("---\r\npeer: '@repo/a@^1.0.0'\r\n---\r\n\r\n# H"),
    ).toEqual([{ name: '@repo/a', range: '^1.0.0' }]);
  });

  test('leaves a requires: declaration alone, and is left alone by one', () => {
    // The two keys are read by the same machinery. Reading either as the other
    // would refuse a file for a requirement it never made.
    const content = withFrontmatter(
      'requires: [config.commands.install]',
      "peer: '@repo/a@^1.0.0'",
    );
    expect(requiredPeers(content)).toEqual([
      { name: '@repo/a', range: '^1.0.0' },
    ]);
  });
});
