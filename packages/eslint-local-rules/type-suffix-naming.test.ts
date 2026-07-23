import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './type-suffix-naming.js';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run('type-suffix-naming', rule, {
  invalid: [
    // `Arguments` → `Args` applies everywhere, React file or not.
    {
      code: 'type FetchUserArguments = { readonly id: string };',
      errors: [{ messageId: 'useArgsSuffix' }],
      filename: 'src/services/fetchUser.service.ts',
      output: 'type FetchUserArgs = { readonly id: string };',
    },
    {
      code: 'type CardArguments = { readonly id: string };',
      errors: [{ messageId: 'useArgsSuffix' }],
      filename: 'src/components/Card/Card.types.tsx',
      output: 'type CardArgs = { readonly id: string };',
    },
    // `Properties` → `Props` is React-only, so this is the .tsx side of that
    // gate; the .ts side is asserted under `valid`.
    {
      code: 'type CardProperties = { readonly title: string };',
      errors: [{ messageId: 'usePropsSuffix' }],
      filename: 'src/components/Card/Card.types.tsx',
      output: 'type CardProps = { readonly title: string };',
    },
    {
      code: 'type CardProperties = { readonly title: string };',
      errors: [{ messageId: 'usePropsSuffix' }],
      filename: 'src/components/Card/Card.types.jsx',
      output: 'type CardProps = { readonly title: string };',
    },
    // Only the suffix is replaced — an inner `Arguments` in the name survives.
    {
      code: 'type ArgumentsParserArguments = { readonly raw: string };',
      errors: [{ messageId: 'useArgsSuffix' }],
      filename: 'src/utils/parse.util.ts',
      output: 'type ArgumentsParserArgs = { readonly raw: string };',
    },
  ],
  valid: [
    { code: 'type FetchUserArgs = { readonly id: string };', filename: 'a.ts' },
    {
      code: 'type CardProps = { readonly title: string };',
      filename: 'src/components/Card/Card.types.tsx',
    },
    // The React half of the gate: `Properties` is a legitimate name outside a
    // React file (a CSS/style or DB-column shape, say), so it must stay silent.
    {
      code: 'type CardProperties = { readonly title: string };',
      filename: 'src/styles/card.constants.ts',
    },
    // Substring, not suffix — `ArgumentsLog` is not a violation.
    { code: 'type ArgumentsLog = { readonly raw: string };', filename: 'a.ts' },
  ],
});
