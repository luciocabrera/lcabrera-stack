import { readFromCookie } from '@/utils/storage/readFromCookie.util';

import {
  GLOBAL_SETTINGS_COOKIE_KEY,
  GLOBAL_SETTINGS_COOKIE_VERSION,
} from './globalSettings.constants';

import type {
  GlobalPinningPreferences,
  GlobalSettingsState,
} from '@/types/globalSettings.types';
import type {
  PinConflictResolution,
  UnpinConflictResolution,
} from '@/types/pinningPreferences.types';
import type { PinSide } from '@/types/ui.types';

const PIN_SIDE_VALUES = ['closest-edge', 'left', 'right'] as const;
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

    return {
      pinning: parsedPinning ?? fallback.pinning,
    };
  } catch {
    return fallback;
  }
};
