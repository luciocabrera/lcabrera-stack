import { Link, useParams } from 'react-router';

import type { ScanLinkProps } from './ScanLink.types';

export const ScanLink = ({ scan }: ScanLinkProps) => {
  const { projectId, runId } = useParams();
  return (
    <Link
      to={`/cqms/projects/view/${projectId}/runs/${runId}/scans/${scan.scan_id}`}
    >
      {scan.scanner_id}
    </Link>
  );
};
