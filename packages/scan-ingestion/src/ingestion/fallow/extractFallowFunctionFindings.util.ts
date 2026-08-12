import type { FallowFunctionFindingInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

import { makeFindingId } from '../../../../../.github/skills/code-smell-shared/scripts/deterministic-scan-shared.mjs';
import { buildFunctionFinding } from '../../../../../.github/skills/code-smell-shared/scripts/finding-templates.mjs';

type ExtractFallowFunctionFindingsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_function_findings rows (health.findings) — per-function
 * threshold violations. severity_raw keeps fallow's own critical|high|
 * moderate scale; severity is the canonical BLOCKER..NIT mapping (ADR-028
 * — previously lived only in the generic scan_findings layer, now stored
 * here directly along with rule_id/why/fix/confidence/effort/finding_id,
 * derived from the same finding-templates builder the .mjs report
 * generator calls).
 */
export const extractFallowFunctionFindings = ({
  raw,
}: ExtractFallowFunctionFindingsArgs): readonly FallowFunctionFindingInput[] =>
  (raw.health?.findings ?? []).map((finding) => {
    const template = buildFunctionFinding(finding);
    return {
      cognitive: finding.cognitive ?? undefined,
      col: finding.col ?? undefined,
      confidence: 'high',
      coverage_source: finding.coverage_source ?? undefined,
      coverage_tier: finding.coverage_tier ?? undefined,
      crap: finding.crap ?? undefined,
      cyclomatic: finding.cyclomatic ?? undefined,
      effort: template.effort,
      exceeded: finding.exceeded ?? undefined,
      file_path: finding.path,
      finding_id: makeFindingId(
        template.ruleId,
        template.locationPath,
        template.locationHint ?? '',
        template.why,
      ),
      fix: template.fix,
      function_name: finding.name ?? undefined,
      line: finding.line ?? undefined,
      line_count: finding.line_count ?? undefined,
      param_count: finding.param_count ?? undefined,
      rule_id: template.ruleId,
      severity: template.severity,
      severity_raw: finding.severity ?? undefined,
      why: template.why,
    };
  });
