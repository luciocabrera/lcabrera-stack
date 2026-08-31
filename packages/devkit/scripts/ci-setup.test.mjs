import { describe, expect, test } from 'vite-plus/test';

import { substituteCiSetup } from './ci-setup.mjs';

const workflow = (...lines) =>
  ['jobs:', '  gate:', '    steps:', ...lines, ''].join('\n');

const VP_STEP = [
  '- name: Set up Vite+',
  '  uses: voidzero-dev/setup-vp@sha',
  '  with:',
  '    run-install: false',
];

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

  test('does not substitute a bare placeholder that is not a comment', () => {
    const content = workflow('      {{ci.setup}}');
    expect(substituteCiSetup({ content, setup: VP_STEP })).toBe(content);
  });

  test('does not confuse a command placeholder for this one', () => {
    const content = workflow('      # {{commands.install}}');
    expect(substituteCiSetup({ content, setup: VP_STEP })).toBe(content);
  });
});
