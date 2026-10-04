import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, cpSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { versions, versionMeta } from '../shared/versions.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../../../')

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

/** 处理 Blade 插值 `{{ }}`，避免被 VitePress 当作 Vue 模板插值：
 *  - 代码块内含 `{{ }}`：在代码块 info string 追加 `v-pre`
 *  - 代码块外含 `{{ }}`：替换为 HTML 实体 `&#123;&#123; ... &#125;&#125;` */
function escapeBladeInterpolation(text) {
  const lines = text.split('\n')
  let inBlock = false
  let blockStart = -1
  let blockHasInterp = false
  for (let i = 0; i < lines.length; i++) {
    const fenceMatch = lines[i].match(/^(\s*)(```+)(.*)$/)
    if (fenceMatch) {
      if (!inBlock) {
        inBlock = true
        blockStart = i
        blockHasInterp = false
      } else {
        if (blockHasInterp) {
          const info = lines[blockStart].match(/^(\s*)(```+)(.*)$/)[3]
          if (!/\bv-pre\b/.test(info)) {
            // 无语言时补一个 txt，避免 `v-pre` 被 Shiki 当成语言名
            const suffix = info.trim() ? 'v-pre' : 'txt v-pre'
            lines[blockStart] = lines[blockStart].replace(/(```+)(.*)$/, `$1$2 ${suffix}`)
          }
        }
        inBlock = false
        blockStart = -1
        blockHasInterp = false
      }
      continue
    }
    if (inBlock) {
      if (/\{\{[^}]+\}\}/.test(lines[i])) blockHasInterp = true
    } else if (/\{\{[^}]+\}\}/.test(lines[i])) {
      lines[i] = lines[i].replace(/\{\{([^}]+)\}\}/g, '&#123;&#123;$1&#125;&#125;')
    }
  }
  return lines.join('\n')
}

/** 文档里出现的非标准代码块语言标签 -> Shiki 可用的语言 */
const fenceLangMap = {
  none: 'txt',
  nothing: 'txt',
  env: 'dotenv',
  alpine: 'html'
}

/**
 * 规范化代码块的语言标签：
 * 1. `none` / `nothing` 之类无意义标签改为 `txt`（纯文本）
 * 2. `env` / `alpine` 映射到 Shiki 已支持的语言，保留高亮
 * 3. `v-pre` 独占语言位时补 `txt`，避免被当成语言名
 * 目的是消除 `The language 'xxx' is not loaded` 告警。
 */
function normalizeFenceLangs(text) {
  const lines = text.split('\n')
  let inBlock = false

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)(```+)(.*)$/)
    if (!m) continue

    if (inBlock) {
      inBlock = false
      continue
    }
    inBlock = true

    const [, indent, fence, info] = m
    if (!info.trim()) continue

    const tokens = info.trim().split(/\s+/)
    const lang = tokens[0].toLowerCase()

    if (fenceLangMap[lang]) {
      tokens[0] = fenceLangMap[lang]
    } else if (lang === 'v-pre') {
      tokens.unshift('txt')
    } else {
      continue
    }

    lines[i] = `${indent}${fence}${tokens.join(' ')}`
  }

  return lines.join('\n')
}

/** 预处理单篇文档：替换占位符、重写链接、转换 alerts、处理锚点 */
function transform(content, version) {
  let out = content
    .replaceAll('{{version}}', version)
    .replaceAll(`/docs/${version}/`, `/${version}/`)

  // Dcat Admin 文档用 {{public}} 引用原官网的图片/链接，重写为可访问的绝对地址，
  // 否则 HTML 属性里的插值会被 Vue 编译器当作资源 import 解析导致构建失败
  out = out.replaceAll('{{public}}', 'https://www.dcatadmin.com')

  // 重写正文中的相对 md 链接（如 DcatAdmin 文档的 [文本](slug.md#锚点)）为站点绝对路径，
  // 不影响外部链接、站内绝对路径与纯锚点链接
  out = out.replace(/\]\((?!https?:\/\/|mailto:|\/|#)([^)\s#]+?)\.md(#[^)]*)?\)/g,
    (_, slug, anchor) => `](/${version}/${slug}${anchor || ''})`)

  // <a name="xxx"></a> -> <a id="xxx" class="laravel-anchor"></a>，确保 #xxx 跳转生效
  out = out.replace(/<a\s+name="([^"]+)"><\/a>/g, '<a id="$1" class="laravel-anchor"></a>')

  out = convertAlerts(out)
  out = escapeBladeInterpolation(out)
  out = normalizeFenceLangs(out)
  return out
}

function prepareVersion(version) {
  const meta = versionMeta[version] || {}
  const srcDir = resolve(root, meta.srcDir || `${version}/zh-CN`)
  if (!existsSync(srcDir)) {
    console.warn(`[skip] 源目录不存在: ${srcDir}`)
    return []
  }
  const outDir = resolve(__dirname, `../../${version}`)
  mkdirSync(outDir, { recursive: true })

  // 同步正文相对路径引用的静态资源子目录（如 DcatAdmin/images 截图）
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      cpSync(join(srcDir, entry.name), join(outDir, entry.name), { recursive: true })
    }
  }

  const skipFiles = ['documentation.md', ...(meta.exclude || [])]
  let count = 0
  const slugs = []
  for (const file of readdirSync(srcDir)) {
    if (!file.endsWith('.md') || skipFiles.includes(file)) continue
    const content = readFileSync(join(srcDir, file), 'utf-8')
    writeFileSync(join(outDir, file), transform(content, version))
    slugs.push(file.slice(0, -3))
    count++
  }

  // 版本落地页
  const label = meta.label || 'Laravel'
  const title = meta.title || `${version} 文档`
  const tagline = meta.tagline || `Laravel ${version} 官方文档中文翻译`
  writeFileSync(
    join(outDir, 'index.md'),
    `---\nlayout: home\n\nhero:\n  name: ${label}\n  text: ${title}\n  tagline: ${tagline}\n  actions:\n    - theme: brand\n      text: 开始阅读\n      link: /${version}/installation\n    - theme: alt\n      text: 切换版本\n      link: /\n---\n`
  )

  console.log(`[ok] ${version}: ${count} 篇文档已生成`)
  return slugs
}

// 生成各版本页面索引（供 VersionSwitcher 编译期判断目标版本是否存在同 slug 页面，
// 生产环境 site.pages 为空，不能依赖运行时数据）
const pageIndex = {}
for (const v of versions) {
  const slugs = prepareVersion(v)
  if (slugs.length) pageIndex[v] = slugs
}
writeFileSync(
  resolve(__dirname, '../page-index.json'),
  JSON.stringify(pageIndex)
)
console.log('文档预处理完成。')
