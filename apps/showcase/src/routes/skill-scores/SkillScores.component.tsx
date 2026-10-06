import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { useLoaderData } from 'react-router';

import type { loader } from './skill-scores.loader';
import type { SkillScoreRow, SkillScoresResponse } from './SkillScores.types';

export const SkillScores = () => {
  const { columnsState, dataPromise, groupingState, metaState } =
    useLoaderData<typeof loader>();

  return (
    <TableLayout<SkillScoreRow, SkillScoresResponse>
      columnsState={columnsState}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      dataTotalSelector={(response) => response.total}
      groupingState={groupingState}
      metaState={metaState}
    />
  );
};
