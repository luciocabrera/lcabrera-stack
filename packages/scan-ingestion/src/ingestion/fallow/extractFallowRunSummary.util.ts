import type { FallowRunSummaryInput } from './fallowDetail.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

import { extractFallowCheckMetrics } from './extractFallowCheckMetrics.util.ts';
import { extractFallowCodeHealthSignals } from './extractFallowCodeHealthSignals.util.ts';
import { extractFallowDupesMetrics } from './extractFallowDupesMetrics.util.ts';
import { extractFallowGraphSignals } from './extractFallowGraphSignals.util.ts';
import { extractFallowHealthScoreMetrics } from './extractFallowHealthScoreMetrics.util.ts';
import { extractFallowHealthSectionMetrics } from './extractFallowHealthSectionMetrics.util.ts';
import { extractFallowHealthSummaryMetrics } from './extractFallowHealthSummaryMetrics.util.ts';
import { extractFallowRunMetaMetrics } from './extractFallowRunMetaMetrics.util.ts';
import { extractFallowVitalSignCounts } from './extractFallowVitalSignCounts.util.ts';

type ExtractFallowRunSummaryArgs = {
  readonly raw: FallowRaw;
};

/**
 * The cqms.fallow_runs master row (1:1 with the scan, ADR-019 addendum) —
 * the wide run-level metrics row assembled from every section of the
 * combined fallow output. NOT NULL columns are always emitted (with 0
 * fallbacks) because jsonb_to_record never applies column DEFAULTs; the
 * nullable ones fall back to undefined, which JSON.stringify drops and
 * Postgres reads as SQL NULL.
 *
 * One extractor per source section, each owning its own fallbacks: the row
 * is 66 fields wide, and mapping them inline made a single function of
 * cyclomatic 133 — not from branching logic but from one `?.` and one `??`
 * per field. Splitting by section is what the shape was already saying.
 */
export const extractFallowRunSummary = ({
  raw,
}: ExtractFallowRunSummaryArgs): FallowRunSummaryInput => {
  const vitalSigns = raw.health?.vital_signs;

  return {
    ...extractFallowRunMetaMetrics({ raw }),
    ...extractFallowCheckMetrics({ check: raw.check }),
    ...extractFallowDupesMetrics({ stats: raw.dupes?.stats }),
    ...extractFallowHealthScoreMetrics({ healthScore: raw.health_score }),
    ...extractFallowHealthSectionMetrics({ health: raw.health }),
    ...extractFallowHealthSummaryMetrics({ summary: raw.health?.summary }),
    ...extractFallowCodeHealthSignals({ vitalSigns }),
    ...extractFallowGraphSignals({ vitalSigns }),
    ...extractFallowVitalSignCounts({ counts: vitalSigns?.counts }),
  };
};
