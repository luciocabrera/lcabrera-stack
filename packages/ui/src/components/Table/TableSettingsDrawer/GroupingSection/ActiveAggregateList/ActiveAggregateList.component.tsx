import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { InfoBox } from '#ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { ActiveAggregateListProps } from './ActiveAggregateList.types';

import { useSetColumnAggregate } from '../../TableDrawerContext/actions';
import { useGetGroupingAggregates } from '../../TableDrawerContext/selectors';
import { toAggregateItems } from '../utils';
import { styles } from './ActiveAggregateList.stylex';
import { ShareOfTotalToggle } from './ShareOfTotalToggle';

/**
 * The aggregates currently staged, one row each, with a remove control.
 *
 * Not draggable, unlike the group-key list beside it: the key order is the
 * query's nesting order and means something, where the aggregate order means
 * nothing at all — offering a drag handle would imply a choice that has no
 * effect.
 */
export const ActiveAggregateList = ({
  isBusy = false,
}: ActiveAggregateListProps) => {
  const columns = useGetColumns();
  const aggregates = useGetGroupingAggregates();
  const setColumnAggregate = useSetColumnAggregate();

  const aggregateItems = toAggregateItems({ aggregates, columns });

  return (
    <SidePanelSection>
      <SidePanelSectionHeader title={`Aggregates (${aggregateItems.length})`} />
      {aggregateItems.length === 0 ? (
        <InfoBox>
          No aggregates selected. Every group still shows how many rows it
          covers.
        </InfoBox>
      ) : (
        <div {...stylex.props(styles.aggregateList)}>
          {aggregateItems.map(({ columnKey, label }) => (
            <div key={columnKey} {...stylex.props(styles.aggregateItem)}>
              <span {...stylex.props(styles.aggregateItemLabel)}>{label}</span>
              <div {...stylex.props(styles.aggregateItemControls)}>
                <ShareOfTotalToggle
                  columnKey={columnKey}
                  isBusy={isBusy}
                  label={label}
                />
                <Button
                  aria-label={`Remove ${label}`}
                  icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
                  isBusy={isBusy}
                  onClick={() => {
                    setColumnAggregate({ columnKey, fn: undefined });
                  }}
                  size='mini'
                  tooltipContent={`Remove ${label}`}
                  variant='ghost'
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SidePanelSection>
  );
};
