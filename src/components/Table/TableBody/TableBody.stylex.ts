// TableBody no longer uses custom styles — row positioning is handled
// by SpacerRow components in normal document flow rather than absolute
// positioning with translateY transforms. This eliminates the visible
// gap during fast scrolling.
//
// This file is kept as a placeholder for any future tbody-level styles.

import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  placeholder: {
    display: 'contents',
  },
});
