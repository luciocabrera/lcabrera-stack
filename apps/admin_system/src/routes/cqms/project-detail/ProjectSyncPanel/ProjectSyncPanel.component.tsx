import { Button } from '@repo/ui/components/Button';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useFetcher } from 'react-router';

import type {
  ProjectSyncPanelProps,
  SyncActionData,
} from './ProjectSyncPanel.types';

import { applyWebkitDirectory } from './applyWebkitDirectory.util';
import { useFolderSnapshotUpload } from './useFolderSnapshotUpload.hook';

/**
 * The snapshot sync panel (ADR-028) with two client-side channels, both of
 * which POST a zip through the same `sync-upload` action:
 *  - Folder picker (ADR-031): pick the project directory; the browser packs it
 *    client-side, excluding node_modules/.git/build output (node_modules is
 *    opt-in). This is the ergonomic path — no hand-made archive.
 *  - .zip upload (ADR-028): a pre-made archive, kept as a fallback.
 * useFetcher (not <Form>) so uploads stay on the page; a completed action
 * revalidates the project loader, refreshing the synced-at line and unlocking
 * Trigger Scan. Timestamp renders locale-independently to keep SSR/client
 * markup identical. The server never reads a local path (hosted model,
 * ADR-028) — zipping is always on the developer's machine.
 */
export const ProjectSyncPanel = ({ project }: ProjectSyncPanelProps) => {
  const folderUpload = useFolderSnapshotUpload();
  const [folderFiles, setFolderFiles] = useState<readonly File[]>([]);
  const [includeNodeModules, setIncludeNodeModules] = useState(false);

  const zipFetcher = useFetcher<SyncActionData>();
  const isZipUploading = zipFetcher.state !== 'idle';

  const handleFolderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFolderFiles(event.target.files ? [...event.target.files] : []);
  };

  const handleIncludeNodeModulesChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setIncludeNodeModules(event.target.checked);
  };

  const handleFolderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void folderUpload.submitFolder({ files: folderFiles, includeNodeModules });
  };

  return (
    <div>
      {project.synced_at ? (
        <p>
          Last synced {project.synced_at.slice(0, 19).replace('T', ' ')} (
          {project.sync_source ?? 'unknown source'}).
        </p>
      ) : (
        <p>
          No code snapshot yet — pick your project folder to pack and upload it
          (or upload a .zip) to enable scans.
        </p>
      )}

      <form onSubmit={handleFolderSubmit}>
        <input
          accept='*/*'
          name='folder'
          onChange={handleFolderChange}
          ref={applyWebkitDirectory}
          type='file'
        />
        <label>
          <input
            checked={includeNodeModules}
            onChange={handleIncludeNodeModulesChange}
            type='checkbox'
          />
          Include node_modules
        </label>
        <Button
          isDisabled={folderUpload.isBusy || folderFiles.length === 0}
          size='mini'
          type='submit'
        >
          {folderUpload.isBusy ? 'Packing…' : 'Pack & Sync Folder'}
        </Button>
      </form>
      {Boolean(folderUpload.error) && <p>{folderUpload.error}</p>}

      <p>or</p>

      <zipFetcher.Form encType='multipart/form-data' method='post'>
        <input name='intent' type='hidden' value='sync-upload' />
        <input accept='.zip' name='archive' required type='file' />
        <Button isDisabled={isZipUploading} size='mini' type='submit'>
          {isZipUploading ? 'Uploading…' : 'Upload .zip'}
        </Button>
      </zipFetcher.Form>
      {Boolean(zipFetcher.data?.syncError) && (
        <p>{zipFetcher.data?.syncError}</p>
      )}
    </div>
  );
};
