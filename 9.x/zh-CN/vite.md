# 资源打包（Vite）

- [简介](#introduction)
- [安装与设置](#installation)
  - [安装 Node](#installing-node)
  - [安装 Vite 和 Laravel 插件](#installing-vite-and-laravel-plugin)
  - [配置 Vite](#configuring-vite)
  - [加载脚本和样式](#loading-your-scripts-and-styles)
- [运行 Vite](#running-vite)
- [使用 JavaScript](#working-with-scripts)
  - [别名](#aliases)
  - [Vue](#vue)
  - [React](#react)
  - [Inertia](#inertia)
  - [URL 处理](#url-processing)
- [使用样式表](#working-with-stylesheets)
- [使用 Blade 和路由](#working-with-blade-and-routes)
  - [使用 Vite 处理静态资源](#blade-processing-static-assets)
  - [保存时刷新](#blade-refreshing-on-save)
  - [别名](#blade-aliases)
- [自定义基础 URL](#custom-base-urls)
- [环境变量](#environment-variables)
- [在测试中禁用 Vite](#disabling-vite-in-tests)
- [服务端渲染（SSR）](#ssr)
- [脚本和样式标签属性](#script-and-style-attributes)
  - [内容安全策略（CSP）Nonce](#content-security-policy-csp-nonce)
  - [子资源完整性（SRI）](#subresource-integrity-sri)
  - [任意属性](#arbitrary-attributes)
- [高级自定义](#advanced-customization)
  - [修正开发服务器 URL](#correcting-dev-server-urls)

<a name="introduction"></a>
## 简介

[Vite](https://vitejs.dev) 是一个现代前端构建工具，提供极快的开发环境并将代码打包用于生产。使用 Laravel 构建应用程序时，通常会使用 Vite 将应用程序的 CSS 和 JavaScript 文件打包为生产就绪的资源。

Laravel 通过提供官方插件和 Blade 指令来加载开发和生产资源，与 Vite 无缝集成。

> **Note**  
> 你在运行 Laravel Mix 吗？Vite 已在新 Laravel 安装中取代了 Laravel Mix。如需 Mix 文档，请访问 [Laravel Mix](https://laravel-mix.com/) 网站。如果你想切换到 Vite，请查看我们的[迁移指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-laravel-mix-to-vite)。

<a name="vite-or-mix"></a>
#### 在 Vite 和 Laravel Mix 之间选择

在过渡到 Vite 之前，新 Laravel 应用程序在打包资源时使用由 [webpack](https://webpack.js.org/) 驱动的 [Mix](https://laravel-mix.com/)。Vite 专注于在构建富 JavaScript 应用程序时提供更快、更高效的体验。如果你正在开发单页应用程序（SPA），包括使用 [Inertia](https://inertiajs.com) 等工具开发的应用程序，Vite 将是完美选择。

Vite 也适用于使用 JavaScript "点缀"的传统服务端渲染应用程序，包括使用 [Livewire](https://laravel-livewire.com) 的应用程序。但是，它缺少 Laravel Mix 支持的一些功能，例如将未在 JavaScript 应用程序中直接引用的任意资源复制到构建中的能力。

<a name="migrating-back-to-mix"></a>
#### 迁回 Mix

你是否已使用我们的 Vite 脚手架启动了新 Laravel 应用程序，但需要迁回 Laravel Mix 和 webpack？没问题。请查阅我们的[从 Vite 迁移到 Mix 的官方指南](https://github.com/laravel/vite-plugin/blob/main/UPGRADE.md#migrating-from-vite-to-laravel-mix)。

<a name="installation"></a>
## 安装与设置

> **Note**  
> 以下文档讨论如何手动安装和配置 Laravel Vite 插件。但是，Laravel 的[入门套件](/docs/{{version}}/starter-kits)已包含所有这些脚手架，是开始使用 Laravel 和 Vite 的最快方式。

<a name="installing-node"></a>
### 安装 Node

运行 Vite 和 Laravel 插件之前，必须确保已安装 Node.js（16+）和 NPM：

```sh
node -v
npm -v
```

可以使用 [Node 官方网站](https://nodejs.org/en/download/)提供的简单图形安装程序轻松安装最新版本的 Node 和 NPM。或者，如果你使用 [Laravel Sail](https://laravel.com/docs/{{version}}/sail)，可以通过 Sail 调用 Node 和 NPM：

```sh
./vendor/bin/sail node -v
./vendor/bin/sail npm -v
```

<a name="installing-vite-and-laravel-plugin"></a>
### 安装 Vite 和 Laravel 插件

在全新安装的 Laravel 中，你会在应用程序目录结构根目录找到 `package.json` 文件。默认 `package.json` 文件已包含开始使用 Vite 和 Laravel 插件所需的一切。可以通过 NPM 安装应用程序的前端依赖：

```sh
npm install
```

<a name="configuring-vite"></a>
### 配置 Vite

Vite 通过项目根目录的 `vite.config.js` 文件配置。你可以根据需要自由自定义此文件，也可以安装应用程序所需的任何其他插件，如 `@vitejs/plugin-vue` 或 `@vitejs/plugin-react`。

Laravel Vite 插件要求你指定应用程序的入口点。它们可以是 JavaScript 或 CSS 文件，包括 TypeScript、JSX、TSX 和 Sass 等预处理语言。

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel([
            'resources/css/app.css',
            'resources/js/app.js',
        ]),
    ],
});
```

如果你正在构建 SPA（包括使用 Inertia 构建的应用程序），Vite 在没有 CSS 入口点时效果最佳：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel([
            'resources/css/app.css', // [tl! remove]
            'resources/js/app.js',
        ]),
    ],
});
```

相反，应通过 JavaScript 导入 CSS。通常，这将在应用程序的 `resources/js/app.js` 文件中完成：

```js
import './bootstrap';
import '../css/app.css'; // [tl! add]
```

Laravel 插件还支持多个入口点和高级配置选项，如 [SSR 入口点](#ssr)。

<a name="working-with-a-secure-development-server"></a>
#### 使用安全开发服务器

如果本地开发 Web 服务器通过 HTTPS 服务应用程序，你可能会遇到连接 Vite 开发服务器的问题。

如果你使用 [Laravel Valet](/docs/{{version}}/valet) 进行本地开发，并已对应用程序运行 [secure 命令](/docs/{{version}}/valet#securing-sites)，可以将 Vite 开发服务器配置为自动使用 Valet 生成的 TLS 证书：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            // ...
            valetTls: 'my-app.test', // [tl! add]
        }),
    ],
});
```

使用其他 Web 服务器时，应生成受信任证书并手动配置 Vite 使用生成的证书：

```js
// ...
import fs from 'fs'; // [tl! add]

const host = 'my-app.test'; // [tl! add]

export default defineConfig({
    // ...
    server: { // [tl! add]
        host, // [tl! add]
        hmr: { host }, // [tl! add]
        https: { // [tl! add]
            key: fs.readFileSync(`/path/to/${host}.key`), // [tl! add]
            cert: fs.readFileSync(`/path/to/${host}.crt`), // [tl! add]
        }, // [tl! add]
    }, // [tl! add]
});
```

如果无法为系统生成受信任证书，可以安装并配置 [`@vitejs/plugin-basic-ssl` 插件](https://github.com/vitejs/vite-plugin-basic-ssl)。使用不受信任的证书时，需要在浏览器中接受 Vite 开发服务器的证书警告，方法是运行 `npm run dev` 命令时在控制台中点击"Local"链接。

<a name="loading-your-scripts-and-styles"></a>
### 加载脚本和样式

配置 Vite 入口点后，只需在应用程序根模板 `<head>` 中添加的 `@vite()` Blade 指令中引用它们：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

如果通过 JavaScript 导入 CSS，只需包含 JavaScript 入口点：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    @vite('resources/js/app.js')
</head>
```

`@vite` 指令会自动检测 Vite 开发服务器并注入 Vite 客户端以启用热模块替换。在构建模式下，指令将加载已编译和版本化的资源，包括任何导入的 CSS。

如果需要，还可以在调用 `@vite` 指令时指定已编译资源的构建路径：

```blade
<!doctype html>
<head>
    {{-- 给定的构建路径相对于 public 路径。 --}}

    @vite('resources/js/app.js', 'vendor/courier/build')
</head>
```

<a name="running-vite"></a>
## 运行 Vite

有两种方式运行 Vite。可以通过 `dev` 命令运行开发服务器，这在本地开发时非常有用。开发服务器会自动检测文件更改并立即在所有打开的浏览器窗口中反映更改。

或者，运行 `build` 命令将版本化和打包应用程序的资源，并为部署到生产做好准备：

```shell
# 运行 Vite 开发服务器...
npm run dev

# 为生产构建和版本化资源...
npm run build
```

<a name="working-with-scripts"></a>
## 使用 JavaScript

<a name="aliases"></a>
### 别名

默认情况下，Laravel 插件提供了一个通用别名，帮助你快速入门并便捷地导入应用程序的资源：

```js
{
    '@' => '/resources/js'
}
```

可以通过在 `vite.config.js` 配置文件中添加自己的别名来覆盖 `'@'` 别名：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel(['resources/ts/app.tsx']),
    ],
    resolve: {
        alias: {
            '@': '/resources/ts',
        },
    },
});
```

<a name="vue"></a>
### Vue

如果你想使用 [Vue](https://vuejs.org/) 框架构建前端，还需要安装 `@vitejs/plugin-vue` 插件：

```sh
npm install --save-dev @vitejs/plugin-vue
```

然后可以在 `vite.config.js` 配置文件中包含该插件。在 Laravel 中使用 Vue 插件时，需要一些额外选项：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        laravel(['resources/js/app.js']),
        vue({
            template: {
                transformAssetUrls: {
                    // Vue 插件会重写单文件组件中引用的资源 URL，
                    // 使其指向 Laravel Web 服务器。将此设置为 `null`
                    // 允许 Laravel 插件改为将资源 URL 重写为指向
                    // Vite 服务器。
                    base: null,

                    // Vue 插件会解析绝对 URL 并将其视为磁盘上
                    // 文件的绝对路径。将此设置为 `false` 将保持
                    // 绝对 URL 不变，以便它们可以按预期引用
                    // public 目录中的资源。
                    includeAbsolute: false,
                },
            },
        }),
    ],
});
```

> **Note**  
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已包含正确的 Laravel、Vue 和 Vite 配置。查看 [Laravel Breeze](/docs/{{version}}/starter-kits#breeze-and-inertia) 以获取开始使用 Laravel、Vue 和 Vite 的最快方式。

<a name="react"></a>
### React

如果你想使用 [React](https://reactjs.org/) 框架构建前端，还需要安装 `@vitejs/plugin-react` 插件：

```sh
npm install --save-dev @vitejs/plugin-react
```

然后可以在 `vite.config.js` 配置文件中包含该插件：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel(['resources/js/app.jsx']),
        react(),
    ],
});
```

需要确保任何包含 JSX 的文件具有 `.jsx` 或 `.tsx` 扩展名，并根据需要更新入口点，如[上文所示](#configuring-vite)。

还需要在现有 `@vite` 指令旁包含额外的 `@viteReactRefresh` Blade 指令。

```blade
@viteReactRefresh
@vite('resources/js/app.jsx')
```

`@viteReactRefresh` 指令必须在 `@vite` 指令之前调用。

> **Note**  
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已包含正确的 Laravel、React 和 Vite 配置。查看 [Laravel Breeze](/docs/{{version}}/starter-kits#breeze-and-inertia) 以获取开始使用 Laravel、React 和 Vite 的最快方式。

<a name="inertia"></a>
### Inertia

Laravel Vite 插件提供了便捷的 `resolvePageComponent` 函数，帮助你解析 Inertia 页面组件。以下是在 Vue 3 中使用该辅助函数的示例；但是，你也可以在其他框架（如 React）中使用此函数：

```js
import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
  resolve: (name) => resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue')),
  setup({ el, App, props, plugin }) {
    return createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
});
```

> **Note**  
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已包含正确的 Laravel、Inertia 和 Vite 配置。查看 [Laravel Breeze](/docs/{{version}}/starter-kits#breeze-and-inertia) 以获取开始使用 Laravel、Inertia 和 Vite 的最快方式。

<a name="url-processing"></a>
### URL 处理

使用 Vite 并在应用程序的 HTML、CSS 或 JS 中引用资源时，有几点需要注意。首先，如果使用绝对路径引用资源，Vite 不会将资源包含在构建中；因此，应确保资源在 public 目录中可用。

引用相对资源路径时，请记住路径相对于引用它的文件。通过相对路径引用的任何资源将被 Vite 重写、版本化和打包。

考虑以下项目结构：

```nothing
public/
  taylor.png
resources/
  js/
    Pages/
      Welcome.vue
  images/
    abigail.png
```

以下示例演示了 Vite 如何处理相对和绝对 URL：

```html
<!-- 此资源不被 Vite 处理，不会包含在构建中 -->
<img src="/taylor.png">

<!-- 此资源将被 Vite 重写、版本化和打包 -->
<img src="../../images/abigail.png">
```

<a name="working-with-stylesheets"></a>
## 使用样式表

可以在 [Vite 文档](https://vitejs.dev/guide/features.html#css)中了解更多有关 Vite CSS 支持的信息。如果你使用 PostCSS 插件（如 [Tailwind](https://tailwindcss.com)），可以在项目根目录创建 `postcss.config.js` 文件，Vite 会自动应用它：

```js
module.exports = {
    plugins: {
        tailwindcss: {},
        autoprefixer: {},
    },
};
```

<a name="working-with-blade-and-routes"></a>
## 使用 Blade 和路由

<a name="blade-processing-static-assets"></a>
### 使用 Vite 处理静态资源

在 JavaScript 或 CSS 中引用资源时，Vite 会自动处理和版本化它们。此外，在构建基于 Blade 的应用程序时，Vite 还可以处理和版本化仅在 Blade 模板中引用的静态资源。

但是，要实现这一点，需要通过将静态资源导入应用程序入口点来让 Vite 感知你的资源。例如，如果要处理和版本化存储在 `resources/images` 中的所有图像和存储在 `resources/fonts` 中的所有字体，应在应用程序 `resources/js/app.js` 入口点中添加以下内容：

```js
import.meta.glob([
  '../images/**',
  '../fonts/**',
]);
```

现在，运行 `npm run build` 时这些资源将被 Vite 处理。然后可以在 Blade 模板中使用 `Vite::asset` 方法引用这些资源，该方法将返回给定资源的版本化 URL：

```blade
<img src="{{ Vite::asset('resources/images/logo.png') }}">
```

<a name="blade-refreshing-on-save"></a>
### 保存时刷新

当应用程序使用传统服务端渲染和 Blade 构建时，Vite 可以通过在更改应用程序视图文件时自动刷新浏览器来改善开发工作流。首先，只需将 `refresh` 选项指定为 `true`。

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            // ...
            refresh: true,
        }),
    ],
});
```

当 `refresh` 选项为 `true` 时，在运行 `npm run dev` 期间保存以下目录中的文件将触发浏览器执行完整页面刷新：

- `app/View/Components/**`
- `lang/**`
- `resources/lang/**`
- `resources/views/**`
- `routes/**`

如果你使用 [Ziggy](https://github.com/tighten/ziggy) 在应用程序前端生成路由链接，监视 `routes/**` 目录非常有用。

如果这些默认路径不适合你的需求，可以指定自己的监视路径列表：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            // ...
            refresh: ['resources/views/**'],
        }),
    ],
});
```

在底层，Laravel Vite 插件使用 [`vite-plugin-full-reload`](https://github.com/ElMassimo/vite-plugin-full-reload) 包，该包提供了一些高级配置选项来微调此功能的行为。如果需要这种级别的自定义，可以提供 `config` 定义：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            // ...
            refresh: [{
                paths: ['path/to/watch/**'],
                config: { delay: 300 }
            }],
        }),
    ],
});
```

<a name="blade-aliases"></a>
### 别名

在 JavaScript 应用程序中，[创建别名](#aliases)以引用常用目录很常见。但是，也可以通过在 `Illuminate\Support\Facades\Vite` 类上使用 `macro` 方法来创建在 Blade 中使用的别名。通常，"宏"应在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中定义：

    /**
     * 引导任何应用程序服务。
     *
     * @return void
     */
    public function boot()
    {
        Vite::macro('image', fn ($asset) => $this->asset("resources/images/{$asset}"));
    }

定义宏后，可以在模板中调用它。例如，我们可以使用上面定义的 `image` 宏来引用位于 `resources/images/logo.png` 的资源：

```blade
<img src="{{ Vite::image('logo.png') }}" alt="Laravel Logo">
```

<a name="custom-base-urls"></a>
## 自定义基础 URL

如果 Vite 编译的资源部署在与应用程序不同的域上（例如通过 CDN），必须在应用程序 `.env` 文件中指定 `ASSET_URL` 环境变量：

```env
ASSET_URL=https://cdn.example.com
```

配置资源 URL 后，所有重写的资源 URL 都将以配置值作为前缀：

```nothing
https://cdn.example.com/build/assets/app.9dce8d17.js
```

请记住，[绝对 URL 不会被 Vite 重写](#url-processing)，因此不会被添加前缀。

<a name="environment-variables"></a>
## 环境变量

可以通过在应用程序 `.env` 文件中使用 `VITE_` 前缀来将环境变量注入 JavaScript：

```env
VITE_SENTRY_DSN_PUBLIC=http://example.com
```

可以通过 `import.meta.env` 对象访问注入的环境变量：

```js
import.meta.env.VITE_SENTRY_DSN_PUBLIC
```

<a name="disabling-vite-in-tests"></a>
## 在测试中禁用 Vite

Laravel 的 Vite 集成会在运行测试时尝试解析资源，这要求你运行 Vite 开发服务器或构建资源。

如果你希望在测试期间模拟 Vite，可以调用 `withoutVite` 方法，该方法适用于任何扩展 Laravel `TestCase` 类的测试：

```php
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_without_vite_example()
    {
        $this->withoutVite();

        // ...
    }
}
```

如果想为所有测试禁用 Vite，可以从基础 `TestCase` 类的 `setUp` 方法调用 `withoutVite` 方法：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void// [tl! add:start]
    {
        parent::setUp();

        $this->withoutVite();
    }// [tl! add:end]
}
```

<a name="ssr"></a>
## 服务端渲染（SSR）

Laravel Vite 插件让设置 Vite 的服务端渲染变得轻松。首先，在 `resources/js/ssr.js` 创建 SSR 入口点，并通过向 Laravel 插件传递配置选项来指定入口点：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.js',
            ssr: 'resources/js/ssr.js',
        }),
    ],
});
```

为确保不会忘记重新构建 SSR 入口点，我们建议增强应用程序 `package.json` 中的"build"脚本以创建 SSR 构建：

```json
"scripts": {
     "dev": "vite",
     "build": "vite build" // [tl! remove]
     "build": "vite build && vite build --ssr" // [tl! add]
}
```

然后，要构建和启动 SSR 服务器，可以运行以下命令：

```sh
npm run build
node bootstrap/ssr/ssr.mjs
```

> **Note**  
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已包含正确的 Laravel、Inertia SSR 和 Vite 配置。查看 [Laravel Breeze](/docs/{{version}}/starter-kits#breeze-and-inertia) 以获取开始使用 Laravel、Inertia SSR 和 Vite 的最快方式。

<a name="script-and-style-attributes"></a>
## 脚本和样式标签属性

<a name="content-security-policy-csp-nonce"></a>
### 内容安全策略（CSP）Nonce

如果你希望作为[内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，在脚本和样式标签中包含 [`nonce` 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)，可以在自定义[中间件](/docs/{{version}}/middleware)中使用 `useCspNonce` 方法生成或指定 nonce：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Vite;

class AddContentSecurityPolicyHeaders
{
    /**
     * 处理传入请求。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        Vite::useCspNonce();

        return $next($request)->withHeaders([
            'Content-Security-Policy' => "script-src 'nonce-".Vite::cspNonce()."'",
        ]);
    }
}
```

调用 `useCspNonce` 方法后，Laravel 将自动在所有生成的脚本和样式标签上包含 `nonce` 属性。

如果需要在其他地方指定 nonce，包括 Laravel [入门套件](/docs/{{version}}/starter-kits)中包含的 [Ziggy `@route` 指令](https://github.com/tighten/ziggy#using-routes-with-a-content-security-policy)，可以使用 `cspNonce` 方法检索它：

```blade
@routes(nonce: Vite::cspNonce())
```

如果你已有希望指示 Laravel 使用的 nonce，可以将 nonce 传递给 `useCspNonce` 方法：

```php
Vite::useCspNonce($nonce);
```

<a name="subresource-integrity-sri"></a>
### 子资源完整性（SRI）

如果 Vite 清单包含资源的 `integrity` 哈希，Laravel 将自动在生成的任何脚本和样式标签上添加 `integrity` 属性，以强制执行[子资源完整性](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)。默认情况下，Vite 不会在其清单中包含 `integrity` 哈希，但可以通过安装 [`vite-plugin-manifest-sri`](https://www.npmjs.com/package/vite-plugin-manifest-sri) NPM 插件来启用：

```shell
npm install --save-dev vite-plugin-manifest-sri
```

然后可以在 `vite.config.js` 文件中启用此插件：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import manifestSRI from 'vite-plugin-manifest-sri';// [tl! add]

export default defineConfig({
    plugins: [
        laravel({
            // ...
        }),
        manifestSRI(),// [tl! add]
    ],
});
```

如果需要，还可以自定义可以找到完整性哈希的清单键：

```php
use Illuminate\Support\Facades\Vite;

Vite::useIntegrityKey('custom-integrity-key');
```

如果想完全禁用此自动检测，可以向 `useIntegrityKey` 方法传递 `false`：

```php
Vite::useIntegrityKey(false);
```

<a name="arbitrary-attributes"></a>
### 任意属性

如果需要在脚本和样式标签上包含额外属性，如 [`data-turbo-track`](https://turbo.hotwired.dev/handbook/drive#reloading-when-assets-change) 属性，可以通过 `useScriptTagAttributes` 和 `useStyleTagAttributes` 方法指定。通常，应从[服务提供者](/docs/{{version}}/providers)调用这些方法：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes([
    'data-turbo-track' => 'reload', // 为属性指定值...
    'async' => true, // 指定不带值的属性...
    'integrity' => false, // 排除原本会包含的属性...
]);

Vite::useStyleTagAttributes([
    'data-turbo-track' => 'reload',
]);
```

如果需要条件性地添加属性，可以传递一个回调，该回调将接收资源源路径、其 URL、其清单块和整个清单：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes(fn (string $src, string $url, array|null $chunk, array|null $manifest) => [
    'data-turbo-track' => $src === 'resources/js/app.js' ? 'reload' : false,
]);

Vite::useStyleTagAttributes(fn (string $src, string $url, array|null $chunk, array|null $manifest) => [
    'data-turbo-track' => $chunk && $chunk['isEntry'] ? 'reload' : false,
]);
```

> **Warning**  
> Vite 开发服务器运行期间，`$chunk` 和 `$manifest` 参数将为 `null`。

<a name="advanced-customization"></a>
## 高级自定义

开箱即用，Laravel 的 Vite 插件使用合理的约定，应该适用于大多数应用程序；但是，有时你可能需要自定义 Vite 的行为。要启用额外的自定义选项，我们提供以下方法和选项，可用于代替 `@vite` Blade 指令：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    {{
        Vite::useHotFile(storage_path('vite.hot')) // 自定义"hot"文件...
            ->useBuildDirectory('bundle') // 自定义构建目录...
            ->useManifestFilename('assets.json') // 自定义清单文件名...
            ->withEntryPoints(['resources/js/app.js']) // 指定入口点...
    }}
</head>
```

然后在 `vite.config.js` 文件中指定相同的配置：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            hotFile: 'storage/vite.hot', // 自定义"hot"文件...
            buildDirectory: 'bundle', // 自定义构建目录...
            input: ['resources/js/app.js'], // 指定入口点...
        }),
    ],
    build: {
      manifest: 'assets.json', // 自定义清单文件名...
    },
});
```

<a name="correcting-dev-server-urls"></a>
### 修正开发服务器 URL

Vite 生态系统中的一些插件假设以正斜杠开头的 URL 将始终指向 Vite 开发服务器。但是，由于 Laravel 集成的特性，情况并非如此。

例如，`vite-imagetools` 插件在 Vite 服务资源时输出如下 URL：

```html
<img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520">
```

`vite-imagetools` 插件期望输出 URL 被 Vite 拦截，然后插件可以处理所有以 `/@imagetools` 开头的 URL。如果使用期望此行为的插件，需要手动修正 URL。可以在 `vite.config.js` 文件中使用 `transformOnServe` 选项完成此操作。

在此特定示例中，我们将开发服务器 URL 追加到生成代码中所有 `/@imagetools` 的出现处：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { imagetools } from 'vite-imagetools';

export default defineConfig({
    plugins: [
        laravel({
            // ...
            transformOnServe: (code, devServerUrl) => code.replaceAll('/@imagetools', devServerUrl+'/@imagetools'),
        }),
        imagetools(),
    ],
});
```

现在，Vite 服务资源时，将输出指向 Vite 开发服务器的 URL：

```html
- <img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520"><!-- [tl! remove] -->
+ <img src="http://[::1]:5173/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520"><!-- [tl! add] -->
```
