import { useAppConfigContextValue } from '../useAppConfigContextValue.hook';

export const useGetAppNavigationItems = () =>
  useAppConfigContextValue().getNavigationItems;
