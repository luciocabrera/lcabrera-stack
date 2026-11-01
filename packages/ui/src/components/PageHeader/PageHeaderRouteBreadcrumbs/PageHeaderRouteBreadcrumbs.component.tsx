import { Breadcrumbs, useRouteBreadcrumbs } from '#ui/components/Breadcrumbs';

export const PageHeaderRouteBreadcrumbs = () => (
  <Breadcrumbs items={useRouteBreadcrumbs()} />
);
