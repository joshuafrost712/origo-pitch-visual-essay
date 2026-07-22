/**
 * Content loader. All access to essay copy goes through this module so the
 * renderer and the dev-feedback edit tools share one source of truth.
 */
import rawContent from '../../content/essay-content.json'
import type { EssayContent, EssayNode } from '../../schema/types'

const content = rawContent as EssayContent

export function getContent(): EssayContent {
  return content
}

/** Depth-first walk over every node in document order. */
export function walk(nodes: EssayNode[], visit: (node: EssayNode, parents: EssayNode[]) => void) {
  const recurse = (list: EssayNode[], parents: EssayNode[]) => {
    for (const node of list) {
      visit(node, parents)
      if (node.children?.length) recurse(node.children, [...parents, node])
    }
  }
  recurse(nodes, [])
}

export interface NodeRef {
  node: EssayNode
  parents: EssayNode[]
}

let indexCache: Map<string, NodeRef> | null = null

export function nodeIndex(): Map<string, NodeRef> {
  if (indexCache) return indexCache
  const map = new Map<string, NodeRef>()
  walk(content.sections, (node, parents) => map.set(node.id, { node, parents }))
  indexCache = map
  return map
}

export function findNode(id: string): NodeRef | undefined {
  return nodeIndex().get(id)
}
