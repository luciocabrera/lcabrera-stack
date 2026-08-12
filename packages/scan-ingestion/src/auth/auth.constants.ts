/**
 * CodePulse's product tag on every API-token plaintext
 * (`cqms_<tokenId>.<secret>`). It aids secret-scanning tools and human
 * recognition. This is the CQMS-specific value; the generic token format
 * lives in `@lcabrera/server/tokens` and takes this prefix as a parameter,
 * so the reusable package stays product-agnostic. Shared by issueApiToken
 * (writes it) and verifyApiToken (matches it).
 */
export const API_TOKEN_PREFIX = 'cqms_';
