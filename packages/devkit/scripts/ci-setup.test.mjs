import { describe, expect, test } from 'vite-plus/test';

import { needsCiSetup, substituteCiSetup } from './ci-setup.mjs';

const workflow = (...lines) =>
  ['jobs:', '  gate:', '    steps:', ...lines, ''].join('\n');

const VP_STEP = [
  '- name: Set up Vite+',
  '  uses: voidzero-dev/setup-vp@sha',
  '  with:',
  '    run-install: false',
];

describe('needsCiSetup', () => {
  test('sees the placeholder on its own line', () => {
    expect(needsCiSetup(workflow('      # {{ci.setup}}'))).toBe(true);
  });

  test('is false for content that never asks', () => {
    expect(needsCiSetup(workflow('      - run: echo hi'))).toBe(false);
  });

  // The templates spell it as a comment so they stay parseable YAML; a bare
  // line would break `vp fmt` on the asset itself.
  test('ignores a bare placeholder that is not a comment', () => {
    expect(needsCiSetup(workflow('      {{ci.setup}}'))).toBe(false);
  });

  test('does not confuse a command placeholder for this one', () => {
    expect(needsCiSetup(workflow('      - run: {{commands.install}}'))).toBe(
      false,
    );
  });

  // The regex is module-scope and global, so `lastIndex` survives a call. Two
  // identical questions must get the same answer.
  test('answers the same twice', () => {
    const content = workflow('      # {{ci.setup}}');
    expect([needsCiSetup(content), needsCiSetup(content)]).toEqual([
      true,
      true,
    ]);
  });
});

describe('substituteCiSetup', () => {
  test('indents every line to where the placeholder sat', () => {
    expect(
      substituteCiSetup({
        content: workflow('      # {{ci.setup}}', '      - run: install'),
        setup: VP_STEP,
      }),
    ).toBe(
      workflow(
        '      - name: Set up Vite+',
        '        uses: voidzero-dev/setup-vp@sha',
        '        with:',
        '          run-install: false',
        '',
        '      - run: install',
      ),
    );
  });

  // Deleting only the placeholder TEXT would leave an indented blank line in
  // every consumer whose runner needs nothing, which is the majority of them.
  test('takes the whole line when there are no steps', () => {
    expect(
      substituteCiSetup({
        content: workflow('      # {{ci.setup}}', '      - run: install'),
        setup: [],
      }),
    ).toBe(workflow('      - run: install'));
  });

  test('treats an absent setup as no steps', () => {
    expect(
      substituteCiSetup({ content: workflow('      # {{ci.setup}}') }),
    ).toBe(workflow());
  });

  // Trailing whitespace on an otherwise empty line is what a YAML linter flags
  // first, and it would arrive in every consumer's repository.
  test('leaves a blank line inside the block unindented', () => {
    expect(
      substituteCiSetup({
        content: workflow('    # {{ci.setup}}'),
        setup: ['- name: A', '', '- name: B'],
      }),
    ).toBe(workflow('    - name: A', '', '    - name: B', ''));
  });

  test('leaves content alone when it has no placeholder', () => {
    const content = workflow('      - run: install');
    expect(substituteCiSetup({ content, setup: VP_STEP })).toBe(content);
  });
});
