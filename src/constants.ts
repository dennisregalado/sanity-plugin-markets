import type {PluginConfigContext} from './types'

export const METADATA_SCHEMA_NAME = `market.metadata`
export const TRANSLATIONS_ARRAY_NAME = `markets`
export const API_VERSION = `2025-02-19`
export const DEFAULT_CONFIG: PluginConfigContext = {
  supportedLanguages: [],
  schemaTypes: [],
  languageField: `market`,
  weakReferences: false,
  bulkPublish: false,
  metadataFields: [],
  apiVersion: API_VERSION,
  allowCreateMetaDoc: false,
  callback: null,
}
