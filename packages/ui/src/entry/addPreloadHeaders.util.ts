type AddPreloadHeadersArgs = {
  readonly responseHeaders: Headers;
  readonly stylexCssHref: string;
};

export const addPreloadHeaders = ({
  responseHeaders,
  stylexCssHref,
}: AddPreloadHeadersArgs) => {
  responseHeaders.append('Link', `<${stylexCssHref}>; rel=preload; as=style`);
};
