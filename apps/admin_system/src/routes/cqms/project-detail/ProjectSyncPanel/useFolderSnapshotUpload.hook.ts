import { IGNORED_DIRECTORIES } from '@repo/scan-ingestion/ingestion/ingestion.constants';
import { zipSync } from 'fflate';
import { useState } from 'react';
import { useFetcher } from 'react-router';

import type { SyncActionData } from './ProjectSyncPanel.types';

import { isPathInIgnoredDirectory } from './isPathInIgnoredDirectory.util';
import { resolveArchiveEntryKey } from './resolveArchiveEntryKey.util';
import { resolveEffectiveIgnoredDirectories } from './resolveEffectiveIgnoredDirectories.util';

const SNAPSHOT_FILE_NAME = 'snapshot.zip';

type SubmitFolderArgs = {
  readonly files: readonly File[];
  readonly includeNodeModules: boolean;
};

/**
 * The browser folder-picker sync channel (ADR-031): the client packs a picked
 * project directory into a zip and POSTs it through the existing `sync-upload`
 * action (ADR-028) — no server change, and no dependency installs or VCS
 * metadata ever leave the machine because the shared IGNORED_DIRECTORIES set
 * is applied before zipping. Zip keys are repo-root-relative POSIX paths (see
 * resolveArchiveEntryKey) so the server extractor's zip-slip guard and
 * workspace discovery line up exactly with the CLI push. Reading file bytes,
 * zipping, and the fetcher submit are the effects and live here; the pure
 * filtering / key derivation live in colocated utils. `isBusy` spans both the
 * client-side pack and the server round-trip so the trigger stays disabled for
 * the whole operation.
 */
export const useFolderSnapshotUpload = () => {
  const fetcher = useFetcher<SyncActionData>();
  const [isPacking, setIsPacking] = useState(false);
  const [packError, setPackError] = useState('');

  const submitFolder = async ({
    files,
    includeNodeModules,
  }: SubmitFolderArgs) => {
    setPackError('');
    setIsPacking(true);
    try {
      const ignoredDirectories = resolveEffectiveIgnoredDirectories({
        baseIgnored: IGNORED_DIRECTORIES,
        includeNodeModules,
      });

      const included = files
        .map((file) => ({
          file,
          key: resolveArchiveEntryKey(file.webkitRelativePath),
        }))
        .filter(
          ({ key }) =>
            !isPathInIgnoredDirectory({
              ignoredDirectories,
              relativePath: key,
            }),
        );

      if (included.length === 0) {
        setPackError(
          'That folder has no files to upload once node_modules and build output are excluded.',
        );
        return;
      }

      const entries = Object.fromEntries(
        await Promise.all(
          included.map(
            async ({ file, key }) =>
              [key, new Uint8Array(await file.arrayBuffer())] as const,
          ),
        ),
      );

      const archive = new File([zipSync(entries)], SNAPSHOT_FILE_NAME, {
        type: 'application/zip',
      });
      const formData = new FormData();
      formData.append('intent', 'sync-upload');
      formData.append('archive', archive);
      void fetcher.submit(formData, {
        encType: 'multipart/form-data',
        method: 'post',
      });
    } catch (error) {
      setPackError(
        error instanceof Error
          ? error.message
          : 'Failed to package the folder.',
      );
    } finally {
      setIsPacking(false);
    }
  };

  return {
    error: packError || fetcher.data?.syncError,
    isBusy: isPacking || fetcher.state !== 'idle',
    submitFolder,
  };
};
