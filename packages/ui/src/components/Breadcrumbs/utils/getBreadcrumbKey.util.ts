import type { To } from 'react-router';

import { createPath } from 'react-router';

import type { BreadcrumbItem } from '../Breadcrumbs.types';

const getPathKey = (to: To) => (typeof to === 'string' ? to : createPath(to));

export const getBreadcrumbKey = ({ label, to }: BreadcrumbItem) =>
  to === undefined ? label : `${getPathKey(to)} ${label}`;
