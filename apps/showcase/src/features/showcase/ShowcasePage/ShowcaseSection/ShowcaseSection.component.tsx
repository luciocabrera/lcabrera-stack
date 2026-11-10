import { Title } from '@lcabrera/ui/components/Title';
import * as stylex from '@stylexjs/stylex';

import type { ShowcaseSectionProps } from './ShowcaseSection.types';

import { styles } from './ShowcaseSection.stylex';

export const ShowcaseSection = ({ children, title }: ShowcaseSectionProps) => (
  <section {...stylex.props(styles.section)}>
    <Title customStylex={styles.sectionTitle} level={2} variant='plain'>
      {title}
    </Title>
    {children}
  </section>
);
