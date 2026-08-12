import { logger } from '#ui/utils/logger';

type CreateUrlStateCodecArgs<TState, TFallback> = {
  /**
   * Reduces state to the JSON-serialisable value that travels in the param.
   * It must return a value `JSON.stringify` can represent — deciding whether
   * the param belongs in the URL at all is the caller's job, not the codec's.
   */
  readonly compact: (state: TState) => unknown;
  /**
   * Raw param text to JSON text, for params carrying a transport layer such as
   * Base64. Throwing here is a refusal like any other: it degrades rather than
   * escaping to the caller.
   */
  readonly decodeParam?: (param: string) => string;
  /** JSON text to raw param text — the inverse of `decodeParam`. */
  readonly encodeParam?: (json: string) => string;
  /** What `deserialize` answers whenever the param is unusable. */
  readonly fallback: TFallback;
  /** Names this codec in the debug line written on a failed parse or a refusal. */
  readonly label: string;
  /**
   * Narrows parsed JSON to the state, answering `undefined` for anything
   * outside its vocabulary. That answer refuses the **whole** payload — never
   * one field of it.
   */
  readonly narrow: (parsed: unknown) => TState | undefined;
};

const identity = (text: string) => text;

/**
 * Builds a URL-param codec from a caller-supplied narrowing.
 *
 * The narrowing is the entire validation story — no combinators, no schema
 * type, no error objects, because that is how this grows into a schema library
 * by accident and `@lcabrera/ui` deliberately ships without one.
 *
 * The contract it buys is refusal, not repair: a narrowing that does not
 * recognise a token returns `undefined`, and `deserialize` then answers
 * `fallback`. So a hand-edited param yields *no* state rather than a partly
 * applied one, and a token *the narrowing rejects* never reaches a downstream
 * lookup typed as valid.
 *
 * That guarantee is exactly as wide as the narrowing each codec supplies and no
 * wider — one that asserts only an envelope buys nothing about the values
 * inside it. Each codec documents its own reach.
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
      logger.debug(`[urlState] Failed to parse ${label} param:`, error);
    }

    return fallback;
  },

  serialize: (state: TState) => encodeParam(JSON.stringify(compact(state))),
});
