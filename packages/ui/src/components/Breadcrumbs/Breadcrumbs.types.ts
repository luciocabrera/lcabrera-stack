import type { To, UIMatch } from 'react-router';

export type BreadcrumbHandle<TLoaderData = unknown> = {
  readonly breadcrumb?: (match: UIMatch<TLoaderData>) => BreadcrumbItem;
};

export type BreadcrumbItem = {
  readonly label: string;
  /** Omitted for a step that has no page of its own; the last item never links. */
  readonly to?: To;
};

export type BreadcrumbsProps = {
  readonly items: readonly BreadcrumbItem[];
  /** The accessible name of the `nav` landmark. Defaults to `'Breadcrumb'`. */
  readonly label?: string;
};
