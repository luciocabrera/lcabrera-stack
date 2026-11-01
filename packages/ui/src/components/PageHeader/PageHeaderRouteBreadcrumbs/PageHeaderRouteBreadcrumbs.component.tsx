import { Breadcrumbs, useRouteBreadcrumbs } from '#ui/components/Breadcrumbs';

import type { PageHeaderRouteBreadcrumbsProps } from './PageHeaderRouteBreadcrumbs.types';

export const PageHeaderRouteBreadcrumbs = ({
  label,
}: PageHeaderRouteBreadcrumbsProps) => (
  <Breadcrumbs items={useRouteBreadcrumbs()} label={label} />
);
