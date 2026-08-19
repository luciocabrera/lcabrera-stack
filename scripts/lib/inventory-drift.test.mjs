import { describe, expect, it } from 'vite-plus/test';

import {
  describeFinding,
  exportedSymbolNames,
  isBaselined,
  isDocumented,
  missingExports,
  staleBaselineEntries,
  toBaseline,
  treeFor,
  utilFileEntries,
} from './inventory-drift.mjs';

describe('treeFor', () => {
  it('matches a file under one of the three governed trees', () => {
    expect(treeFor('packages/ui/src/hooks/useTheme.hook.ts')?.root).toBe(
      'packages/ui/src',
    );
    expect(treeFor('packages/server/src/db/get-pool.util.ts')?.root).toBe(
      'packages/server/src',
    );
    expect(treeFor('apps/react-router/src/auth/authMiddleware.ts')?.root).toBe(
      'apps/react-router/src',
    );
  });

  it('matches nothing for a file outside every tree', () => {
    // `packages/api` and `packages/utils` carry no INVENTORY.md — a file there
    // must not silently join `packages/ui/src` because it starts with `packages/`.
    expect(
      treeFor('packages/api/src/fetchAndValidate.util.ts'),
    ).toBeUndefined();
    expect(treeFor('scripts/verify-inventory.mjs')).toBeUndefined();
  });
});

describe('utilFileEntries', () => {
  it('keeps only *.util.ts / *.util.tsx files inside a governed tree', () => {
    const paths = [
      'packages/ui/src/hooks/useTheme.hook.ts',
      'packages/ui/src/utils/theme/theme.util.ts',
      'packages/ui/src/components/Button/utils/getButtonElement.util.tsx',
      'packages/api/src/fetchAndValidate.util.ts',
      'packages/ui/src/INVENTORY.md',
    ];
    expect(utilFileEntries(paths).map((entry) => entry.file)).toEqual([
      'packages/ui/src/utils/theme/theme.util.ts',
      'packages/ui/src/components/Button/utils/getButtonElement.util.tsx',
    ]);
  });

  it('excludes a colocated test file, which ends in .test.ts(x) not .util.ts(x)', () => {
    const paths = [
      'packages/ui/src/utils/theme/theme.util.ts',
      'packages/ui/src/utils/theme/theme.util.test.ts',
    ];
    expect(utilFileEntries(paths).map((entry) => entry.file)).toEqual([
      'packages/ui/src/utils/theme/theme.util.ts',
    ]);
  });
});

describe('exportedSymbolNames', () => {
  it('collects a named const export', () => {
    expect(exportedSymbolNames('export const getThing = () => 1;')).toEqual([
      'getThing',
    ]);
  });

  it('collects a named function export, sync or async', () => {
    expect(
      exportedSymbolNames(
        'export function getThing() {}\nexport async function loadThing() {}',
      ),
    ).toEqual(['getThing', 'loadThing']);
  });

  it('dedupes a name matched by more than one export declaration', () => {
    // Two matches of the same name, so this would still pass without the
    // `new Set(...)` wrapping unless the regex genuinely produced a dupe.
    expect(
      exportedSymbolNames(
        'export const getThing = () => 1;\nexport const getThing = () => 2;',
      ),
    ).toEqual(['getThing']);
  });

  it('ignores a bare re-export, which declares nothing new here', () => {
    expect(
      exportedSymbolNames("export { getThing } from './other.util.ts';"),
    ).toEqual([]);
  });
});

describe('isDocumented', () => {
  it('matches a name in a table row, ui-style', () => {
    expect(
      isDocumented('| `getThing` | `x.util.ts` | does a thing |', 'getThing'),
    ).toBe(true);
  });

  it('matches a name inside a prose parenthetical, server-style', () => {
    const prose =
      'Everything it composes (`expandGroupingSets`, `assertGroupKeys`) is private.';
    expect(isDocumented(prose, 'assertGroupKeys')).toBe(true);
  });

  it('does not let one name satisfy a longer name that contains it', () => {
    expect(isDocumented('| `getThingExtra` | ... |', 'getThing')).toBe(false);
  });
});

describe('missingExports', () => {
  const tree = {
    inventory: 'packages/ui/src/INVENTORY.md',
    root: 'packages/ui/src',
  };
  const inventoryTextByTree = new Map([
    [tree.root, 'The `documented` helper does the documented thing.'],
  ]);

  it('flags an export the tree inventory never names', () => {
    const entries = [
      {
        file: 'packages/ui/src/utils/x.util.ts',
        source: 'export const documented = 1;\nexport const missing = 2;',
        tree,
      },
    ];
    expect(missingExports(entries, inventoryTextByTree)).toEqual([
      { file: 'packages/ui/src/utils/x.util.ts', symbol: 'missing' },
    ]);
  });

  it('flags nothing when every export is named', () => {
    const entries = [
      {
        file: 'packages/ui/src/utils/x.util.ts',
        source: 'export const documented = 1;',
        tree,
      },
    ];
    expect(missingExports(entries, inventoryTextByTree)).toEqual([]);
  });
});

describe('toBaseline / isBaselined', () => {
  it('groups findings by file into a sorted, deduped shape', () => {
    const findings = [
      { file: 'b.util.ts', symbol: 'z' },
      { file: 'a.util.ts', symbol: 'y' },
      { file: 'a.util.ts', symbol: 'x' },
      { file: 'a.util.ts', symbol: 'x' },
    ];
    expect(toBaseline(findings)).toEqual({
      'a.util.ts': ['x', 'y'],
      'b.util.ts': ['z'],
    });
  });

  it('round-trips through isBaselined', () => {
    const baseline = toBaseline([{ file: 'a.util.ts', symbol: 'x' }]);
    expect(isBaselined(baseline, 'a.util.ts', 'x')).toBe(true);
    expect(isBaselined(baseline, 'a.util.ts', 'y')).toBe(false);
    expect(isBaselined(baseline, 'b.util.ts', 'x')).toBe(false);
  });
});

describe('staleBaselineEntries', () => {
  it('reports a grandfathered pair that is no longer missing', () => {
    const baseline = { 'a.util.ts': ['x', 'y'] };
    const stillMissing = [{ file: 'a.util.ts', symbol: 'x' }];
    expect(staleBaselineEntries(baseline, stillMissing)).toEqual([
      { file: 'a.util.ts', symbol: 'y' },
    ]);
  });

  it('reports nothing when every grandfathered pair is still missing', () => {
    const baseline = { 'a.util.ts': ['x'] };
    const stillMissing = [{ file: 'a.util.ts', symbol: 'x' }];
    expect(staleBaselineEntries(baseline, stillMissing)).toEqual([]);
  });
});

describe('describeFinding', () => {
  it('names the file and the undocumented symbol', () => {
    expect(
      describeFinding({
        file: 'packages/ui/src/utils/x.util.ts',
        symbol: 'missing',
      }),
    ).toBe(
      "packages/ui/src/utils/x.util.ts: `missing` is not named anywhere in its tree's INVENTORY.md",
    );
  });
});
