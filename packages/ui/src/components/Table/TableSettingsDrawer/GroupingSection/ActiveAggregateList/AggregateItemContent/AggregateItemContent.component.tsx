import * as stylex from '@stylexjs/stylex';

import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { ICON_SIZE_MD } from '#ui/design-system/constants';

import type { AggregateItemContentProps } from './AggregateItemContent.types';

import { useRemoveColumnAggregate } from '../../../TableDrawerContext/actions';
import { ShareOfTotalToggle } from '../ShareOfTotalToggle';
import { styles } from './AggregateItemContent.stylex';

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
