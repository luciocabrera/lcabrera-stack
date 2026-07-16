type ValidatePushArchiveArgs = {
  readonly byteLength: number;
  readonly maxBytes: number;
};

type ValidatePushArchiveResult =
  | { readonly error: string; readonly ok: false; readonly status: number }
  | { readonly ok: true };

/**
 * Checks a pushed archive's size before anything touches disk.
 *
 * Returns the failure rather than throwing so the caller owns the HTTP shape —
 * this stays a pure function, and the status codes travel with the reason that
 * earned them (400 for nothing sent, 413 for too much).
 */
export const validatePushArchive = ({
  byteLength,
  maxBytes,
}: ValidatePushArchiveArgs): ValidatePushArchiveResult => {
  if (byteLength === 0) {
    return {
      error: 'Empty request body — expected a .zip archive.',
      ok: false,
      status: 400,
    };
  }

  if (byteLength > maxBytes) {
    return {
      error: `Archive exceeds the ${maxBytes}-byte push limit.`,
      ok: false,
      status: 413,
    };
  }

  return { ok: true };
};
