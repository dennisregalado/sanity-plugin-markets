import {TrashIcon} from '@sanity/icons'
import {type ButtonTone, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  type DocumentActionComponent,
  type SanityDocument,
  useClient,
} from 'sanity'

import DeleteTranslationDialog from '../components/DeleteTranslationDialog'
import DeleteTranslationFooter from '../components/DeleteTranslationFooter'
import {useDocumentInternationalizationContext} from '../components/DocumentInternationalizationContext'
import {API_VERSION, MARKETS_ARRAY_NAME} from '../constants'

export const DeleteTranslationAction: DocumentActionComponent = (props) => {
  const {id: documentId, published, draft} = props
  const doc = draft || published
  const {languageField} = useDocumentInternationalizationContext()

  const [isDialogOpen, setDialogOpen] = useState(false)
  const [markets, setMarkets] = useState<SanityDocument[]>([])
  const onClose = useCallback(() => setDialogOpen(false), [])
  const documentLanguage = doc ? doc[languageField] : null

  const toast = useToast()
  const client = useClient({apiVersion: API_VERSION})

  // Remove translation reference and delete document in one transaction
  const onProceed = useCallback(() => {
    const tx = client.transaction()
    let operation = 'DELETE'

    if (documentLanguage && markets.length > 0) {
      operation = 'UNSET'
      markets.forEach((translation) => {
        tx.patch(translation._id, (patch) =>
          patch.unset([
            `${MARKETS_ARRAY_NAME}[_key == "${documentLanguage}"]`,
          ])
        )
      })
    } else {
      tx.delete(documentId)
      tx.delete(`drafts.${documentId}`)
    }

    tx.commit()
      .then(() => {
        if (operation === 'DELETE') {
          onClose()
        }
        toast.push({
          status: 'success',
          title:
            operation === 'UNSET'
              ? 'Translation reference unset'
              : 'Document deleted',
          description:
            operation === 'UNSET' ? 'The document can now be deleted' : null,
        })
      })
      .catch((err) => {
        toast.push({
          status: 'error',
          title:
            operation === 'unset'
              ? 'Failed to unset market reference'
              : 'Failed to delete document',
          description: err.message,
        })
      })
  }, [client, documentLanguage, markets, documentId, onClose, toast])

  return {
    label: `Delete market...`,
    disabled: !doc || !documentLanguage,
    icon: TrashIcon,
    tone: 'critical' as ButtonTone,
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: isDialogOpen && {
      type: 'dialog',
      onClose,
      header: 'Delete market',
      content: doc ? (
        <DeleteTranslationDialog
          doc={doc}
          documentId={documentId}
          setMarkets={setMarkets}
        />
      ) : null,
      footer: (
        <DeleteTranslationFooter
          onClose={onClose}
          onProceed={onProceed}
          markets={markets}
        />
      ),
    },
  }
}
