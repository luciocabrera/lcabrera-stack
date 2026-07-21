import { readdirSync } from 'node:fs';
import { expect, it } from 'vitest';

import { rules } from './rules.js';

// Read with the literal `'.'` rather than a path built from `import.meta.dirname`:
// a computed argument trips security/detect-non-literal-fs-filename, and there is
// nothing to compute here. Vitest runs with its project root as the cwd, and this
// package's vite.config.ts sits beside these rules, so `'.'` is this directory.
const entries = readdirSync('.');

const TEST_FILE_SUFFIX = '.test.ts';
const testedRules = new Set(
  entries
    .filter((entry) => entry.endsWith(TEST_FILE_SUFFIX))
    .map((entry) => entry.slice(0, -TEST_FILE_SUFFIX.length)),
);

// Guards the assumption above. If the cwd ever moves, the listing goes empty or
// wrong and every rule would look untested — a confusing failure. This one names
// the real cause instead.
it('resolves the cwd to the rule directory', () => {
  expect(entries).toContain('index.ts');
});

// The ratchet. Every rule in this plugin runs on all 17 workspaces, and four of
// them decide whether to run at all from a filename suffix — so a rule can stop
// matching anything without a single test failing or a single finding appearing.
// `no-type-definitions-in-components` sat dead on every error boundary in the
// repo for exactly that reason: it matched the camelCase `.errorBoundary.tsx`
// spelling that `filename-convention` had already replaced.
//
// A missing test is what let that happen, so the missing test is what fails now.
it('has a colocated test for every registered rule', () => {
  const untested = Object.keys(rules).filter(
    (ruleName) => !testedRules.has(ruleName),
  );

  expect(untested).toEqual([]);
});
