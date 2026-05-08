import { readFromCookie } from '@/utils/storage/readFromCookie.util';

import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  GLOBAL_SETTINGS_COOKIE_VERSION,
} from './globalSettings.constants';

import type {
  GlobalNavigationCollapsedPreference,
  GlobalNavigationPinnedPreference,
  GlobalNavigationPreferences,
  GlobalPinningPreferences,
  GlobalSettingsState,
} from '@/types/globalSettings.types';
import type {
  PinConflictResolution,
  UnpinConflictResolution,
} from '@/types/pinningPreferences.types';
import type { PinSide } from '@/types/ui.types';

const PIN_SIDE_VALUES = ['closest-edge', 'left', 'right'] as const;
const NAVIGATION_SIZE_VALUES = ['compact', 'large', 'medium', 'small'] as const;
const NAVIGATION_COLLAPSED_VALUES = ['collapsed', 'expanded'] as const;
const NAVIGATION_PINNED_VALUES = ['pinned', 'unpinned'] as const;
const PIN_CONFLICT_VALUES = [
  'move-column',
  'pin-all-between',
  'pin-only',
] as const;
const UNPIN_CONFLICT_VALUES = ['reorder-to-fill', 'unpin-beyond'] as const;

type GlobalSettingsCookiePayload = {
  readonly value?: unknown;
  readonly version?: unknown;
};

type GetGlobalSettingsFromCookieArgs = {
  readonly cookieString?: string;
  readonly fallback: GlobalSettingsState;
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isNavigationSizePreference = (
  value: unknown,
): value is GlobalNavigationPreferences['size'] => {
  return (
    typeof value === 'string' &&
    NAVIGATION_SIZE_VALUES.includes(
      value as (typeof NAVIGATION_SIZE_VALUES)[number],
    )
  );
};

const isNavigationCollapsedPreference = (
  value: unknown,
): value is GlobalNavigationCollapsedPreference => {
  return (
    typeof value === 'string' &&
    NAVIGATION_COLLAPSED_VALUES.includes(
      value as (typeof NAVIGATION_COLLAPSED_VALUES)[number],
    )
  );
};

const isNavigationPinnedPreference = (
  value: unknown,
): value is GlobalNavigationPinnedPreference => {
  return (
    typeof value === 'string' &&
    NAVIGATION_PINNED_VALUES.includes(
      value as (typeof NAVIGATION_PINNED_VALUES)[number],
    )
  );
};

const isPinSide = (value: unknown): value is PinSide => {
  return (
    typeof value === 'string' &&
    PIN_SIDE_VALUES.includes(value as (typeof PIN_SIDE_VALUES)[number])
  );
};

const isPinConflictResolution = (
  value: unknown,
): value is PinConflictResolution => {
  return (
    typeof value === 'string' &&
    PIN_CONFLICT_VALUES.includes(value as (typeof PIN_CONFLICT_VALUES)[number])
  );
};

const isUnpinConflictResolution = (
  value: unknown,
): value is UnpinConflictResolution => {
  return (
    typeof value === 'string' &&
    UNPIN_CONFLICT_VALUES.includes(
      value as (typeof UNPIN_CONFLICT_VALUES)[number],
    )
  );
};

const toGlobalPinningPreferences = (
  value: unknown,
): GlobalPinningPreferences | undefined => {
  if (!isObject(value)) {
    return undefined;
  }

  const pinSide = isPinSide(value['pinSide']) ? value['pinSide'] : undefined;
  const pinConflictResolution = isPinConflictResolution(
    value['pinConflictResolution'],
  )
    ? value['pinConflictResolution']
    : undefined;
  const unpinConflictResolution = isUnpinConflictResolution(
    value['unpinConflictResolution'],
  )
    ? value['unpinConflictResolution']
    : undefined;

  return {
    pinConflictResolution,
    pinSide,
    unpinConflictResolution,
  };
};

const toGlobalNavigationPreferences = (
  value: unknown,
): GlobalNavigationPreferences | undefined => {
  if (!isObject(value)) {
    return undefined;
  }

  const collapsed = isNavigationCollapsedPreference(value['collapsed'])
    ? value['collapsed']
    : undefined;
  const pinned = isNavigationPinnedPreference(value['pinned'])
    ? value['pinned']
    : undefined;
  const size = isNavigationSizePreference(value['size'])
    ? value['size']
    : undefined;

  return { collapsed, pinned, size };
};

export const getGlobalSettingsFromCookie = ({
  cookieString,
  fallback,
}: GetGlobalSettingsFromCookieArgs): GlobalSettingsState => {
  const rawCookie = readFromCookie({
    cookieString,
    key: GLOBAL_SETTINGS_COOKIE_KEY,
  });

  if (!rawCookie) {
    return fallback;
  }

  try {
    const payload = JSON.parse(
      decodeURIComponent(rawCookie),
    ) as GlobalSettingsCookiePayload;

    if (payload.version !== GLOBAL_SETTINGS_COOKIE_VERSION) {
      return fallback;
    }

    if (!isObject(payload.value)) {
      return fallback;
    }

    const parsedPinning = toGlobalPinningPreferences(payload.value['pinning']);
    const parsedNavigation = toGlobalNavigationPreferences(
      payload.value['navigation'],
    );

    return {
      navigation: parsedNavigation ?? fallback.navigation,
      pinning: parsedPinning ?? fallback.pinning,
    };
  } catch {
    return fallback;
  }
};
