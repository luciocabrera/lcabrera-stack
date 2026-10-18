import { ALL_FAIL, ALL_PASS } from './report.constants.ts';

export const hiddenSkillOutcomes = (skill: string) => (taskKey: string) =>
  taskKey.startsWith(`${skill}/trigger`) ? ALL_FAIL : ALL_PASS;
