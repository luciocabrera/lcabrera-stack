import {
  useGetTableAdditionalMetadata,
  useGetTableLocale,
  useGetTableSchemaName,
  useGetTableTableName,
  useGetTableTitlePlural,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';

export const useDetailsIdentityMeta = () => {
  return {
    additionalMetadata: useGetTableAdditionalMetadata(),
    locale: useGetTableLocale(),
    schemaName: useGetTableSchemaName(),
    tableName: useGetTableTableName(),
    title: useGetTableTitlePlural(),
  };
};
