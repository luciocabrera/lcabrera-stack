/**
 * Lowercase hex for a byte array — what `bytea` looked like in every JSON page
 * this route ever rendered.
 *
 * Spelled out rather than delegated to `Buffer.prototype.toString('hex')`,
 * because this app's tsconfig declares no `node` types: `Buffer` is a Node
 * global, and reaching for one here would put a server-only assumption in a
 * module the client graph can legitimately resolve. A `Buffer` is a
 * `Uint8Array`, so the driver's value arrives as one either way.
 */
export const toHexString = (bytes: Uint8Array) =>
  [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
