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
/** 把 documentation.md 里的链接规范化为站点可点击地址：
 *  - 替换 {{version}} 占位与 /docs/{version}/ 前缀
 *  - 相对写法 slug.md(#锚点) 重写为 /{version}/slug(#锚点)
 *  - 外链与站点绝对路径保持原样 */
function normalizeLink(rawLink, version) {
  let link = rawLink
    .replace('{{version}}', version)
    .replace(`/docs/${version}/`, `/${version}/`)

  if (!/^([a-z]+:)?\//i.test(link)) {
    const [path, anchor] = link.split('#')
    const slug = path.replace(/\.md$/, '')
    link = `/${version}/${slug}` + (anchor ? `#${anchor}` : '')
  }
  return link
}

export function parseSidebar(version) {
  const docPath = resolve(__dirname, `../../../${versionMeta[version]?.srcDir || `${version}/zh-CN`}/documentation.md`)
  const content = readFileSync(docPath, 'utf-8')
  const sidebar = []
  let currentGroup = null

  for (const line of content.split('\n')) {
    const groupMatch = line.match(/^-\s+##\s+(.+)$/)
    if (groupMatch) {
      const raw = groupMatch[1].trim()
      // 「分组标题本身就是一个链接」的写法（如 - ## [模型树](model-tree.md)）：
      // 当作可点击的顶层侧栏项，而不是一个没有子项、文字被原样显示的分组
      const linkGroup = raw.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (linkGroup) {
        sidebar.push({ text: linkGroup[1], link: normalizeLink(linkGroup[2], version) })
        currentGroup = null
        continue
      }
      currentGroup = { text: raw, collapsed: false, items: [] }
      sidebar.push(currentGroup)
      continue
    }

    const itemMatch = line.match(/^\s+-\s+\[([^\]]+)\]\(([^)]+)\)/)
    if (itemMatch) {
      const item = { text: itemMatch[1], link: normalizeLink(itemMatch[2], version) }
      if (currentGroup) {
        currentGroup.items.push(item)
      } else {
        sidebar.push(item)
      }
    }
  }

  return sidebar
}
