import * as stylex from '@stylexjs/stylex';

import { DisclosureIcon } from '#ui/components/Icons';
import { useToggleTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';

import type { TableGroupDisclosureProps } from './TableGroupDisclosure.types';

import { tableGroupDisclosureStyles } from './TableGroupDisclosure.stylex';

/**
 * Not a button (ADR-062): a second tab stop would break the grid's roving model.
 * `aria-hidden` (not `role='presentation'`) removes the subtree.
 */
export const TableGroupDisclosure = ({
  disclosure,
  path,
}: TableGroupDisclosureProps) => {
  const toggleGroupExpansion = useToggleTableGroupExpansion();

  // A leaf group owns no loaded children, so it draws no chevron: its rows open
  // in their own route rather than under it (#870).
  if (disclosure?.hasChildren !== true) {
    return <span {...stylex.props(tableGroupDisclosureStyles.spacer)} />;
  }

  return (
    <span
      {...stylex.props(
        tableGroupDisclosureStyles.control,
        disclosure?.isExpanded === true && tableGroupDisclosureStyles.expanded,
      )}
      aria-hidden='true'
      data-expanded={disclosure?.isExpanded ?? false}
      data-testid='table-group-disclosure'
      onClick={() => toggleGroupExpansion(path)}
    >
      <DisclosureIcon size={12} />
    </span>
  );
};
