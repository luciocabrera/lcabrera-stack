import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { AggregateItemContentProps } from './AggregateItemContent.types';

import { useRemoveColumnAggregate } from '../../../TableDrawerContext/actions';
import { ShareOfTotalToggle } from '../ShareOfTotalToggle';
import { styles } from './AggregateItemContent.stylex';

/**
 * One staged aggregate in the drawer list: its label, its share toggle and a
 * remove control — the row `DraggableList` renders inside a draggable shell.
 *
 * Self-connected: it dispatches the removal itself rather than taking an
 * `onRemove` prop, because un-staging an aggregate is a targeted `(columnKey,
 * fn)` action and nothing about it needs the rest of the list. That is where it
 * departs from `GroupKeyItemContent` and `SortItemContent` beside it, whose
 * removals are whole-list rewrites their list has to compute.
 *
 * No level number, unlike a group key. The key order is the query's nesting
 * order, which a reader has to be able to count; the aggregate order is the
 * order the measures are listed in, and numbering it would imply a hierarchy
 * that is not there.
 */
export const AggregateItemContent = ({
  isBusy,
  item: { columnKey, fn, label },
}: AggregateItemContentProps) => {
  const removeColumnAggregate = useRemoveColumnAggregate();

  const handleRemove = () => {
    removeColumnAggregate({ columnKey, fn });
  };

  return (
    <div {...stylex.props(styles.aggregateItem)}>
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
          onClick={handleRemove}
          size='mini'
          tooltipContent={`Remove ${label}`}
          variant='ghost'
        />
      </div>
    </div>
  );
};
