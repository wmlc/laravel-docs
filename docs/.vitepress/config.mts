import { defineConfig } from 'vitepress'
import { parseSidebar, versions } from './shared/sidebar.mjs'

export default defineConfig({
  title: 'Laravel 文档',
  description: 'Laravel 官方文档中文翻译',
  lang: 'zh-CN',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: 'localhostLinks',

  head: [
    ['meta', { name: 'theme-color', content: '#ff2d20' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: '首页', link: '/' },
      { component: 'VersionSwitcher' }
    ],

    sidebar: {
      '/13.x/': parseSidebar('13.x'),
      '/12.x/': parseSidebar('12.x')
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/laravel/laravel' }
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索文档'
          },
          modal: {
            displayDetails: '显示详情',
            resetButtonTitle: '清除查询条件',
            backButtonTitle: '关闭',
            noResultsText: '无法找到相关结果',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },

    outline: {
      label: '本页目录',
      level: [2, 3]
    },

    docFooter: {
      prev: '上一页',
      next: '下一页'
    },

    lastUpdated: {
      text: '最后更新于'
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    langMenuLabel: '语言'
  },

  markdown: {
    lineNumbers: false
  }
})
