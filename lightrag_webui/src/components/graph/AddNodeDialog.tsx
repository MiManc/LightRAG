import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { createEntity } from '@/api/lightrag'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useGraphStore } from '@/stores/graph'
import { useSettingsStore } from '@/stores/settings'
import { errorMessage } from '@/lib/utils'

interface AddNodeDialogProps {
  isOpen: boolean
  onClose: () => void
}

const AddNodeDialog = ({ isOpen, onClose }: AddNodeDialogProps) => {
  const { t } = useTranslation()
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setEntityName('')
    setEntityType('')
    setDescription('')
    setError(null)
    setIsSubmitting(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = entityName.trim()
    const trimmedType = entityType.trim()
    const trimmedDescription = description.trim()

    if (!trimmedName || !trimmedDescription) {
      setError(t('graphPanel.addNodeDialog.requiredError'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await createEntity(trimmedName, {
        description: trimmedDescription,
        entity_type: trimmedType || 'UNKNOWN',
        source_id: 'manual_creation',
        file_path: 'manual_creation'
      })

      useSettingsStore.getState().setQueryLabel(trimmedName)
      useGraphStore.getState().setSelectedNode(trimmedName, true)
      useGraphStore.getState().incrementGraphDataVersion()
      toast.success(t('graphPanel.addNodeDialog.success', { name: trimmedName }))
      handleClose()
    } catch (err) {
      const message = errorMessage(err)
      setError(message)
      toast.error(t('graphPanel.addNodeDialog.failed'), {
        description: message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('graphPanel.addNodeDialog.title')}</DialogTitle>
            <DialogDescription>{t('graphPanel.addNodeDialog.description')}</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/15 text-destructive mt-4 rounded-md px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            <label className="grid gap-2 text-sm font-medium">
              {t('graphPanel.addNodeDialog.nameLabel')}
              <Input
                value={entityName}
                onChange={(event) => setEntityName(event.target.value)}
                placeholder={t('graphPanel.addNodeDialog.namePlaceholder')}
                disabled={isSubmitting}
                autoFocus
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {t('graphPanel.addNodeDialog.typeLabel')}
              <Input
                value={entityType}
                onChange={(event) => setEntityType(event.target.value)}
                placeholder={t('graphPanel.addNodeDialog.typePlaceholder')}
                disabled={isSubmitting}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {t('graphPanel.addNodeDialog.descriptionLabel')}
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('graphPanel.addNodeDialog.descriptionPlaceholder')}
                className="border-input focus-visible:ring-ring min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !entityName.trim() || !description.trim()}
            >
              {isSubmitting ? t('common.saving') : t('graphPanel.addNodeDialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddNodeDialog
