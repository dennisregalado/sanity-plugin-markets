import { Badge, MenuItem, useToast } from '@sanity/ui'
import { useCallback } from 'react'
import { type SanityDocument, useClient } from 'sanity'

import type { Market } from '../types'
import { useDocumentInternationalizationContext } from './DocumentInternationalizationContext'
import { EditIcon } from '@sanity/icons'

type MarketPatchProps = {
  market: Market
  source: SanityDocument | null
  disabled: boolean
}

export default function MarketPatch(props: MarketPatchProps) {
  const { market, source } = props
  const { apiVersion, languageField } = useDocumentInternationalizationContext()
  const disabled = props.disabled || !source
  const client = useClient({ apiVersion })
  const toast = useToast()

  const handleClick = useCallback(() => {
    if (!source) {
      throw new Error(`Cannot patch missing document`)
    }

    const currentId = source._id

    client
      .patch(currentId)
      .set({ [languageField]: market.id })
      .commit()
      .then(() => {
        toast.push({
          title: `Set document market to ${market.title}`,
          status: `success`,
        })
      })
      .catch((err) => {
        console.error(err)

        return toast.push({
          title: `Failed to set document market to ${market.title}`,
          status: `error`,
        })
      })
  }, [source, client, languageField, market, toast])

  return (
    <MenuItem 
      onClick={handleClick}
      disabled={disabled}
      text={market.title}
      icon={<EditIcon />}
      iconRight={<Badge tone={"primary"}>{market.id}</Badge>}
    />
  )
}
