import {Button, Grid} from '@sanity/ui'

type DeleteTranslationFooterProps = {
  markets: unknown[]
  onClose: () => void
  onProceed: () => void
}

export default function DeleteTranslationFooter(
  props: DeleteTranslationFooterProps
) {
  const {markets, onClose, onProceed} = props

  return (
    <Grid columns={2} gap={2}>
      <Button text="Cancel" onClick={onClose} mode="ghost" />
      <Button
        text={
          markets && markets.length > 0
            ? `Unset market reference`
            : `Delete document`
        }
        onClick={onProceed}
        tone="critical"
      />
    </Grid>
  )
}
