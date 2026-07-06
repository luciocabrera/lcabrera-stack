import type { FallowDeadCodeInput } from './fallowDetail.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowDeadCodeArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_dead_code rows — every dead-code style item from the check
 * section flattened into one category-discriminated table. Auxiliary
 * evidence (actions / imported_from / used_in_workspaces) travels in the
 * detail jsonb column verbatim. Unused prod/dev/optional dependencies
 * share the 'unused_dependency' category, discriminated by
 * dependency_location (mirroring the location field in package.json).
 */
export const extractFallowDeadCode = ({
  raw,
}: ExtractFallowDeadCodeArgs): readonly FallowDeadCodeInput[] => {
  const check = raw.check;
  if (!check) {
    return [];
  }

  const unusedFiles = check.unused_files.map(
    (item): FallowDeadCodeInput => ({
      category: 'unused_file',
      detail: { actions: item.actions },
      file_path: item.path,
    }),
  );

  const unusedExports = check.unused_exports.map(
    (item): FallowDeadCodeInput => ({
      category: 'unused_export',
      col: item.col ?? undefined,
      detail: { actions: item.actions },
      export_name: item.export_name ?? undefined,
      file_path: item.path,
      is_re_export: item.is_re_export ?? undefined,
      is_type_only: item.is_type_only ?? undefined,
      line: item.line ?? undefined,
    }),
  );

  const unusedTypes = check.unused_types.map(
    (item): FallowDeadCodeInput => ({
      category: 'unused_type',
      col: item.col ?? undefined,
      detail: { actions: item.actions },
      export_name: item.export_name ?? undefined,
      file_path: item.path,
      is_re_export: item.is_re_export ?? undefined,
      is_type_only: item.is_type_only ?? undefined,
      line: item.line ?? undefined,
    }),
  );

  const unusedDependencies = [
    ...check.unused_dependencies.map((item) => ({
      fallbackLocation: 'dependencies',
      item,
    })),
    ...check.unused_dev_dependencies.map((item) => ({
      fallbackLocation: 'devDependencies',
      item,
    })),
    ...check.unused_optional_dependencies.map((item) => ({
      fallbackLocation: 'optionalDependencies',
      item,
    })),
  ].map(
    ({ fallbackLocation, item }): FallowDeadCodeInput => ({
      category: 'unused_dependency',
      dependency_location: item.location ?? fallbackLocation,
      detail: {
        actions: item.actions,
        used_in_workspaces: item.used_in_workspaces ?? undefined,
      },
      file_path: item.path ?? undefined,
      line: item.line ?? undefined,
      package_name: item.package_name,
    }),
  );

  const unlistedDependencies = check.unlisted_dependencies.map(
    (item): FallowDeadCodeInput => ({
      category: 'unlisted_dependency',
      detail: { actions: item.actions, imported_from: item.imported_from },
      file_path: item.imported_from[0]?.path ?? undefined,
      line: item.imported_from[0]?.line ?? undefined,
      package_name: item.package_name,
    }),
  );

  const unresolvedImports = check.unresolved_imports.map(
    (item): FallowDeadCodeInput => ({
      category: 'unresolved_import',
      col: item.col ?? undefined,
      detail: { actions: item.actions, specifier: item.specifier ?? undefined },
      file_path: item.path ?? undefined,
      line: item.line ?? undefined,
    }),
  );

  return [
    ...unusedFiles,
    ...unusedExports,
    ...unusedTypes,
    ...unusedDependencies,
    ...unlistedDependencies,
    ...unresolvedImports,
  ];
};
