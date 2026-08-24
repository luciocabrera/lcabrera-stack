import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import { BrokenLink } from './BrokenLink';
import { ConnectionPulse } from './ConnectionPulse';
import { DisruptionParticles } from './DisruptionParticles';
import { styles } from './ErrorDescriptive.stylex';
import { LaptopClient } from './LaptopClient';
import { ServerRack } from './ServerRack';
import { WarningBadge } from './WarningBadge';

export const ErrorDescriptive = () => {
  const titleId = useId();
  const descId = useId();

  return (
    <svg
      {...stylex.props(styles.svg)}
      aria-labelledby={`${titleId} ${descId}`}
      height='100%'
      role='img'
      viewBox='0 0 360 220'
      width='100%'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title id={titleId}>Data fetch error</title>
      <desc id={descId}>
        Two data blocks with a breaking link and a subtle warning badge
        indicating a fetch error.
      </desc>

      <ServerRack />
      <LaptopClient />
      <ConnectionPulse />
      <BrokenLink />
      <DisruptionParticles />
      <WarningBadge />
    </svg>
  );
};
