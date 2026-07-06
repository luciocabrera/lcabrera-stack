import type { FallowRaw } from './fallowRaw.schema.ts';

import { type FallowTargetInput } from './fallowDetail.types.ts';

type ExtractFallowTargetsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_targets rows (health.targets) — fallow's own prioritized
 * refactoring recommendations. factors/evidence are structured but
 * shape-variable per category, so they stay jsonb.
 */
export const extractFallowTargets = ({
  raw,
}: ExtractFallowTargetsArgs): readonly FallowTargetInput[] =>
  (raw.health?.targets ?? []).map((target) => ({
    category: target.category ?? undefined,
    confidence: target.confidence ?? undefined,
    effort: target.effort ?? undefined,
    efficiency: target.efficiency ?? undefined,
    evidence: target.evidence ?? undefined,
    factors: target.factors ?? undefined,
    file_path: target.path,
    priority: target.priority ?? undefined,
    recommendation: target.recommendation ?? undefined,
  }));
