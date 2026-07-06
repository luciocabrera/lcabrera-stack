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
    ]);
    expect(rows[0]).toEqual({
      category: 'unused_file',
      detail: { actions: [{ type: 'delete-file' }] },
      file_path: 'src/server.constants.ts',
    });
    expect(rows[1]).toMatchObject({
      category: 'unused_export',
      export_name: 'DEFAULT_SORTING',
      file_path: 'src/carSales.constants.ts',
      is_re_export: true,
      is_type_only: false,
      line: 3,
    });
    expect(rows[3]).toMatchObject({
      category: 'unused_dependency',
      dependency_location: 'dependencies',
      file_path: 'apps/admin_system/package.json',
      package_name: '@repo/data-access',
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
