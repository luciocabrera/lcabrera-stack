import * as stylex from '@stylexjs/stylex';

import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import {
  useGetTableGroupingCapabilities,
  useGetTableIsGroupingLocked,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { ColumnAxisSectionProps } from './ColumnAxisSection.types';

import { useSetGroupingColumnAxis } from '../../../TableDrawerContext/actions';
import {
  useGetGroupingColumnAxis,
  useGetGroupingKeys,
} from '../../../TableDrawerContext/selectors';
import { toGroupKeyColumnOptions } from '../../utils';
import {
  COLUMN_AXIS_NONE_OPTION,
  COLUMN_AXIS_NONE_VALUE,
  COLUMN_AXIS_PLACEHOLDER,
  COLUMN_AXIS_SECTION_TITLE,
} from './ColumnAxisSection.constants';
import { styles } from './ColumnAxisSection.stylex';

export const ColumnAxisSection = ({
  isBusy = false,
}: ColumnAxisSectionProps) => {
  const columns = useGetColumns();
  const capabilities = useGetTableGroupingCapabilities();
  const groupingKeys = useGetGroupingKeys();
  const columnAxis = useGetGroupingColumnAxis();
  const isGroupingLocked = useGetTableIsGroupingLocked();
  const setColumnAxis = useSetGroupingColumnAxis();

  if (isGroupingLocked) return;

  const options = [
    COLUMN_AXIS_NONE_OPTION,
    ...toGroupKeyColumnOptions({
      allowRequiredPeriod: false,
      capabilities,
      columns,
      stagedKeys: new Set(groupingKeys),
    }),
  ];

  return (
    <div {...stylex.props(styles.container)} data-testid='column-axis-section'>
      <SidePanelSectionHeader title={COLUMN_AXIS_SECTION_TITLE} />
      <VirtualSelect
        isBusy={isBusy}
        isDisabled={groupingKeys.length === 0}
        mode='single'
        onChange={(values) => {
          const next = values[0];
          const isCleared =
            next === undefined || next === COLUMN_AXIS_NONE_VALUE;

          setColumnAxis(isCleared ? undefined : next);
        }}
        options={options}
        placeholder={COLUMN_AXIS_PLACEHOLDER}
        selected={
          columnAxis === undefined ? [COLUMN_AXIS_NONE_VALUE] : [columnAxis]
        }
      />
    </div>
  );
};
