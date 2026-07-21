type FetchAndValidateArgs<T> = {
  readonly isValid: (value: unknown) => value is T;
  readonly shapeErrorMessage: string;
  readonly url: string;
};

/**
 * Fetch a URL, assert an OK response, parse JSON, and validate its shape with a
 * type guard before returning the typed body.
 * @param args - Endpoint URL, response type guard, and shape-mismatch message.
 * @returns The validated response body.
 * @throws When the response is not OK or fails the shape guard.
 */
export const fetchAndValidate = async <T>({
  isValid,
  shapeErrorMessage,
  url,
}: FetchAndValidateArgs<T>): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const body = (await response.json()) as unknown;
  if (!isValid(body)) {
    throw new Error(shapeErrorMessage);
  }

  return body;
};
