import {TrashIcon} from '@sanity/icons'
import {type ButtonTone, useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {
  type DocumentActionComponent,
  type KeyedObject,
  type Reference,
  type TypedObject,
  useClient,
} from 'sanity'

import {API_VERSION, TRANSLATIONS_ARRAY_NAME} from '../constants'

type MarketReference = TypedObject &
  KeyedObject & {
    value: Reference
  }

export const DeleteMetadataAction: DocumentActionComponent = (props) => {
  const {id: documentId, published, draft, onComplete} = props
  const doc = draft || published

  const [isDialogOpen, setDialogOpen] = useState(false)
  const onClose = useCallback(() => setDialogOpen(false), [])
  const markets: MarketReference[] = useMemo(
    () =>
      doc && Array.isArray(doc[TRANSLATIONS_ARRAY_NAME])
        ? (doc[TRANSLATIONS_ARRAY_NAME] as Array<MarketReference>)
        : [],
    [doc]
  )

  const toast = useToast()
  const client = useClient({apiVersion: API_VERSION})

  // Remove translation reference and delete document in one transaction
  const onProceed = useCallback(() => {
    const tx = client.transaction()

    tx.patch(documentId, (patch) => patch.unset([TRANSLATIONS_ARRAY_NAME]))

    if (markets.length > 0) {
      markets.forEach((translation) => {
        tx.delete(translation._ref)
        tx.delete(`drafts.${translation._ref}`)
      })
    }

    tx.delete(documentId)
    // Shouldn't exist as this document type is in liveEdit
    tx.delete(`drafts.${documentId}`)

    tx.commit()
      .then(() => {
        onClose()

        toast.push({
          status: 'success',
          title: 'Deleted document and markets',
        })
      })
      .catch((err) => {
        toast.push({
          status: 'error',
          title: 'Failed to delete document and markets',
          description: err.message,
        })
      })
  }, [client, markets, documentId, onClose, toast])

  return {
    label: `Delete all markets`,
    disabled: !doc || !markets.length,
    icon: TrashIcon,
    tone: 'critical' as ButtonTone,
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: isDialogOpen && {
      type: 'confirm',
      onCancel: onComplete,
      onConfirm: () => {
        onProceed()
        onComplete()
      },
      tone: 'critical' as ButtonTone,
      message:
        markets.length === 1
          ? `Delete 1 market and this document`
          : `Delete all ${markets.length} markets and this document`,
    },
  }
}
