import * as stylex from '@stylexjs/stylex';

import { useGetIsBusy } from '../contexts/meta/selectors';
import { VirtualSelectTrigger } from '../VirtualSelectTrigger';
import { busyStyles } from './VirtualSelectHeader.stylex';

/**
 * Header slice of VirtualSelect: the busy shimmer overlay plus the
 * self-connected combobox trigger. Fully self-connected (zero props) — it
 * reads only what it renders itself (the busy flag for the overlay); the
 * trigger owns the rest of its wiring.
 */
export const VirtualSelectHeader = () => {
  const isBusy = useGetIsBusy();

  return (
    <>
      {isBusy && (
        <div {...stylex.props(busyStyles.overlay)} aria-hidden='true'>
          <div {...stylex.props(busyStyles.wave)} />
        </div>
      )}
      <VirtualSelectTrigger />
    </>
  );
};
