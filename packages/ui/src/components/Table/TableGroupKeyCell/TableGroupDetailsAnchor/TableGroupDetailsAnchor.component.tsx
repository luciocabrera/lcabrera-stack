import * as stylex from '@stylexjs/stylex';
import { Link, useLocation } from 'react-router';

import { useGetTableGroupingPeriods } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import type { TableGroupDetailsAnchorProps } from './TableGroupDetailsAnchor.types';

import { resolveGroupDetailsHref } from '../utils/resolveGroupDetailsHref.util';
import { tableGroupDetailsAnchorStyles } from './TableGroupDetailsAnchor.stylex';

export const TableGroupDetailsAnchor = ({
  groupDetailsPath,
  groupingKeys,
  summary,
  text,
}: TableGroupDetailsAnchorProps) => {
  const periods = useGetTableGroupingPeriods();
  const { search } = useLocation();

  const href = resolveGroupDetailsHref({
    groupDetailsPath,
    groupingKeys,
    periods,
    search,
    summary,
  });

  if (href === undefined) return text;

  return (
    <Link
      {...stylex.props(tableGroupDetailsAnchorStyles.link)}
      data-testid='table-group-details-link'
      tabIndex={-1}
      to={href}
    >
      {text}
    </Link>
  );
};
