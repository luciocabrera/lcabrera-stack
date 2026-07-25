import { useAppConfigContextValue } from '../useAppConfigContextValue.hook';

export const useGetIsAuthEnabled = () =>
  useAppConfigContextValue().isAuthEnabled;
