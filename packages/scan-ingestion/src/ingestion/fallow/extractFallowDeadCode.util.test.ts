import { describe, expect, it } from 'vitest';

import { extractFallowDeadCode } from './extractFallowDeadCode.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowDeadCode', () => {
  it('flattens every check category into category-discriminated rows', () => {
    const raw = fallowRawSchema.parse({
      check: {
        total_issues: 5,
        unlisted_dependencies: [
          {
            actions: [{ type: 'install-dependency' }],
            imported_from: [
              { col: 9, line: 3, path: 'apps/web/vite.config.ts' },
              { col: 9, line: 2, path: 'apps/shared/vite.config.ts' },
            ],
            package_name: 'vite-plus',
          },
        ],
        unused_dependencies: [
          {
            actions: [],
            line: 18,
            location: 'dependencies',
            package_name: '@repo/data-access',
            path: 'apps/admin_system/package.json',
            used_in_workspaces: ['apps/react-router'],
          },
        ],
        unused_exports: [
          {
            actions: [{ type: 'remove-export' }],
            col: 2,
            export_name: 'DEFAULT_SORTING',
            is_re_export: true,
            is_type_only: false,
            line: 3,
            path: 'src/carSales.constants.ts',
          },
        ],
        unused_files: [
          {
            actions: [{ type: 'delete-file' }],
            path: 'src/server.constants.ts',
          },
        ],
        unresolved_imports: [
          {
            actions: [{ type: 'fix-import' }],
            col: 12,
            line: 4,
            path: 'src/app/routes.ts',
            specifier: '@/missing/module',
          },
        ],
        unused_types: [
          {
            actions: [],
            export_name: 'BooleanFilter',
            is_type_only: true,
            line: 2,
            path: 'src/orders.types.ts',
          },
        ],
      },
    });

    const rows = extractFallowDeadCode({ raw });

    expect(rows.map((row) => row.category)).toEqual([
      'unused_file',
      'unused_export',
      'unused_type',
      'unused_dependency',
      'unlisted_dependency',
      'unresolved_import',
    ]);
    expect(rows[0]).toEqual({
      category: 'unused_file',
      confidence: 'high',
      detail: { actions: [{ type: 'delete-file' }] },
      effort: 'small',
      file_path: 'src/server.constants.ts',
      finding_id: expect.any(String),
      fix: 'Verify no dynamic/framework usage, then delete the file (or suppress with a fallow-ignore-file comment).',
      rule_id: 'fallow/unused-file',
      severity: 'MEDIUM',
      why: 'File is never imported from any detected entry point.',
    });
    expect(rows[1]).toMatchObject({
      category: 'unused_export',
      export_name: 'DEFAULT_SORTING',
      file_path: 'src/carSales.constants.ts',
      is_re_export: true,
      is_type_only: false,
      line: 3,
      rule_id: 'fallow/unused-export',
      severity: 'MEDIUM',
      why: 'Export `DEFAULT_SORTING` is never imported anywhere.',
    });
    expect(rows[3]).toMatchObject({
      category: 'unused_dependency',
      dependency_location: 'dependencies',
      file_path: 'apps/admin_system/package.json',
      package_name: '@repo/data-access',
      rule_id: 'fallow/unused-dependency',
      severity: 'HIGH',
    });
    expect(rows[3]?.detail).toMatchObject({
      used_in_workspaces: ['apps/react-router'],
    });
    // Unlisted deps have no single location — first import site is the anchor.
    expect(rows[4]).toMatchObject({
      category: 'unlisted_dependency',
      file_path: 'apps/web/vite.config.ts',
      line: 3,
      package_name: 'vite-plus',
      rule_id: 'fallow/unlisted-dependency',
      severity: 'HIGH',
    });
    expect(rows[5]).toEqual({
      category: 'unresolved_import',
      col: 12,
      confidence: 'high',
      detail: {
        actions: [{ type: 'fix-import' }],
        specifier: '@/missing/module',
      },
      effort: 'small',
      file_path: 'src/app/routes.ts',
      finding_id: expect.any(String),
      fix: 'Fix the import specifier or restore the missing module.',
      line: 4,
      rule_id: 'fallow/unresolved-import',
      severity: 'HIGH',
      why: 'Import `@/missing/module` cannot be resolved.',
    });
  });

  // Every unresolved-import field but `actions` is nullish in the schema
  // (the section was empty in every sampled run, so the shape is unverified
  // against real output) — the absent case is the one likely to show up first.
  it('omits the optional unresolved-import fields when only actions are present', () => {
    const raw = fallowRawSchema.parse({
      check: { unresolved_imports: [{ actions: [] }] },
    });

    const rows = extractFallowDeadCode({ raw });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      category: 'unresolved_import',
      col: undefined,
      detail: { actions: [], specifier: undefined },
      file_path: undefined,
      line: undefined,
      why: 'Import `<unknown>` cannot be resolved.',
    });
  });

  it('labels dev/optional dependency lists via dependency_location fallback', () => {
    const raw = fallowRawSchema.parse({
      check: {
        unused_dev_dependencies: [{ actions: [], package_name: 'left-pad' }],
        unused_optional_dependencies: [
          { actions: [], package_name: 'fsevents' },
        ],
      },
    });

    const rows = extractFallowDeadCode({ raw });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      category: 'unused_dependency',
      dependency_location: 'devDependencies',
      package_name: 'left-pad',
    });
    expect(rows[1]).toMatchObject({
      dependency_location: 'optionalDependencies',
    });
  });

  it('returns [] when the check section is missing', () => {
    expect(extractFallowDeadCode({ raw: fallowRawSchema.parse({}) })).toEqual(
      [],
    );
  });
});
