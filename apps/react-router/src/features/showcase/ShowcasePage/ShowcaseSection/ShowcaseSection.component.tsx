import * as stylex from '@stylexjs/stylex';

import type { ShowcaseSectionProps } from './ShowcaseSection.types';

import { styles } from './ShowcaseSection.stylex';

export const ShowcaseSection = ({ children, title }: ShowcaseSectionProps) => (
  <section {...stylex.props(styles.section)}>
    <h2 {...stylex.props(styles.sectionTitle)}>{title}</h2>
    {children}
  </section>
);
