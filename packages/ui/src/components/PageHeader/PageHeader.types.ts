import type { ReactNode } from 'react';

import type { BreadcrumbItem } from '#ui/components/Breadcrumbs';

export type PageHeaderProps = {
  readonly actions?: ReactNode;
  /** Defaults to the matched routes' `handle.breadcrumb` entries, which needs a data router. */
  readonly breadcrumbs?: readonly BreadcrumbItem[];
  readonly description?: ReactNode;
  readonly title: string;
};
