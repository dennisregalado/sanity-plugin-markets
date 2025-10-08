import { useCallback, useContext } from 'react'
import { RouterContext, useRouter } from 'sanity/router'
import { usePaneRouter } from 'sanity/structure'
import { usePresentationNavigate } from 'sanity/presentation'

export function useOpenInNewPane(id?: string | null, type?: string) {
  const routerContext = useContext(RouterContext)
  const { routerPanesState, groupIndex } = usePaneRouter()
  const router = useRouter()

  // Safely try to get presentation navigate - it may not be available outside presentation tool
  let presentationNavigate = null
  try {
    presentationNavigate = usePresentationNavigate()
  } catch (error) {
    // Presentation context is not available, will fall back to router
  }

  const openInNewPane = useCallback(() => {
    if (!routerContext || !id || !type) {
      return
    }

    if (presentationNavigate) {
      presentationNavigate(undefined, { id, type })
    } else {
      routerContext.navigateIntent('edit', { id, type })
    }
  }, [id, type, routerContext, routerPanesState, groupIndex])

  return openInNewPane
}
