import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './no-explanatory-comments.ts';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

const ANNOTATED = [
  '/**',
  ' * @param {{ a?: readonly string[] }} [options]',
  ' */',
  'export const make = ({ a = [] } = {}) => a;',
].join('\n');

ruleTester.run('no-explanatory-comments', rule, {
  invalid: [
    {
      code: [
        "import { x } from './x.ts';",
        '',
        '// Reads the thing and returns it.',
        'export const read = () => x;',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        '/** Reads the thing. */',
        'function read() {',
        '  return x;',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        'export const read = () => {',
        '  // Guard against the empty case first.',
        '  return x;',
        '};',
      ].join('\n'),
      errors: [{ messageId: 'insideDeclaration' }],
    },
    {
      code: [
        "import { useState } from 'react';",
        '',
        'export const Panel = () => {',
        '  const [open] = useState(false);',
        '  return <div>{/* the chevron points down when open */}{open}</div>;',
        '};',
      ].join('\n'),
      errors: [{ messageId: 'insideDeclaration' }],
      filename: 'Panel.component.tsx',
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        '// The shape the reader hands back.',
        'type Result = { readonly value: typeof x };',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        'type Result = {',
        '  /** Absent while the first read is in flight. */',
        '  readonly value?: typeof x;',
        '};',
      ].join('\n'),
      errors: [{ messageId: 'insideDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        '// The shape the reader hands back.',
        'interface Result {',
        '  readonly value: typeof x;',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        'enum Mode {',
        '  /** The only mode a link written before rollup existed can name. */',
        '  Flat = 0,',
        '}',
        'export const mode = Mode.Flat === x;',
      ].join('\n'),
      errors: [{ messageId: 'insideDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        '// Memoised because the parent re-renders on every keystroke.',
        'export const Row = memo(() => x);',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        "// The clear half of the set — `deriveToggle`'s `target: undefined`.",
        'export const CLEAR_COMMAND = { id: x };',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        'export class Store {',
        '  // The last value read, or undefined before the first read.',
        '  value = x;',
        '}',
      ].join('\n'),
      errors: [{ messageId: 'insideDeclaration' }],
    },
    {
      code: ["import { x } from './x.ts';", '', ANNOTATED].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
      filename: 'make.ts',
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        '// keep-me this stays only when configured to',
        'export const read = () => x;',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
    },
    {
      code: ["import { x } from './x.ts';", '', ANNOTATED].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' }],
      filename: 'make.mjs',
      options: [{ annotationTags: ['@other'] }],
    },
  ],
  valid: [
    {
      code: [
        '/**',
        ' * Why this module exists, in the one position the rule exempts.',
        ' */',
        '',
        "import { x } from './x.ts';",
        '',
        'export const read = () => x;',
      ].join('\n'),
    },
    {
      code: [
        '// Why this module exists, with no import between it and the code.',
        'export const read = () => 1;',
      ].join('\n'),
    },
    {
      code: [
        "import { render } from '@testing-library/react';",
        '',
        '// @vitest-environment jsdom',
        "import { Panel } from './Panel.component.tsx';",
        '',
        'export const mount = () => render(<Panel />);',
      ].join('\n'),
      filename: 'Panel.component.test.tsx',
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        'export const read = () => {',
        '  // v8 ignore next',
        '  if (x === undefined) return 0;',
        '  return x;',
        '};',
      ].join('\n'),
    },
    {
      code: ["import { x } from './x.ts';", '', ANNOTATED].join('\n'),
      filename: 'make.mjs',
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        'const value = x;',
        '',
        '// Above a statement rather than a declaration, so out of scope.',
        'export { value };',
      ].join('\n'),
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        'const value = x; // trailing on the line above, not a heading',
        'export const read = () => value;',
      ].join('\n'),
    },
    {
      code: [
        "import { x } from './x.ts';",
        '',
        '// keep-me this is configured as a directive prefix',
        'export const read = () => x;',
      ].join('\n'),
      options: [{ directives: ['keep-me'] }],
    },
  ],
});
