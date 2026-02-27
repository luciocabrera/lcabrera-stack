import * as stylex from '@stylexjs/stylex';

import type { TagProps } from './Tag.types';

import { styles } from './Tag.stylex';

export const Tag = ({ label, onRemove }: TagProps) => (
  <span {...stylex.props(styles.tag)}>
    <span {...stylex.props(styles.label)}>{label}</span>
    <button
      aria-label={`Remove ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      type='button'
      {...stylex.props(styles.removeButton)}
    >
      ✕
    </button>
  </span>
);
