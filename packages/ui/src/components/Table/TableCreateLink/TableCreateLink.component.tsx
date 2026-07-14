import { PlusIcon } from '@repo/ui/components/Icons';
import { NavLink } from '@repo/ui/components/NavLink';

import type { TableCreateLinkProps } from './TableCreateLink.types';

// Sized to match the built-in table-settings gear button (size='mini') so the two read as a matched pair.
// `isBusy` mirrors that gear button so both show the loading overlay together while the table loads.
export const TableCreateLink = ({
  isBusy = false,
  title,
  to,
}: TableCreateLinkProps) => (
  <NavLink
    aria-label={`Create ${title}`}
    color='outline'
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
