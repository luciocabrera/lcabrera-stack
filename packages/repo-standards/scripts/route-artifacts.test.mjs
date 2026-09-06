import { describe, expect, it } from 'vite-plus/test';

import {
  artifactNamesIn,
  candidatesIn,
  describeFinding,
  groupByDirectory,
  normalizeSubject,
  routeArtifactReport,
} from './route-artifacts.mjs';

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
  it('passes the route modules the repo has today', () => {
    const paths = [
      'apps/docs-site/src/routes/reports/trigger-scan/triggerScan.constants.ts',
      'apps/docs-site/src/routes/reports/trigger-scan/TriggerScan.component.tsx',
      'apps/docs-site/src/routes/reports/project-detail/ProjectDetail.types.ts',
      'apps/docs-site/src/routes/reports/project-detail/ProjectDetail.component.tsx',
      'apps/docs-site/src/routes/reports/Reports.constants.tsx',
      'apps/docs-site/src/routes/reports/Reports.layout.tsx',
      'apps/showcase/src/routes/car-sales-infinite/CarSales.types.ts',
      'apps/showcase/src/routes/car-sales-infinite/CarSales.component.tsx',
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
