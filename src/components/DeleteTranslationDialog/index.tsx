import {Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useEffect, useMemo} from 'react'
import type {SanityDocument} from 'sanity'
import {useListeningQuery} from 'sanity-plugin-utils'

import DocumentPreview from './DocumentPreview'
import {separateReferences} from './separateReferences'

type DeleteTranslationDialogProps = {
  doc: SanityDocument
  documentId: string
  setMarkets: (markets: SanityDocument[]) => void
}

export default function DeleteTranslationDialog(
  props: DeleteTranslationDialogProps
) {
  const {doc, documentId, setMarkets} = props

  // Get all references and check if any of them are translations metadata
  const {data, loading} = useListeningQuery<SanityDocument[]>(
    `*[references($id)]{_id, _type}`,
    {params: {id: documentId}, initialValue: []}
  )
  const {markets, otherReferences} = useMemo(
    () => separateReferences(data),
    [data]
  )

  useEffect(() => {
    setMarkets(markets)
  }, [setMarkets, markets])

  if (loading) {
    return (
      <Flex padding={4} align="center" justify="center">
        <Spinner />
      </Flex>
    )
  }

  return (
    <Stack space={4}>
      {markets && markets.length > 0 ? (
        <Text>
          This document is a language-specific version which other translations
          depend on.
        </Text>
      ) : (
        <Text>This document does not have connected markets.</Text>
      )}
      <Card border padding={3}>
        <Stack space={4}>
          <Text size={1} weight="semibold">
            {markets && markets.length > 0 ? (
              <>Before this document can be deleted</>
            ) : (
              <>This document can now be deleted</>
            )}
          </Text>
          <DocumentPreview value={doc} type={doc._type} />
          {markets && markets.length > 0 ? (
            <>
              <Card borderTop />
              <Text size={1} weight="semibold">
                The reference in{' '}
                {markets.length === 1
                  ? `this markets document`
                  : `these markets documents`}{' '}
                must be removed
              </Text>
              {markets.map((market) => (
                <DocumentPreview
                  key={market._id}
                  value={market}
                  type={market._type}
                />
              ))}
            </>
          ) : null}
          {otherReferences && otherReferences.length > 0 ? (
            <>
              <Card borderTop />
              <Text size={1} weight="semibold">
                {otherReferences.length === 1
                  ? `There is an additional reference`
                  : `There are additional references`}{' '}
                to this document
              </Text>
              {otherReferences.map((reference) => (
                <DocumentPreview
                  key={reference._id}
                  value={reference}
                  type={reference._type}
                />
              ))}
            </>
          ) : null}
        </Stack>
      </Card>
      {otherReferences.length === 0 ? (
        <Text>This document has no other references.</Text>
      ) : (
        <Text>
          You may not be able to delete this document because other documents
          refer to it.
        </Text>
      )}
    </Stack>
  )
}
