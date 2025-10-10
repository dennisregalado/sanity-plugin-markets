import { useCallback, useContext } from 'react'
import { RouterContext } from 'sanity/router'
import { usePaneRouter } from 'sanity/structure'
import { usePresentationNavigate, usePresentationParams } from 'sanity/presentation'
import { useClient } from 'sanity'
import { useDocumentInternationalizationContext } from '../components/DocumentInternationalizationContext'

export function useOpenMarketDocument(id?: string | null, type?: string, market?: string | null) {
  const routerContext = useContext(RouterContext)
  const { routerPanesState, groupIndex } = usePaneRouter()
  const { resolvePath, apiVersion, supportedMarkets } = useDocumentInternationalizationContext()
  const client = useClient({ apiVersion })


  // Safely try to get presentation navigate - it may not be available outside presentation tool
  let presentationNavigate = null
  let presentationParams = null
  try {
    presentationNavigate = usePresentationNavigate()
    presentationParams = usePresentationParams()
  } catch (error) {
    // Presentation context is not available, will fall back to router
  }

  const openInNewPane = useCallback(async () => {
    if (!routerContext || !id || !type) {
      return
    }

    if (presentationNavigate && presentationParams) {
      let presentationPath = undefined

      // Fetch the document to check if it has a slug
      let hasSlug = false
      if (resolvePath && market) {
        try {
          const document = await client.fetch(
            `*[_id in [$id, $draftId]][0]{ "slug": coalesce(slug.current, slug), _type }`,
            { id, draftId: `drafts.${id}` }
          )
          
          if (document?.slug) {
            // Document has a slug - use resolvePath
            hasSlug = true
            presentationPath = resolvePath({
              type: document._type || type,
              slug: document.slug,
              market,
            })
          }
        } catch (error) {
          console.error('Error fetching document:', error)
        }
      }

      if (presentationPath && hasSlug) {
        presentationNavigate(presentationPath, { id, type })
      } else if (market && presentationParams.preview) {
        // Fallback: swap the locale prefix in the current URL
        const targetMarket = supportedMarkets.find(m => m.id === market)
        
        if (targetMarket) {
          // Extract pathname from the preview URL
          let pathname: string
          try {
            const url = new URL(presentationParams.preview)
            pathname = url.pathname
          } catch {
            // If it's not a valid URL, assume it's already a pathname
            pathname = presentationParams.preview.split('?')[0]
          }
          
          // Remove any existing locale prefix (except default '/')
          for (const market of supportedMarkets) {
            const prefix = market.pathPrefix?.replace(/\/+$/, '').toLowerCase()
            if (prefix && pathname.toLowerCase().startsWith(prefix)) {
              pathname = pathname.slice(prefix.length) || '/'
              break
            }
          }
          
          // Add target locale prefix (unless it's the default '/')
          const targetPrefix = targetMarket.pathPrefix?.replace(/\/+$/, '').toLowerCase()
          const newPathname = targetPrefix ? `${targetPrefix}${pathname}` : pathname
          
          presentationNavigate(newPathname, { id, type })
        } else {
          presentationNavigate(undefined, { id, type })
        }
      } else {
        presentationNavigate(undefined, { id, type })
      }

    } else {
      routerContext.navigateIntent('edit', { id, type })
    }
  }, [id, type, market, routerContext, routerPanesState, groupIndex, presentationNavigate, presentationParams, resolvePath, client, supportedMarkets])

  return openInNewPane
}
