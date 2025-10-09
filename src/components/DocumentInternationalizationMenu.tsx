import { EarthGlobeIcon } from '@sanity/icons'
import {
  Button,
  Card,
  MenuDivider,
  Popover,
  Text,
  useClickOutside,
  Menu,
  Flex,
  Label,
} from '@sanity/ui'
import { uuid } from '@sanity/uuid'
import { useCallback, useMemo, useState } from 'react'
import { useEditState, isDev } from 'sanity'

import { useMarketMetadata } from '../hooks/useMarketMetadata'
import type { DocumentInternationalizationMenuProps } from '../types'
import { useDocumentInternationalizationContext } from './DocumentInternationalizationContext'
import LanguageManage from './LanguageManage'
import MarketOption from './MarketOption'
import MarketPatch from './MarketPatch'
import Warning from './Warning'

export function DocumentInternationalizationMenu(
  props: DocumentInternationalizationMenuProps
) {
  const { documentId } = props
  const schemaType = props.schemaType
  const { languageField, supportedMarkets } =
    useDocumentInternationalizationContext()

  // UI Handlers
  const [open, setOpen] = useState(false)
  const handleClick = useCallback(() => setOpen((o) => !o), [])
  const [button, setButton] = useState<HTMLElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)
  const handleClickOutside = useCallback(() => setOpen(false), [])
  useClickOutside(handleClickOutside, [button, popover])

  // Get metadata from content lake
  const { data, loading, error } = useMarketMetadata(documentId)
  console.log('data', data)
  const metadata = Array.isArray(data) && data.length ? data[0] : null

  // Optimistically set a metadata ID for a newly created metadata document
  // Cannot rely on generated metadata._id from useMarketMetadata
  // As the document store might not have returned it before creating another translation
  const metadataId = useMemo(() => {
    if (loading) {
      return null
    }

    // Once created, these two values should be the same anyway
    return metadata?._id ?? uuid()
  }, [loading, metadata?._id])

  // Duplicate a new language version from the most recent version of this document
  const { draft, published } = useEditState(documentId, schemaType.name)
  const source = draft || published

  // Check for data issues
  const documentIsInOneMetadataDocument = useMemo(() => {
    return Array.isArray(data) && data.length <= 1
  }, [data])
  const sourceLanguageId = source?.[languageField] as string | undefined
  const sourceLanguageIsValid = supportedMarkets.some(
    (l) => l.id === sourceLanguageId
  )
  const allLanguagesAreValid = useMemo(() => {
    const valid = supportedMarkets.every((l) => l.id && l.title)
    if (!valid) {
      console.warn(
        `Not all languages are valid. It should be an array of objects with an "id" and "title" property. Or a function that returns an array of objects with an "id" and "title" property.`,
        supportedMarkets
      )
    }

    return valid
  }, [supportedMarkets])

  const activeMarkets = useMemo(() => {
    return supportedMarkets?.filter((market) => {
      // Include current market (has checkmark) OR markets with existing translations
      const isCurrent = market.id === sourceLanguageId
      const hasTranslation = metadata?.markets.some((t) => t._key === market.id)
      return !loading && sourceLanguageId && sourceLanguageIsValid && (isCurrent || hasTranslation)
    })
  }, [supportedMarkets, loading, sourceLanguageId, sourceLanguageIsValid, metadata])

  const creatableMarkets = useMemo(() => {
    return supportedMarkets?.filter((market) => {
      // Include markets that can be created (has add icon) - not current AND no translation
      const isCurrent = market.id === sourceLanguageId
      const hasTranslation = metadata?.markets.some((t) => t._key === market.id)
      return !loading && sourceLanguageId && sourceLanguageIsValid && !isCurrent && !hasTranslation
    })
  }, [supportedMarkets, loading, sourceLanguageId, sourceLanguageIsValid, metadata])

  const undecidedMarkets = useMemo(() => {
    return supportedMarkets?.filter(() => {
      return !(!loading && sourceLanguageId && sourceLanguageIsValid)
    })
  }, [supportedMarkets, loading, sourceLanguageId, sourceLanguageIsValid])

  const content = (
    <Menu>
      {error ? (
        <Card tone="critical" padding={1}>
          <Text>There was an error returning markets metadata</Text>
        </Card>
      ) : (
        <>
          <Flex direction="column" gap={2}>
            {activeMarkets.length > 0 && (
              <Flex direction="column">
                <Flex padding={2}>
                  <Label muted style={{ textTransform: 'uppercase' }} size={1}>Active</Label>
                </Flex>
                {activeMarkets.map((market) => (
                  <MarketOption
                    key={market.id}
                    market={market}
                    schemaType={schemaType}
                    documentId={documentId}
                    disabled={loading || !allLanguagesAreValid}
                    current={market.id === sourceLanguageId}
                    metadata={metadata}
                    metadataId={metadataId}
                    source={source}
                    sourceLanguageId={sourceLanguageId}
                  />
                ))}
              </Flex>
            )}
            {creatableMarkets.length > 0 && (
              <Flex direction="column">
                <Flex padding={2}>
                  <Label muted style={{ textTransform: 'uppercase' }} size={1}>Undecided</Label>
                </Flex>
                {creatableMarkets.map((market) => (
                  <MarketOption
                    key={market.id}
                    market={market}
                    schemaType={schemaType}
                    documentId={documentId}
                    disabled={loading || !allLanguagesAreValid}
                    current={market.id === sourceLanguageId}
                    metadata={metadata}
                    metadataId={metadataId}
                    source={source}
                    sourceLanguageId={sourceLanguageId}
                  />
                ))}
              </Flex>
            )}
            {undecidedMarkets.length > 0 && (
              <Flex direction="column">
                <Flex padding={2}>
                  <Label muted style={{ textTransform: 'uppercase' }} size={1}>{sourceLanguageId ? 'Undecided' : 'Select a Market'}</Label>
                </Flex>
                {undecidedMarkets.map((market) => (
                  <MarketPatch
                    key={market.id}
                    source={source}
                    market={market}
                    // Only allow language patch change to:
                    // - Keys not in metadata
                    // - The key of this document in the metadata
                    disabled={
                      (loading ||
                        !allLanguagesAreValid ||
                        metadata?.markets
                          .filter((t) => t?._ref !== documentId)
                          .some((t) => t._key === market.id)) ??
                      false
                    }
                  />

                ))}
              </Flex>
            )}
          </Flex>
          <MenuDivider />
          {isDev && (
            <LanguageManage
              id={metadata?._id}
              documentId={documentId}
              metadataId={metadataId}
              schemaType={schemaType}
              sourceLanguageId={sourceLanguageId}
            />
          )}
          {supportedMarkets.length > 0 ? (
            <>
              {/* Once metadata is loaded, there may be issues */}
              {loading ? null : (
                <>
                  {/* Not all languages are valid */}
                  {data && documentIsInOneMetadataDocument ? null : (
                    <Warning>
                      {/* TODO: Surface these documents to the user */}
                      This document has been found in more than one Markets
                      Metadata documents
                    </Warning>
                  )}
                  {/* Not all languages are valid */}
                  {allLanguagesAreValid ? null : (
                    <Warning>
                      Not all market objects are valid. See the console.
                    </Warning>
                  )}
                  {/* Current document has no language field */}
                  {/* Current document has an invalid language field */}
                  {sourceLanguageId && !sourceLanguageIsValid ? (
                    <Warning>
                      Select a supported market. Current market value:{' '}
                      <code>{sourceLanguageId}</code>
                    </Warning>
                  ) : null}
                </>
              )}
            </>
          ) : null}
        </>
      )}
    </Menu>
  )

  const issueWithTranslations =
    !loading && sourceLanguageId && !sourceLanguageIsValid

  // Get the current market title, or fallback to "Markets"
  const buttonText = useMemo(() => {
    const currentMarket = supportedMarkets.find((m) => m.id === sourceLanguageId)
    return currentMarket?.title ?? 'Markets'
  }, [supportedMarkets, sourceLanguageId])

  if (!documentId) {
    return null
  }

  if (!schemaType || !schemaType.name) {
    return null
  }

  return (
    <Popover
      animate
      constrainSize
      content={content}
      open={open}
      portal
      ref={setPopover}
      overflow="auto"
      tone="default"
    >
      <Button
        text={buttonText}
        mode="bleed"
        padding={2}
        disabled={!source}
        tone={
          !source || loading || !issueWithTranslations ? 'suggest' : 'critical'
        }
        icon={EarthGlobeIcon}
        onClick={handleClick}
        ref={setButton}
        selected={open}
      />
    </Popover>
  )
}
