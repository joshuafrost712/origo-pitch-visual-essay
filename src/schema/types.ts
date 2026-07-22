/**
 * Essay content schema. Every piece of prose on the page lives in
 * src/content/essay-content.json as a node with an id and one or more string
 * fields. Components render fields through <T>, which tags the DOM with
 * data-dfb-node/data-dfb-field so the dev-feedback tools can edit in place.
 */
export interface EssayNode {
  id: string
  kicker?: string
  heading?: string
  text?: string
  caption?: string
  label?: string
  quote?: string
  note?: string
  children?: EssayNode[]
}

export interface EssayContent {
  version: string
  sections: EssayNode[]
}

/** Field names the dev server will accept edits to (mirrors vite.config.ts). */
export type EssayField = 'kicker' | 'heading' | 'text' | 'caption' | 'label' | 'quote' | 'note'
