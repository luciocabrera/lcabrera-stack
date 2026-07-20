import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import rule from './filename-convention.js';

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
  ],
  valid: [
    { code, filename: 'src/routes/x/order-detail/order-detail.loader.ts' },
    { code, filename: 'src/routes/x/order-detail/order-detail.meta.ts' },
    { code, filename: 'src/components/OrderDetail/OrderDetail.component.tsx' },
    { code, filename: 'src/hooks/useVirtualization.hook.ts' },
    // unenforced / unrecognised shapes are skipped
    { code, filename: 'src/routes/x/root.ts' },
    { code, filename: 'src/components/Card/index.ts' },
    { code, filename: 'src/design-system/tokens/colors.stylex.ts' },
    { code, filename: 'src/routes/x/orderClientAction.ts' },
    // deferred suffixes: util convention differs per package, so unenforced
    { code, filename: 'packages/utils/merge-arrays.util.ts' },
    { code, filename: 'src/utils/getFilteredOptions.util.ts' },
    // .errorBoundary / .layout are unenforced (route vs component-bundle)
    { code, filename: 'src/root/Root.errorBoundary.tsx' },
  ],
});
