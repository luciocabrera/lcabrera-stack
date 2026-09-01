import { PERSISTENCE_VERSION } from './persistence.constants';

type ParseVersionedPayloadArgs = {
  readonly rawValue: string;
};

export const parseVersionedPayload = <T>({
  rawValue,
}: ParseVersionedPayloadArgs) => {
  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as {
      value: unknown;
      version: number;
    };

    return parsed.version === PERSISTENCE_VERSION
      ? (parsed.value as T)
      : undefined;
  } catch {
    return;
  }
};
