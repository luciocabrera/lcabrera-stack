/* oxlint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @stylexjs/valid-styles */
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  trigger: (anchorName: string) => ({
    anchorName,
    display: 'inline-flex',
  }),
});
