import type { TableFeatures, TableLayoutMode } from '../Table.types';

type ResolveTablePresentationArgs = {
  readonly features?: TableFeatures;
  readonly layout?: TableLayoutMode;
};

export const resolveTablePresentation = ({
  features = {},
  layout = 'virtual',
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
  };
};
