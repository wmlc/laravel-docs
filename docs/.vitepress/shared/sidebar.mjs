import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export { versions } from './versions.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * 从 {version}/zh-CN/documentation.md 解析出 VitePress sidebar 结构。
 *
 * documentation.md 格式：
 *   - ## 分组名
 *       - [标题](/docs/{{version}}/slug)
 *   - [标题](https://external)
 */
export function parseSidebar(version) {
  const docPath = resolve(__dirname, `../../../${version}/zh-CN/documentation.md`)
  const content = readFileSync(docPath, 'utf-8')
  const sidebar = []
  let currentGroup = null

  for (const line of content.split('\n')) {
    const groupMatch = line.match(/^-\s+##\s+(.+)$/)
    if (groupMatch) {
      currentGroup = { text: groupMatch[1].trim(), collapsed: false, items: [] }
      sidebar.push(currentGroup)
      continue
    }

    const itemMatch = line.match(/^\s+-\s+\[([^\]]+)\]\(([^)]+)\)/)
    if (itemMatch) {
      const text = itemMatch[1]
      let link = itemMatch[2]
        .replace('{{version}}', version)
        .replace(`/docs/${version}/`, `/${version}/`)

      const item = { text, link }
      if (currentGroup) {
        currentGroup.items.push(item)
      } else {
        sidebar.push(item)
      }
    }
  }

  return sidebar
}
