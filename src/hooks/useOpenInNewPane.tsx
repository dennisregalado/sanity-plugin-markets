import { useCallback, useContext } from 'react'
import { RouterContext, useRouter } from 'sanity/router'
import { usePaneRouter } from 'sanity/structure'
import { usePresentationNavigate } from 'sanity/presentation'
import { useClient, useDocumentStore, useFormValue } from 'sanity'
import { useDocumentInternationalizationContext } from '../components/DocumentInternationalizationContext'

export function useOpenInNewPane(id?: string | null, type?: string, market?: string | null) {
  const routerContext = useContext(RouterContext)
  const { routerPanesState, groupIndex } = usePaneRouter()
  const { resolvePath, apiVersion } = useDocumentInternationalizationContext()
  const client = useClient({ apiVersion })
 

  // Safely try to get presentation navigate - it may not be available outside presentation tool
  let presentationNavigate = null
  try {
    presentationNavigate = usePresentationNavigate()
  } catch (error) {
    // Presentation context is not available, will fall back to router
  }

  const openInNewPane = useCallback(async () => {
    if (!routerContext || !id || !type) {
      return
    }

    if (presentationNavigate) {
      let presentationPath = undefined

      // If resolvePath is configured and we have a market, resolve the path
      if (resolvePath && market) {
        try {
          // Fetch the document to get its slug
          const document = await client.fetch(
            `*[_id in [$id, $draftId]][0]{ "slug": coalesce(slug.current, slug), _type }`,
            { id, draftId: `drafts.${id}` }
          ) 
          if (document?.slug) {
            presentationPath = resolvePath({
              type: document._type || type,
              slug: document.slug,
              market,
            })
          }
        } catch (error) {
          console.error('Error resolving presentation path:', error)
        }
      }

      presentationNavigate(presentationPath, { id, type })
    } else {
      routerContext.navigateIntent('edit', { id, type })
    }
  }, [id, type, market, routerContext, routerPanesState, groupIndex, presentationNavigate, resolvePath, client])

  return openInNewPane
}
