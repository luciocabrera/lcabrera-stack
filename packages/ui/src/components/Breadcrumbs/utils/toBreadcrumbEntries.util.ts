import type { BreadcrumbItem } from '../Breadcrumbs.types';

export const toBreadcrumbEntries = (items: readonly BreadcrumbItem[]) =>
  items.map((item, position) => ({
    identity: `${position} ${item.label}`,
    isCurrent: position === items.length - 1,
    item,
  }));
