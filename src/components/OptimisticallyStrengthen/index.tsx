import type {MarketReference} from '../../types'
import ReferencePatcher from './ReferencePatcher'

type OptimisticallyStrengthenProps = {
  markets: MarketReference[]
  metadataId: string
}

// There's no good reason to leave published references as weak
// So this component will run on every render and strengthen them
export default function OptimisticallyStrengthen(
  props: OptimisticallyStrengthenProps
) {
  const {markets = [], metadataId} = props

  if (!markets.length) {
    return null
  }

  return (
    <>
      {markets.map((market) =>
        market._strengthenOnPublish?.type ? (
          <ReferencePatcher
            key={market._key}
            market={market}
            documentType={market._strengthenOnPublish.type}
            metadataId={metadataId}
          />
        ) : null
      )}
    </>
  )
}
