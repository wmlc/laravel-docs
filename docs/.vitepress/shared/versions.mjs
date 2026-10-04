/** 站点支持的文档版本（Laravel 各版本 + Dcat Admin），按从新到旧排序。新增/移除版本只需改这里。 */
export const versions = ['13.x', '12.x', '11.x', '9.x', 'dcat-admin']

/**
 * 版本元数据（未配置的版本走默认规则：源目录 {version}/zh-CN）。
 * - srcDir: 源文档目录（相对仓库根）
 * - label:  切换器/首页展示名
 * - title/tagline: 版本落地页 hero 文案
 * - exclude: 不导入站点的 md 文件
 */
export const versionMeta = {
  '13.x': { siteTitle: 'Laravel 13.x 文档', logo: '/logos/13x.svg', icon: '/icons/13x.svg' },
  '12.x': { siteTitle: 'Laravel 12.x 文档', logo: '/logos/12x.svg', icon: '/icons/12x.svg' },
  '11.x': { siteTitle: 'Laravel 11.x 文档', logo: '/logos/11x.svg', icon: '/icons/11x.svg' },
  '9.x': { siteTitle: 'Laravel 9.x 文档', logo: '/logos/9x.svg', icon: '/icons/9x.svg' },
  'dcat-admin': {
    srcDir: 'DcatAdmin',
    label: 'Dcat Admin',
    // 源文档对应 dcat/laravel-admin 2.*（见 installation.md 的 composer require 与 beta-change-log.md 的 v2.x 日志）
    title: '2.x 文档',
    tagline: 'Dcat Admin 后台系统构建工具文档',
    exclude: ['README.md', 'LICENSE.md'],
    siteTitle: 'Dcat Admin 2.x 文档',
    logo: '/logos/dcat.svg',
    icon: '/icons/dcat.svg'
  }
}

/** 默认进入的版本 */
export const defaultVersion = versions[0]

/** 匹配任意版本路径的正则片段，例如用于版本号切换时保留当前页面 */
export const versionPattern = versions.map((v) => v.replaceAll('.', '\\.')).join('|')

/**
 * 生成「只搜索当前版本」的 MiniSearch 过滤器。
 *
 * VitePress 会把 siteData 中的函数 toString() 后注入客户端重新求值，
 * 因此函数体不能引用任何外部变量，只能用 new Function 把版本列表内联进去。
 * 运行时按浏览器当前路径判断版本：不在版本页（如首页）时回退到默认版本。
 */
export function createVersionSearchFilter() {
  return new Function(
    'result',
    `
  const matched = location.pathname.match(/\\/(${versionPattern})\\//)
  const version = matched ? matched[1] : '${defaultVersion}'
  const id = result.id.startsWith('/') ? result.id : '/' + result.id
  return id.includes('/' + version + '/')
`
  )
}
