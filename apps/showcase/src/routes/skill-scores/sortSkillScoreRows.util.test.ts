import { describe, expect, it } from 'vite-plus/test';

import { SKILL_SCORE_ROWS } from './SkillScores.constants';
import { sortSkillScoreRows } from './sortSkillScoreRows.util';

const skills = (rows: readonly { readonly skill: string }[]) =>
  rows.map((row) => row.skill);

describe('sortSkillScoreRows', () => {
  it('keeps the declared order with no sort', () => {
    expect(
      skills(sortSkillScoreRows({ rows: SKILL_SCORE_ROWS, sorting: [] })),
    ).toEqual(skills(SKILL_SCORE_ROWS));
  });

  it('sorts a number column descending', () => {
    const sorted = sortSkillScoreRows({
      rows: SKILL_SCORE_ROWS,
      sorting: [{ columnKey: 'overall', direction: 'desc' }],
    });

    expect(sorted[0]?.skill).toBe('epic');
  });

  it('breaks a tie with the next term', () => {
    const sorted = sortSkillScoreRows({
      rows: SKILL_SCORE_ROWS,
      sorting: [
        { columnKey: 'clarity', direction: 'asc' },
        { columnKey: 'skill', direction: 'desc' },
      ],
    });

    expect(skills(sorted).slice(0, 2)).toEqual([
      'unslop',
      'typescript-api-engineering',
    ]);
  });
});
