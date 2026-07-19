import type { ClientActionFunctionArgs } from 'react-router';

import { parseOrderFormData, toOrderFieldErrors } from './config';

/**
 * Shared browser `clientAction` for the create and edit order routes: validate
 * the submission client-side and only delegate to the server `action` when it
 * passes (feature plan §2). On failure it returns `{ errors }` instantly, with
 * no server round-trip. The request is cloned so the body remains intact for
 * `serverAction()`.
 */
export const orderClientAction = async ({
  request,
  serverAction,
}: ClientActionFunctionArgs) => {
  const formData = await request.clone().formData();
  const parsed = parseOrderFormData(formData);

  if (!parsed.success) {
    return { errors: toOrderFieldErrors({ error: parsed.error }) };
  }

  return serverAction();
};
