/**
 * The Postgres schema holding the llm-usage roll-up views
 * (`v_daily_llm_cost`, `v_project_llm_cost`, `v_scanner_llm_cost`,
 * `v_capped_llm_usage_attempts`). Shared so the readers cannot drift onto
 * different schemas.
 */
export const LLM_USAGE_SCHEMA = 'llm_usage';
