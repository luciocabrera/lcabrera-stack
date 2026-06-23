// import type { Route } from './+types/layout';

export { shouldRevalidatePersistCookieAction as shouldRevalidate } from '../utils/shouldRevalidatePersistCookieAction.util';
export { loader } from './enterprise-orders.loader';
export { meta } from './enterprise-orders.meta';
export { EnterpriseOrders as default } from './EnterpriseOrders.component';
// export function HydrateFallback(args: Route.HydrateFallbackProps) {
//   console.log('HydrateFallback render', { args });

//   return <div>{JSON.stringify(args)}</div>;
// }
