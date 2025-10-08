import {useContext} from 'react'
import {createContext} from 'react'
import {type LayoutProps, useClient, useWorkspace} from 'sanity'
import {suspend} from 'suspend-react'

import {DEFAULT_CONFIG} from '../constants'
import type {PluginConfig, PluginConfigContext} from '../types'

const DocumentInternationalizationContext =
  createContext<PluginConfigContext>(DEFAULT_CONFIG)

export function useDocumentInternationalizationContext() {
  return useContext(DocumentInternationalizationContext)
}

type DocumentInternationalizationProviderProps = LayoutProps & {
  pluginConfig: Required<PluginConfig>
}

/**
 * This Provider wraps the Studio and provides the DocumentInternationalization context to document actions and components.
 */
export function DocumentInternationalizationProvider(
  props: DocumentInternationalizationProviderProps
) {
  const {pluginConfig} = props

  const client = useClient({apiVersion: pluginConfig.apiVersion})
  const workspace = useWorkspace()
  const supportedMarkets = Array.isArray(pluginConfig.supportedMarkets)
    ? pluginConfig.supportedMarkets
    : // eslint-disable-next-line require-await
      suspend(async () => {
        if (typeof pluginConfig.supportedMarkets === 'function') {
          return pluginConfig.supportedMarkets(client)
        }
        return pluginConfig.supportedMarkets
      }, [workspace])

  return (
    <DocumentInternationalizationContext.Provider
      value={{...pluginConfig, supportedMarkets}}
    >
      {props.renderDefault(props)}
    </DocumentInternationalizationContext.Provider>
  )
}
