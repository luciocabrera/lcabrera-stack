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
 * Its narrowing asserts the envelope only — a plain object whose values stay
 * `unknown`. A non-object payload is still refused, because an array or a
 * scalar is not a `tableState` value in any shape this param defines.
 *
 * Be clear about what that leaves open, because the values are **not** narrowed
 * downstream either. `readTableLoaderStateFromRequest` casts them —
 * `urlState?.columnOrder` to `ColumnOrderState`, `urlState?.columnVisibility` to
 * `ColumnVisibilityState` — so a hand-edited payload can put a number behind an
 * array type. That is pre-existing and unchanged by this codec; hardening those
 * slices is separate work, tracked on its own. What this codec closes is the
 * envelope, and it claims nothing about the values inside it.
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
