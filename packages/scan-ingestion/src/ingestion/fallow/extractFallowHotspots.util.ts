import type { FallowRaw } from './fallowRaw.schema.ts';

import { type FallowHotspotInput } from './fallowDetail.types.ts';

type ExtractFallowHotspotsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_hotspots rows — git-churn × complexity hotspots
 * (health.hotspots). The recommendation actions are deliberately not
 * stored: they are templated remediation text derivable from the metrics.
 */
export const extractFallowHotspots = ({
  raw,
}: ExtractFallowHotspotsArgs): readonly FallowHotspotInput[] =>
  (raw.health?.hotspots ?? []).map((hotspot) => ({
    commits: hotspot.commits ?? undefined,
    complexity_density: hotspot.complexity_density ?? undefined,
    fan_in: hotspot.fan_in ?? undefined,
    file_path: hotspot.path,
    lines_added: hotspot.lines_added ?? undefined,
    lines_deleted: hotspot.lines_deleted ?? undefined,
    score: hotspot.score ?? undefined,
    trend: hotspot.trend ?? undefined,
    weighted_commits: hotspot.weighted_commits ?? undefined,
  }));
