import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import rule from './no-type-definitions-in-components.js';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

// The rule gates on `context.filename`, so every case below is the SAME source
// under a different name. That is the point: a rule keyed to a filename suffix
// goes silently dead when the suffix convention moves, and a dead rule reports
// exactly as many findings as compliant code does — zero.
const typeAlias = 'type CardProps = { readonly title: string };';
const interfaceDeclaration = 'interface CardProps { title: string }';

ruleTester.run('no-type-definitions-in-components', rule, {
  invalid: [
    {
      code: typeAlias,
      errors: [{ messageId: 'noTypeInComponent' }],
      filename: 'src/components/Card/Card.component.tsx',
    },
    {
      code: interfaceDeclaration,
      errors: [{ messageId: 'noTypeInComponent' }],
      filename: 'src/components/Card/Card.component.tsx',
    },
    {
      code: typeAlias,
      errors: [{ messageId: 'noTypeInComponent' }],
      filename: 'src/root/Root.layout.tsx',
    },
    // The regression this test exists for. `filename-convention` enforces the
    // hyphenated spelling and rejects the camelCase `.errorBoundary` one, but
    // this rule still matched only `.errorBoundary.tsx` — so it fired on none
    // of the repo's seven error boundaries, and nothing noticed.
    {
      code: typeAlias,
      errors: [{ messageId: 'noTypeInComponent' }],
      filename: 'src/root/Root.error-boundary.tsx',
    },
    // Every offending declaration is reported, not just the first.
    {
      code: `${typeAlias}\ntype CardState = { readonly open: boolean };`,
      errors: [
        { messageId: 'noTypeInComponent' },
        { messageId: 'noTypeInComponent' },
      ],
      filename: 'src/components/Card/Card.component.tsx',
    },
  ],
  valid: [
    // The other side of the gate: types belong in these files.
    { code: typeAlias, filename: 'src/components/Card/Card.types.ts' },
    {
      code: interfaceDeclaration,
      filename: 'src/components/Card/Card.types.ts',
    },
    { code: typeAlias, filename: 'src/components/Card/Card.test.tsx' },
    { code: typeAlias, filename: 'src/utils/formatDate.util.ts' },
    // A component file with no type declaration is what compliance looks like.
    {
      code: 'export const Card = () => undefined;',
      filename: 'src/components/Card/Card.component.tsx',
    },
  ],
});
