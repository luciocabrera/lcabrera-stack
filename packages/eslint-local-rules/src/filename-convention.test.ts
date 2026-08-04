import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './filename-convention.ts';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test. The rule only inspects
// `context.filename`, so the `code` is an inert valid module in every case.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const code = 'export const value = 1;';

ruleTester.run('filename-convention', rule, {
  invalid: [
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/routes/enterprise-orders/edit-order/editOrder.action.ts',
    },
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/routes/enterprise-orders/edit-order/editOrder.loader.ts',
    },
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/routes/enterprise-orders/new-order/newOrder.meta.ts',
    },
    {
      // a route module inside a test file is still checked against its subject
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/routes/x/editOrder.action.test.ts',
    },
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/components/my_widget.component.tsx',
    },
    {
      code,
      errors: [{ messageId: 'hookPrefix' }],
      filename: 'src/hooks/virtualization.hook.ts',
    },
    // components: .layout / .error-boundary must be PascalCase
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/routes/x/enterprise-orders.error-boundary.tsx',
    },
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/routes/x/enterprise-orders.layout.tsx',
    },
    // the old camelCase .errorBoundary suffix is deprecated
    {
      code,
      errors: [{ messageId: 'deprecatedSuffix' }],
      filename: 'src/routes/x/EnterpriseOrders.errorBoundary.tsx',
    },
    {
      code,
      errors: [{ messageId: 'deprecatedSuffix' }],
      filename: 'src/routes/x/car-sales.errorBoundary.tsx',
    },
    // function-modules (util / service) default to camelCase — the rule flags a
    // kebab `.util` here with no options.
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'packages/utils/merge-arrays.util.ts',
    },
    // …but with `@lcabrera/utils`'s `{ suffixCase: { util: 'kebab-case' } }` option,
    // a camelCase `.util` is what fails — the rule stays live, not turned off.
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'packages/utils/src/arrays/mergeArrays.util.ts',
      options: [{ suffixCase: { util: 'kebab-case' } }],
    },
    {
      code,
      errors: [{ messageId: 'wrongCase' }],
      filename: 'src/routes/x/enterprise-orders.service.ts',
    },
  ],
  valid: [
    { code, filename: 'src/routes/x/order-detail/order-detail.loader.ts' },
    { code, filename: 'src/routes/x/order-detail/order-detail.meta.ts' },
    { code, filename: 'src/components/OrderDetail/OrderDetail.component.tsx' },
    { code, filename: 'src/hooks/useVirtualization.hook.ts' },
    // components: PascalCase base for view / layout / error boundary
    { code, filename: 'src/routes/x/EnterpriseOrders.error-boundary.tsx' },
    { code, filename: 'src/routes/x/EnterpriseOrders.layout.tsx' },
    { code, filename: 'src/root/Root.layout.tsx' },
    // function-modules → camelCase
    { code, filename: 'src/utils/getFilteredOptions.util.ts' },
    { code, filename: 'src/routes/x/enterpriseOrders.service.ts' },
    // …unless the suffixCase option overrides it (kebab `.util` in @lcabrera/utils)
    {
      code,
      filename: 'packages/utils/src/arrays/merge-arrays.util.ts',
      options: [{ suffixCase: { util: 'kebab-case' } }],
    },
    // unenforced / unrecognised shapes are skipped
    { code, filename: 'src/routes/x/root.ts' },
    { code, filename: 'src/components/Card/index.ts' },
    { code, filename: 'src/design-system/tokens/colors.stylex.ts' },
    { code, filename: 'src/routes/x/orderClientAction.ts' },
  ],
});

// The deprecation map is this repo's own migration history. Because the rule
// ships, a consumer must be able to replace or drop it — otherwise they inherit
// a rename they never made.
ruleTester.run('filename-convention (configured deprecations)', rule, {
  invalid: [
    {
      code: 'export const A = 1;',
      errors: [{ messageId: 'deprecatedSuffix' }],
      filename: 'Widget.oldThing.ts',
      options: [{ deprecatedSuffixes: { oldThing: 'new-thing' } }],
    },
  ],
  valid: [
    // An empty map drops this repo's deprecations entirely.
    {
      code: 'export const A = 1;',
      filename: 'Thing.errorBoundary.tsx',
      options: [{ deprecatedSuffixes: {} }],
    },
    // A consumer's own map does not inherit ours.
    {
      code: 'export const A = 1;',
      filename: 'Thing.errorBoundary.tsx',
      options: [{ deprecatedSuffixes: { legacy: 'modern' } }],
    },
  ],
});
