import { Select } from '#ui/components/Select';
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
    <Select
      aria-label={`${label} grouping granularity`}
      customStylex={styles.periodSelect}
      disabled={isBusy}
      onChange={handleChange}
      options={[
        { label: 'Raw', value: RAW_VALUE },
        ...available.map((period) => ({
          label: TABLE_GROUP_PERIOD_LABELS[period],
          value: period,
        })),
      ]}
      value={periods[columnKey] ?? RAW_VALUE}
    />
  );
};
