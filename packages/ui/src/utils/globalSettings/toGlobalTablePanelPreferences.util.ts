import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { resolveSettingsTabOrder } from '#ui/components/Table/utils/resolveSettingsTabOrder.util';

export const toGlobalTablePanelPreferences = (value: unknown) => {
  if (!isObject(value)) {
    return;
  }

  const settingsTabOrder = Array.isArray(value.settingsTabOrder)
    ? resolveSettingsTabOrder(value.settingsTabOrder)
    : undefined;

  return { settingsTabOrder };
};
