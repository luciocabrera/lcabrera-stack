// Browser uploads buffer in memory (native request.formData()) — cap them.
// The CLI push channel (ADR-029) is the intended path for big repos.
const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;

type ValidateSyncArchiveArgs = {
  readonly archive: unknown;
};

type ValidateSyncArchiveResult =
  | { readonly archive: File; readonly ok: true }
  | { readonly error: string; readonly ok: false };

/**
 * Checks that a `sync-upload` form entry is a non-empty `.zip` within the
 * browser-upload cap, and narrows it to `File` for the caller.
 *
 * Returns a result rather than throwing, because every rejection here is a
 * message the sync panel renders inline. The discriminated union is what lets
 * the action keep the narrowing without re-testing `instanceof File`.
 */
export const validateSyncArchive = ({
  archive,
}: ValidateSyncArchiveArgs): ValidateSyncArchiveResult => {
  if (!(archive instanceof File) || archive.size === 0) {
    return {
      error: 'Pick a .zip archive of the repository to upload.',
      ok: false,
    };
  }

  if (!archive.name.toLowerCase().endsWith('.zip')) {
    return { error: 'Only .zip archives are supported.', ok: false };
  }

  if (archive.size > MAX_ARCHIVE_BYTES) {
    return {
      error: `Archive is too large for browser upload (max ${MAX_ARCHIVE_BYTES / (1024 * 1024)} MB) — use the CLI push instead.`,
      ok: false,
    };
  }

  return { archive, ok: true };
};
