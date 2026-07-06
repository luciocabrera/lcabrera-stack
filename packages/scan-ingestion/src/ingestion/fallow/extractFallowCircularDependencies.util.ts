import type { FallowCircularDependencyInput } from './fallowDetail.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowCircularDependenciesArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_circular_dependencies rows (check.circular_dependencies).
 * entry_file_path denormalizes files[0] for cheap filtering; the full
 * ordered cycle and its import edges stay in jsonb.
 */
export const extractFallowCircularDependencies = ({
  raw,
}: ExtractFallowCircularDependenciesArgs): readonly FallowCircularDependencyInput[] =>
  (raw.check?.circular_dependencies ?? []).map((cycle) => ({
    col: cycle.col ?? undefined,
    cycle_length: cycle.length ?? cycle.files.length,
    edges: cycle.edges ?? undefined,
    entry_file_path: cycle.files[0] ?? undefined,
    files: cycle.files,
    line: cycle.line ?? undefined,
  }));
