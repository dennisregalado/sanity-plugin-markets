import type {SanityDocument} from 'sanity'

import {METADATA_SCHEMA_NAME} from '../../constants'

export function separateReferences(data: SanityDocument[] | null = []): {
  markets: SanityDocument[]
  otherReferences: SanityDocument[]
} {
  const markets: SanityDocument[] = []
  const otherReferences: SanityDocument[] = []

  if (data && data.length > 0) {
    data.forEach((doc) => {
      if (doc._type === METADATA_SCHEMA_NAME) {
        markets.push(doc)
      } else {
        otherReferences.push(doc)
      }
    })
  }

  return {markets, otherReferences}
}
