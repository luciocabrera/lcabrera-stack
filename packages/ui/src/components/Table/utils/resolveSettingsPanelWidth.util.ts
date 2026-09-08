export const resolveSettingsPanelWidth = (width: unknown) =>
  typeof width === 'number' && Number.isFinite(width) && width > 0
    ? width
    : undefined;
