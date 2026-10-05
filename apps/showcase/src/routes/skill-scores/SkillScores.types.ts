export type SkillScoreRow = {
  readonly anti_patterns: number;
  readonly change: number;
  readonly clarity: number;
  readonly completeness: number;
  readonly overall: number;
  readonly scope_coverage: number;
  readonly skill: string;
  readonly trigger_precision: number;
};

export type SkillScoresResponse = {
  readonly data: readonly SkillScoreRow[];
  readonly total: number;
};
