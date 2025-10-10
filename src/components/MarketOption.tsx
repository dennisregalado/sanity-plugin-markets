import { AddIcon, CheckmarkIcon, DotIcon } from '@sanity/icons'
import {
  Badge,
  MenuItem,
  useToast,
  Spinner,
  Flex,
} from '@sanity/ui'
import { uuid } from '@sanity/uuid'
import { useCallback, useEffect, useState } from 'react'
import { type ObjectSchemaType, type SanityDocument, useClient } from 'sanity'
import { METADATA_SCHEMA_NAME } from '../constants'
import { useOpenMarketDocument } from '../hooks/useOpenMarketDocument'
import type {
  Market,
  Metadata,
  MetadataDocument,
  MarketReference,
} from '../types'
import { createReference } from '../utils/createReference'
import { removeExcludedPaths } from '../utils/excludePaths'
import { useDocumentInternationalizationContext } from './DocumentInternationalizationContext'

type MarketOptionProps = {
  market: Market
  schemaType: ObjectSchemaType
  documentId: string
  disabled: boolean
  current: boolean
  source: SanityDocument | null
  metadataId: string | null
  metadata?: Metadata | null
  sourceLanguageId?: string
}

export default function MarketOption(props: MarketOptionProps) {
  const {
    market,
    schemaType,
    documentId,
    current,
    source,
    sourceLanguageId,
    metadata,
    metadataId,
  } = props
  /* When the user has clicked the Create button, the button should be disabled
   * to prevent double-clicks from firing onCreate twice. This creates duplicate
   * translation metadata entries, which editors will not be able to delete */
  const [userHasClicked, setUserHasClicked] = useState(false)

  const disabled =
    props.disabled ||
    userHasClicked ||
    current ||
    !source ||
    !sourceLanguageId ||
    !metadataId
  const translation: MarketReference | undefined = metadata?.markets
    .length
    ? metadata.markets.find((t) => t._key === market.id)
    : undefined
  const { apiVersion, languageField, weakReferences, callback } =
    useDocumentInternationalizationContext()
  const client = useClient({ apiVersion })
  const toast = useToast()

  const open = useOpenMarketDocument(translation?.value?._ref, schemaType.name, market.id)
  const handleOpen = useCallback(() => open(), [open])

  /* Once a translation has been created, reset the userHasClicked state to false
   * so they can click on it to navigate to the translation. If a translation already
   * existed when this component was mounted, this will have no effect. */
  const hasTranslation = Boolean(translation)
  useEffect(() => {
    setUserHasClicked(false)
  }, [hasTranslation])

  const handleCreate = useCallback(async () => {
    if (!source) {
      throw new Error(`Cannot create translation without source document`)
    }

    if (!sourceLanguageId) {
      throw new Error(`Cannot create translation without source language ID`)
    }

    if (!metadataId) {
      throw new Error(`Cannot create translation without a metadata ID`)
    }
    /* Disable the create button while this request is pending */
    setUserHasClicked(true)

    const transaction = client.transaction()

    // 1. Duplicate source document
    const newTranslationDocumentId = uuid()
    let newTranslationDocument = {
      ...source,
      _id: `drafts.${newTranslationDocumentId}`,
      // 2. Update language of the translation
      [languageField]: market.id,
    }

    // Remove fields / paths we don't want to duplicate
    newTranslationDocument = removeExcludedPaths(
      newTranslationDocument,
      schemaType
    ) as SanityDocument

    transaction.create(newTranslationDocument)

    // 3. Maybe create the metadata document
    const sourceReference = createReference(
      sourceLanguageId,
      documentId,
      schemaType.name,
      !weakReferences
    )
    const newTranslationReference = createReference(
      market.id,
      newTranslationDocumentId,
      schemaType.name,
      !weakReferences
    )
    const newMetadataDocument: MetadataDocument = {
      _id: metadataId,
      _type: METADATA_SCHEMA_NAME,
      schemaTypes: [schemaType.name],
      markets: [sourceReference],
      //   translations: [sourceReference],
    }

    transaction.createIfNotExists(newMetadataDocument)

    // 4. Patch translation to metadata document
    // Note: If the document was only just created in the operation above
    // This patch operation will have no effect
    const metadataPatch = client
      .patch(metadataId)
      .setIfMissing({ markets: [sourceReference] })
      .insert(`after`, `markets[-1]`, [newTranslationReference])

    transaction.patch(metadataPatch)

    // 5. Commit!
    transaction
      .commit()
      .then(() => {
        const metadataExisted = Boolean(metadata?._createdAt)

        callback?.({
          client,
          sourceLanguageId,
          sourceDocument: source,
          newDocument: newTranslationDocument,
          destinationLanguageId: market.id,
          metaDocumentId: metadataId,
        }).catch((err) => {
          toast.push({
            status: 'error',
            title: `Callback`,
            description: `Error while running callback - ${err}.`,
          })
        })

        return toast.push({
          status: 'success',
          title: metadataExisted ? `Updated "${market.title}" market` : `Created "${market.title}" market`,
          //  description: metadataExisted
          //    ? `Updated Markets Metadata`
          //    : `Created Markets Metadata`,
        })
      })
      .catch((err) => {
        console.error(err)

        /* Re-enable the create button if there was an error */
        setUserHasClicked(false)

        return toast.push({
          status: 'error',
          title: `Error creating market`,
          description: err.message,
        })
      })
  }, [
    client,
    documentId,
    market.id,
    market.title,
    languageField,
    metadata?._createdAt,
    metadataId,
    schemaType,
    source,
    sourceLanguageId,
    toast,
    weakReferences,
    callback,
  ])

  const getIcon = () => {
    if (disabled && !current) return <Spinner style={{ marginTop: '3px' }} size={0} />
    if (translation) {
      // You can now use translation.isDraft and translation.onlyDraft here
      // to return different icons based on draft status

      if (translation.onlyDraft) return <DotIcon style={{ color: `var(--card-badge-caution-dot-color)` }} />
      if (translation.isDraft) return <Flex align="center" justify="center" style={{ position: 'relative' }}>
        <div data-status="published"
          style={{
            position: 'absolute',
            left: -3,
            width: 5,
            height: 5,
            backgroundColor: `var(--card-badge-positive-dot-color)`,
            borderRadius: `999px`,
            boxShadow: `0 0 0 1px var(--card-bg-color)`,
            zIndex: 1,
          }}
        />
        <div data-status="draft"
          style={{
            position: 'absolute',
            left: 2,
            width: 5,
            height: 5,
            backgroundColor: `var(--card-badge-caution-dot-color)`,
            borderRadius: `999px`,
            boxShadow: `0 0 0 1px var(--card-bg-color)`,
            zIndex: 2,
          }}
        />
        <DotIcon style={{ color: `var(--card-badge-caution-dot-color)`, opacity: 0 }} />
      </Flex>
      return <DotIcon style={{ color: `var(--card-badge-positive-dot-color)` }} />
    }
    if (current) return CheckmarkIcon
    return AddIcon
  }

  return (
    <MenuItem
      icon={getIcon()}
      text={market.title}
      onClick={translation ? handleOpen : handleCreate}
      iconRight={<Badge tone={"primary"}>{market.id}</Badge>}
      selected={current}
    />
  )
}