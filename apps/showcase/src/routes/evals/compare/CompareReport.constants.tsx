import type { TableColumn } from '@lcabrera/ui/components/Table';

import { NavLink, StatusBadge } from '@lcabrera/ui';

import type { FlippedTask } from './EvalsCompare.types';

import { subjectHref } from '../utils/subjectHref.util';

export const FLIP_COLUMNS: readonly TableColumn<FlippedTask>[] = [
  { key: 'taskKey', label: 'Task' },
  {
    key: 'subjectName',
    label: 'Subject',
    render: ({ subjectKind, subjectName }) => (
      <NavLink
        to={subjectHref({ kind: subjectKind, name: subjectName })}
        variant='inline'
      >
        {subjectName}
      </NavLink>
    ),
  },
  { align: 'end', key: 'a', label: 'A' },
  { align: 'end', key: 'b', label: 'B' },
  {
    key: 'change',
    label: 'Change',
    render: ({ change }) =>
      change === 'regressed' ? (
        <StatusBadge label={change} tone='error' />
      ) : (
        change
      ),
  },
];
