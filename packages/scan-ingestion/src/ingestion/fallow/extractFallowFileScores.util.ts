import type { FallowFileScoreInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowFileScoresArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_file_scores rows — one per scored file (health.file_scores),
 * the per-file analytics backbone (maintainability, complexity, fan-in/out,
 * CRAP). Paths are kept exactly as fallow reports them (git-root-relative).
 */
export const extractFallowFileScores = ({
  raw,
}: ExtractFallowFileScoresArgs): readonly FallowFileScoreInput[] =>
  (raw.health?.file_scores ?? []).map((score) => ({
    complexity_density: score.complexity_density ?? undefined,
    crap_above_threshold: score.crap_above_threshold ?? undefined,
    crap_max: score.crap_max ?? undefined,
    dead_code_ratio: score.dead_code_ratio ?? undefined,
    fan_in: score.fan_in,
    fan_out: score.fan_out,
    file_path: score.path,
    function_count: score.function_count ?? undefined,
    lines: score.lines ?? undefined,
    maintainability_index: score.maintainability_index ?? undefined,
    total_cognitive: score.total_cognitive ?? undefined,
    total_cyclomatic: score.total_cyclomatic ?? undefined,
  }));
