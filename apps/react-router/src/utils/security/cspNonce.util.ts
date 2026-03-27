export const CSP_NONCE_HEADER_NAME = "x-csp-nonce";

/**
 * Reads the CSP nonce from the inbound request headers.
 *
 * Header source is intentionally standardized to a single header name so all
 * SSR entrypoints consume the same contract.
 */
export const getRequestCspNonce = (request: Request): string | undefined => {
  const value = request.headers.get(CSP_NONCE_HEADER_NAME);
  return value === null ? undefined : value;
};
