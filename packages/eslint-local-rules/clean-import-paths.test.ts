import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vite-plus/test';

import rule from './clean-import-paths.js';

// RuleTester drives a test framework through these static hooks; wire them to
// vitest's so each case surfaces as a normal test rather than a bare throw.
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run('clean-import-paths', rule, {
  invalid: [
    {
      code: "import { Card } from './Card/index';",
      errors: [{ messageId: 'cleanImportPath' }],
      output: "import { Card } from './Card';",
    },
    {
      code: "import { Card } from './Card/index.ts';",
      errors: [{ messageId: 'cleanImportPath' }],
      output: "import { Card } from './Card';",
    },
    {
      code: "import { Card } from './Card.tsx';",
      errors: [{ messageId: 'cleanImportPath' }],
      output: "import { Card } from './Card';",
    },
    {
      code: "import { Button } from '@/components/Button/index.tsx';",
      errors: [{ messageId: 'cleanImportPath' }],
      output: "import { Button } from '@/components/Button';",
    },
    // The original quote style is preserved, not normalised — that is the
    // formatter's job, and rewriting it here would fight Oxfmt.
    {
      code: 'import { Card } from "./Card/index";',
      errors: [{ messageId: 'cleanImportPath' }],
      output: 'import { Card } from "./Card";',
    },
    // Re-exports are covered too, both named and star.
    {
      code: "export { Card } from './Card/index';",
      errors: [{ messageId: 'cleanImportPath' }],
      output: "export { Card } from './Card';",
    },
    {
      code: "export * from './Card/index';",
      errors: [{ messageId: 'cleanImportPath' }],
      output: "export * from './Card';",
    },
    // A bare directory self-reference normalises to an explicit './'.
    {
      code: "import { Card } from './index';",
      errors: [{ messageId: 'cleanImportPath' }],
      output: "import { Card } from './';",
    },
  ],
  valid: [
    "import { Card } from './Card';",
    "import { Button } from '@/components/Button';",
    "import { helper } from '../helper';",
    "export * from './Card';",
    // External packages are none of this rule's business: their paths are
    // resolved by the package's own exports map, so stripping an extension or
    // an `/index` segment there could break resolution outright.
    "import { useState } from 'react';",
    "import styles from 'some-pkg/dist/index.css';",
    "import { x } from '@scope/pkg/index.js';",
    // A local module that genuinely ends in `index` without being a barrel.
    "import { reindex } from './reindex';",
  ],
});
