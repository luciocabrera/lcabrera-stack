/**
 * A two-route stub for testing a GET form: the form at `/`, submitting to `/results`, whose loader returns the query it was sent and renders it in an `output`.
 */

import type { ReactNode } from 'react';

import { createRoutesStub, Form, useLoaderData } from 'react-router';
import { vi } from 'vite-plus/test';

type CreateGetFormRoutesStubArgs = {
  readonly fields: ReactNode;
};

export const createGetFormRoutesStub = ({
  fields,
}: CreateGetFormRoutesStubArgs) => {
  const resultsLoader = vi.fn(
    ({ request }: { readonly request: Request }) => new URL(request.url).search,
  );
  const Stub = createRoutesStub([
    {
      Component: () => (
        <Form action='/results' method='get'>
          {fields}
          <button type='submit'>Apply</button>
        </Form>
      ),
      path: '/',
    },
    {
      Component: () => <output>{useLoaderData<string>()}</output>,
      loader: resultsLoader,
      path: '/results',
    },
  ]);

  return { resultsLoader, Stub };
};
