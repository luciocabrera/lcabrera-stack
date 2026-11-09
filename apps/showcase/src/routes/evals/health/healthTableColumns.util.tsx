import type { TableColumn } from '@lcabrera/ui/components/Table/Table.types';

import { NavLink } from '@lcabrera/ui/components/NavLink';
import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';

import type { HealthClassRow, HealthRunRow } from './EvalsHealth.types';

export const HEALTH_CLASS_COLUMNS: readonly TableColumn<HealthClassRow>[] = [
  { key: 'outcome', label: 'Outcome' },
  {
    key: 'errorClass',
    label: 'Error class',
    render: ({ errorClass, isRateLimit }) =>
      isRateLimit ? (
        <StatusBadge label={errorClass} tone='error' />
      ) : (
        errorClass
      ),
  },
  { align: 'end', dataType: 'number', key: 'trials', label: 'Trials' },
  { align: 'end', dataType: 'number', key: 'runs', label: 'Runs' },
];

export const HEALTH_RUN_COLUMNS: readonly TableColumn<HealthRunRow>[] = [
  {
    key: 'label',
    label: 'Run',
    render: ({ href, label }) => (
      <NavLink to={href} variant='inline'>
        {label}
      </NavLink>
    ),
  },
  { align: 'end', dataType: 'number', key: 'trials', label: 'Trials' },
  { align: 'end', dataType: 'number', key: 'errors', label: 'Errors' },
  { align: 'end', dataType: 'number', key: 'timeouts', label: 'Timeouts' },
  {
    align: 'end',
    dataType: 'number',
    key: 'rateLimits',
    label: 'Rate limits',
  },
];
