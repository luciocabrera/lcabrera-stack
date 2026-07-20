import { Button } from '@repo/ui/components/Button';
import { Form } from 'react-router';

import { LOGOUT_ROUTE } from '@/auth/auth.constants';

import type { LogoutControlProps } from './LogoutControl.types';

/**
 * Session control mounted in the navigation footer via `AppShell`'s
 * `sessionActions` slot. Logout mutates session state, so it POSTs a `<Form>`
 * to the logout action — never a GET a link or prefetch could fire. Mirrors the
 * theme toggle beside it: icon-only with a tooltip when the sidebar is
 * collapsed, labelled when expanded.
 */
export const LogoutControl = ({ isCollapsed }: LogoutControlProps) => (
  <Form action={LOGOUT_ROUTE} method='post'>
    <Button
      aria-label='Log out'
      icon='🚪'
      isIconOnly={isCollapsed}
      tooltipContent={isCollapsed ? 'Log out' : undefined}
      tooltipPlacement='right'
      type='submit'
      variant='ghost'
    >
      Log out
    </Button>
  </Form>
);
