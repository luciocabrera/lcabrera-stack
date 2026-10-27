import type { LoaderFunctionArgs } from 'react-router';

import { getRootLoaderData } from '@lcabrera/ui/routing/shared/getRootLoaderData.util';

import { APP_ID } from '@/constants/app.constants';
import { isEvalsDashboardEnabled } from '@/routes/evals/.server/requireEvalsDashboard.service';

export const loader = ({ request }: LoaderFunctionArgs) => ({
  ...getRootLoaderData({ appId: APP_ID, request }),
  isEvalsDashboardEnabled: isEvalsDashboardEnabled(),
});
