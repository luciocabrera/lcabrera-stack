import type { ProjectLlmCostRow } from '@repo/scan-ingestion/queries/getProjectLlmCost.util';

import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { createEmptyColumnsState } from '@lcabrera/ui/components/Table/utils/createEmptyColumnsState.util';

import type { ProjectLlmCostTableProps } from './ProjectLlmCostTable.types';

import { PROJECT_LLM_COST_COLUMNS } from './ProjectLlmCostTable.constants';

export const ProjectLlmCostTable = ({
  projectCostPromise,
}: ProjectLlmCostTableProps) => (
  <TableLayout<ProjectLlmCostRow, readonly ProjectLlmCostRow[]>
    columnsState={createEmptyColumnsState({
      columns: PROJECT_LLM_COST_COLUMNS,
    })}
    dataPromise={projectCostPromise}
    dataSelector={(rows) => rows}
    metaState={{ title: { plural: 'Projects', singular: 'Project' } }}
  />
);
