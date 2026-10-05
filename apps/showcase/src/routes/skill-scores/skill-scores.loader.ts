import { createTableRouteLoader } from '@lcabrera/ui/routing/loaders/createTableRouteLoader.util';

import { APP_ID } from '@/constants/app.constants';

import type { SkillScoreRow, SkillScoresResponse } from './SkillScores.types';

import {
  CELL_PALETTE,
  COLUMNS,
  PERSISTENCE_KEY,
  SKILL_SCORE_ROWS,
  TABLE_NAME,
  TITLE,
} from './SkillScores.constants';
import { sortSkillScoreRows } from './sortSkillScoreRows.util';

export const loader = createTableRouteLoader<
  SkillScoreRow,
  SkillScoresResponse
>({
  appId: APP_ID,
  cellPalette: CELL_PALETTE,
  columns: COLUMNS,
  fetchPage: async ({ effectiveSorting }) => ({
    data: sortSkillScoreRows({
      rows: SKILL_SCORE_ROWS,
      sorting: effectiveSorting,
    }),
    total: SKILL_SCORE_ROWS.length,
  }),
  includeFilters: false,
  persistenceKey: PERSISTENCE_KEY,
  tableName: TABLE_NAME,
  title: TITLE,
});
