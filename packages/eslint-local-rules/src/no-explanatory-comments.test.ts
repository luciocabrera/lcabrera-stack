import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './no-explanatory-comments.ts';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

const src = (...lines: readonly string[]) =>
  ["import { x } from './x.ts';", '', ...lines].join('\n');

const ok = (...lines: readonly string[]) => ({ code: src(...lines) });

const directive = (name: string) =>
  `// ${name} pinned as a fixture, not a live suppression`;

const above = (...lines: readonly string[]) => ({
  code: src(...lines),
  errors: [{ messageId: 'aboveDeclaration' as const }],
});

const inside = (...lines: readonly string[]) => ({
  code: src(...lines),
  errors: [{ messageId: 'insideDeclaration' as const }],
});

const ANNOTATED = [
  '/**',
  ' * @param {{ a?: readonly string[] }} [options]',
  ' */',
  'export const make = ({ a = [] } = {}) => a;',
].join('\n');

ruleTester.run('no-explanatory-comments', rule, {
  invalid: [
    above('// Reads the thing and returns it.', 'export const read = () => x;'),
    above('/** Reads the thing. */', 'function read() {', '  return x;', '}'),
    inside(
      'export const read = () => {',
      '  // Guard against the empty case first.',
      '  return x;',
      '};',
    ),
    {
      code: [
        "import { useState } from 'react';",
        '',
        'export const Panel = () => {',
        '  const [open] = useState(false);',
        '  return <div>{/* the chevron points down when open */}{open}</div>;',
        '};',
      ].join('\n'),
      errors: [{ messageId: 'insideDeclaration' as const }],
      filename: 'Panel.component.tsx',
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    },
    above(
      '// The shape the reader hands back.',
      'type Result = { readonly value: typeof x };',
    ),
    above(
      '// The shape the reader hands back.',
      'export type Exported = { readonly value: typeof x };',
    ),
    inside(
      'export type Descriptor = {',
      '  /**',
      '   * A rationale paragraph rather than a one-line note, which is not what a',
      '   * published member carries.',
      '   */',
      '  readonly column?: typeof x;',
      '};',
    ),
    inside(
      'export type Descriptor = {',
      '  /** Absent means off. See ADR-063 for why. */',
      '  readonly column?: typeof x;',
      '};',
    ),
    inside(
      'export type Descriptor = {',
      '  /** Absent means off, as #850 established. */',
      '  readonly column?: typeof x;',
      '};',
    ),
    {
      ...inside(
        'export type Descriptor = {',
        '  /** A note that runs past the configured budget for a member note. */',
        '  readonly column?: typeof x;',
        '};',
      ),
      options: [{ memberNoteMaxLength: 20 }],
    },
    inside(
      'type Result = {',
      '  /** Absent while the first read is in flight. */',
      '  readonly value?: typeof x;',
      '};',
    ),
    above(
      '// The shape the reader hands back.',
      'interface Result {',
      '  readonly value: typeof x;',
      '}',
    ),
    inside(
      'enum Mode {',
      '  /** The only mode a link written before rollup existed can name. */',
      '  Flat = 0,',
      '}',
      'export const mode = Mode.Flat === x;',
    ),
    above(
      '// Memoised because the parent re-renders on every keystroke.',
      'export const Row = memo(() => x);',
    ),
    above(
      "// The clear half of the set — `deriveToggle`'s `target: undefined`.",
      'export const CLEAR_COMMAND = { id: x };',
    ),
    inside(
      'export class Store {',
      '  // The last value read, or undefined before the first read.',
      '  value = x;',
      '}',
    ),
    { ...above(ANNOTATED), filename: 'make.ts' },
    above(
      '// keep-me this stays only when configured to',
      'export const read = () => x;',
    ),
    {
      ...above(ANNOTATED),
      filename: 'make.mjs',
      options: [{ annotationTags: ['@other'] }],
    },
    {
      code: [
        '// Why this module exists, and it imports nothing.',
        '',
        '/** The suffixes a component file may carry. */',
        'export const SUFFIXES = [".component.tsx"];',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' as const }],
    },
    {
      code: [
        '#!/usr/bin/env node',
        '',
        '/**',
        ' * Why this module exists.',
        ' */',
        '',
        '/** The rule whose silence this gate exists to catch. */',
        'export const PROBE_RULE = 1;',
      ].join('\n'),
      errors: [{ messageId: 'aboveDeclaration' as const }],
      filename: 'probe.mjs',
    },
    {
      code: src(
        '// prettier-ignore',
        'export const read = () => {',
        '  // v8 ignore next',
        '  if (x === undefined) return 0;',
        '  return x;',
        '};',
      ),
      errors: [
        { messageId: 'aboveDeclaration' as const },
        { messageId: 'insideDeclaration' as const },
      ],
      options: [{ directives: [] }],
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
    ok('// prettier-ignore', 'export const read = () => x;'),
    ok(
      directive('react-doctor-disable-next-line'),
      'export const Panel = () => x;',
    ),
    ok(directive('react-doctor-disable-line'), 'export const Row = () => x;'),
    ok(directive('react-doctor-disable'), 'export const Cell = () => x;'),
    ok(directive('NOSONAR'), 'export const run = () => x;'),
    ok(
      directive('fallow-ignore-next-line complexity'),
      'export const walk = () => x;',
    ),
    ok(
      'export const read = () => {',
      '  // v8 ignore next',
      '  if (x === undefined) return 0;',
      '  return x;',
      '};',
    ),
    { ...ok(ANNOTATED), filename: 'make.mjs' },
    ok(
      'export type Descriptor = {',
      '  /** Defaults to `*`. */',
      '  readonly column?: typeof x;',
      '};',
    ),
    ok(
      'export interface Options {',
      "  /** IANA time zone, e.g. `'UTC'`. */",
      '  readonly timeZone?: typeof x;',
      '}',
    ),
    ok(
      'export enum Mode {',
      '  /** Emitted when every key is rolled up. */',
      '  Flat = 0,',
      '}',
    ),
    {
      ...ok(
        'export type Descriptor = {',
        '  /** A note held to a shorter budget than the default. */',
        '  readonly column?: typeof x;',
        '};',
      ),
      options: [{ memberNoteMaxLength: 60 }],
    },
    ok(
      'const value = x;',
      '',
      '// Above a statement rather than a declaration, so out of scope.',
      'export { value };',
    ),
    ok(
      'const value = x; // trailing on the line above, not a heading',
      'export const read = () => value;',
    ),
    {
      code: [
        '#!/usr/bin/env node',
        '',
        '/**',
        ' * Why this module exists, below a shebang that is not the header.',
        ' */',
        '',
        'export const read = () => 1;',
      ].join('\n'),
      filename: 'run.mjs',
    },
    {
      code: [
        '// Why this module exists, in a header of several adjacent lines',
        '// that carry on without a blank line between them.',
        'export const read = () => 1;',
      ].join('\n'),
    },
    {
      code: ['#!/usr/bin/env node', '', 'export const read = () => 1;'].join(
        '\n',
      ),
      filename: 'bare.mjs',
    },
    {
      ...ok(
        '// keep-me this is configured as a directive prefix',
        'export const read = () => x;',
      ),
      options: [{ directives: ['keep-me'] }],
    },
  ],
});
