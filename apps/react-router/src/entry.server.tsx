import { createHandleRequest } from '@repo/ui/entry/createHandleRequest.util';

import stylexCssHref from './stylex.css?url';

const { handleRequest, streamTimeout } = createHandleRequest({
  stylexCssHref,
});

export { streamTimeout };
export default handleRequest;
