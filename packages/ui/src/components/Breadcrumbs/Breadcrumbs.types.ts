import type { To, UIMatch } from 'react-router';

export type BreadcrumbHandle<TLoaderData = unknown> = {
  /** A list is the route's own steps in order, for a route that has no parent route to supply the earlier ones. */
  readonly breadcrumb?: (
    match: UIMatch<TLoaderData>,
  ) => BreadcrumbItem | readonly BreadcrumbItem[];
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
