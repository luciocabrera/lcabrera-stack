type AddPreloadHeadersArgs = {
  readonly responseHeaders: Headers;
  readonly stylexCssHref: string;
};

/**
 * Appends the preload Link header for the app's compiled StyleX stylesheet
 * so the browser fetches the critical CSS before the streamed HTML
 * references it.
 */
export const addPreloadHeaders = ({
  responseHeaders,
  stylexCssHref,
}: AddPreloadHeadersArgs) => {
  responseHeaders.append('Link', `<${stylexCssHref}>; rel=preload; as=style`);
};
