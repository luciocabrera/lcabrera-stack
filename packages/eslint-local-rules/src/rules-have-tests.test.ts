import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vite-plus/test';

import { rules } from './index.ts';

// Read with the literal `'src'` rather than a path built from
// `import.meta.dirname`: a computed argument trips
// security/detect-non-literal-fs-filename, and there is nothing to compute here.
// Vitest runs with its project root as the cwd — the package root, where
// vite.config.ts sits — so the rules are one level down, in `src`.
const entries = readdirSync('src');

const TEST_FILE_SUFFIX = '.test.ts';
const testedRules = new Set(
  entries
    .filter((entry) => entry.endsWith(TEST_FILE_SUFFIX))
    .map((entry) => entry.slice(0, -TEST_FILE_SUFFIX.length)),
);

// Guards the assumption above. If the cwd or the layout ever moves, the listing
// goes empty or wrong and every rule would look untested — a confusing failure.
// This one names the real cause instead. It earned its keep in the move to
// `src/`: it was the first thing to fail.
it('resolves the listing to the rule directory', () => {
  expect(entries).toContain('index.ts');
});

// The ratchet. Every rule in this plugin runs on every workspace, and four of
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

// The other way a rule stops being right without failing anything. ESLint prints
// `meta.docs.url` beside every finding it reports, so this string lands in a
// consumer's terminal — and nothing in this repository ever renders it, which is
// how eight of the ten rules shipped `https://example.com/rule/<name>`, the
// placeholder the first one was scaffolded from, while two pointed at a
// `/rules/<name>` path that has never existed.
//
// Asserting the URL against the factory that built it would pass whatever the
// factory said. These two assertions do not: the location is a literal here, and
// the anchor has to match a heading the README really carries.
const README = readFileSync('README.md', 'utf8');
const DOCS_LOCATION =
  'https://github.com/luciocabrera/lcabrera-stack/blob/main/packages/eslint-local-rules/README.md';

it('documents every rule at a URL that resolves', () => {
  const broken = Object.entries(rules).flatMap(([ruleName, rule]) => {
    const url = rule.meta.docs?.url;
    const documented = README.includes(`### \`${ruleName}\``);

    return documented && url === `${DOCS_LOCATION}#${ruleName}`
      ? []
      : [`${ruleName}: url=${url ?? 'none'} documented=${documented}`];
  });

  expect(broken).toEqual([]);
});
