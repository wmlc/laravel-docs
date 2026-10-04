import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export { versions } from './versions.mjs'
import { versionMeta } from './versions.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * 从源目录 documentation.md 解析出 VitePress sidebar 结构。
 *
 * documentation.md 格式：
 *   - ## 分组名
 *       - [标题](/docs/{{version}}/slug)   Laravel 版本
 *       - [标题](slug.md)                  Dcat Admin 等相对路径写法（也支持 slug.md#锚点）
 *   - [标题](https://external)
 */
export function parseSidebar(version) {
  const docPath = resolve(__dirname, `../../../${versionMeta[version]?.srcDir || `${version}/zh-CN`}/documentation.md`)
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

      // 相对路径写法 slug.md(#锚点) 重写为站点绝对路径 /{version}/slug(#锚点)；外链与绝对路径保持原样
      if (!/^([a-z]+:)?\//i.test(link)) {
        const [path, anchor] = link.split('#')
        const slug = path.replace(/\.md$/, '')
        link = `/${version}/${slug}` + (anchor ? `#${anchor}` : '')
      }

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
