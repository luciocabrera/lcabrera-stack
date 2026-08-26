import { parseOrdersPageParams } from './parseOrdersPageParams.util';
import { resolveOrdersGroupRead } from './resolveOrdersGroupRead.util';

export const resolveOrdersPageRead = async (params: URLSearchParams) =>
  resolveOrdersGroupRead({ ...parseOrdersPageParams(params), params });
