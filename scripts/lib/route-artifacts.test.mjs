import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { parseFileName as parseInRule } from '../../packages/eslint-local-rules/src/file-names.ts';
import {
  ARTIFACT_TREE_FOLDERS,
  artifactNamesIn,
  CATCH_ALL_FOLDERS,
  candidatesIn,
  describeFinding,
  groupByDirectory,
  normalizeSubject,
  PAIRED_SUFFIXES,
  parseFileName,
  routeArtifactReport,
} from './route-artifacts.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RULE_SOURCE = join(
  REPO_ROOT,
  'packages/eslint-local-rules/src/domain-folder-filename.ts',
);

// This module and `local-rules/domain-folder-filename` are two homes for one
// convention: the rule owns everything outside a route tree, this owns what it
// exempts. They must not disagree, and the copies below cannot be shared —
// the rule is TypeScript inside a published package, this is a root script that
// has to run on a fresh checkout with nothing built. So the copies are asserted
// instead, the way `commit-convention.mjs` and `git-exec.mjs` assert theirs.

/** The string entries of a `const NAME = [ … ]` literal in the rule's source. */
const defaultListInRule = (name) => {
  const source = readFileSync(RULE_SOURCE, 'utf8');
  const declaration = source.indexOf(`const ${name} = [`);
  const open = source.indexOf('[', declaration);
  const close = source.indexOf(']', open);
  const body = source
    .slice(open + 1, close)
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  // Odd-indexed segments of a split on the quote are the quoted contents —
  // linear, and no regex to backtrack.
  return body.split("'").filter((_, index) => index % 2 === 1);
};

describe('agreement with local-rules/domain-folder-filename', () => {
  it('parses a filename exactly as the rule does', () => {
    // Imported from the rule's own source, so this is equivalence rather than a
    // restatement. A parse that drifts would make this gate go quiet, and
    // silence is what a passing run looks like.
    const cases = [
      'apps/a/src/routes/car-sales/CarSales.types.ts',
      'apps/a/src/routes/reports/Reports.constants.tsx',
      'apps/a/src/routes/reports/trigger-scan/triggerScan.constants.ts',
      'apps/a/src/routes/x/editOrder.action.test.ts',
      'apps/a/src/routes/x/Root.error-boundary.tsx',
      'apps/a/src/routes/x/index.ts',
      'README.md',
    ];
    for (const filePath of cases) {
      expect(parseFileName(filePath)).toEqual(parseInRule(filePath));
    }
  });

  it('exempts the same folder kinds the rule calls catch-all', () => {
    expect(CATCH_ALL_FOLDERS).toEqual(
      defaultListInRule('DEFAULT_CATCH_ALL_FOLDERS'),
    );
  });

  it('walks the same trees the rule exempts', () => {
    expect(ARTIFACT_TREE_FOLDERS).toEqual(
      defaultListInRule('DEFAULT_ARTIFACT_FOLDERS'),
    );
  });

  it('checks the same file suffixes the rule pairs', () => {
    expect(PAIRED_SUFFIXES).toEqual(
      defaultListInRule('DEFAULT_PAIRED_SUFFIXES'),
    );
  });
});

describe('normalizeSubject', () => {
  it('collapses the three spellings the repo uses for one subject', () => {
    expect(normalizeSubject('trigger-scan')).toBe('triggerscan');
    expect(normalizeSubject('triggerScan')).toBe('triggerscan');
    expect(normalizeSubject('TriggerScan')).toBe('triggerscan');
  });

  it('keeps digits, which a route name may carry', () => {
    expect(normalizeSubject('wide-alltypes-150')).toBe('widealltypes150');
    expect(normalizeSubject('WideAlltypes150')).toBe('widealltypes150');
  });
});

describe('groupByDirectory', () => {
  it('collects the siblings of each directory', () => {
    expect(
      groupByDirectory(['a/b/one.ts', 'a/b/two.ts', 'a/c/three.ts']),
    ).toEqual(
      new Map([
        ['a/b', ['a/b/one.ts', 'a/b/two.ts']],
        ['a/c', ['a/c/three.ts']],
      ]),
    );
  });

  it('files a repo-root path under the root, not under a truncated name', () => {
    // `git ls-files` lists plenty of root-level files, and `lastIndexOf('/')`
    // is -1 for each. Taking `slice(0, -1)` there would bucket `README.md`
    // under a directory called `README.m`.
    expect(groupByDirectory(['README.md', 'package.json', 'a/b.ts'])).toEqual(
      new Map([
        ['', ['README.md', 'package.json']],
        ['a', ['a/b.ts']],
      ]),
    );
  });
});

