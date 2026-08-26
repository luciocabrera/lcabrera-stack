import * as stylex from '@stylexjs/stylex';

import type { ShowcaseSubsectionProps } from './ShowcaseSubsection.types';

import { styles } from './ShowcaseSubsection.stylex';

export const ShowcaseSubsection = ({
  children,
  title,
}: ShowcaseSubsectionProps) => (
  <div {...stylex.props(styles.subsection)}>
    <h3 {...stylex.props(styles.subsectionTitle)}>{title}</h3>
    {children}
  </div>
);
