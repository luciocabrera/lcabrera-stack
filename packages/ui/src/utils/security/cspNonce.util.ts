import { CSP_NONCE_HEADER_NAME } from './cspNonceHeaderName.constants';

/**
 * Reads the CSP nonce from the inbound request headers.
 *
 * Header source is intentionally standardized to a single header name so all
 * SSR entrypoints consume the same contract.
 */
export const getRequestCspNonce = (request: Request): string | undefined => {
  return request.headers.get(CSP_NONCE_HEADER_NAME) ?? undefined;
};
