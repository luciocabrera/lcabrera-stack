import { createHandleRequest } from '@repo/ui/server';

import stylexCssHref from './stylex.css?url';

const { handleRequest, streamTimeout } = createHandleRequest({
  stylexCssHref,
});

export { streamTimeout };
export default handleRequest;
