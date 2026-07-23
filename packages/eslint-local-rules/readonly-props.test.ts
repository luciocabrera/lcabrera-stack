import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './readonly-props.js';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run('readonly-props', rule, {
  invalid: [
    {
      code: 'type ButtonProps = { onClick: () => void };',
      errors: [{ messageId: 'requireReadonly' }],
      output: 'type ButtonProps = { readonly onClick: () => void };',
    },
    // The children case this convention exists for: required and readonly.
    {
      code: 'type AppProvidersProps = { children: ReactNode };',
      errors: [{ messageId: 'requireReadonly' }],
      output: 'type AppProvidersProps = { readonly children: ReactNode };',
    },
    // Optional members need it too — `?` is not a substitute for `readonly`.
    {
      code: 'type CardProps = { padding?: string };',
      errors: [{ messageId: 'requireReadonly' }],
      output: 'type CardProps = { readonly padding?: string };',
    },
    // Every offending member is reported, not just the first.
    {
      code: 'type ModalProps = { isOpen: boolean; readonly title: string; onClose: () => void };',
      errors: [
        { messageId: 'requireReadonly' },
        { messageId: 'requireReadonly' },
      ],
      output:
        'type ModalProps = { readonly isOpen: boolean; readonly title: string; readonly onClose: () => void };',
    },
    // Members declared alongside an inherited native-element type are ours.
    {
      code: "type NavbarProps = ComponentPropsWithoutRef<'nav'> & { isCompact: boolean };",
      errors: [{ messageId: 'requireReadonly' }],
      output:
        "type NavbarProps = ComponentPropsWithoutRef<'nav'> & { readonly isCompact: boolean };",
    },
  ],
  valid: [
    'type ButtonProps = { readonly onClick: () => void };',
    'type AppProvidersProps = { readonly children: ReactNode };',
    'type CardProps = { readonly padding?: string };',
    // Inherited React members are not ours to change — the intersection's
    // non-literal side is never inspected.
    "type CardProps = ComponentPropsWithoutRef<'div'> & { readonly color?: CardColor };",
    "type InputProps = ComponentPropsWithRef<'input'>;",
    // Not a props type — broader readonly discipline is documented, not
    // mechanised here.
    'type CarSalesRepository = { getAll: () => Promise<Row[]> };',
    // A method signature cannot carry `readonly`.
    'type PanelProps = { render(): ReactNode };',
    // Index signatures use a different modifier position.
    'type DictProps = { readonly [key: string]: string };',
  ],
});
