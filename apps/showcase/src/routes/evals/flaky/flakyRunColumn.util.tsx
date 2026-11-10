import type { TableColumn } from '@lcabrera/ui/components/Table';

import { NavLink, StatusBadge } from '@lcabrera/ui';

import type { FlakyRun, FlakyTaskRow } from './EvalsFlaky.types';

export const flakyRunColumn = ({ label, runId }: FlakyRun) =>
  ({
    align: 'end',
    key: runId,
    label,
    render: ({ cells }) => {
      const cell = cells.find((candidate) => candidate.runId === runId);

      return (
        cell !== undefined && (
          <NavLink to={cell.href} variant='inline'>
            {cell.isSplit ? (
              <StatusBadge label={cell.label} tone='warning' />
            ) : (
              cell.label
            )}
          </NavLink>
        )
      );
    },
  }) satisfies TableColumn<FlakyTaskRow>;
