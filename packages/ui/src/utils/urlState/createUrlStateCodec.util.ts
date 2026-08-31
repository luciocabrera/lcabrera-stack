import { logger } from '#ui/utils/logger';

type CreateUrlStateCodecArgs<TState, TFallback> = {
  readonly compact: (state: TState) => unknown;
  readonly decodeParam?: (param: string) => string;
  readonly encodeParam?: (json: string) => string;
  readonly fallback: TFallback;
  readonly label: string;
  readonly narrow: (parsed: unknown) => TState | undefined;
};

const identity = (text: string) => text;

export const createUrlStateCodec = <TState, TFallback = TState>({
  compact,
  decodeParam = identity,
  encodeParam = identity,
  fallback,
  label,
  narrow,
}: CreateUrlStateCodecArgs<TState, TFallback>) => ({
  deserialize: (param: string) => {
    try {
      const narrowed = narrow(JSON.parse(decodeParam(param)) as unknown);

      if (narrowed !== undefined) {
        return narrowed;
      }

      logger.debug(`[urlState] Refused ${label} param: unrecognised value`);
    } catch (error) {
      const failure = error instanceof Error ? error.name : typeof error;

      logger.debug(`[urlState] Failed to parse ${label} param: ${failure}`);
    }

    return fallback;
  },

  serialize: (state: TState) => encodeParam(JSON.stringify(compact(state))),
});
