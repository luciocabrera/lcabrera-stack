import type { FallowCircularDependencyInput } from './fallowDetail.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

import { makeFindingId } from '../../../../../.github/skills/code-smell-shared/scripts/deterministic-scan-shared.mjs';
import { buildCircularDependencyFinding } from '../../../../../.github/skills/code-smell-shared/scripts/finding-templates.mjs';

type ExtractFallowCircularDependenciesArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_circular_dependencies rows (check.circular_dependencies).
 * entry_file_path denormalizes files[0] for cheap filtering; the full
 * ordered cycle and its import edges stay in jsonb. rule_id/severity/why/
 * fix/confidence/effort/finding_id (ADR-028) come from the same
 * finding-templates builder the .mjs report generator calls.
 */
export const extractFallowCircularDependencies = ({
  raw,
}: ExtractFallowCircularDependenciesArgs): readonly FallowCircularDependencyInput[] =>
  (raw.check?.circular_dependencies ?? []).map((cycle) => {
    const template = buildCircularDependencyFinding(cycle);
    return {
      col: cycle.col ?? undefined,
      confidence: 'high',
      cycle_length: cycle.length ?? cycle.files.length,
      edges: cycle.edges ?? undefined,
      effort: template.effort,
      entry_file_path: cycle.files[0] ?? undefined,
      files: cycle.files,
      finding_id: makeFindingId(
        template.ruleId,
        template.locationPath,
        template.locationHint ?? '',
        template.why,
      ),
      fix: template.fix,
      line: cycle.line ?? undefined,
      rule_id: template.ruleId,
      severity: template.severity,
      why: template.why,
    };
  });
