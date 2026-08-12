import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { createUrlStateCodec } from './createUrlStateCodec.util';

/** Base64 with the two alphabet characters a URL would otherwise escape. */
const toUrlSafeBase64 = (base64: string) =>
  base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');

const fromUrlSafeBase64 = (param: string) =>
  param
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(param.length + ((4 - (param.length % 4)) % 4), '=');

/**
 * Codec for the Base64 `<persistenceKey>-tableState` param.
 *
 * Its narrowing only asserts the envelope — a plain object whose values stay
 * `unknown`. That is the whole vocabulary this param has: every value is read
 * back through a slice-specific reader that narrows for itself, so claiming
 * more here would be claiming something unchecked. An array or a scalar payload
 * is still refused, because no reader downstream can make sense of one.
 */
export const stateCodec = createUrlStateCodec<
  Record<string, unknown>,
  undefined
>({
  compact: (state) =>
    Object.fromEntries(
      Object.entries(state).map(([key, value]) => [
        key,
        value instanceof Set ? [...value] : value,
      ]),
    ),
  decodeParam: (param) => atob(fromUrlSafeBase64(param)),
  encodeParam: (json) => toUrlSafeBase64(btoa(json)),
  fallback: undefined,
  label: 'state',
  narrow: (parsed) =>
    isObject(parsed) && !Array.isArray(parsed) ? parsed : undefined,
});
