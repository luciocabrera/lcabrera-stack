import type { qualitySkills } from './qualitySkills.util';

export type QualityDimensionRow = QualitySkill['dimensions'][number] & {
  readonly skill: string;
};

type QualitySkill = ReturnType<typeof qualitySkills>[number];
