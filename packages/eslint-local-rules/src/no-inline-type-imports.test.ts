import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './no-inline-type-imports.ts';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
// (@typescript-eslint/rule-tester defaults the TypeScript parser, which these
// `import type` fixtures need — espree cannot read any of them.)
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run('no-inline-type-imports', rule, {
  invalid: [
    // Case 2: a value import whose specifiers are ALL inline types.
    {
      code: "import { type Foo } from 'bar';",
      errors: [{ messageId: 'noInlineTypeImport' }],
      output: "import type { Foo } from 'bar';",
    },
    {
      code: "import { type Foo, type Baz } from 'bar';",
      errors: [{ messageId: 'noInlineTypeImport' }],
      output: "import type { Foo, Baz } from 'bar';",
    },
    {
      code: "import { type Foo as Renamed } from 'bar';",
      errors: [{ messageId: 'noInlineTypeImport' }],
      output: "import type { Foo as Renamed } from 'bar';",
    },

    // Case 1: an `import type` that redundantly repeats `type` inline.
    {
      code: "import type { type Foo } from 'bar';",
      errors: [{ messageId: 'redundantInlineType' }],
      output: "import type { Foo } from 'bar';",
    },
    {
      code: "import type { type Foo as Renamed } from 'bar';",
      errors: [{ messageId: 'redundantInlineType' }],
      output: "import type { Foo as Renamed } from 'bar';",
    },
    // The load-bearing case for the fixer's filter+map: only SOME specifiers
    // carry the redundant inline `type`. Every specifier must survive the
    // rewrite, in source order — a filter that dropped the plain ones would
    // silently delete `Foo` from the import.
    {
      code: "import type { Foo, type Baz } from 'bar';",
      errors: [{ messageId: 'redundantInlineType' }],
      output: "import type { Foo, Baz } from 'bar';",
    },
    {
      code: "import type { type Foo, Baz, type Qux } from 'bar';",
      errors: [{ messageId: 'redundantInlineType' }],
      output: "import type { Foo, Baz, Qux } from 'bar';",
    },
    // The source text of the module specifier is reused verbatim, so a double
    // quoted path must come back double quoted.
    {
      code: 'import { type Foo } from "bar";',
      errors: [{ messageId: 'noInlineTypeImport' }],
      output: 'import type { Foo } from "bar";',
    },
    // The declaration's range covers its semicolon, so replacing the node drops
    // one unless it is carried over — the fixer used to, and Oxfmt quietly put
    // it back on the next format. These two pin the punctuation to the source.
    {
      code: "import { type Foo } from 'bar'",
      errors: [{ messageId: 'noInlineTypeImport' }],
      output: "import type { Foo } from 'bar'",
    },
    {
      code: "import type { type Foo } from 'bar'",
      errors: [{ messageId: 'redundantInlineType' }],
      output: "import type { Foo } from 'bar'",
    },
  ],
  valid: [
    // Already correct.
    "import type { Foo } from 'bar';",
    "import type { Foo, Baz } from 'bar';",
    // Plain value imports.
    "import { foo } from 'bar';",
    "import foo from 'bar';",
    "import * as foo from 'bar';",
    "import 'bar';",
    // Mixed value + inline type is deliberately NOT reported — rewriting it to
    // `import type` would break the value import. typescript-eslint owns this.
    "import { type Foo, baz } from 'bar';",
    "import { baz, type Foo } from 'bar';",
    // A default import alongside an inline type is likewise mixed.
    "import foo, { type Baz } from 'bar';",
  ],
});
