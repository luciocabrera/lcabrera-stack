import { useNavigate } from 'react-router';

type BrowserHistoryState = null | { readonly idx?: number };

export const useBackNavigate = () => {
  const navigate = useNavigate();

  return (fallbackTo: string) => {
    const state = globalThis.history.state as BrowserHistoryState;

    if (typeof state?.idx === 'number' && state.idx > 0) {
      void navigate(-1);
    } else {
      void navigate(fallbackTo);
    }
  };
};