describe('candidatesIn', () => {
  const paths = [
    'apps/a/src/routes/car-sales/CarSales.types.ts',
    'apps/a/src/routes/car-sales/CarSales.component.tsx',
    'apps/a/src/routes/car-sales/config/carSales.constants.ts',
    'packages/server/src/filters/filters.types.ts',
    'apps/a/src/routes/x/notes.md',
  ];

  it('takes the paired suffixes under a route tree', () => {
    expect(candidatesIn(paths)).toEqual([
      'apps/a/src/routes/car-sales/CarSales.types.ts',
    ]);
  });

  it('leaves everything outside a route tree to the ESLint rule', () => {
    // The two homes must not overlap: a domain folder is the rule's business.
    expect(candidatesIn(['packages/server/src/filters/nope.types.ts'])).toEqual(
      [],
    );
  });

  it('leaves a catch-all folder alone, as the rule does', () => {
    expect(
      candidatesIn([
        'apps/a/src/routes/car-sales/config/anything.constants.ts',
      ]),
    ).toEqual([]);
  });
});

describe('artifactNamesIn', () => {
  it('picks out every artifact suffix and drops the rest', () => {
    expect(
      artifactNamesIn([
        'r/CarSales.component.tsx',
        'r/carSales.loader.ts',
        'r/CarSales.stylex.ts',
        'r/CarSales.types.ts',
        'r/useThing.hook.ts',
        'r/Root.error-boundary.tsx',
        'r/carSales.clientAction.ts',
      ]),
    ).toEqual(['CarSales', 'carSales', 'Root']);
  });

  it('returns nothing for a folder with no artifact module', () => {
    expect(artifactNamesIn(['r/thing.util.ts', 'r/thing.test.ts'])).toEqual([]);
  });
});

describe('routeArtifactReport', () => {
  // Pinned as a regression list, the way domain-folder-filename.test.ts pins
  // its own: each of these is a real file that must keep passing, and each
  // passes for a different reason.
  it('passes the route modules the repo has today', () => {
    const paths = [
      // names the route module in a kebab-case folder
      'apps/docs-site/src/routes/reports/trigger-scan/triggerScan.constants.ts',
      'apps/docs-site/src/routes/reports/trigger-scan/TriggerScan.component.tsx',
      // names the component in a PascalCase-artifact folder
      'apps/docs-site/src/routes/reports/project-detail/ProjectDetail.types.ts',
      'apps/docs-site/src/routes/reports/project-detail/ProjectDetail.component.tsx',
      // a `.tsx` constants file at a route-container level
      'apps/docs-site/src/routes/reports/Reports.constants.tsx',
      'apps/docs-site/src/routes/reports/Reports.layout.tsx',
      // the folder name and the artifact name genuinely differ
      'apps/showcase/src/routes/car-sales-infinite/CarSales.types.ts',
      'apps/showcase/src/routes/car-sales-infinite/CarSales.component.tsx',
      // digits in the subject
      'apps/showcase/src/routes/wide-alltypes-150/WideAlltypes150.constants.ts',
      'apps/showcase/src/routes/wide-alltypes-150/WideAlltypes150.component.tsx',
    ];
    expect(routeArtifactReport(paths).findings).toEqual([]);
    expect(routeArtifactReport(paths).checked).toBe(5);
  });

  it('reports a file named after nothing in its folder', () => {
    const paths = [
      'apps/showcase/src/routes/car-sales/zzz-nope.constants.ts',
      'apps/showcase/src/routes/car-sales/CarSales.component.tsx',
    ];
    expect(routeArtifactReport(paths).findings).toEqual([
      {
        artifacts: ['CarSales'],
        filePath: 'apps/showcase/src/routes/car-sales/zzz-nope.constants.ts',
      },
    ]);
  });

  it('accepts a base that extends an artifact name', () => {
    // The same prefix relation `domain-folder-filename` uses inside an artifact
    // folder, so the two homes cannot disagree about `XContext.types.ts`.
    const paths = [
      'apps/a/src/routes/x/TableConfigContext.types.ts',
      'apps/a/src/routes/x/TableConfig.context.tsx',
    ];
    expect(routeArtifactReport(paths).findings).toEqual([]);
  });

  it('skips a folder that holds no artifact rather than guessing a name', () => {
    const paths = [
      'apps/a/src/routes/x/anything.types.ts',
      'apps/a/src/routes/x/useThing.hook.ts',
    ];
    const report = routeArtifactReport(paths);
    expect(report.findings).toEqual([]);
    expect(report.skipped).toEqual(['apps/a/src/routes/x/anything.types.ts']);
    expect(report.checked).toBe(0);
  });

  it('does not let a sibling directory satisfy the check', () => {
    const paths = [
      'apps/a/src/routes/x/nope.types.ts',
      'apps/a/src/routes/x/inner/Inner.component.tsx',
      'apps/a/src/routes/x/X.component.tsx',
    ];
    expect(routeArtifactReport(paths).findings).toHaveLength(1);
  });
});

describe('describeFinding', () => {
  it('names each artifact the file could legitimately be renamed to', () => {
    expect(
      describeFinding({
        artifacts: ['CarSales', 'car-sales'],
        filePath: 'apps/a/src/routes/car-sales/zzz-nope.constants.ts',
      }),
    ).toBe(
      "apps/a/src/routes/car-sales/zzz-nope.constants.ts: 'zzz-nope.constants' names no artifact in its folder — rename it (git mv) to one of: CarSales.constants, car-sales.constants",
    );
  });
});
