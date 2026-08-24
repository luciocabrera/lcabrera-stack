import { CSP_NONCE_HEADER_NAME } from './security.constants';

export const getRequestCspNonce = (request: Request) => {
  return request.headers.get(CSP_NONCE_HEADER_NAME) ?? undefined;
};
