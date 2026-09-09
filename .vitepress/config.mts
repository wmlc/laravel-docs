import { defineConfig } from 'vitepress'

const version = process.env.DOCS_VERSION || '13'

const isV13 = version === '13'
const ver = isV13 ? '13.x' : '12.x'

const otherVer = isV13 ? '12.x' : '13.x'
const devPort = isV13 ? '8099' : '8099'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: `/docs/${ver}/`,
  srcDir: `${ver}/zh-CN`,
  outDir: `.vitepress/dist/docs/${ver}`,
  title: `Laravel ${ver} 中文文档`,
  description: "Laravel 中文文档",
  ignoreDeadLinks: true,
  head: [
    ['script', {}, `
      (function() {
        function fixVersionLinks() {
          var nav = document.querySelector('.VPNav nav');
          if (!nav) return false;
          var links = nav.querySelectorAll('a');
          links.forEach(function(a) {
            var href = a.getAttribute('href') || '';
            if (href.indexOf('/${otherVer}/') === -1) return;
            var isDev = !!location.port;
            var url = isDev
              ? location.protocol + '//' + location.hostname + ':${devPort}/docs/${otherVer}/'
              : '/docs/${otherVer}/';
            a.setAttribute('href', url);
            a.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = url;
            });
          });
          return true;
        }
        function tryFix() {
          if (fixVersionLinks()) return;
          var n = 0, t = setInterval(function() {
            if (fixVersionLinks() || ++n > 50) clearInterval(t);
          }, 100);
        }
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', tryFix);
        } else {
          tryFix();
        }
      })();
    `]
  ],
  vite: {
    build: {
      emptyOutDir: false
    },
    plugins: [{
      name: 'fix-version-links',
      transform(code, id) {
        if (id.endsWith('.md')) {
          return code
            .replace(/\/docs\/\{\{version\}\}/g, '')
            // VitePress 的客户端路由仅按 id 定位；旧文档的 name 锚点会被忽略。
            .replace(/<a\s+name=(['"])([^'"]+)\1><\/a>/g, '<a id="$2"></a>')
        }
      }
    }]
  },
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: ver,
        items: [
          { text: '13.x', link: '/docs/13.x/' },
          { text: '12.x', link: '/docs/12.x/' },
        ]
      },
      { text: 'API', link: `https://api.laravel.com/docs/${ver}` }
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
          { text: isV13 ? 'Facade' : 'Facades', link: '/facades' },
        ]
      },
      {
        text: '基础',
        collapsed: true,
        items: [
          { text: '路由', link: '/routing' },
          { text: '中间件', link: '/middleware' },
          { text: isV13 ? 'CSRF 保护' : 'CSRF 防护', link: '/csrf' },
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
          { text: isV13 ? 'Artisan 命令行' : 'Artisan 控制台', link: '/artisan' },
          { text: isV13 ? '广播' : '事件广播', link: '/broadcasting' },
          { text: '缓存', link: '/cache' },
          { text: '集合', link: '/collections' },
          { text: '并发', link: '/concurrency' },
          { text: '上下文', link: '/context' },
          { text: '契约', link: '/contracts' },
          { text: '事件', link: '/events' },
          { text: '文件存储', link: '/filesystem' },
          { text: '辅助函数', link: '/helpers' },
          { text: 'HTTP 客户端', link: '/http-client' },
          ...(isV13 ? [{ text: '图片处理', link: '/images' }] : []),
          { text: '本地化', link: '/localization' },
          { text: '邮件', link: '/mail' },
          { text: '通知', link: '/notifications' },
          { text: '扩展包开发', link: '/packages' },
          { text: '进程', link: '/processes' },
          { text: '队列', link: '/queues' },
          { text: isV13 ? '限流' : '速率限制', link: '/rate-limiting' },
          { text: '搜索', link: '/search' },
          { text: '字符串', link: '/strings' },
          { text: '任务调度', link: '/scheduling' },
        ]
      },
      {
        text: '安全',
        collapsed: true,
        items: [
          { text: isV13 ? '认证' : '用户认证', link: '/authentication' },
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
          { text: isV13 ? '修改器 / 类型转换' : '修改器与类型转换', link: '/eloquent-mutators' },
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
          ...(isV13 ? [{ text: 'Head', link: '/head' }] : []),
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
