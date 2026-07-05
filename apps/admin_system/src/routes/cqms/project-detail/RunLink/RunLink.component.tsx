import { Link, useParams } from 'react-router';

import type { RunLinkProps } from './RunLink.types';

export const RunLink = ({ run }: RunLinkProps) => {
  const { projectId } = useParams();
  return (
    <Link to={`/cqms/projects/view/${projectId}/runs/${run.id}`}>
      {new Date(run.created_at).toLocaleString()}
    </Link>
  );
};
