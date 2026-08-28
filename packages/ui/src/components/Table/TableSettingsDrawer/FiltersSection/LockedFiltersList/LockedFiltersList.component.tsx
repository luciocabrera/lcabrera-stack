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
 * The restriction this table states and cannot change, as its own section of the filters
 * panel
 * ([ADR-094](../../../../../../../../docs/decisions/ADR-094-a-scoped-table-states-its-restriction-and-opens-declared.md)).
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
