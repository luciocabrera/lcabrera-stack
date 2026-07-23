import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './single-component-export.js';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

const twoArrowExports = [
  'export const Card = () => undefined;',
  'export const CardHeader = () => undefined;',
].join('\n');

ruleTester.run('single-component-export', rule, {
  invalid: [
    {
      code: twoArrowExports,
      errors: [{ messageId: 'multipleComponentExports' }],
      filename: 'src/components/Card/Card.component.tsx',
    },
    // Function declarations count the same as arrow functions.
    {
      code: 'export function Card() {}\nexport function CardHeader() {}',
      errors: [{ messageId: 'multipleComponentExports' }],
      filename: 'src/components/Card/Card.component.tsx',
    },
    // Two declarators in one `export const` are still two exports.
    {
      code: 'export const Card = () => undefined,\n  CardHeader = () => undefined;',
      errors: [{ messageId: 'multipleComponentExports' }],
      filename: 'src/components/Card/Card.component.tsx',
    },
    // Reported once for the file, however many exports there are.
    {
      code: `${twoArrowExports}\nexport const CardFooter = () => undefined;`,
      errors: [{ messageId: 'multipleComponentExports' }],
      filename: 'src/components/Card/Card.component.tsx',
    },
  ],
  valid: [
    // The gate: only `.component.tsx` is constrained. A barrel or a util module
    // exporting several functions is normal and must stay silent.
    { code: twoArrowExports, filename: 'src/components/Card/index.ts' },
    { code: twoArrowExports, filename: 'src/utils/format.util.ts' },
    { code: twoArrowExports, filename: 'src/components/Card/Card.test.tsx' },
    // One component plus non-function exports is the shape the rule allows:
    // only functions are counted, so constants ride along.
    {
      code: 'export const CARD_GAP = 8;\nexport const Card = () => undefined;',
      filename: 'src/components/Card/Card.component.tsx',
    },
    {
      code: 'export const Card = () => undefined;',
      filename: 'src/components/Card/Card.component.tsx',
    },
  ],
});
