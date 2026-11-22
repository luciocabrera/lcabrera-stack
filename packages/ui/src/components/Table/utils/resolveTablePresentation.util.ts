import type { TitleLevel } from '#ui/components/Title/Title.types';

import type { TableFeatures, TableLayoutMode } from '../Table.types';

type ResolveTablePresentationArgs = {
  readonly features?: TableFeatures;
  readonly layout?: TableLayoutMode;
  readonly titleLevel?: TitleLevel;
};

export const resolveTablePresentation = ({
  features = {},
  layout = 'virtual',
  titleLevel = 2,
}: ResolveTablePresentationArgs) => {
  const isOnByDefault = layout === 'virtual';

  return {
    features: {
      columnMenu: features.columnMenu ?? isOnByDefault,
      resize: features.resize ?? isOnByDefault,
      settings: features.settings ?? isOnByDefault,
      toolbar: features.toolbar ?? isOnByDefault,
    },
    layout,
    titleLevel,
  };
};
