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

  // The templates spell it as a comment so they stay parseable YAML — a bare
  // line sits where a sequence item belongs and `vp fmt` refuses the asset. So
  // the bare spelling is not this placeholder, and substituting must not treat
  // it as one.
  test('does not substitute a bare placeholder that is not a comment', () => {
    const content = workflow('      {{ci.setup}}');
    expect(substituteCiSetup({ content, setup: VP_STEP })).toBe(content);
  });

  // Spelled exactly like the real placeholder but for the name, so what is being
  // asserted is that the NAME is matched. Against `- run: {{commands.install}}`
  // this passes whatever the name pattern is, since the `#` and the line anchor
  // already reject it — a green test proving nothing.
  test('does not confuse a command placeholder for this one', () => {
    const content = workflow('      # {{commands.install}}');
    expect(substituteCiSetup({ content, setup: VP_STEP })).toBe(content);
  });
});
