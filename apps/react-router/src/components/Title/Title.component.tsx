import * as stylex from '@stylexjs/stylex';

import type { TitleProps } from './Title.types';

import { styles } from './Title.stylex';

export const Title = ({
  actions,
  children,
  customStylex,
  icon,
}: TitleProps) => {
  if (!children && !icon && !actions) return;

  return (
    <div {...stylex.props(styles.container, customStylex)}>
      <div {...stylex.props(styles.titleSection)}>
        {icon && <div {...stylex.props(styles.icon)}>{icon}</div>}
        {children && <h2 {...stylex.props(styles.title)}>{children}</h2>}
      </div>
      {actions && <div {...stylex.props(styles.actions)}>{actions}</div>}
    </div>
  );
};
