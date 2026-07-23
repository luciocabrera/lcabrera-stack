import { describe, expect, it } from 'vite-plus/test';

import { styles } from '../NotificationItem/NotificationItem.stylex';
import { getNotificationDismissIconStyle } from './getNotificationDismissIconStyle.util';

describe('getNotificationDismissIconStyle', () => {
  it('returns the mapped style for each explicit variant', () => {
    expect(getNotificationDismissIconStyle('error')).toBe(
      styles.dismissButtonError,
    );
    expect(getNotificationDismissIconStyle('info')).toBe(
      styles.dismissButtonInfo,
    );
    expect(getNotificationDismissIconStyle('primary')).toBe(
      styles.dismissButtonPrimary,
    );
    expect(getNotificationDismissIconStyle('secondary')).toBe(
      styles.dismissButtonSecondary,
    );
    expect(getNotificationDismissIconStyle('success')).toBe(
      styles.dismissButtonSuccess,
    );
    expect(getNotificationDismissIconStyle('warning')).toBe(
      styles.dismissButtonWarning,
    );
  });

  it('returns default style for default variant', () => {
    expect(getNotificationDismissIconStyle('default')).toBe(
      styles.dismissButtonDefault,
    );
  });
});
