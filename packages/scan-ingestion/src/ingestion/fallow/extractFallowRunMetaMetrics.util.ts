import type { FallowRunSummaryInput } from './fallowDetail.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowRunMetaMetricsArgs = {
  readonly raw: FallowRaw;
};

/**
 * The run envelope — fallow's own version, kind and telemetry, which belong
 * to no single analysis section.
 *
 * Every sibling extractor returns an explicit `Pick` of the master row on
 * purpose: spread properties are exempt from TypeScript's excess-property
 * check, so without it a typo'd key would silently vanish from the composed
 * row instead of failing the build.
 */
export const extractFallowRunMetaMetrics = ({
  raw,
}: ExtractFallowRunMetaMetricsArgs): Pick<
  FallowRunSummaryInput,
  | 'analysis_run_id'
  | 'elapsed_ms'
  | 'fallow_version'
  | 'raw_kind'
  | 'raw_schema_version'
> => ({
  analysis_run_id: raw._meta?.telemetry?.analysis_run_id ?? undefined,
  elapsed_ms: raw.elapsed_ms ?? undefined,
  fallow_version: raw.version ?? undefined,
  raw_kind: raw.kind ?? undefined,
  raw_schema_version: raw.schema_version ?? undefined,
});
