import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { data, type LoaderFunctionArgs } from 'react-router';
import { z } from 'zod';

const paramsSchema = z.object({ projectId: z.string().uuid() });

/** Awaited — needed to pre-fill the Form and to 404 on an unknown project. */
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const project = await getProjectById({
    projectId: parsedParams.data.projectId,
  });
  if (!project) {
    throw data('Project not found.', { status: 404 });
  }

  return { project };
};
