import * as stylex from '@stylexjs/stylex';

import { DisclosureIcon } from '#ui/components/Icons';
import { useToggleTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';

import type { TableGroupDisclosureProps } from './TableGroupDisclosure.types';

import { tableGroupDisclosureStyles } from './TableGroupDisclosure.stylex';

export const TableGroupDisclosure = ({
  disclosure,
  path,
}: TableGroupDisclosureProps) => {
  const toggleGroupExpansion = useToggleTableGroupExpansion();

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
