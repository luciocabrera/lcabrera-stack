import { useAppConfigContextValue } from '../useAppConfigContextValue.hook';

export const useGetAppLogoutRoute = () =>
  useAppConfigContextValue().logoutRoute;
