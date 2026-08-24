import * as stylex from '@stylexjs/stylex';
import { Link, useLocation } from 'react-router';

import { useGetTableGroupingPeriods } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';

import type { TableGroupDetailsAnchorProps } from './TableGroupDetailsAnchor.types';

import { resolveGroupDetailsHref } from '../utils/resolveGroupDetailsHref.util';
import { tableGroupDetailsAnchorStyles } from './TableGroupDetailsAnchor.stylex';

/**
 * The anchor half of a group key's link, and **the only part that needs a
 * `Router`**.
 *
 * Split from `TableGroupKeyLink` for that reason alone: a table whose route
 * declares no `groupDetailsPath` never mounts this, so a grouped table still
 * renders outside a router exactly as it did before the affordance existed.
 * Folding the two together would make every grouped table in every consumer
 * depend on routing context to draw a group heading.
 *
 * **It is not a tab stop, and that is the same rule the chevron follows.**
 * ADR-062 gives the grid a roving tab stop addressed by row key plus column
 * key, so exactly one element in the body is tabbable; an anchor that took
 * focus would be a second stop inside a cell that already owns one, and tabbing
 * through a grouped body would alternate between the two. `tabIndex={-1}` keeps
 * it reachable by pointer, and `activateGridCellLink` handles `Enter` on the
 * cell the roving focus is already on.
 */
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
