import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';

import type { TagProps } from './Tag.types';

import { styles } from './Tag.stylex';

export const Tag = ({ label, onRemove }: TagProps) => (
  <span {...stylex.props(styles.tag)}>
    <span {...stylex.props(styles.label)}>{label}</span>
    <Button
      aria-label={`Remove ${label}`}
      color='ghost'
      // customStylex={styles.removeButton}
      icon={<span {...stylex.props(styles.removeIcon)}>✕</span>}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      size='embedded'
      // variant='flat'
      width='auto'
    />
  </span>
);
