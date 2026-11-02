import type { BreadcrumbItem } from '../Breadcrumbs.types';

export type BreadcrumbsItemProps = {
  readonly isCurrent: boolean;
  readonly item: BreadcrumbItem;
};
