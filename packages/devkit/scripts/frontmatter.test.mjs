import { describe, expect, test } from 'vite-plus/test';

import { requiredConfigKeys, requiresDeclarationLine } from './frontmatter.mjs';

const withFrontmatter = (...lines) =>
  ['---', ...lines, '---', '', '# Heading', ''].join('\n');

describe('requiredConfigKeys', () => {
  test('reads each config key out of a flow array', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter(
          'name: demo',
          'requires: [config.commands.install, config.paths.docs]',
        ),
      ),
    ).toEqual(['commands.install', 'paths.docs']);
  });

  test('reads the quoted spelling the other frontmatter here uses', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter("requires: ['config.commands.install']"),
      ),
    ).toEqual(['commands.install']);
  });

  test('reads a flow array a formatter has broken over several lines', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter(
          'requires:',
          '  [',
          "    'config.commands.install',",
          "    'config.paths.rules',",
          '  ]',
        ),
      ),
    ).toEqual(['commands.install', 'paths.rules']);
  });

  test('reads the block spelling of the same list', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter(
          'requires:',
          '  - config.commands.install',
          '  - config.paths.rules',
          'name: demo',
        ),
      ),
    ).toEqual(['commands.install', 'paths.rules']);
  });

  test('reads a lone scalar, however it is quoted', () => {
    expect(
      requiredConfigKeys(withFrontmatter('requires: config.commands.install')),
    ).toEqual(['commands.install']);
    expect(
      requiredConfigKeys(withFrontmatter('requires: "config.paths.docs"')),
    ).toEqual(['paths.docs']);
    expect(
      requiredConfigKeys(withFrontmatter("requires: 'config.profile'")),
    ).toEqual(['profile']);
  });

  test('reads the same list however the spelling is styled', () => {
    const spellings = {
      'block sequence': [
        'requires:',
        '  - config.paths.docs',
        '  - config.commands.install',
      ],
      'block sequence at the key indent': [
        'requires:',
        '- config.paths.docs',
        '- config.commands.install',
      ],
      'block sequence behind a blank line and a note': [
        'requires:',
        '',
        '  # what it cannot run without',
        '  - config.paths.docs',
        '  - config.commands.install',
      ],
      'flow array': ['requires: [config.paths.docs, config.commands.install]'],
      'flow array opening on the next line': [
        'requires:',
        "  ['config.paths.docs',",
        "   'config.commands.install']",
      ],
    };
    const read = Object.entries(spellings).map(([spelling, lines]) => [
      spelling,
      requiredConfigKeys(withFrontmatter(...lines, 'name: demo')),
    ]);
    expect(Object.fromEntries(read)).toEqual(
      Object.fromEntries(
        Object.keys(spellings).map((spelling) => [
          spelling,
          ['paths.docs', 'commands.install'],
        ]),
      ),
    );
  });

  test('reads past a note between items, and drops one trailing an entry', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter(
          'requires:',
          '  - config.paths.docs # where they land',
          '  # and the command it shells out to',
          '  - config.commands.install',
        ),
      ),
    ).toEqual(['paths.docs', 'commands.install']);
    expect(
      requiredConfigKeys(withFrontmatter('requires: config.profile # the one')),
    ).toEqual(['profile']);
  });

  test('declares nothing when the value is absent or only a note', () => {
    expect(
      requiredConfigKeys(withFrontmatter('requires:', 'name: demo')),
    ).toEqual([]);
    expect(
      requiredConfigKeys(
        withFrontmatter('requires:', '  # nothing yet', 'name: demo'),
      ),
    ).toEqual([]);
  });

  test('names each key once however often it is declared', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter(
          'requires: [config.paths.docs, config.paths.docs, config.profile]',
        ),
      ),
    ).toEqual(['paths.docs', 'profile']);
  });

  test('ignores a requires: that is not about this config', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter(
          'title: Middleware & Context API',
          'requires: [react-router@7.9.0+, v8_middleware: true]',
        ),
      ),
    ).toEqual([]);
  });

  test('finds nothing without frontmatter, and nothing without the key', () => {
    expect(
      requiredConfigKeys('# Heading\n\nrequires: [config.profile]'),
    ).toEqual([]);
    expect(requiredConfigKeys(withFrontmatter('name: demo'))).toEqual([]);
    expect(requiredConfigKeys('')).toEqual([]);
  });

  test('is not fooled by a horizontal rule opening the file', () => {
    expect(
      requiredConfigKeys(
        ['----', 'requires: [config.profile]', '----'].join('\n'),
      ),
    ).toEqual([]);
  });

  test('reads a block closed with CRLF, so a checkout style cannot disable it', () => {
    expect(
      requiredConfigKeys('---\r\nrequires: [config.profile]\r\n---\r\n\r\n# H'),
    ).toEqual(['profile']);
  });

  test('ignores an unclosed array rather than reading past the block', () => {
    expect(
      requiredConfigKeys(withFrontmatter('requires: [config.profile')),
    ).toEqual([]);
  });

  test('never adopts a value that belongs to another key', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter('requires: react-router', "paths: ['config.profile']"),
      ),
    ).toEqual([]);
    expect(
      requiredConfigKeys(
        withFrontmatter(
          'requires: react-router',
          'paths:',
          '  - config.profile',
        ),
      ),
    ).toEqual([]);
    expect(
      requiredConfigKeys(
        withFrontmatter('requires:', 'paths:', '  - config.profile'),
      ),
    ).toEqual([]);
  });
});

describe('requiresDeclarationLine', () => {
  test('points at the line a reader has to edit', () => {
    expect(
      requiresDeclarationLine(
        withFrontmatter('name: demo', 'requires: [config.profile]'),
      ),
    ).toBe(3);
  });

  test('is undefined when there is nothing declared', () => {
    expect(requiresDeclarationLine('# Heading')).toBeUndefined();
  });
});
