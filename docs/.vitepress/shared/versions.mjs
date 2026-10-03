/** 站点支持的 Laravel 版本，按从新到旧排序。新增/移除版本只需改这里。 */
export const versions = ['13.x', '12.x', '11.x', '9.x']

/** 默认进入的版本 */
export const defaultVersion = versions[0]

/** 匹配任意版本路径的正则片段，例如用于版本号切换时保留当前页面 */
export const versionPattern = versions.map((v) => v.replaceAll('.', '\\.')).join('|')
