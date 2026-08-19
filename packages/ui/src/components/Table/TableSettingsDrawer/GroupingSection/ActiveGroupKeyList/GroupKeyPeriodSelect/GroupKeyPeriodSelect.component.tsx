import * as stylex from '@stylexjs/stylex';

import { useGetTableColumnGroupingCapability } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TABLE_GROUP_PERIOD_LABELS } from '#ui/components/Table/Table.constants';
import { isTableGroupPeriod } from '#ui/components/Table/utils/isTableGroupPeriod.util';

import type { GroupKeyPeriodSelectProps } from './GroupKeyPeriodSelect.types';

import { useSetGroupKeyPeriod } from '../../../TableDrawerContext/actions';
import { useGetGroupingPeriods } from '../../../TableDrawerContext/selectors';
import { styles } from './GroupKeyPeriodSelect.stylex';

/** What "no truncation" is worth in a `<select>`, which cannot hold `undefined`. */
const RAW_VALUE = '';

/**
 * The granularity one applied date or timestamp key is grouped at — Day, Month,
 * Quarter or Year, or the column's raw values (#786).
 *
 * **It renders nothing at all for a column with no granularities**, which is
 * every non-temporal column and any date whose range is too wide for even a
 * year to clear the cardinality guard. A disabled control there would suggest a
 * choice the route does not have.
 *
 * The options are the capability's list rather than the whole vocabulary, so a
 * granularity the server would refuse is never offered — the same rule
 * `toGroupKeyColumnOptions` follows for the columns themselves (ADR-058, #642).
 *
 * A self-connected delegate: it reads the capability and the staged
 * granularities from their stores and dispatches its own action, so the list
 * item above it forwards only what identifies the key.
 */
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
