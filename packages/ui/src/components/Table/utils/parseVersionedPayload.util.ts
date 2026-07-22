import { PERSISTENCE_VERSION } from './persistence.constants';

type ParseVersionedPayloadArgs = {
  readonly rawValue: string;
};

/**
 * Parse a version-gated persisted payload — URI-encoded `{ value, version }`
 * JSON as written by the table persistence utils. Returns the payload value
 * when the version matches `PERSISTENCE_VERSION`, `undefined` on version
 * mismatch or invalid JSON. Callers supply their own empty default.
 */
export const parseVersionedPayload = <T>({
  rawValue,
}: ParseVersionedPayloadArgs) => {
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
      value: unknown;
      version: number;
    };

    if (parsed.version === PERSISTENCE_VERSION) {
      return parsed.value as T;
    }
  } catch {
    // Invalid JSON — skip
  }
};
