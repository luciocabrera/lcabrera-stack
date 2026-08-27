import * as stylex from '@stylexjs/stylex';

import { LockIcon } from '#ui/components/Icons';
import { InfoBox } from '#ui/components/InfoBox';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetTableLockedFilters } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { ICON_SIZE_SM } from '#ui/design-system/constants';

import { styles } from './LockedFiltersList.stylex';

const UNREADABLE_RESTRICTION =
  'These rows are restricted, and the link does not say what to.';

/**
 * What already restricts these rows, which this table states and cannot change (ADR-087).
 *
 * It is a **separate** section from `ActiveFiltersList` rather than extra rows inside it,
 * and the count stays separate too: `Active Filters (n)` answers "how many filters can I
 * take off", and an entry no control removes is not one of them. Nothing here is a
 * `ColumnFilter`, so `Clear Filters` and `Reset Filters` do not reach it — closing the view
 * is what clears it.
 *
 * A route that declares no restriction renders nothing here; one whose restriction could
 * not be read renders **why**, because an empty list under this heading would say the rows
 * are unrestricted — which is exactly what a refused token does not mean.
 */
export const LockedFiltersList = () => {
  const lockedFilters = useGetTableLockedFilters();

  if (lockedFilters === undefined) return;

  const { entries, refusal } = lockedFilters;

  return (
    <div {...stylex.props(styles.container)} data-testid='locked-filters-list'>
      <SidePanelSectionHeader title={`Locked Filters (${entries.length})`} />
      {entries.length > 0 ? (
        <ul {...stylex.props(styles.list)}>
          {entries.map(({ columnKey, label, value }) => (
            <li
              {...stylex.props(styles.entry)}
              data-testid={`locked-filter-${columnKey}`}
              key={columnKey}
            >
              <span {...stylex.props(styles.icon)}>
                <LockIcon size={ICON_SIZE_SM} />
              </span>
              <span {...stylex.props(styles.label)}>{label}</span>
              <span {...stylex.props(styles.operator)}>=</span>
              <span {...stylex.props(styles.value)}>{value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <InfoBox>{refusal ?? UNREADABLE_RESTRICTION}</InfoBox>
      )}
    </div>
  );
};
