import { Badge, Box, Button, Flex, Text, useToast } from '@sanity/ui'
import { useCallback } from 'react'
import { type SanityDocument, useClient } from 'sanity'

import type { Market } from '../types'
import { useDocumentInternationalizationContext } from './DocumentInternationalizationContext'
import { EditIcon } from '@sanity/icons'

type LanguagePatchProps = {
  language: Market
  source: SanityDocument | null
  disabled: boolean
}

export default function LanguagePatch(props: LanguagePatchProps) {
  const { language, source } = props
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
      .set({ [languageField]: language.id })
      .commit()
      .then(() => {
        toast.push({
          title: `Set document market to ${language.title}`,
          status: `success`,
        })
      })
      .catch((err) => {
        console.error(err)

        return toast.push({
          title: `Failed to set document market to ${language.title}`,
          status: `error`,
        })
      })
  }, [source, client, languageField, language, toast])

  return (
    <Button
      mode="bleed"
      onClick={handleClick}
      disabled={disabled}
      justify="flex-start"
    >
      <Flex gap={3} align="center">
        <Text size={1} weight="medium">
          <EditIcon />
        </Text>
        <Box flex={1}>
          <Text size={1} weight="medium">{language.title}</Text>
        </Box>
        <Badge>{language.id}</Badge>
      </Flex>
    </Button>
  )
}
