import { logger } from '#ui/utils/logger';

type CreateUrlStateCodecArgs<TState, TFallback> = {
  readonly compact: (state: TState) => unknown;
  readonly decodeParam?: (param: string) => string;
  /** JSON text to raw param text — the inverse of `decodeParam`. */
  readonly encodeParam?: (json: string) => string;
  readonly fallback: TFallback;
  readonly label: string;
  /** That answer refuses the **whole** payload — never one field of it. */
  readonly narrow: (parsed: unknown) => TState | undefined;
};

const identity = (text: string) => text;

/**
 * The narrowing is the entire validation story — no combinators, no schema type, no error
 * objects, because that is how this grows into a schema library by accident and
 * `@lcabrera/ui` deliberately ships without one.
 * So a hand-edited param yields *no* state rather than a partly applied one, and a token
 * *the narrowing rejects* never reaches a downstream lookup typed as valid.
 */
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
      // The failure *kind* only — never the error itself. V8 embeds the input
      // in a `JSON.parse` SyntaxError message, so passing the error through
      // would echo the param's leading characters into the log, and `filters`
      // carries user-entered text. The name still separates malformed JSON
      // (`SyntaxError`) from undecodable Base64 (`InvalidCharacterError`).
      const failure = error instanceof Error ? error.name : typeof error;

      logger.debug(`[urlState] Failed to parse ${label} param: ${failure}`);
    }

    return fallback;
  },

  serialize: (state: TState) => encodeParam(JSON.stringify(compact(state))),
});
