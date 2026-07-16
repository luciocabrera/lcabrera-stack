const CATEGORY_SUFFIXES: readonly {
  readonly category: string;
  readonly suffix: string;
}[] = [
  { category: 'test', suffix: '.test.tsx' },
  { category: 'test', suffix: '.test.ts' },
  { category: 'test', suffix: '.spec.tsx' },
  { category: 'test', suffix: '.spec.ts' },
  { category: 'component', suffix: '.component.tsx' },
  { category: 'component', suffix: '.component.ts' },
  { category: 'hook', suffix: '.hook.ts' },
  { category: 'hook', suffix: '.hook.tsx' },
  { category: 'util', suffix: '.util.ts' },
  { category: 'util', suffix: '.util.tsx' },
  { category: 'service_api', suffix: '.api.ts' },
  { category: 'repository', suffix: '.repository.ts' },
  { category: 'controller', suffix: '.controller.ts' },
  { category: 'route', suffix: '.route.ts' },
  { category: 'route', suffix: '.route.tsx' },
  { category: 'types', suffix: '.types.ts' },
  { category: 'stylex', suffix: '.stylex.ts' },
  { category: 'constants', suffix: '.constants.ts' },
  { category: 'schema', suffix: '.schema.ts' },
];

/**
 * Suffix-convention classification (matches this monorepo's own file-naming
 * rules) — feeds the run's per-file inventory (TECH_SPEC §2.3), not a
 * generic language-agnostic classifier.
 */
export const classifyFileTypeCategory = (fileName: string): string => {
  const match = CATEGORY_SUFFIXES.find(({ suffix }) =>
    fileName.endsWith(suffix),
  );
  return match?.category ?? 'other';
};
