import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { PinLeftIcon, PinRightIcon } from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { PinningSectionProps } from './PinningSection.types';

import { useSetColumnPinning } from '../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../ColumnDrawerContext/selectors';
import { styles } from './PinningSection.stylex';
import { PinningSectionToolbar } from './PinningSectionToolbar';

export const PinningSection = <TData,>({
  columnKey: _columnKey,
}: PinningSectionProps<TData>) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.headerRow)}>
          <h3 {...stylex.props(styles.headerTitle)}>Column Pinning</h3>
          <PinningSectionToolbar variant='toolbar' />
        </div>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color={columnPinning === 'left' ? 'primary' : 'outline'}
            icon={<PinLeftIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              setColumnPinning(columnPinning === 'left' ? undefined : 'left');
            }}
            size='sm'
            width='full'
          >
            Pin Left
          </Button>
          <Button
            color={columnPinning === 'right' ? 'primary' : 'outline'}
            icon={<PinRightIcon size={ICON_SIZE_MD} />}
            onClick={() => {
              setColumnPinning(columnPinning === 'right' ? undefined : 'right');
            }}
            size='sm'
            width='full'
          >
            Pin Right
          </Button>
        </div>
      </div>
      <PinningSectionToolbar />
    </div>
  );
};
