import * as stylex from '@stylexjs/stylex';

import { BrokenLink } from './BrokenLink';
import { ConnectionPulse } from './ConnectionPulse';
import { DisruptionParticles } from './DisruptionParticles';
import { styles } from './ErrorDescriptive.stylex';
import { LaptopClient } from './LaptopClient';
import { ServerRack } from './ServerRack';
import { WarningBadge } from './WarningBadge';

/**
 * Theme-adaptive, accessible, animated SVG illustrations for error / empty states.
 * - Uses `color` prop (or inherited color) so it blends with any UI theme.
 * - Respects prefers-reduced-motion.
 */
export const ErrorDescriptive = () => {
  return (
    <svg
      {...stylex.props(styles.svg)}
      aria-labelledby='errTitle errDesc'
      height='100%'
      role='img'
      viewBox='0 0 360 220'
      width='100%'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title id='errTitle'>Data fetch error</title>
      <desc id='errDesc'>
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
