import type { LoaderFunctionArgs } from 'react-router';

import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { data } from 'react-router';
import { z } from 'zod';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({ projectId: z.uuid() });

/** Awaited — needed to pre-fill the Form and to 404 on an unknown project. */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { projectId } = parseRouteParams({
    invalidMessage: 'Invalid project id.',
    params,
    schema: paramsSchema,
  });

  const project = await getProjectById({ projectId });
  if (!project) {
    throw data('Project not found.', { status: 404 });
  }

  return { project };
};
