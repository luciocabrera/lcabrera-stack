import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { isTableDensity } from '#ui/components/Table/utils/isTableDensity.util';

export const toGlobalTableDisplayPreferences = (value: unknown) => {
  if (!isObject(value)) {
    return;
  }

  const density = isTableDensity(value.density) ? value.density : undefined;
  const headerDensity = isTableDensity(value.headerDensity)
    ? value.headerDensity
    : undefined;
  const titleDensity = isTableDensity(value.titleDensity)
    ? value.titleDensity
    : undefined;

  return { density, headerDensity, titleDensity };
};
