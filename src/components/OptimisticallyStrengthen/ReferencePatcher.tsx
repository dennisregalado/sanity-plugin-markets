import {useEffect} from 'react'
import {PatchEvent, unset, useClient, useEditState} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

import {API_VERSION} from '../../constants'
import type {MarketReference} from '../../types'

type ReferencePatcherProps = {
  market: MarketReference
  documentType: string
  metadataId: string
}

// For every reference, check if it is published, and if so, strengthen the reference
export default function ReferencePatcher(props: ReferencePatcherProps) {
  const {market, documentType, metadataId} = props
  const editState = useEditState(market._ref, documentType)
  const client = useClient({apiVersion: API_VERSION})
  const {onChange} = useDocumentPane()
 
  useEffect(() => {
    if (
      // We have a reference
      market._ref &&
      // It's still weak and not-yet-strengthened
      market._weak &&
      // We also want to keep this check because maybe the user *configured* weak refs
      market._strengthenOnPublish &&
      // The referenced document has just been published
      !editState.draft &&
      editState.published &&
      editState.ready
    ) {
      const referencePathBase = [
        'markets',
        {_key: market._key},
        'value',
      ]

      onChange(
        new PatchEvent([
          unset([...referencePathBase, '_weak']),
          unset([...referencePathBase, '_strengthenOnPublish']),
        ])
      )
    }
  }, [market, editState, metadataId, client, onChange])

  return null
}
