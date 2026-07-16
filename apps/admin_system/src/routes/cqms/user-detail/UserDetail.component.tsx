import { NavLink } from '@repo/ui/components/NavLink';
import { SectionCard } from '@repo/ui/components/SectionCard';
import { StatusBadge } from '@repo/ui/components/StatusBadge';
import { useLoaderData } from 'react-router';

import type { loader } from './userDetail.loader';

export const UserDetail = () => {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{user.display_name}</h1>
      <p>
        <StatusBadge
          label={user.enabled ? 'enabled' : 'disabled'}
          tone={user.enabled ? 'success' : 'neutral'}
        />{' '}
        {user.username}
      </p>
      <NavLink to={`/cqms/admin/users/edit/${user.username}`} variant='primary'>
        Edit User
      </NavLink>

      <SectionCard title='Roles'>
        <p>{user.role_names.join(', ') || 'No roles assigned.'}</p>
      </SectionCard>
    </div>
  );
};
