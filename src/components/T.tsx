import { createElement, type ReactNode } from 'react'
import { findNode } from '../lib/content/loader'
import type { EssayField } from '../schema/types'

/**
 * Render one field of one essay-content node, tagged for the dev-feedback
 * tools: highlighting the text offers "Edit text", which patches
 * essay-content.json through the dev server. `as` picks the wrapper element
 * (span by default). Missing node/field renders a loud placeholder in dev so
 * copy gaps are impossible to miss.
 */
export function T({
  id,
  field = 'text',
  as = 'span',
  className,
}: {
  id: string
  field?: EssayField
  as?: keyof HTMLElementTagNameMap
  className?: string
}): ReactNode {
  const value = findNode(id)?.node[field]
  const missing = typeof value !== 'string'
  return createElement(
    as,
    {
      className,
      'data-dfb-node': id,
      'data-dfb-field': field,
    },
    missing ? `⟨missing: ${id}.${field}⟩` : value,
  )
}

/** Plain accessor for places that need the raw string (aria-labels, alt text). */
export function t(id: string, field: EssayField = 'text'): string {
  const value = findNode(id)?.node[field]
  return typeof value === 'string' ? value : `⟨missing: ${id}.${field}⟩`
}
