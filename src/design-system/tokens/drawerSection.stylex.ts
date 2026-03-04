import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

/**
 * Shared styles for Table Settings Drawer sections.
 * Used by SortingSection, AddFilterSection, ColumnOrderSection,
 * ActiveFiltersList, GeneralSettingsSection, and others.
 *
 * Import only the styles you need and compose with local overrides.
 */
export const drawerSectionStyles = stylex.create({
  /** Flex column container with `gap: md`. Most common drawer layout. */
  container: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  /** Full-height variant of `container` for sections that fill the drawer. */
  containerFull: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  /** Section header: secondary text, small bold, with bottom margin. */
  header: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
    marginBottom: spacing.xs,
  },
  /** Flex row for section header with title and toolbar buttons. */
  headerRow: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  /** Header title inside a headerRow (no bottom margin, grows). */
  headerTitle: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
  },
  /** Toolbar group for mini buttons inside a headerRow. */
  headerToolbar: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  /** Subsection wrapper with `gap: sm` (e.g. add-column form area). */
  subsection: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  /** Vertical list of items with `gap: sm`. */
  list: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  /** Horizontal item row (centered, `gap: sm`). */
  itemRow: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
  /** Text label inside an item row: primary color, grows to fill space. */
  itemLabel: {
    color: colors.textPrimary,
    flexGrow: 1,
    flexShrink: 1,
    fontSize: typography.fontSizeSm,
  },
  /** Inline controls group (e.g. sort direction + remove buttons). */
  itemControls: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  /** Bottom-anchored reset/action area. */
  resetSection: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    marginTop: 'auto',
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
});
