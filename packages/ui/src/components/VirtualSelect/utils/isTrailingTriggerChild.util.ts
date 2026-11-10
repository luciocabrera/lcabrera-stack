export const isTrailingTriggerChild = ({ dataset }: HTMLElement) =>
  dataset.chevron !== undefined || dataset.overflow !== undefined;
