import * as stylex from '@stylexjs/stylex';

import type { TitleProps } from './Title.types';

import { styles } from './Title.stylex';

export const Title = ({
  actions,
  children,
  customStylex,
  icon,
  level = 2,
  variant = 'toolbar',
  ...props
}: TitleProps) => {
  if (!children && !icon && !actions) return;

  const Heading = `h${level}` as const;
  const isToolbar = variant === 'toolbar';

  return (
    <div
      {...props}
      {...stylex.props(
        styles.container,
        isToolbar && styles.toolbar,
        customStylex,
      )}
    >
      <div {...stylex.props(styles.titleSection)}>
        {Boolean(icon) && <div {...stylex.props(styles.icon)}>{icon}</div>}
        {Boolean(children) && (
          <Heading
            {...stylex.props(
              isToolbar
                ? styles.title
                : [styles.plainTitle, styles.plainLevel[level]],
            )}
          >
            {children}
          </Heading>
        )}
      </div>
      {Boolean(actions) && (
        <div {...stylex.props(styles.actions)}>{actions}</div>
      )}
    </div>
  );
};
