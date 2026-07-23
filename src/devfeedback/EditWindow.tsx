import { useEffect, useState } from 'react'
import { findNode } from '../lib/content/loader'
import type { EssayNode } from '../schema/types'
import { useFeedback } from './feedbackContext'
import { addEdit } from './db'
import { applyContentEdit } from './applyEdit'

const FIELD_LABEL: Record<string, string> = {
  kicker: 'section kicker',
  heading: 'heading',
  text: 'body text',
  caption: 'caption',
  label: 'label',
  quote: 'quote',
  note: 'note',
}

/**
 * Edit-in-place for essay-content text. Saving live-applies through the dev
 * server's /__content-edit endpoint (the change hot-reloads in seconds and
 * lands as a git diff); when that endpoint is not reachable (a deployed
 * build), the edit is saved as a pending suggestion in the feedback batch
 * instead.
 */
export function EditWindow() {
  const { editDraft, closeEdit } = useFeedback()
  const [text, setText] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  // This panel is a singleton (mounted once, shown/hidden via `editDraft`), so its
  // local draft state survives across edit targets. Without this reset, a previous
  // target's typed `text` wins over the new target's `oldText` (`value = text ??
  // oldText`) and the panel opens showing the wrong, stale text. Clear the draft
  // whenever the target identity changes (including on close → reopen).
  useEffect(() => {
    setText(null)
    setSaving(false)
    setNotice('')
  }, [editDraft?.nodeId, editDraft?.field])

  if (!editDraft) return null

  const node = findNode(editDraft.nodeId)?.node
  const field = editDraft.field as keyof EssayNode
  const oldText = typeof node?.[field] === 'string' ? (node[field] as string) : ''
  const value = text ?? oldText
  const dirty = value.trim() !== oldText.trim()

  const save = async () => {
    const newText = value.trim()
    if (!node || !dirty || !newText || saving) return
    setSaving(true)
    const applied = await applyContentEdit({
      nodeId: editDraft.nodeId,
      field: editDraft.field,
      oldText,
      newText,
    })
    await addEdit({
      route: editDraft.route,
      locationLabel: editDraft.locationLabel,
      nodeId: editDraft.nodeId,
      field: editDraft.field,
      oldText,
      newText,
      applied,
    })
    setSaving(false)
    if (applied) {
      // The dev server rewrote essay-content.json; Vite hot-reloads the page.
      closeEdit()
    } else {
      setNotice(
        'Could not reach the dev server, so the text is unchanged for now. The edit is saved as a suggestion and will be applied by the developer.',
      )
    }
  }

  if (!node) {
    return (
      <div className="dfb-root dfb-overlay" role="dialog" aria-label="Edit text">
        <div className="dfb-panel">
          <p className="dfb-muted">This text could not be traced to the content file.</p>
          <button type="button" className="dfb-btn" onClick={closeEdit}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dfb-root dfb-overlay" role="dialog" aria-label="Edit text">
      <div className="dfb-panel">
        <div className="dfb-panel-head">
          <strong>Edit {FIELD_LABEL[editDraft.field] ?? 'text'}</strong>
          <button type="button" className="dfb-x" onClick={closeEdit}>
            Cancel
          </button>
        </div>

        <div className="dfb-meta">
          <span className="dfb-tag">{editDraft.route}</span>
          <span className="dfb-tag dfb-tag-soft">
            {editDraft.nodeId} · {editDraft.field}
          </span>
        </div>

        <textarea
          autoFocus
          rows={5}
          className="dfb-textarea"
          value={value}
          onChange={(e) => {
            setText(e.target.value)
            setNotice('')
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void save()
          }}
        />

        {notice && <p className="dfb-muted dfb-status">{notice}</p>}

        <div className="dfb-row">
          <div className="dfb-spacer" />
          <button
            type="button"
            className="dfb-btn dfb-btn-primary"
            disabled={!dirty || !value.trim() || saving}
            onClick={() => void save()}
          >
            {saving ? 'Saving…' : 'Change the text'}
          </button>
        </div>
      </div>
    </div>
  )
}
