import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, PinIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { PinningSectionProps } from './PinningSection.types';

import {
  useResetColumnPinning,
  useSetColumnPinning,
} from '../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../ColumnDrawerContext/selectors';
import { styles } from './PinningSection.stylex';

export const PinningSection = <TData,>({
  columnKey: _columnKey,
}: PinningSectionProps<TData>) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();
  const resetColumnPinning = useResetColumnPinning();

  const hasPinning = columnPinning !== undefined;

  const handleClear = () => {
    setColumnPinning(undefined);
  };

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Column Pinning</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            color={columnPinning === 'left' ? 'primary' : 'outline'}
            icon={<PinIcon size={ICON_SIZE_MD} />}
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
            icon={<PinIcon size={ICON_SIZE_MD} />}
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
      <div {...stylex.props(styles.resetSection)}>
        <Button
          color='outline'
          icon={<EraserIcon size={ICON_SIZE_MD} />}
          isDisabled={!hasPinning}
          onClick={handleClear}
          size='sm'
          width='full'
        >
          Clear Pinning
        </Button>
        <Button
          color='outline'
          icon={<RefreshIcon size={ICON_SIZE_MD} />}
          onClick={resetColumnPinning}
          size='sm'
          width='full'
        >
          Reset Pinning
        </Button>
      </div>
    </div>
  );
};
