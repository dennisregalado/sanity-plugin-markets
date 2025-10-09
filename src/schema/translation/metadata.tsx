import { EarthGlobeIcon } from '@sanity/icons'
import {
  defineArrayMember,
  defineField,
  defineType,
  type DocumentDefinition,
  type FieldDefinition,
} from 'sanity'

import { METADATA_SCHEMA_NAME, MARKETS_ARRAY_NAME } from '../../constants'
import { Text } from '@sanity/ui'

function getFlagEmoji(countryCode: string) {
  return [...countryCode.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt()))
    .reduce((a, b) => `${a}${b}`);
}
export default (
  schemaTypes: string[],
  metadataFields: FieldDefinition[]
): DocumentDefinition =>
  defineType({
    type: 'document',
    name: METADATA_SCHEMA_NAME,
    title: 'Markets metadata',
    icon: EarthGlobeIcon,
    liveEdit: true,
    fields: [
      defineField({
        name: MARKETS_ARRAY_NAME,
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object',
            name: 'marketReference',
            fields: [
              defineField({
                type: 'reference',
                name: 'value',
                title: 'Document',
                to: [...schemaTypes.map((type) => ({ type }))],
              }),
              defineField({
                name: 'isDraft',
                type: 'boolean',
                hidden: true
              }),
              defineField({
                name: 'onlyDraft',
                type: 'boolean',
                hidden: true
              }),
            ],
            preview: {
              select: {
                countryCode: '_key',
                title: 'value.title', 
              },
              prepare(selection) {
                const { title, countryCode } = selection
                return {
                  title: title,   
                  icon: () => <Text>{getFlagEmoji(countryCode)}</Text>,
                }
              },
            },
          })
        ],
      }),
      defineField({
        name: 'schemaTypes',
        description:
          'Optional: Used to filter the reference fields above so all markets share the same types.',
        type: 'array',
        of: [{ type: 'string' }],
        options: { list: schemaTypes },
        readOnly: ({ value }) => Boolean(value),
      }),
      ...metadataFields,
    ],
    preview: {
      select: {
        markets: MARKETS_ARRAY_NAME,
        documentSchemaTypes: 'schemaTypes',
      },
      prepare(selection) {
        const { markets = [], documentSchemaTypes = [] } = selection
        const title =
          markets.length === 1
            ? `1 Market`
            : `${markets.length} Markets`
        const marketKeys = markets.length
          ? markets
            .map((t: { _key: string }) => t._key.toUpperCase())
            .join(', ')
          : ``
        const subtitle = [
          marketKeys ? `(${marketKeys})` : null,
          documentSchemaTypes?.length
            ? documentSchemaTypes.map((s: string) => s).join(`, `)
            : ``,
        ]
          .filter(Boolean)
          .join(` `)

        return {
          title,
          subtitle,
        }
      },
    },
  })
