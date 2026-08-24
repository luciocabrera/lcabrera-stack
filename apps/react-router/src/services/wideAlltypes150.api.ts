import type { PaginatedFetchArgs } from '@lcabrera/api/http/http.types';

import { getApiBaseUrl } from '@lcabrera/api/config/get-api-base-url.util';
import { createPaginatedFetcher } from '@lcabrera/api/http/create-paginated-fetcher.util';
import { isObject } from '@lcabrera/utils/guards/is-object.util';

import { isExternalApiEnabled } from './isExternalApiEnabled.util';

// ─── Type ────────────────────────────────────────────────────────────────────

// Properties sorted alphabetically: c_001…c_149 first (before "id"), id last.
export type WideAlltypes150 = {
  readonly c_001: number;
  readonly c_002: string;
  readonly c_003: string;
  readonly c_004: number;
  readonly c_005: number;
  readonly c_006: boolean;
  readonly c_007: string;
  readonly c_008: string;
  readonly c_009: string;
  readonly c_010: string;
  readonly c_011: string;
  readonly c_012: string;
  readonly c_013: string;
  readonly c_014: string;
  readonly c_015: string;
  readonly c_016: string;
  readonly c_017: string;
  readonly c_018: string;
  readonly c_019: readonly number[];
  readonly c_020: number;
  readonly c_021: number;
  readonly c_022: string;
  readonly c_023: string;
  readonly c_024: number;
  readonly c_025: number;
  readonly c_026: boolean;
  readonly c_027: string;
  readonly c_028: string;
  readonly c_029: string;
  readonly c_030: string;
  readonly c_031: string;
  readonly c_032: string;
  readonly c_033: string;
  readonly c_034: string;
  readonly c_035: string;
  readonly c_036: string;
  readonly c_037: string;
  readonly c_038: string;
  readonly c_039: readonly number[];
  readonly c_040: number;
  readonly c_041: number;
  readonly c_042: string;
  readonly c_043: string;
  readonly c_044: number;
  readonly c_045: number;
  readonly c_046: boolean;
  readonly c_047: string;
  readonly c_048: string;
  readonly c_049: string;
  readonly c_050: string;
  readonly c_051: string;
  readonly c_052: string;
  readonly c_053: string;
  readonly c_054: string;
  readonly c_055: string;
  readonly c_056: string;
  readonly c_057: string;
  readonly c_058: string;
  readonly c_059: readonly number[];
  readonly c_060: number;
  readonly c_061: number;
  readonly c_062: string;
  readonly c_063: string;
  readonly c_064: number;
  readonly c_065: number;
  readonly c_066: boolean;
  readonly c_067: string;
  readonly c_068: string;
  readonly c_069: string;
  readonly c_070: string;
  readonly c_071: string;
  readonly c_072: string;
  readonly c_073: string;
  readonly c_074: string;
  readonly c_075: string;
  readonly c_076: string;
  readonly c_077: string;
  readonly c_078: string;
  readonly c_079: readonly number[];
  readonly c_080: number;
  readonly c_081: number;
  readonly c_082: string;
  readonly c_083: string;
  readonly c_084: number;
  readonly c_085: number;
  readonly c_086: boolean;
  readonly c_087: string;
  readonly c_088: string;
  readonly c_089: string;
  readonly c_090: string;
  readonly c_091: string;
  readonly c_092: string;
  readonly c_093: string;
  readonly c_094: string;
  readonly c_095: string;
  readonly c_096: string;
  readonly c_097: string;
  readonly c_098: string;
  readonly c_099: readonly number[];
  readonly c_100: number;
  readonly c_101: number;
  readonly c_102: string;
  readonly c_103: string;
  readonly c_104: number;
  readonly c_105: number;
  readonly c_106: boolean;
  readonly c_107: string;
  readonly c_108: string;
  readonly c_109: string;
  readonly c_110: string;
  readonly c_111: string;
  readonly c_112: string;
  readonly c_113: string;
  readonly c_114: string;
  readonly c_115: string;
  readonly c_116: string;
  readonly c_117: string;
  readonly c_118: string;
  readonly c_119: readonly number[];
  readonly c_120: number;
  readonly c_121: number;
  readonly c_122: string;
  readonly c_123: string;
  readonly c_124: number;
  readonly c_125: number;
  readonly c_126: boolean;
  readonly c_127: string;
  readonly c_128: string;
  readonly c_129: string;
  readonly c_130: string;
  readonly c_131: string;
  readonly c_132: string;
  readonly c_133: string;
  readonly c_134: string;
  readonly c_135: string;
  readonly c_136: string;
  readonly c_137: string;
  readonly c_138: string;
  readonly c_139: readonly number[];
  readonly c_140: number;
  readonly c_141: number;
  readonly c_142: string;
  readonly c_143: string;
  readonly c_144: number;
  readonly c_145: number;
  readonly c_146: boolean;
  readonly c_147: string;
  readonly c_148: string;
  readonly c_149: string;
  readonly id: number;
};

export type WideAlltypes150Response = {
  readonly data: readonly WideAlltypes150[];
  readonly hasMore: boolean;
  readonly total: number;
};

const isWideAlltypes150Response = (
  value: unknown,
): value is WideAlltypes150Response =>
  isObject(value) &&
  Array.isArray(value.data) &&
  typeof value.hasMore === 'boolean' &&
  typeof value.total === 'number';

// ─── Service ──────────────────────────────────────────────────────────────────

export const WIDE_ALLTYPES_150_PAGINATED_PATH =
  '/_api/wide-alltypes-150/paginated';

const fetchSelfHostedPage = createPaginatedFetcher<WideAlltypes150Response>({
  isValid: isWideAlltypes150Response,
  path: WIDE_ALLTYPES_150_PAGINATED_PATH,
});

const fetchExternalPage = createPaginatedFetcher<WideAlltypes150Response>({
  isValid: isWideAlltypes150Response,
  path: '/wide-alltypes-150/paginated',
  resolveBaseUrl: getApiBaseUrl,
});

/**
 * No filter support (varied column types make generic filtering impractical), and no
 * keyset support — so the route sends neither.
 */
export const fetchWideAlltypes150Page = (args: PaginatedFetchArgs) =>
  isExternalApiEnabled() ? fetchExternalPage(args) : fetchSelfHostedPage(args);
