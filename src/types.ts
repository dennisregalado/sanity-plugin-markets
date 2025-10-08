/* eslint-disable no-unused-vars */

import type {
  FieldDefinition,
  KeyedObject,
  ObjectSchemaType,
  Reference,
  SanityClient,
  SanityDocument,
  SanityDocumentLike,
} from 'sanity'

export type Market = {
  id: Intl.UnicodeBCP47LocaleIdentifier
  language?: any;
  country?: any;
  currency?: any;
  pathPrefix?: string;
  title: string
}

export type SupportedMarkets =
  | Market[]
  | ((client: SanityClient) => Promise<Market[]>)

export type PluginCallbackArgs = {
  sourceDocument: SanityDocument
  newDocument: SanityDocument
  sourceLanguageId: string
  destinationLanguageId: string
  metaDocumentId: string
  client: SanityClient
}

export type PluginConfig = {
  supportedMarkets: SupportedMarkets
  schemaTypes: string[]
  languageField?: string
  weakReferences?: boolean
  bulkPublish?: boolean
  metadataFields?: FieldDefinition[]
  apiVersion?: string
  allowCreateMetaDoc?: boolean
  callback?: ((args: PluginCallbackArgs) => Promise<void>) | null
}

// Context version of config
// should have processed the
// supportedMarkets function
export type PluginConfigContext = Required<PluginConfig> & {
  supportedMarkets: Market[]
}

export type MarketReference = KeyedObject & Reference

export type Metadata = {
  _id: string
  _createdAt: string
  markets: Array<MarketReference>
 // translations: MarketReference[]
}

export type MetadataDocument = SanityDocumentLike & {
  schemaTypes: string[]
  markets: Array<MarketReference>
 // translations: MarketReference[]
}

export type DocumentInternationalizationMenuProps = {
  schemaType: ObjectSchemaType
  documentId: string
}

// Extend Sanity schema definitions
export interface DocumentInternationalizationSchemaOpts {
  markets?: {
    /** Set to true to disable duplication of this field or type */
    exclude?: boolean
  }
}

declare module 'sanity' {
  interface ArrayOptions extends DocumentInternationalizationSchemaOpts {}
  interface BlockOptions extends DocumentInternationalizationSchemaOpts {}
  interface BooleanOptions extends DocumentInternationalizationSchemaOpts {}
  interface CrossDatasetReferenceOptions
    extends DocumentInternationalizationSchemaOpts {}
  interface DateOptions extends DocumentInternationalizationSchemaOpts {}
  interface DatetimeOptions extends DocumentInternationalizationSchemaOpts {}
  interface FileOptions extends DocumentInternationalizationSchemaOpts {}
  interface GeopointOptions extends DocumentInternationalizationSchemaOpts {}
  interface ImageOptions extends DocumentInternationalizationSchemaOpts {}
  interface NumberOptions extends DocumentInternationalizationSchemaOpts {}
  interface ObjectOptions extends DocumentInternationalizationSchemaOpts {}
  interface ReferenceBaseOptions
    extends DocumentInternationalizationSchemaOpts {}
  interface SlugOptions extends DocumentInternationalizationSchemaOpts {}
  interface StringOptions extends DocumentInternationalizationSchemaOpts {}
  interface TextOptions extends DocumentInternationalizationSchemaOpts {}
  interface UrlOptions extends DocumentInternationalizationSchemaOpts {}
  interface EmailOptions extends DocumentInternationalizationSchemaOpts {}
}
