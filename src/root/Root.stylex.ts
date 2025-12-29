import * as stylex from '@stylexjs/stylex';

import {  typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  base: {
    transition: 'background-color 0.3s ease, color 0.3s ease',
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    minHeight: '100vh',
  }});