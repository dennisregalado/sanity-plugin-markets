import {EarthGlobeIcon} from '@sanity/icons'
import {
  defineField,
  defineType,
  type DocumentDefinition,
  type FieldDefinition,
} from 'sanity'

import {METADATA_SCHEMA_NAME, TRANSLATIONS_ARRAY_NAME} from '../../constants'

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
        name: TRANSLATIONS_ARRAY_NAME,
        type: 'internationalizedArrayReference',
      }),
      defineField({
        name: 'schemaTypes',
        description:
          'Optional: Used to filter the reference fields above so all markets share the same types.',
        type: 'array',
        of: [{type: 'string'}],
        options: {list: schemaTypes},
        readOnly: ({value}) => Boolean(value),
      }),
      ...metadataFields,
    ],
    preview: {
      select: {
        markets: TRANSLATIONS_ARRAY_NAME,
        documentSchemaTypes: 'schemaTypes',
      },
      prepare(selection) {
        const {markets = [], documentSchemaTypes = []} = selection
        const title =
          markets.length === 1
            ? `1 Market`
            : `${markets.length} Markets`
        const marketKeys = markets.length
          ? markets
              .map((t: {_key: string}) => t._key.toUpperCase())
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
