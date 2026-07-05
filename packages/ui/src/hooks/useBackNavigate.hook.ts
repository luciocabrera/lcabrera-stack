import { useNavigate } from 'react-router';

type BrowserHistoryState = { readonly idx?: number } | null;

/**
 * Navigates to the previous in-app entry when this SPA session's history
 * stack actually has one (`history.state.idx`, the position marker
 * react-router's own browser history writes on every push — 0 or absent
 * means this page has no earlier in-app history), otherwise navigates to a
 * caller-supplied fallback route instead of leaving the app entirely.
 */
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
