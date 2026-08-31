import { createContext } from 'react-router';

import type { AuthClaims } from './auth.types';

export const authContext = createContext<AuthClaims>();
