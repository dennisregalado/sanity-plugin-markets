import type {DocumentBadgeDescription, DocumentBadgeProps} from 'sanity'

import {useDocumentInternationalizationContext} from '../components/DocumentInternationalizationContext'

export function LanguageBadge(
  props: DocumentBadgeProps
): DocumentBadgeDescription | null {
  const source = props?.draft || props?.published
  const {languageField, supportedMarkets} =
    useDocumentInternationalizationContext()
  const languageId = source?.[languageField]

  if (!languageId) {
    return null
  }

  const language = Array.isArray(supportedMarkets)
    ? supportedMarkets.find((l) => l.id === languageId)
    : null

  // Currently we only show the language id if the supportedMarkets are async
  return {
    label: language?.id ?? String(languageId),
    title: language?.title ?? undefined,
    color: `primary`,
  }
}
