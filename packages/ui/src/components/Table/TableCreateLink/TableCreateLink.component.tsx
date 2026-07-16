import { PlusIcon } from '@repo/ui/components/Icons';
import { NavLink } from '@repo/ui/components/NavLink';

import type { TableCreateLinkProps } from './TableCreateLink.types';

export const TableCreateLink = ({
  isBusy = false,
  title,
  to,
}: TableCreateLinkProps) => (
  <NavLink
    aria-label={`Create ${title}`}
    icon={<PlusIcon size={16} />}
    isBusy={isBusy}
    isIconOnly
    size='mini'
    to={to}
    tooltipContent={`Create ${title}`}
  >
    {`Create ${title}`}
  </NavLink>
);
