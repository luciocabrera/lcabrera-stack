import * as stylex from '@stylexjs/stylex';

import { useGetIsBusy } from '../contexts/meta/selectors';
import { VirtualSelectTrigger } from '../VirtualSelectTrigger';
import { busyStyles } from './VirtualSelectHeader.stylex';

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
