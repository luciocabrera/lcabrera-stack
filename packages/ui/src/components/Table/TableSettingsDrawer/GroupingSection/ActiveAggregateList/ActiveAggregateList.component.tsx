import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '#ui/components/DraggableList';

import { DraggableList } from '#ui/components/DraggableList';
import { InfoBox } from '#ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';

import type { ActiveAggregateListProps } from './ActiveAggregateList.types';

import { useReorderColumnAggregates } from '../../TableDrawerContext/actions';
import { useGetGroupingAggregates } from '../../TableDrawerContext/selectors';
import { toAggregateItems } from '../utils';
import { styles } from './ActiveAggregateList.stylex';
import { AggregateItemContent } from './AggregateItemContent';

/**
 * The aggregates currently staged, one draggable row each, with a share toggle
 * and a remove control.
 *
 * One column may appear several times, once per function applied to it (#831),
 * so each row is keyed by the `(columnKey, fn)` pair rather than by the column —
 * a column key alone would repeat, and both React and the reorder below would
 * conflate two distinct rows.
 *
 * **The order is a choice, so it is draggable** (#832). It is the order the
 * measures are listed in, and it is state rather than a view preference: the
 * `grouping` param's `agg` array carries it, so a shared link and a reload read
 * back what was dragged. The drag stages like every other drawer edit and
 * applies on Accept, so it costs no loader run of its own.
 *
 * A self-connected delegate: it reads the staged aggregates and the route's
 * columns from their stores itself, so the section shell above it forwards only
 * `isBusy`. Each row does the same for its own removal and share.
 */
export const ActiveAggregateList = ({
  isBusy = false,
}: ActiveAggregateListProps) => {
  const columns = useGetColumns();
  const aggregates = useGetGroupingAggregates();
  const reorderColumnAggregates = useReorderColumnAggregates();

  const aggregateItems = toAggregateItems({ aggregates, columns });

  const handleReorder = (reorderedItems: DraggableItem[]) => {
    reorderColumnAggregates(reorderedItems.map((item) => item.id));
  };

  const draggableItems: DraggableItem[] = aggregateItems.map((item) => ({
    content: <AggregateItemContent isBusy={isBusy} item={item} />,
    id: item.id,
  }));

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
          <DraggableList
            isBusy={isBusy}
            items={draggableItems}
            onOrderChange={handleReorder}
          />
        </div>
      )}
    </SidePanelSection>
  );
};
