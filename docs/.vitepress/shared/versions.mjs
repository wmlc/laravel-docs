/** 站点支持的 Laravel 版本，按从新到旧排序。新增/移除版本只需改这里。 */
export const versions = ['13.x', '12.x', '11.x', '9.x']

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
