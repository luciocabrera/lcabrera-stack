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
    // `.claude/rules/routes-data.md` is already written this way, so a matcher
    // bounded to one line would read a real declaration as absent — the silent
    // form of this gate not firing.
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
    // The exact declaration a shipped reference file already carries. Reading a
    // library version range as a config key would refuse to write a file that
    // needs nothing from the consumer.
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

  test('never adopts a bracket that belongs to another key', () => {
    expect(
      requiredConfigKeys(
        withFrontmatter('requires: react-router', "paths: ['config.profile']"),
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
