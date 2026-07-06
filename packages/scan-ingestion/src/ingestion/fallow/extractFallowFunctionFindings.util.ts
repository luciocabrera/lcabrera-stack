import type { FallowFunctionFindingInput } from './fallowDetail.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowFunctionFindingsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_function_findings rows (health.findings) — per-function
 * threshold violations. severity keeps fallow's own critical|high|moderate
 * scale; the canonical BLOCKER..NIT mapping lives only in the generic
 * scan_findings layer (produced by generate-fallow-report.mjs).
 */
export const extractFallowFunctionFindings = ({
  raw,
}: ExtractFallowFunctionFindingsArgs): readonly FallowFunctionFindingInput[] =>
  (raw.health?.findings ?? []).map((finding) => ({
    cognitive: finding.cognitive ?? undefined,
    col: finding.col ?? undefined,
    coverage_source: finding.coverage_source ?? undefined,
    coverage_tier: finding.coverage_tier ?? undefined,
    crap: finding.crap ?? undefined,
    cyclomatic: finding.cyclomatic ?? undefined,
    exceeded: finding.exceeded ?? undefined,
    file_path: finding.path,
    function_name: finding.name ?? undefined,
    line: finding.line ?? undefined,
    line_count: finding.line_count ?? undefined,
    param_count: finding.param_count ?? undefined,
    severity: finding.severity ?? undefined,
  }));
