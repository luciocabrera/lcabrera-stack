import { describe, expect, test } from 'vite-plus/test';

import {
  extractRunScripts,
  extractSecretReferences,
  extractUses,
} from './closure-yaml.mjs';

describe('extractUses', () => {
  test('reads the value and drops the pinning comment', () => {
    expect(extractUses('      - uses: actions/checkout@abc123 # v7\n')).toEqual(
      [{ line: 1, target: 'actions/checkout@abc123' }],
    );
  });

  test('reads a quoted value on its own line', () => {
    expect(
      extractUses(
        '    steps:\n      - name: x\n        uses: "./.github/actions/x"\n',
      ),
    ).toEqual([{ line: 3, target: './.github/actions/x' }]);
  });

  test('a commented-out step declares nothing', () => {
    expect(extractUses('      # uses: actions/checkout@v5\n')).toEqual([]);
  });
});

describe('extractRunScripts', () => {
  test('reads an inline command', () => {
    expect(extractRunScripts('      - run: corepack enable\n')).toEqual([
      { line: 1, text: 'corepack enable' },
    ]);
  });

  test('unquotes a value written as a scalar', () => {
    expect(extractRunScripts("        run: '$GATES/repo-verify-pr'\n")).toEqual(
      [{ line: 1, text: '$GATES/repo-verify-pr' }],
    );
  });

  test('reads every line of a block scalar and stops at the next key', () => {
    const content = [
      '      - name: Install',
      '        run: |',
      '          npm ci',
      '',
      '          npm run build',
      '      - name: Test',
      '        run: npm test',
    ].join('\n');

    expect(extractRunScripts(content)).toEqual([
      { line: 3, text: '          npm ci' },
      { line: 5, text: '          npm run build' },
      { line: 7, text: 'npm test' },
    ]);
  });

  test('a folded scalar is read the same way', () => {
    expect(
      extractRunScripts('        run: >-\n          echo hello\n'),
    ).toEqual([{ line: 2, text: '          echo hello' }]);
  });
});

describe('extractSecretReferences', () => {
  test('reads a name and whether the expression answers its absence', () => {
    const content = [
      `          A: \${{ secrets.PUBLISH_TOKEN }}`,
      `          B: \${{ secrets.REPO_ADMIN_TOKEN || github.token }}`,
    ].join('\n');

    expect(extractSecretReferences(content)).toEqual([
      { fallback: false, line: 1, name: 'PUBLISH_TOKEN' },
      { fallback: true, line: 2, name: 'REPO_ADMIN_TOKEN' },
    ]);
  });

  test('prose naming a secret outside an expression declares nothing', () => {
    expect(
      extractSecretReferences('# set secrets.PUBLISH_TOKEN first\n'),
    ).toEqual([]);
  });

  test('a secret is answered by what follows its own `||`, not the expression', () => {
    const content = [
      `          A: \${{ secrets.PUBLISH_TOKEN || secrets.FALLBACK_TOKEN }}`,
      `          B: \${{ inputs.ref || secrets.REPO_ADMIN_TOKEN }}`,
    ].join('\n');

    expect(extractSecretReferences(content)).toEqual([
      { fallback: true, line: 1, name: 'PUBLISH_TOKEN' },
      { fallback: false, line: 1, name: 'FALLBACK_TOKEN' },
      { fallback: false, line: 2, name: 'REPO_ADMIN_TOKEN' },
    ]);
  });

  test('an expression carrying a stray brace is left unread', () => {
    expect(
      extractSecretReferences(`          A: \${{ secrets.PUBLISH_TOKEN{ }}\n`),
    ).toEqual([]);
  });
});
