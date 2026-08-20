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

import { useRemoveColumnAggregate } from '../../TableDrawerContext/actions';
import { useGetGroupingAggregates } from '../../TableDrawerContext/selectors';
import { toAggregateItems } from '../utils';
import { styles } from './ActiveAggregateList.stylex';
import { ShareOfTotalToggle } from './ShareOfTotalToggle';

/**
 * The aggregates currently staged, one row each, with a remove control.
 *
 * One column may appear several times, once per function applied to it (#831),
 * so each row is keyed by the `(columnKey, fn)` pair rather than by the column —
 * a column key alone would repeat, and React would reconcile two distinct rows
 * as one.
 *
 * The rows are in staged order, which is state: it is what the `grouping` param
 * carries and what #832 makes draggable. Not draggable **yet**, so the handle is
 * absent rather than inert.
 */
export const ActiveAggregateList = ({
  isBusy = false,
}: ActiveAggregateListProps) => {
  const columns = useGetColumns();
  const aggregates = useGetGroupingAggregates();
  const removeColumnAggregate = useRemoveColumnAggregate();

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
          {aggregateItems.map(({ columnKey, fn, id, label }) => (
            <div key={id} {...stylex.props(styles.aggregateItem)}>
              <span {...stylex.props(styles.aggregateItemLabel)}>{label}</span>
              <div {...stylex.props(styles.aggregateItemControls)}>
                <ShareOfTotalToggle
                  columnKey={columnKey}
                  fn={fn}
                  isBusy={isBusy}
                  label={label}
                />
                <Button
                  aria-label={`Remove ${label}`}
                  icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
                  isBusy={isBusy}
                  onClick={() => {
                    removeColumnAggregate({ columnKey, fn });
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
