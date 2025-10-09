import {useListeningQuery} from 'sanity-plugin-utils'

import {METADATA_SCHEMA_NAME} from '../constants'
import type {Metadata} from '../types'

// Using references() seemed less reliable for updating the listener
// results than querying raw values in the array
// AFAIK: references is _faster_ when querying with GROQ
// const query = `*[_type == $marketSchema && references($id)]`
const query = `*[_type == $marketSchema && $id in markets[]._ref]{
  _id,
  _createdAt,
  markets[] {
    ...,
    "isDraft": count(*[_id == "drafts." + ^._ref]) > 0,
    "onlyDraft": count(*[_id == "drafts." + ^._ref]) > 0 
                 && count(*[_id == ^._ref]) == 0
  }
}`

export function useMarketMetadata(id: string): {
  data: Metadata[] | unknown
  loading: boolean
  error: boolean | unknown | ProgressEvent
} {
  const {data, loading, error} = useListeningQuery<Metadata[]>(query, {
    params: {id, marketSchema: METADATA_SCHEMA_NAME},
  })

  return {data, loading, error}
}
