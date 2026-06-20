import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { ICON_SIZE_XS } from '@/design-system/constants/iconSizes.constants';

import type { TagProps } from './Tag.types';

import { styles } from './Tag.stylex';

export const Tag = ({ label, onRemove }: TagProps) => (
  <span {...stylex.props(styles.tag)}>
    <span {...stylex.props(styles.label)}>{label}</span>
    <Button
      aria-label={`Remove ${label}`}
      color='ghost'
      icon={<MenuCloseIcon size={ICON_SIZE_XS} />}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      size='embedded'
      tooltipContent={`Remove ${label}`}
      width='auto'
    />
  </span>
);
