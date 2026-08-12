import {
  useGetTableAdditionalMetadata,
  useGetTableLocale,
  useGetTableSchemaName,
  useGetTableTableName,
  useGetTableTitlePlural,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';

/**
 * Read the identity and locale/metadata meta values for the details panel.
 * @returns Identity fields, locale, and the additional metadata map.
 */
export const useDetailsIdentityMeta = () => {
  return {
    additionalMetadata: useGetTableAdditionalMetadata(),
    locale: useGetTableLocale(),
    schemaName: useGetTableSchemaName(),
    tableName: useGetTableTableName(),
    title: useGetTableTitlePlural(),
  };
};
