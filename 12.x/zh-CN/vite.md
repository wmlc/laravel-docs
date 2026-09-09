# 资源打包（Vite）

- [简介](#introduction)
- [安装与设置](#installation)
  - [安装 Node](#installing-node)
  - [安装 Vite 和 Laravel 插件](#installing-vite-and-laravel-plugin)
  - [配置 Vite](#configuring-vite)
  - [加载你的脚本和样式](#loading-your-scripts-and-styles)
- [运行 Vite](#running-vite)
- [使用 JavaScript](#working-with-scripts)
  - [别名](#aliases)
  - [Vue](#vue)
  - [React](#react)
  - [Svelte](#svelte)
  - [Inertia](#inertia)
  - [URL 处理](#url-processing)
- [使用样式表](#working-with-stylesheets)
- [配合 Blade 和路由使用](#working-with-blade-and-routes)
  - [使用 Vite 处理静态资源](#blade-processing-static-assets)
  - [保存时刷新](#blade-refreshing-on-save)
  - [别名](#blade-aliases)
- [资源预加载](#asset-prefetching)
- [自定义基础 URL](#custom-base-urls)
- [环境变量](#environment-variables)
- [在测试中禁用 Vite](#disabling-vite-in-tests)
- [服务端渲染（SSR）](#ssr)
- [script 和 style 标签属性](#script-and-style-attributes)
  - [内容安全策略（CSP）Nonce](#content-security-policy-csp-nonce)
  - [子资源完整性（SRI）](#subresource-integrity-sri)
  - [任意属性](#arbitrary-attributes)
- [高级自定义](#advanced-customization)
  - [开发服务器跨源资源共享（CORS）](#cors)
  - [修正开发服务器 URL](#correcting-dev-server-urls)

<a name="introduction"></a>
## 简介

[Vite](https://vitejs.dev) 是一款现代前端构建工具，它提供了极快的开发环境，并为你的代码打包生产版本。使用 Laravel 构建应用时，你通常会使用 Vite 将应用的 CSS 和 JavaScript 文件打包为可用于生产环境的资源。

Laravel 通过提供官方插件和 Blade 指令，与 Vite 无缝集成，为开发和生产环境加载你的资源。

<a name="installation"></a>
## 安装与设置

> [!NOTE]
> 以下文档讨论的是如何手动安装和配置 Laravel Vite 插件。不过，Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含所有这些脚手架，是开始使用 Laravel 和 Vite 的最快方式。

<a name="installing-node"></a>
### 安装 Node

在运行 Vite 和 Laravel 插件之前，你必须确保已安装 Node.js（16+）和 NPM：

```shell
node -v
npm -v
```

你可以使用 [Node 官网](https://nodejs.org/en/download/)提供的简单图形化安装程序，轻松安装最新版本的 Node 和 NPM。或者，如果你使用的是 [Laravel Sail](https://laravel.com/docs/{{version}}/sail)，则可以通过 Sail 调用 Node 和 NPM：

```shell
./vendor/bin/sail node -v
./vendor/bin/sail npm -v
```

<a name="installing-vite-and-laravel-plugin"></a>
### 安装 Vite 和 Laravel 插件

在全新安装的 Laravel 中，你会在应用目录结构的根目录下找到一个 `package.json` 文件。默认的 `package.json` 文件已经包含了开始使用 Vite 和 Laravel 插件所需的一切。你可以通过 NPM 安装应用的前端依赖：

```shell
npm install
```

<a name="configuring-vite"></a>
### 配置 Vite

Vite 通过项目根目录下的 `vite.config.js` 文件进行配置。你可以根据需要自由定制该文件，也可以安装应用所需的任何其他插件，例如 `@vitejs/plugin-react`、`@sveltejs/vite-plugin-svelte` 或 `@vitejs/plugin-vue`。

Laravel Vite 插件要求你指定应用的入口点。入口点可以是 JavaScript 或 CSS 文件，也可以是 TypeScript、JSX、TSX 和 Sass 等预处理语言：

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

如果你正在构建单页应用（SPA），包括使用 Inertia 构建的应用，Vite 在不配置 CSS 入口点时工作效果最佳：

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

相反，你应当通过 JavaScript 导入 CSS。通常，这会在应用的 `resources/js/app.js` 文件中完成：

```js
import './bootstrap';
import '../css/app.css'; // [tl! add]
```

Laravel 插件还支持多个入口点以及高级配置选项，例如 [SSR 入口点](#ssr)。

<a name="working-with-a-secure-development-server"></a>
#### 使用安全的开发服务器

如果本地开发 Web 服务器通过 HTTPS 为你的应用提供服务，连接 Vite 开发服务器时可能会遇到问题。

如果你使用的是 [Laravel Herd](https://herd.laravel.com) 并已对站点启用安全连接，或者你使用的是 [Laravel Valet](/docs/{{version}}/valet) 并已对应用运行了 [secure 命令](/docs/{{version}}/valet#securing-sites)，Laravel Vite 插件会自动检测并使用生成的 TLS 证书。

如果你在启用站点安全连接时使用的主机名与应用的目录名不一致，可以在应用的 `vite.config.js` 文件中手动指定主机：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            // ...
            detectTls: 'my-app.test', // [tl! add]
        }),
    ],
});
```

使用其他 Web 服务器时，你应当生成一个受信任的证书，并手动配置 Vite 使用生成的证书：

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

如果你无法为系统生成受信任的证书，可以安装并配置 [@vitejs/plugin-basic-ssl 插件](https://github.com/vitejs/vite-plugin-basic-ssl)。使用不受信任的证书时，你需要在运行 `npm run dev` 命令后，按照控制台中显示的「Local」链接，在浏览器中接受 Vite 开发服务器的证书警告。

<a name="configuring-hmr-in-sail-on-wsl2"></a>
#### 在 WSL2 上的 Sail 中运行开发服务器

在 Windows Subsystem for Linux 2 (WSL2) 上的 [Laravel Sail](/docs/{{version}}/sail) 中运行 Vite 开发服务器时，你应当将以下配置添加到 `vite.config.js` 文件中，以确保浏览器能够与开发服务器通信：

```js
// ...

export default defineConfig({
    // ...
    server: { // [tl! add:start]
        hmr: {
            host: 'localhost',
        },
    }, // [tl! add:end]
});
```

如果开发服务器运行期间你的文件更改没有反映到浏览器中，你可能还需要配置 Vite 的 [server.watch.usePolling 选项](https://vitejs.dev/config/server-options.html#server-watch)。

<a name="loading-your-scripts-and-styles"></a>
### 加载你的脚本和样式

配置好 Vite 入口点之后，你就可以在应用根模板 `<head>` 中添加的 `@vite()` Blade 指令里引用它们：

```blade
<!DOCTYPE html>
<head>
    {{-- ... --}}

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

如果你是通过 JavaScript 导入 CSS 的，则只需包含 JavaScript 入口点：

```blade
<!DOCTYPE html>
<head>
    {{-- ... --}}

    @vite('resources/js/app.js')
</head>
```

`@vite` 指令会自动检测 Vite 开发服务器，并注入 Vite 客户端以启用热模块替换（Hot Module Replacement）。在构建模式下，该指令会加载你编译并添加版本号的资源，包括所有导入的 CSS。

如有需要，你还可以在调用 `@vite` 指令时指定编译资源的构建路径：

```blade
<!doctype html>
<head>
    {{-- 给定的构建路径相对于 public 路径。 --}}

    @vite('resources/js/app.js', 'vendor/courier/build')
</head>
```

<a name="inline-assets"></a>
#### 内联资源

有时可能需要直接包含资源的原始内容，而不是链接到资源的带版本号 URL。例如，在将 HTML 内容传递给 PDF 生成器时，你可能需要将资源内容直接嵌入页面。你可以使用 `Vite` facade 提供的 `content` 方法输出 Vite 资源的内容：

```blade
@use('Illuminate\Support\Facades\Vite')

<!doctype html>
<head>
    {{-- ... --}}

    <style>
        {!! Vite::content('resources/css/app.css') !!}
    </style>
    <script>
        {!! Vite::content('resources/js/app.js') !!}
    </script>
</head>
```

<a name="running-vite"></a>
## 运行 Vite

运行 Vite 有两种方式。你可以通过 `dev` 命令运行开发服务器，这在本地开发时非常有用。开发服务器会自动检测文件的更改，并立即将其反映到任何打开的浏览器窗口中。

或者，运行 `build` 命令会对应用的资源进行版本化和打包，使其可以部署到生产环境：

```shell
# 运行 Vite 开发服务器...
npm run dev

# 为生产环境构建并版本化资源...
npm run build
```

如果你在 WSL2 上的 [Sail](/docs/{{version}}/sail) 中运行开发服务器，可能需要一些[额外的配置](#configuring-hmr-in-sail-on-wsl2)选项。

<a name="working-with-scripts"></a>
## 使用 JavaScript

<a name="aliases"></a>
### 别名

默认情况下，Laravel 插件提供了一个常用的别名，帮助你快速上手，并方便地导入应用的资源：

```js
{
    '@' => '/resources/js'
}
```

你可以向 `vite.config.js` 配置文件添加自己的别名，来覆盖 `'@'` 别名：

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

```shell
npm install --save-dev @vitejs/plugin-vue
```

然后，你可以将插件引入 `vite.config.js` 配置文件中。在 Laravel 中使用 Vue 插件时，有几个额外的选项需要配置：

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
                    // 当在单文件组件中引用资源时，Vue 插件会重写
                    // 资源 URL，使其指向 Laravel Web 服务器。将此项
                    // 设置为 `null` 可以让 Laravel 插件改为重写
                    // 资源 URL，使其指向 Vite 服务器。
                    base: null,

                    // Vue 插件会解析绝对 URL，并将其视为磁盘上
                    // 文件的绝对路径。将此项设置为 `false` 可以
                    // 保持绝对 URL 不变，使其能够按预期引用
                    // public 目录中的资源。
                    includeAbsolute: false,
                },
            },
        }),
    ],
});
```

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Vue 和 Vite 配置。这些入门套件是开始使用 Laravel、Vue 和 Vite 的最快方式。

<a name="react"></a>
### React

如果你想使用 [React](https://reactjs.org/) 框架构建前端，还需要安装 `@vitejs/plugin-react` 插件：

```shell
npm install --save-dev @vitejs/plugin-react
```

然后，你可以将插件引入 `vite.config.js` 配置文件中：

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

你需要确保任何包含 JSX 的文件都具有 `.jsx` 或 `.tsx` 扩展名，如有必要，请记得按照[上文所示](#configuring-vite)更新入口点。

你还需要在现有的 `@vite` 指令旁边，额外包含 `@viteReactRefresh` Blade 指令：

```blade
@viteReactRefresh
@vite('resources/js/app.jsx')
```

`@viteReactRefresh` 指令必须在 `@vite` 指令之前调用。

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、React 和 Vite 配置。这些入门套件是开始使用 Laravel、React 和 Vite 的最快方式。

<a name="svelte"></a>
### Svelte

如果你想使用 [Svelte](https://svelte.dev/) 框架构建前端，还需要安装 `@sveltejs/vite-plugin-svelte` 插件：

```shell
npm install --save-dev @sveltejs/vite-plugin-svelte
```

然后，你可以将插件引入 `vite.config.js` 配置文件中：

```js
import { svelte } from '@sveltejs/vite-plugin-svelte';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    laravel({
      input: ['resources/js/app.ts'],
      ssr: 'resources/js/ssr.ts',
      refresh: true,
    }),
    svelte(),
  ],
});
```

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Svelte 和 Vite 配置。这些入门套件是开始使用 Laravel、Svelte 和 Vite 的最快方式。

<a name="inertia"></a>
### Inertia

Laravel Vite 插件提供了一个方便的 `resolvePageComponent` 函数，帮助你解析 Inertia 页面组件。下面是一个在 Vue 3 中使用该辅助函数的示例；不过，你也可以在 React 或 Svelte 等其他框架中使用该函数：

```js
import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

createInertiaApp({
  resolve: (name) => resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob('./Pages/**/*.vue')),
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el)
  },
});
```

如果你在 Inertia 中使用 Vite 的代码分割功能，我们建议配置[资源预加载](#asset-prefetching)。

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Inertia 和 Vite 配置。这些入门套件是开始使用 Laravel、Inertia 和 Vite 的最快方式。

<a name="url-processing"></a>
### URL 处理

在使用 Vite 并在应用的 HTML、CSS 或 JS 中引用资源时，有几个注意事项需要考虑。首先，如果你使用绝对路径引用资源，Vite 不会将该资源包含在构建中；因此，你应当确保该资源存在于 public 目录中。使用[专用 CSS 入口点](#configuring-vite)时，你应当避免使用绝对路径，因为在开发过程中，浏览器会尝试从托管 CSS 的 Vite 开发服务器加载这些路径，而不是从你的 public 目录加载。

引用相对资源路径时，请记住这些路径是相对于引用它们的文件而言的。任何通过相对路径引用的资源都会被 Vite 重写、版本化并打包。

考虑以下项目结构：

```text
public/
  taylor.png
resources/
  js/
    Pages/
      Welcome.vue
  images/
    abigail.png
```

下面的示例展示了 Vite 如何处理相对 URL 和绝对 URL：

```html
<!-- 此资源不由 Vite 处理，不会包含在构建中 -->
<img src="/taylor.png">

<!-- 此资源会被 Vite 重写、版本化并打包 -->
<img src="../../images/abigail.png">
```

<a name="working-with-stylesheets"></a>
## 使用样式表

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Tailwind 和 Vite 配置。或者，如果你想在不使用入门套件的情况下同时使用 Tailwind 和 Laravel，请查阅 [Tailwind 的 Laravel 安装指南](https://tailwindcss.com/docs/guides/laravel)。

所有 Laravel 应用都已经包含 Tailwind 和配置正确的 `vite.config.js` 文件。因此，你只需启动 Vite 开发服务器，或运行 `dev` Composer 命令，该命令会同时启动 Laravel 和 Vite 开发服务器：

```shell
composer run dev
```

应用的 CSS 可以放在 `resources/css/app.css` 文件中。

<a name="working-with-blade-and-routes"></a>
## 配合 Blade 和路由使用

<a name="blade-processing-static-assets"></a>
### 使用 Vite 处理静态资源

在 JavaScript 或 CSS 中引用资源时，Vite 会自动处理并版本化它们。此外，在构建基于 Blade 的应用时，Vite 还可以处理并版本化你仅在 Blade 模板中引用的静态资源。

不过，要实现这一点，你需要将静态资源导入到应用的入口点，让 Vite 感知到这些资源。例如，如果你想处理并版本化存储在 `resources/images` 中的所有图片和存储在 `resources/fonts` 中的所有字体，你应当在应用的 `resources/js/app.js` 入口点中添加以下内容：

```js
import.meta.glob([
  '../images/**',
  '../fonts/**',
]);
```

现在，运行 `npm run build` 时，这些资源就会被 Vite 处理。然后，你就可以在 Blade 模板中使用 `Vite::asset` 方法引用这些资源，该方法会返回指定资源的带版本号 URL：

```blade
<img src="{{ Vite::asset('resources/images/logo.png') }}">
```

<a name="blade-refreshing-on-save"></a>
### 保存时刷新

当应用使用传统的 Blade 服务端渲染构建时，Vite 可以在你修改应用的视图文件时自动刷新浏览器，从而改善你的开发工作流。首先，你只需将 `refresh` 选项指定为 `true`。

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

当 `refresh` 选项为 `true` 时，在运行 `npm run dev` 期间，保存以下目录中的文件会触发浏览器执行整页刷新：

- `app/Livewire/**`
- `app/View/Components/**`
- `lang/**`
- `resources/lang/**`
- `resources/views/**`
- `routes/**`

如果你使用 [Ziggy](https://github.com/tighten/ziggy) 在应用前端生成路由链接，监视 `routes/**` 目录会非常有用。

如果这些默认路径不符合你的需求，你可以指定自己的要监视的路径列表：

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

Laravel Vite 插件底层使用了 [vite-plugin-full-reload](https://github.com/ElMassimo/vite-plugin-full-reload) 扩展包，它提供了一些高级配置选项来微调此功能的行为。如果你需要这种级别的自定义，可以提供一个 `config` 定义：

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

在 JavaScript 应用中，为经常引用的目录[创建别名](#aliases)是很常见的做法。不过，你也可以使用 `Illuminate\Support\Facades\Vite` 类上的 `macro` 方法，创建可在 Blade 中使用的别名。通常，「宏（macro）」应当在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中定义：

```php
/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Vite::macro('image', fn (string $asset) => $this->asset("resources/images/{$asset}"));
}
```

宏定义好之后，就可以在模板中调用了。例如，我们可以使用上面定义的 `image` 宏来引用位于 `resources/images/logo.png` 的资源：

```blade
<img src="{{ Vite::image('logo.png') }}" alt="Laravel Logo">
```

<a name="asset-prefetching"></a>
## 资源预加载

使用 Vite 的代码分割功能构建 SPA 时，所需的资源会在每次页面导航时才被获取。这种行为可能导致 UI 渲染延迟。如果这对你选择的前端框架构成了问题，Laravel 提供了在初始页面加载时急切预加载（prefetch）应用 JavaScript 和 CSS 资源的能力。

你可以通过在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用 `Vite::prefetch` 方法，来指示 Laravel 急切预加载资源：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * 注册任何应用服务。
     */
    public function register(): void
    {
        // ...
    }

    /**
     * 引导任何应用服务。
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
```

在上面的示例中，资源会在每次页面加载时以最多 `3` 个并发下载的方式进行预加载。你可以根据应用的需要修改并发数，或者在应用需要一次性下载所有资源时不指定并发限制：

```php
/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Vite::prefetch();
}
```

默认情况下，预加载会在[页面 *load* 事件](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event)触发时开始。如果你想自定义预加载开始的时间，可以指定一个 Vite 将监听的事件：

```php
/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Vite::prefetch(event: 'vite:prefetch');
}
```

有了上面的代码，当你在 `window` 对象上手动派发 `vite:prefetch` 事件时，预加载就会开始。例如，你可以让预加载在页面加载三秒后开始：

```html
<script>
    addEventListener('load', () => setTimeout(() => {
        dispatchEvent(new Event('vite:prefetch'))
    }, 3000))
</script>
```

<a name="custom-base-urls"></a>
## 自定义基础 URL

如果 Vite 编译的资源被部署到与应用不同的域，例如通过 CDN 部署，你必须在应用的 `.env` 文件中指定 `ASSET_URL` 环境变量：

```env
ASSET_URL=https://cdn.example.com
```

配置好资源 URL 后，所有重写后的资源 URL 都会以配置的值为前缀：

```text
https://cdn.example.com/build/assets/app.9dce8d17.js
```

请记住，[绝对 URL 不会被 Vite 重写](#url-processing)，因此它们不会被添加前缀。

<a name="environment-variables"></a>
## 环境变量

你可以在应用的 `.env` 文件中，通过为环境变量添加 `VITE_` 前缀，将其注入到 JavaScript 中：

```env
VITE_SENTRY_DSN_PUBLIC=http://example.com
```

你可以通过 `import.meta.env` 对象访问注入的环境变量：

```js
import.meta.env.VITE_SENTRY_DSN_PUBLIC
```

<a name="disabling-vite-in-tests"></a>
## 在测试中禁用 Vite

Laravel 的 Vite 集成会在运行测试时尝试解析你的资源，这就要求你要么运行 Vite 开发服务器，要么先构建资源。

如果你更希望在测试期间模拟 Vite，可以调用 `withoutVite` 方法。所有继承 Laravel `TestCase` 类的测试都可以使用该方法：

```php tab=Pest
test('without vite example', function () {
    $this->withoutVite();

    // ...
});
```

```php tab=PHPUnit
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_without_vite_example(): void
    {
        $this->withoutVite();

        // ...
    }
}
```

如果你想为所有测试禁用 Vite，可以在基础 `TestCase` 类的 `setUp` 方法中调用 `withoutVite` 方法：

```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void// [tl! add:start]
    {
        parent::setUp();

        $this->withoutVite();
    }// [tl! add:end]
}
```

<a name="ssr"></a>
## 服务端渲染（SSR）

Laravel Vite 插件让使用 Vite 搭建服务端渲染变得轻而易举。首先，在 `resources/js/ssr.js` 创建一个 SSR 入口点，并通过向 Laravel 插件传递配置选项来指定该入口点：

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

为了确保你不会忘记重新构建 SSR 入口点，我们建议扩充应用 `package.json` 中的「build」脚本，以创建 SSR 构建：

```json
"scripts": {
     "dev": "vite",
     "build": "vite build" // [tl! remove]
     "build": "vite build && vite build --ssr" // [tl! add]
}
```

然后，要构建并启动 SSR 服务器，你可以运行以下命令：

```shell
npm run build
node bootstrap/ssr/ssr.js
```

如果你使用的是 [Inertia 的 SSR](https://inertiajs.com/server-side-rendering)，则可以改用 `inertia:start-ssr` Artisan 命令来启动 SSR 服务器：

```shell
php artisan inertia:start-ssr
```

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Inertia SSR 和 Vite 配置。这些入门套件是开始使用 Laravel、Inertia SSR 和 Vite 的最快方式。

<a name="script-and-style-attributes"></a>
## script 和 style 标签属性

<a name="content-security-policy-csp-nonce"></a>
### 内容安全策略（CSP）Nonce

如果你希望作为[内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，在 script 和 style 标签上包含 [nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)，可以在自定义[中间件](/docs/{{version}}/middleware)中使用 `useCspNonce` 方法生成或指定一个 nonce：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class AddContentSecurityPolicyHeaders
{
    /**
     * 处理传入请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Vite::useCspNonce();

        return $next($request)->withHeaders([
            'Content-Security-Policy' => "script-src 'nonce-".Vite::cspNonce()."'",
        ]);
    }
}
```

调用 `useCspNonce` 方法后，Laravel 会自动在生成的所有 script 和 style 标签上包含 `nonce` 属性。

如果你需要在其他地方指定 nonce，包括 Laravel [入门套件](/docs/{{version}}/starter-kits)自带的 [Ziggy `@route` 指令](https://github.com/tighten/ziggy#using-routes-with-a-content-security-policy)，可以使用 `cspNonce` 方法获取它：

```blade
@routes(nonce: Vite::cspNonce())
```

如果你已经有一个希望指示 Laravel 使用的 nonce，可以将该 nonce 传递给 `useCspNonce` 方法：

```php
Vite::useCspNonce($nonce);
```

<a name="subresource-integrity-sri"></a>
### 子资源完整性（SRI）

如果你的 Vite 清单（manifest）包含资源的 `integrity` 哈希值，Laravel 会自动在其生成的所有 script 和 style 标签上添加 `integrity` 属性，以强制执行[子资源完整性](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)。默认情况下，Vite 不会在其清单中包含 `integrity` 哈希值，但你可以通过安装 [vite-plugin-manifest-sri](https://www.npmjs.com/package/vite-plugin-manifest-sri) NPM 插件来启用它：

```shell
npm install --save-dev vite-plugin-manifest-sri
```

然后，你可以在 `vite.config.js` 文件中启用该插件：

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

如有需要，你还可以自定义用于查找完整性哈希值的清单键：

```php
use Illuminate\Support\Facades\Vite;

Vite::useIntegrityKey('custom-integrity-key');
```

如果你想完全禁用这种自动检测，可以向 `useIntegrityKey` 方法传递 `false`：

```php
Vite::useIntegrityKey(false);
```

<a name="arbitrary-attributes"></a>
### 任意属性

如果你需要在 script 和 style 标签上包含额外的属性，例如 [data-turbo-track](https://turbo.hotwired.dev/handbook/drive#reloading-when-assets-change) 属性，可以通过 `useScriptTagAttributes` 和 `useStyleTagAttributes` 方法来指定。通常，这些方法应当在[服务提供者](/docs/{{version}}/providers)中调用：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes([
    'data-turbo-track' => 'reload', // 为属性指定一个值...
    'async' => true, // 指定一个没有值的属性...
    'integrity' => false, // 排除一个本应被包含的属性...
]);

Vite::useStyleTagAttributes([
    'data-turbo-track' => 'reload',
]);
```

如果你需要有条件地添加属性，可以传递一个回调，该回调接收资源源路径、其 URL、其清单数据块以及整个清单：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes(fn (string $src, string $url, array|null $chunk, array|null $manifest) => [
    'data-turbo-track' => $src === 'resources/js/app.js' ? 'reload' : false,
]);

Vite::useStyleTagAttributes(fn (string $src, string $url, array|null $chunk, array|null $manifest) => [
    'data-turbo-track' => $chunk && $chunk['isEntry'] ? 'reload' : false,
]);
```

> [!WARNING]
> Vite 开发服务器运行期间，`$chunk` 和 `$manifest` 参数将为 `null`。

<a name="advanced-customization"></a>
## 高级自定义

Laravel 的 Vite 插件开箱即用，采用了适合大多数应用的合理约定；不过，有时你可能需要自定义 Vite 的行为。为了提供额外的自定义选项，我们提供了以下方法和选项，可以用来替代 `@vite` Blade 指令：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    {{
        Vite::useHotFile(storage_path('vite.hot')) // 自定义 "hot" 文件...
            ->useBuildDirectory('bundle') // 自定义构建目录...
            ->useManifestFilename('assets.json') // 自定义清单文件名...
            ->withEntryPoints(['resources/js/app.js']) // 指定入口点...
            ->createAssetPathsUsing(function (string $path, ?bool $secure) { // 为构建后的资源自定义后端路径生成...
                return "https://cdn.example.com/{$path}";
            })
    }}
</head>
```

然后，在 `vite.config.js` 文件中，你应当指定相同的配置：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            hotFile: 'storage/vite.hot', // 自定义 "hot" 文件...
            buildDirectory: 'bundle', // 自定义构建目录...
            input: ['resources/js/app.js'], // 指定入口点...
        }),
    ],
    build: {
      manifest: 'assets.json', // 自定义清单文件名...
    },
});
```

<a name="cors"></a>
### 开发服务器跨源资源共享（CORS）

如果你在从 Vite 开发服务器获取资源时，在浏览器中遇到跨源资源共享（CORS）问题，可能需要向你自定义的源授予开发服务器的访问权限。Vite 与 Laravel 插件结合后，无需任何额外配置即可允许以下源：

- `::1`
- `127.0.0.1`
- `localhost`
- `*.test`
- `*.localhost`
- 项目 `.env` 中的 `APP_URL`

为项目允许自定义源的最简单方式，是确保应用的 `APP_URL` 环境变量与你在浏览器中访问的源一致。例如，如果你访问的是 `https://my-app.laravel`，应当更新 `.env` 使其匹配：

```env
APP_URL=https://my-app.laravel
```

如果你需要对源进行更细粒度的控制，例如支持多个源，你应当使用 [Vite 全面的内置 CORS 服务器配置](https://vite.dev/config/server-options.html#server-cors)。例如，你可以在项目的 `vite.config.js` 文件中的 `server.cors.origin` 配置项中指定多个源：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.js',
            refresh: true,
        }),
    ],
    server: {  // [tl! add]
        cors: {  // [tl! add]
            origin: [  // [tl! add]
                'https://backend.laravel',  // [tl! add]
                'http://admin.laravel:8566',  // [tl! add]
            ],  // [tl! add]
        },  // [tl! add]
    },  // [tl! add]
});
```

你还可以包含正则表达式模式。如果你想允许某个顶级域（例如 `*.laravel`）下的所有源，这会很有帮助：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.js',
            refresh: true,
        }),
    ],
    server: {  // [tl! add]
        cors: {  // [tl! add]
            origin: [ // [tl! add]
                // 支持：SCHEME://DOMAIN.laravel[:PORT] [tl! add]
                /^https?:\/\/.*\.laravel(:\d+)?$/, //[tl! add]
            ], // [tl! add]
        }, // [tl! add]
    }, // [tl! add]
});
```

<a name="correcting-dev-server-urls"></a>
### 修正开发服务器 URL

Vite 生态中的一些插件假设以正斜杠开头的 URL 始终指向 Vite 开发服务器。然而，由于 Laravel 集成的特性，情况并非如此。

例如，当 Vite 为你的资源提供服务时，`vite-imagetools` 插件会输出如下 URL：

```html
<img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520">
```

`vite-imagetools` 插件期望输出的 URL 会被 Vite 拦截，然后由该插件处理所有以 `/@imagetools` 开头的 URL。如果你使用的插件期望这种行为，就需要手动修正这些 URL。你可以在 `vite.config.js` 文件中使用 `transformOnServe` 选项来实现。

在这个特定的示例中，我们会将生成的代码中所有出现的 `/@imagetools` 前面加上开发服务器的 URL：

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

现在，当 Vite 为资源提供服务时，它会输出指向 Vite 开发服务器的 URL：

```html
- <img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520"><!-- [tl! remove] -->
+ <img src="http://[::1]:5173/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520"><!-- [tl! add] -->
```
