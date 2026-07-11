import { Button } from '@repo/ui/components/Button';
import { useFetcher } from 'react-router';

import type { ProjectSyncPanelProps } from './ProjectSyncPanel.types';

type SyncActionData = {
  readonly ok?: boolean;
  readonly syncError?: string;
};

/**
 * The browser sync channel (ADR-028): upload a .zip of the repository to
 * become the project's latest snapshot — sync-then-scan, latest wins.
 * useFetcher (not <Form>) so the upload stays on the page; a completed
 * action revalidates the project loader, refreshing the synced-at line
 * and unlocking the Trigger Scan link automatically. Timestamp renders in
 * a locale-independent format to keep SSR and client markup identical.
 */
export const ProjectSyncPanel = ({ project }: ProjectSyncPanelProps) => {
  const fetcher = useFetcher<SyncActionData>();
  const isUploading = fetcher.state !== 'idle';

  return (
    <div>
      {project.synced_at ? (
        <p>
          Last synced {project.synced_at.slice(0, 19).replace('T', ' ')} (
          {project.sync_source ?? 'unknown source'}).
        </p>
      ) : (
        <p>
          No code snapshot yet — upload a .zip of the repository to enable
          scans.
        </p>
      )}
      <fetcher.Form encType='multipart/form-data' method='post'>
        <input name='intent' type='hidden' value='sync-upload' />
        <input accept='.zip' name='archive' required type='file' />
        <Button isDisabled={isUploading} size='mini' type='submit'>
          {isUploading ? 'Uploading…' : 'Upload Snapshot'}
        </Button>
      </fetcher.Form>
      {fetcher.data?.syncError && <p>{fetcher.data.syncError}</p>}
    </div>
  );
};
