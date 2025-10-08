import {Stack} from '@sanity/ui'
import {defineField, definePlugin, isSanityDocument} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

import {DeleteMetadataAction} from './actions/DeleteMetadataAction'
import {LanguageBadge} from './badges'
import BulkPublish from './components/BulkPublish'
import {DocumentInternationalizationProvider} from './components/DocumentInternationalizationContext'
import {DocumentInternationalizationMenu} from './components/DocumentInternationalizationMenu'
import OptimisticallyStrengthen from './components/OptimisticallyStrengthen'
import {API_VERSION, DEFAULT_CONFIG, METADATA_SCHEMA_NAME} from './constants'
import {documentInternationalizationUsEnglishLocaleBundle} from './i18n'
import metadata from './schema/translation/metadata'
import type {PluginConfig, MarketReference} from './types'

export const markets = definePlugin<PluginConfig>(
  (config) => {
    const pluginConfig = {...DEFAULT_CONFIG, ...config}
    const {
      supportedLanguages,
      schemaTypes,
      languageField,
      bulkPublish,
      metadataFields,
    } = pluginConfig

    if (schemaTypes.length === 0) {
      throw new Error(
        'You must specify at least one schema type on which to enable document internationalization. Update the `schemaTypes` option in the market() configuration.'
      )
    }

    return {
      name: 'sanity-plugin-markets',

      studio: {
        components: {
          layout: (props) =>
            DocumentInternationalizationProvider({...props, pluginConfig}),
        },
      },

      i18n: {
        bundles: [documentInternationalizationUsEnglishLocaleBundle],
      },

      // Adds:
      // - A bulk-publishing UI component to the form
      // - Will only work for projects on a compatible plan
      form: {
        components: {
          input: (props) => {
            if (
              props.id === 'root' &&
              props.schemaType.name === METADATA_SCHEMA_NAME &&
              isSanityDocument(props?.value)
            ) {
              const metadataId = props?.value?._id
              const markets =
                (props?.value?.markets as MarketReference[]) ?? []
              const weakAndTypedMarkets = markets.filter(
                (value) => value?._weak && value._strengthenOnPublish
              )

              return (
                <Stack space={5}>
                  {bulkPublish ? (
                    <BulkPublish markets={markets} />
                  ) : null}
                  {weakAndTypedMarkets.length > 0 ? (
                    <OptimisticallyStrengthen
                      metadataId={metadataId}
                      markets={weakAndTypedMarkets}
                    />
                  ) : null}
                  {props.renderDefault(props)}
                </Stack>
              )
            }

            return props.renderDefault(props)
          },
        },
      },

      // Adds:
      // - The `Translations` dropdown to the editing form
      // - `Badges` to documents with a language value
      // - The `DeleteMetadataAction` action to the metadata document type
      document: {
        unstable_languageFilter: (prev, ctx) => {
          const {schemaType, documentId} = ctx

          return schemaTypes.includes(schemaType) && documentId
            ? [
                ...prev,
                (props) =>
                  DocumentInternationalizationMenu({...props, documentId}),
              ]
            : prev
        },
        badges: (prev, {schemaType}) => {
          if (!schemaTypes.includes(schemaType)) {
            return prev
          }

          return [(props) => LanguageBadge(props), ...prev]
        },
        actions: (prev, {schemaType}) => {
          
          return prev
        },
      },

      // Adds:
      // - The `Translations metadata` document type to the schema
      schema: {
        // Create the metadata document type
        types: [metadata(schemaTypes, metadataFields)],

        // For every schema type this plugin is enabled on
        // Create an initial value template to set the language
        templates: (prev, {schema}) => {
          // Templates are not setup for async languages
          if (!Array.isArray(supportedLanguages)) {
            return prev
          }

          const parameterizedTemplates = schemaTypes.map((schemaType) => ({
            id: `${schemaType}-parameterized`,
            title: `${
              schema?.get(schemaType)?.title ?? schemaType
            }: with Language`,
            schemaType,
            parameters: [
              {name: `languageId`, title: `Language ID`, type: `string`},
            ],
            value: ({languageId}: {languageId: string}) => ({
              [languageField]: languageId,
            }),
          }))

          const staticTemplates = schemaTypes.flatMap((schemaType) => {
            return supportedLanguages.map((language) => ({
              id: `${schemaType}-${language.id}`,
              title: `${language.title} ${
                schema?.get(schemaType)?.title ?? schemaType
              }`,
              schemaType,
              value: {
                [languageField]: language.id,
              },
            }))
          })

          return [...prev, ...parameterizedTemplates, ...staticTemplates]
        },
      },
    }
  }
)
