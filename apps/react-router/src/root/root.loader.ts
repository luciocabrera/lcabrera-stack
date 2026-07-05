import type { LoaderFunctionArgs } from 'react-router';

import { getRootLoaderData } from '@repo/ui/routing/getRootLoaderData.util';
import { APP_ID } from '@/constants/app.constants';

export const loader = ({ request }: LoaderFunctionArgs) =>
  getRootLoaderData({ appId: APP_ID, request });
