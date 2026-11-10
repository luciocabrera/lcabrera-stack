import type { BreadcrumbHandle } from '@lcabrera/ui';
import type { TableColumn } from '@lcabrera/ui/components/Table';

import { NavLink } from '@lcabrera/ui/components/NavLink';
import { StatusBadge } from '@lcabrera/ui/components/StatusBadge';
import {
  RATE_LIMIT_ERROR_CLASS,
  SESSION_LIMIT_ERROR_CLASS,
} from '@repo/eval-history/envelope/envelope.constants';

import type { HealthClassRow, HealthRunRow } from './EvalsHealth.types';

export const EVALS_HEALTH_HANDLE = {
  breadcrumb: () => [{ label: 'Evals', to: '/evals' }, { label: 'health' }],
} satisfies BreadcrumbHandle;

export const RATE_LIMIT_CLASSES: readonly string[] = [
  RATE_LIMIT_ERROR_CLASS,
  SESSION_LIMIT_ERROR_CLASS,
];

export const UNCLASSIFIED = 'unclassified';

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
