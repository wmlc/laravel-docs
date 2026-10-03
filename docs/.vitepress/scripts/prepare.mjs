import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../../../')
const versions = ['13.x', '12.x']

const alertMap = {
  NOTE: 'info',
  TIP: 'tip',
  IMPORTANT: 'tip',
  WARNING: 'warning',
  CAUTION: 'danger'
}

/** 把 GFM alerts（> [!NOTE] ...）转成 VitePress 容器语法（::: info ... :::） */
function convertAlerts(text) {
  const lines = text.split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const m = lines[i].match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/)
    if (m) {
      out.push(`::: ${alertMap[m[1]]}`)
      if (m[2].trim()) out.push(m[2].trim())
      i++
      while (i < lines.length && /^>/.test(lines[i])) {
        out.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      out.push(':::', '')
    } else {
      out.push(lines[i])
      i++
    }
  }
  return out.join('\n')
}

/** 预处理单篇文档：替换占位符、重写链接、转换 alerts、处理锚点 */
function transform(content, version) {
  let out = content
    .replaceAll('{{version}}', version)
    .replaceAll(`/docs/${version}/`, `/${version}/`)

  // <a name="xxx"></a> -> <a id="xxx" class="laravel-anchor"></a>，确保 #xxx 跳转生效
  out = out.replace(/<a\s+name="([^"]+)"><\/a>/g, '<a id="$1" class="laravel-anchor"></a>')

  out = convertAlerts(out)
  return out
}

function prepareVersion(version) {
  const srcDir = resolve(root, `${version}/zh-CN`)
  if (!existsSync(srcDir)) {
    console.warn(`[skip] 源目录不存在: ${srcDir}`)
    return
  }
  const outDir = resolve(__dirname, `../../${version}`)
  mkdirSync(outDir, { recursive: true })

  let count = 0
  for (const file of readdirSync(srcDir)) {
    if (!file.endsWith('.md') || file === 'documentation.md') continue
    const content = readFileSync(join(srcDir, file), 'utf-8')
    writeFileSync(join(outDir, file), transform(content, version))
    count++
  }

  // 版本落地页
  writeFileSync(
    join(outDir, 'index.md'),
    `---\nlayout: home\n\nhero:\n  name: Laravel\n  text: ${version} 文档\n  tagline: Laravel ${version} 官方文档中文翻译\n  actions:\n    - theme: brand\n      text: 开始阅读\n      link: /${version}/installation\n    - theme: alt\n      text: 切换版本\n      link: /\n---\n`
  )

  console.log(`[ok] ${version}: ${count} 篇文档已生成`)
}

for (const v of versions) prepareVersion(v)
console.log('文档预处理完成。')
