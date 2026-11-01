import type { UIMatch } from 'react-router';

import { useMatches } from 'react-router';

import type { BreadcrumbHandle } from '../Breadcrumbs.types';

type BreadcrumbMatch = UIMatch<unknown, Required<BreadcrumbHandle>>;

const hasBreadcrumb = (match: UIMatch): match is BreadcrumbMatch => {
  const { handle } = match;

  return (
    handle instanceof Object &&
    'breadcrumb' in handle &&
    typeof handle.breadcrumb === 'function'
  );
};

export const useRouteBreadcrumbs = () =>
  useMatches()
    .filter(hasBreadcrumb)
    .map((match) => match.handle.breadcrumb(match));
