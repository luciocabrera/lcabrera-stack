import { NavLink } from '@repo/ui/components/NavLink';
import { SectionCard } from '@repo/ui/components/SectionCard';
import { StatusBadge } from '@repo/ui/components/StatusBadge';
import { useLoaderData } from 'react-router';

import type { loader } from './roleDetail.loader';

export const RoleDetail = () => {
  const { permissions, role } = useLoaderData<typeof loader>();

  const assignedIds = new Set(role.permission_ids);
  const assignedLabels = permissions
    .filter((permission) => assignedIds.has(permission.id))
    .map((permission) => `${permission.resource_type}: ${permission.action}`);

  return (
    <div>
      <h1>{role.role_name}</h1>
      <p>
        <StatusBadge
          label={role.enabled ? 'enabled' : 'disabled'}
          tone={role.enabled ? 'success' : 'neutral'}
        />{' '}
        {role.description ?? 'No description.'}
      </p>
      <NavLink color='primary' to={`/cqms/admin/roles/edit/${role.role_name}`}>
        Edit Role
      </NavLink>

      <SectionCard title='Permissions'>
        <p>{assignedLabels.join(' · ') || 'No permissions assigned.'}</p>
      </SectionCard>
    </div>
  );
};
