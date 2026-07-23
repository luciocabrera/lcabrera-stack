import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './merge-duplicate-imports.js';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

// Removing the duplicate leaves the newline that separated it behind, so every
// `output` below ends in one. Asserting the exact text is the point: this rule
// rewrites whole import statements, and its fix has already been wrong once.
ruleTester.run('merge-duplicate-imports', rule, {
  invalid: [
    {
      code: "import { A } from './m';\nimport { B } from './m';",
      errors: [{ messageId: 'duplicateImport' }],
      output: "import { A, B } from './m';\n",
    },
    // One report per duplicate past the first, and one merged result.
    {
      code: "import { A } from './m';\nimport { B } from './m';\nimport { C } from './m';",
      errors: [
        { messageId: 'duplicateImport' },
        { messageId: 'duplicateImport' },
      ],
      output: "import { A, B, C } from './m';\n\n",
    },
    // Aliases are carried across verbatim.
    {
      code: "import { A as X } from './m';\nimport { A as Y } from './m';",
      errors: [{ messageId: 'duplicateImport' }],
      output: "import { A as X, A as Y } from './m';\n",
    },
    // The same binding imported twice collapses to one specifier.
    {
      code: "import { A } from './m';\nimport { A } from './m';",
      errors: [{ messageId: 'duplicateImport' }],
      output: "import { A } from './m';\n",
    },
    // A default import merges as `default as <local>`, which is valid syntax.
    {
      code: "import Card from './m';\nimport { B } from './m';",
      errors: [{ messageId: 'duplicateImport' }],
      output: "import { default as Card, B } from './m';\n",
    },
    // Type-only imports merge with each other, keeping the `type` keyword.
    {
      code: "import type { A } from './m';\nimport type { B } from './m';",
      errors: [{ messageId: 'duplicateImport' }],
      output: "import type { A, B } from './m';\n",
    },
    // Bare specifiers are treated like any other source.
    {
      code: "import { useState } from 'react';\nimport { useMemo } from 'react';",
      errors: [{ messageId: 'duplicateImport' }],
      output: "import { useState, useMemo } from 'react';\n",
    },
  ],
  valid: [
    "import { A, B } from './m';",
    "import { A } from './m';\nimport { B } from './other';",
    // Different import kinds cannot share a statement, so they are left alone.
    "import type { A } from './m';\nimport { b } from './m';",
    // A namespace import cannot be expressed inside braces. The fix used to
    // emit `import { * as ns, B } from './m';` — valid-looking, and a syntax
    // error. There is nothing mergeable here, so the rule stays silent.
    "import * as ns from './m';\nimport { B } from './m';",
    "import * as ns from './m';\nimport * as other from './m';",
  ],
});
