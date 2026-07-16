import { Button } from '@repo/ui/components/Button';
import { MenuCloseIcon } from '@repo/ui/components/Icons';
import { ICON_SIZE_XS } from '@repo/ui/design-system/constants/iconSizes.constants';
import * as stylex from '@stylexjs/stylex';

import type { TagProps } from './Tag.types';

import { styles } from './Tag.stylex';

export const Tag = ({ label, onRemove }: TagProps) => (
  <span {...stylex.props(styles.tag)}>
    <span {...stylex.props(styles.label)}>{label}</span>
    <Button
      aria-label={`Remove ${label}`}
      icon={<MenuCloseIcon size={ICON_SIZE_XS} />}
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
      size='embedded'
      tooltipContent={`Remove ${label}`}
      variant='ghost'
    />
  </span>
);
