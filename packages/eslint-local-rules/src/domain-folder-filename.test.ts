import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './domain-folder-filename.ts';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test. The rule only inspects
// `context.filename`, so the `code` is an inert valid module in every case.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();
const code = 'export const value = 1;';

// The `valid` block below is a REGRESSION LIST, not a sample: every path in it
// is a real file in this repository, taken from a sweep of every `*.types.ts`
// and `*.constants.ts` outside node_modules and classified by hand. The naive
// version of this rule — "a `*.constants.ts` in folder `X` must be named
// `X.constants.ts`" — reports every one of them, and every report is wrong,
// which is why the rule has to tell the three folder shapes apart at all. Add a
// path here when a new legitimate shape appears; never relax the rule to make
// one pass.
ruleTester.run('domain-folder-filename', rule, {
  invalid: [
    // The #599 drift: one domain folder grew three `*.constants.ts` files where
    // the convention allows exactly one, named after the folder.
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename:
        'packages/server/src/db/group-query-builder/aggregate-sql.constants.ts',
    },
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename:
        'packages/server/src/db/group-query-builder/identifier-types.constants.ts',
    },
    // The #389 drift: a domain folder's types named for their contents.
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename: 'packages/server/src/errors/pg-error-fields.types.ts',
    },
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename: 'packages/server/src/db/executor.types.ts',
    },
    // A camelCase domain folder is a domain folder: repeating the folder name
    // as a prefix (`lint/lintViolation`) is the "description of its contents"
    // the convention rejects. These two paths no longer exist — they are the
    // findings this rule surfaced on the tree it was added to, kept here so a
    // later relaxation of the rule fails a test instead of passing quietly.
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename:
        'packages/scan-ingestion/src/ingestion/lint/lintViolation.types.ts',
    },
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename:
        'apps/worker/src/queue/deterministicScannerConfigs.constants.ts',
    },
    // A test file is checked against the subject it covers, so a misnamed
    // `*.constants.test.ts` cannot slip through where its subject could not.
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename: 'packages/server/src/filters/operators.constants.test.ts',
    },
    // An artifact folder still has to name the file after its artifact — the
    // exemption is from the FOLDER pairing, not from naming.
    {
      code,
      errors: [{ messageId: 'artifactNamed' }],
      filename: 'packages/ui/src/components/Table/persistence.constants.ts',
    },
    // `artifactFolders` is what exempts the route tree. Emptying it makes the
    // same route file fail, which is the probe that the exemption is real
    // rather than the rule being silent on that path for some other reason.
    // The path has to be one the folder pairing would REJECT — most route
    // folders name their module after the folder anyway (`trigger-scan/` holds
    // `triggerScan.constants.ts`, which normalizes equal), so those would pass
    // either way and prove nothing.
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename: 'apps/web/src/routes/car-sales-infinite/CarSales.types.ts',
      options: [{ artifactFolders: [] }],
    },
    // Each option REPLACES its default rather than extending it: naming `bits`
    // as the only catch-all folder takes `utils` out of the set.
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename: 'packages/ui/src/utils/theme.types.ts',
      options: [{ catchAllFolders: ['bits'] }],
    },
    // `pairedSuffixes` extends the pairing to a suffix this repo deliberately
    // leaves unenforced.
    {
      code,
      errors: [{ messageId: 'folderNamed' }],
      filename: 'packages/server/src/db/env.schema.ts',
      options: [{ pairedSuffixes: ['schema'] }],
    },
  ],
  valid: [
    // --- domain folders, named after the folder ---
    {
      code,
      filename:
        'packages/server/src/db/group-query-builder/group-query-builder.constants.ts',
    },
    { code, filename: 'packages/server/src/filters/filters.types.ts' },
    { code, filename: 'packages/server/src/crypto/crypto.constants.ts' },
    { code, filename: 'packages/server/src/db/db.types.ts' },
    { code, filename: 'packages/utils/src/formatters/formatters.constants.ts' },
    { code, filename: 'packages/api/src/http/http.types.ts' },
    // camelCase folder, camelCase file — same subject, different spelling
    {
      code,
      filename: 'apps/api/src/features/carSales/carSales.constants.ts',
    },
    {
      code,
      filename: 'packages/ui/src/components/Table/commands/commands.types.ts',
    },

    // --- artifact folders: a PascalCase folder holds one component/context ---
    { code, filename: 'packages/ui/src/components/Table/Table.constants.ts' },
    {
      code,
      filename:
        'packages/ui/src/components/Table/contexts/TableConfig/TableConfigContext.types.ts',
    },
    {
      code,
      filename:
        'packages/ui/src/components/Table/contexts/FiltersData/FiltersDataContext.types.ts',
    },
    {
      code,
      filename:
        'apps/web/src/features/showcase/ShowcasePage/ShowcasePage.types.ts',
    },

    // --- artifact folders: everything under a `routes/` tree ---
    // A route folder is a URL segment, and the module inside is named for the
    // route — which is kebab-case here and camel/Pascal in the file, and in
    // `car-sales-infinite` is not even the same word.
    {
      code,
      filename:
        'apps/web/src/routes/orders/trigger-sync/triggerSync.constants.ts',
    },
    {
      code,
      filename: 'apps/web/src/routes/orders/order-detail/OrderDetail.types.ts',
    },
    {
      code,
      filename: 'apps/web/src/routes/orders/Orders.constants.tsx',
    },
    {
      code,
      filename: 'apps/web/src/routes/car-sales-infinite/CarSales.types.ts',
    },
    {
      code,
      filename:
        'apps/web/src/routes/wide-alltypes-150/WideAlltypes150.constants.ts',
    },

    // --- catch-all folders: the folder names a kind, not a subject ---
    { code, filename: 'packages/ui/src/constants/virtualization.constants.ts' },
    { code, filename: 'packages/ui/src/types/theme.types.ts' },
    {
      code,
      filename:
        'packages/ui/src/design-system/constants/iconSizes.constants.ts',
    },
    {
      code,
      filename:
        'packages/ui/src/components/VirtualList/contexts/VirtualListContext.types.ts',
    },
    {
      code,
      filename:
        'packages/ui/src/components/Table/utils/persistence.constants.ts',
    },
    {
      code,
      filename:
        'packages/ui/src/components/Table/contexts/TableData/data/actions/fetchMoreData.types.ts',
    },
    {
      code,
      filename: 'apps/web/src/routes/car-sales/config/carSales.constants.ts',
    },
    // a package root is not a domain folder
    { code, filename: 'packages/agent-runner/src/runSkillAgent.types.ts' },

    // --- suffixes the rule does not pair ---
    { code, filename: 'packages/server/src/db/env.schema.ts' },
    { code, filename: 'packages/server/src/db/run-query.util.ts' },
    { code, filename: 'packages/server/src/db/get-pool.util.test.ts' },
    // no `<base>.<suffix>.<ext>` shape at all
    { code, filename: 'packages/server/src/index.ts' },
  ],
});
