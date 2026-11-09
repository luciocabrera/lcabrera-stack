import type { TableColumn } from '@lcabrera/ui/components/Table';

import { NavLink } from '@lcabrera/ui';

import type { FlakyRun, FlakyTaskRow } from './EvalsFlaky.types';

import { styles } from './EvalsFlaky.stylex';

export const flakyRunColumn = ({ label, runId }: FlakyRun) =>
  ({
    align: 'end',
    key: runId,
    label,
    render: ({ cells }) => {
      const cell = cells.find((candidate) => candidate.runId === runId);

      return (
        cell !== undefined && (
          <NavLink
            customStylex={cell.isSplit && styles.split}
            to={cell.href}
            variant='inline'
          >
            {cell.label}
          </NavLink>
        )
      );
    },
  }) satisfies TableColumn<FlakyTaskRow>;
