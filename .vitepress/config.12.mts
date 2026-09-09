import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/12.x/',
  srcDir: '12.x/zh-CN',
  outDir: '.vitepress/dist/12.x',
  title: "Laravel 12.x 中文文档",
  description: "Laravel 中文文档",
  ignoreDeadLinks: true,
  vite: {
    build: {
      emptyOutDir: false
    }
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: '12.x',
        items: [
          { text: '13.x', link: '/13.x/' },
          { text: '12.x', link: '/installation' },
        ]
      },
      { text: 'API', link: 'https://api.laravel.com/docs/12.x' }
    ],

    sidebar: [
      {
        text: '前言',
        collapsed: false,
        items: [
          { text: '版本说明', link: '/releases' },
          { text: '升级指南', link: '/upgrade' },
          { text: '贡献指南', link: '/contributions' },
        ]
      },
      {
        text: '入门',
        collapsed: false,
        items: [
          { text: '安装', link: '/installation' },
          { text: '配置', link: '/configuration' },
          { text: '智能体开发', link: '/ai' },
          { text: '目录结构', link: '/structure' },
          { text: '前端', link: '/frontend' },
          { text: '入门套件', link: '/starter-kits' },
          { text: '部署', link: '/deployment' },
        ]
      },
      {
        text: '架构概念',
        collapsed: true,
        items: [
          { text: '请求生命周期', link: '/lifecycle' },
          { text: '服务容器', link: '/container' },
          { text: '服务提供者', link: '/providers' },
          { text: 'Facades', link: '/facades' },
        ]
      },
      {
        text: '基础',
        collapsed: true,
        items: [
          { text: '路由', link: '/routing' },
          { text: '中间件', link: '/middleware' },
          { text: 'CSRF 防护', link: '/csrf' },
          { text: '控制器', link: '/controllers' },
          { text: '请求', link: '/requests' },
          { text: '响应', link: '/responses' },
          { text: '视图', link: '/views' },
          { text: 'Blade 模板', link: '/blade' },
          { text: '资源打包', link: '/vite' },
          { text: 'URL 生成', link: '/urls' },
          { text: '会话', link: '/session' },
          { text: '验证', link: '/validation' },
          { text: '错误处理', link: '/errors' },
          { text: '日志', link: '/logging' },
        ]
      },
      {
        text: '深入探索',
        collapsed: true,
        items: [
          { text: 'Artisan 控制台', link: '/artisan' },
          { text: '事件广播', link: '/broadcasting' },
          { text: '缓存', link: '/cache' },
          { text: '集合', link: '/collections' },
          { text: '并发', link: '/concurrency' },
          { text: '上下文', link: '/context' },
          { text: '契约', link: '/contracts' },
          { text: '事件', link: '/events' },
          { text: '文件存储', link: '/filesystem' },
          { text: '辅助函数', link: '/helpers' },
          { text: 'HTTP 客户端', link: '/http-client' },
          { text: '本地化', link: '/localization' },
          { text: '邮件', link: '/mail' },
          { text: '通知', link: '/notifications' },
          { text: '扩展包开发', link: '/packages' },
          { text: '进程', link: '/processes' },
          { text: '队列', link: '/queues' },
          { text: '速率限制', link: '/rate-limiting' },
          { text: '搜索', link: '/search' },
          { text: '字符串', link: '/strings' },
          { text: '任务调度', link: '/scheduling' },
        ]
      },
      {
        text: '安全',
        collapsed: true,
        items: [
          { text: '用户认证', link: '/authentication' },
          { text: '授权', link: '/authorization' },
          { text: '邮箱验证', link: '/verification' },
          { text: '加密', link: '/encryption' },
          { text: '哈希', link: '/hashing' },
          { text: '密码重置', link: '/passwords' },
        ]
      },
      {
        text: '数据库',
        collapsed: true,
        items: [
          { text: '入门', link: '/database' },
          { text: '查询构造器', link: '/queries' },
          { text: '分页', link: '/pagination' },
          { text: '数据库迁移', link: '/migrations' },
          { text: '数据填充', link: '/seeding' },
          { text: 'Redis', link: '/redis' },
          { text: 'MongoDB', link: '/mongodb' },
        ]
      },
      {
        text: 'Eloquent ORM',
        collapsed: true,
        items: [
          { text: '入门', link: '/eloquent' },
          { text: '关联', link: '/eloquent-relationships' },
          { text: '集合', link: '/eloquent-collections' },
          { text: '修改器与类型转换', link: '/eloquent-mutators' },
          { text: 'API 资源', link: '/eloquent-resources' },
          { text: '序列化', link: '/eloquent-serialization' },
          { text: '工厂', link: '/eloquent-factories' },
        ]
      },
      {
        text: 'AI',
        collapsed: true,
        items: [
          { text: 'AI SDK', link: '/ai-sdk' },
          { text: 'MCP', link: '/mcp' },
          { text: 'Boost', link: '/boost' },
        ]
      },
      {
        text: '测试',
        collapsed: true,
        items: [
          { text: '入门', link: '/testing' },
          { text: 'HTTP 测试', link: '/http-tests' },
          { text: '命令行测试', link: '/console-tests' },
          { text: '浏览器测试', link: '/dusk' },
          { text: '数据库', link: '/database-testing' },
          { text: '模拟', link: '/mocking' },
        ]
      },
      {
        text: '扩展包',
        collapsed: true,
        items: [
          { text: 'Cashier (Stripe)', link: '/billing' },
          { text: 'Cashier (Paddle)', link: '/cashier-paddle' },
          { text: 'Dusk', link: '/dusk' },
          { text: 'Envoy', link: '/envoy' },
          { text: 'Fortify', link: '/fortify' },
          { text: 'Folio', link: '/folio' },
          { text: 'Homestead', link: '/homestead' },
          { text: 'Horizon', link: '/horizon' },
          { text: 'Mix', link: '/mix' },
          { text: 'Octane', link: '/octane' },
          { text: 'Passport', link: '/passport' },
          { text: 'Pennant', link: '/pennant' },
          { text: 'Pint', link: '/pint' },
          { text: 'Precognition', link: '/precognition' },
          { text: 'Prompts', link: '/prompts' },
          { text: 'Pulse', link: '/pulse' },
          { text: 'Reverb', link: '/reverb' },
          { text: 'Sail', link: '/sail' },
          { text: 'Sanctum', link: '/sanctum' },
          { text: 'Scout', link: '/scout' },
          { text: 'Socialite', link: '/socialite' },
          { text: 'Telescope', link: '/telescope' },
          { text: 'Valet', link: '/valet' },
        ]
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wmlc/laravel-docs' }
    ]
  }
})
