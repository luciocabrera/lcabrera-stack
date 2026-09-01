import * as stylex from '@stylexjs/stylex';

import { useGetTableColumnGroupingCapability } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TABLE_GROUP_PERIOD_LABELS } from '#ui/components/Table/Table.constants';
import { isTableGroupPeriod } from '#ui/components/Table/utils/isTableGroupPeriod.util';

import type { GroupKeyPeriodSelectProps } from './GroupKeyPeriodSelect.types';

import { useSetGroupKeyPeriod } from '../../../TableDrawerContext/actions';
import { useGetGroupingPeriods } from '../../../TableDrawerContext/selectors';
import { styles } from './GroupKeyPeriodSelect.stylex';

const RAW_VALUE = '';

export const GroupKeyPeriodSelect = ({
  columnKey,
  isBusy,
  label,
}: GroupKeyPeriodSelectProps) => {
  const capability = useGetTableColumnGroupingCapability(columnKey);
  const periods = useGetGroupingPeriods();
  const setGroupKeyPeriod = useSetGroupKeyPeriod();

  const available = capability?.periods ?? [];

  if (available.length === 0) return;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;

    setGroupKeyPeriod({
      columnKey,
      period: isTableGroupPeriod(value) ? value : undefined,
    });
  };

  return (
    <select
      aria-label={`${label} grouping granularity`}
      disabled={isBusy}
      onChange={handleChange}
      value={periods[columnKey] ?? RAW_VALUE}
      {...stylex.props(styles.periodSelect)}
    >
      <option value={RAW_VALUE}>Raw</option>
      {available.map((period) => (
        <option key={period} value={period}>
          {TABLE_GROUP_PERIOD_LABELS[period]}
        </option>
      ))}
    </select>
  );
};
