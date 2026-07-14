import { data } from 'react-router';
import type { z } from 'zod';

type ParseRouteParamsArgs<TSchema extends z.ZodType> = {
  readonly invalidMessage: string;
  readonly params: Readonly<Record<string, string | undefined>>;
  readonly schema: TSchema;
};

/**
 * Validates route params against a Zod schema, throwing a 400 response with
 * `invalidMessage` when they don't match. Returns the parsed params. Shared by
 * the CQMS loaders/actions, which all key on a validated route param (a UUID id
 * or a slug) and 400 on a malformed one.
 */
export const parseRouteParams = <TSchema extends z.ZodType>({
  invalidMessage,
  params,
  schema,
}: ParseRouteParamsArgs<TSchema>): z.infer<TSchema> => {
  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    throw data(invalidMessage, { status: 400 });
  }

  return parsed.data;
};
