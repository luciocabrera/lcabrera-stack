import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '#ui/components/DraggableList';

import { DraggableList } from '#ui/components/DraggableList';
import { InfoBox } from '#ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useSetTableGroupKeys } from '#ui/components/Table/contexts/TableConfig/grouping/actions';
import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

import type { ActiveGroupKeyListProps } from './ActiveGroupKeyList.types';

import { GroupingSectionToolbar } from '../GroupingSectionToolbar';
import { toGroupKeyItems } from '../utils';
import { styles } from './ActiveGroupKeyList.stylex';
import { GroupKeyItemContent } from './GroupKeyItemContent';

/**
 * The applied group keys, in nesting order, with drag-to-reorder and per-key
 * removal.
 *
 * Reordering is a real edit rather than a view preference: the order is the
 * grouped query's nesting order, so dragging a key changes the question the
 * table answers — which is why every drop writes through the grouping action
 * and re-runs the loader rather than sorting a local list.
 *
 * A self-connected delegate: it reads the applied keys and the route's columns
 * from their stores itself, so the section shell above it forwards only
 * `isBusy`.
 */
export const ActiveGroupKeyList = ({
  isBusy = false,
}: ActiveGroupKeyListProps) => {
  const columns = useGetColumns();
  const groupingKeys = useGetTableGroupingKeys();
  const setGroupKeys = useSetTableGroupKeys();

  const groupKeyItems = toGroupKeyItems({ columns, keys: groupingKeys });

  const handleRemove = (columnKey: string) => {
    setGroupKeys(groupingKeys.filter((key) => key !== columnKey));
  };

  const handleReorder = (reorderedItems: DraggableItem[]) => {
    setGroupKeys(reorderedItems.map((item) => item.id));
  };

  const draggableItems: DraggableItem[] = groupKeyItems.map((item, index) => ({
    content: (
      <GroupKeyItemContent
        isBusy={isBusy}
        item={item}
        level={index + 1}
        onRemove={handleRemove}
      />
    ),
    id: item.columnKey,
  }));

  return (
    <SidePanelSection>
      <SidePanelSectionHeader
        title={`Group Keys (${groupKeyItems.length}/${MAX_TABLE_GROUP_KEYS})`}
        toolbar={<GroupingSectionToolbar isBusy={isBusy} variant='toolbar' />}
      />
      {groupKeyItems.length === 0 ? (
        <InfoBox>
          No grouping applied. Add a column above to group the rows.
        </InfoBox>
      ) : (
        <div {...stylex.props(styles.groupKeyList)}>
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
