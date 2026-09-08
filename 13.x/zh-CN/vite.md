# 资源打包（Vite）

- [简介](#introduction)
- [安装与设置](#installation)
  - [安装 Node](#installing-node)
  - [安装 Vite 与 Laravel 插件](#installing-vite-and-laravel-plugin)
  - [配置 Vite](#configuring-vite)
  - [加载你的脚本与样式](#loading-your-scripts-and-styles)
- [运行 Vite](#running-vite)
- [使用 JavaScript](#working-with-scripts)
  - [别名](#aliases)
  - [Vue](#vue)
  - [React](#react)
  - [Svelte](#svelte)
  - [Inertia](#inertia)
  - [URL 处理](#url-processing)
- [使用样式表](#working-with-stylesheets)
- [使用字体](#working-with-fonts)
  - [字体提供方](#font-providers)
  - [本地字体](#local-fonts)
  - [字体选项](#font-options)
- [使用 Blade 与路由](#working-with-blade-and-routes)
  - [使用 Vite 处理静态资源](#blade-processing-static-assets)
  - [保存时刷新](#blade-refreshing-on-save)
  - [别名](#blade-aliases)
- [资源预取](#asset-prefetching)
- [自定义基础 URL](#custom-base-urls)
- [环境变量](#environment-variables)
- [在测试中禁用 Vite](#disabling-vite-in-tests)
- [服务器端渲染（SSR）](#ssr)
- [Script 与 Style 标签属性](#script-and-style-attributes)
  - [内容安全策略（CSP）Nonce](#content-security-policy-csp-nonce)
  - [子资源完整性（SRI）](#subresource-integrity-sri)
  - [任意属性](#arbitrary-attributes)
- [高级自定义](#advanced-customization)
  - [开发服务器跨源资源共享（CORS）](#cors)
  - [纠正开发服务器 URL](#correcting-dev-server-urls)

<a name="introduction"></a>
## 简介

[Vite](https://vitejs.dev) 是一个现代前端构建工具，提供了极快的开发环境，并为生产环境打包你的代码。使用 Laravel 构建应用时，你通常会使用 Vite 将应用的 CSS 和 JavaScript 文件打包成可用于生产的资源。

Laravel 通过提供官方插件和 Blade 指令与 Vite 无缝集成，以便在开发和生产环境中加载你的资源。

<a name="installation"></a>
## 安装与设置

> [!NOTE]
> 以下文档讨论如何手动安装和配置 Laravel Vite 插件。不过，Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了所有这些脚手架，是使用 Laravel 和 Vite 上手的最快方式。

<a name="installing-node"></a>
### 安装 Node

在运行 Vite 和 Laravel 插件之前，你必须确保已安装 Node.js（16+）和 NPM：

```shell
node -v
npm -v
```

你可以使用[官方 Node 网站](https://nodejs.org/en/download/)上的简单图形安装程序轻松安装最新版本的 Node 和 NPM。或者，如果你使用 [Laravel Sail](https://laravel.com/docs/{{version}}/sail)，可以通过 Sail 调用 Node 和 NPM：

```shell
./vendor/bin/sail node -v
./vendor/bin/sail npm -v
```

<a name="installing-vite-and-laravel-plugin"></a>
### 安装 Vite 与 Laravel 插件

在全新安装的 Laravel 中，你会在应用目录结构的根目录找到一个 `package.json` 文件。默认的 `package.json` 文件已经包含了开始使用 Vite 和 Laravel 插件所需的一切。你可以通过 NPM 安装应用的前端依赖：

```shell
npm install
```

<a name="configuring-vite"></a>
### 配置 Vite

Vite 通过项目根目录的 `vite.config.js` 文件进行配置。你可以根据需求自由自定义此文件，也可以安装应用所需的任何其他插件，例如 `@vitejs/plugin-react`、`@sveltejs/vite-plugin-svelte` 或 `@vitejs/plugin-vue`。

Laravel Vite 插件要求你指定应用的入口点。这些可以是 JavaScript 或 CSS 文件，并包含 TypeScript、JSX、TSX 和 Sass 等预处理语言。

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

如果你正在构建 SPA（包括使用 Inertia 构建的应用），Vite 在没有 CSS 入口点的情况下效果最佳：

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

相反，你应该通过 JavaScript 导入 CSS。通常，这会在应用的 `resources/js/app.js` 文件中完成：

```js
import './bootstrap';
import '../css/app.css'; // [tl! add]
```

Laravel 插件还支持多个入口点以及 [SSR 入口点](#ssr)等高级配置选项。

<a name="working-with-a-secure-development-server"></a>
#### 使用安全的开发服务器

如果你的本地开发 Web 服务器通过 HTTPS 为应用提供服务，你可能会遇到连接 Vite 开发服务器的问题。

如果你使用 [Laravel Herd](https://herd.laravel.com) 并已保护站点，或使用 [Laravel Valet](/docs/{{version}}/valet) 并对应用运行了 [secure 命令](/docs/{{version}}/valet#securing-sites)，Laravel Vite 插件将自动检测并使用为你生成的 TLS 证书。

如果你使用与应用目录名不匹配的主机保护了站点，可以在应用 `vite.config.js` 文件中手动指定主机：

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

使用其他 Web 服务器时，你应生成受信任的证书并手动配置 Vite 使用生成的证书：

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

如果你无法为系统生成受信任的证书，可以安装并配置 [@vitejs/plugin-basic-ssl 插件](https://github.com/vitejs/vite-plugin-basic-ssl)。使用不受信任的证书时，你需要在运行 `npm run dev` 命令时，通过浏览器中控制台的"Local"链接接受 Vite 开发服务器的证书警告。

<a name="configuring-hmr-in-sail-on-wsl2"></a>
#### 在 WSL2 上的 Sail 中运行开发服务器

在 Windows Subsystem for Linux 2（WSL2）上的 [Laravel Sail](/docs/{{version}}/sail) 中运行 Vite 开发服务器时，你应该在 `vite.config.js` 文件中添加以下配置，以确保浏览器可以与开发服务器通信：

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

如果在开发服务器运行期间文件更改未反映在浏览器中，你可能还需要配置 Vite 的 [server.watch.usePolling 选项](https://vitejs.dev/config/server-options.html#server-watch)。

<a name="loading-your-scripts-and-styles"></a>
### 加载你的脚本与样式

配置好 Vite 入口点后，你现在可以在应用根模板的 `<head>` 中通过 `@vite()` Blade 指令引用它们：

```blade
<!DOCTYPE html>
<head>
    {{-- ... --}}

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

如果你通过 JavaScript 导入 CSS，则只需包含 JavaScript 入口点：

```blade
<!DOCTYPE html>
<head>
    {{-- ... --}}

    @vite('resources/js/app.js')
</head>
```

`@vite` 指令将自动检测 Vite 开发服务器，并注入 Vite 客户端以启用热模块替换。在构建模式下，该指令将加载你已编译和版本化的资源，包括任何导入的 CSS。

如有需要，你也可以在调用 `@vite` 指令时指定已编译资源的构建路径：

```blade
<!doctype html>
<head>
    {{-- Given build path is relative to public path. --}}

    @vite('resources/js/app.js', 'vendor/courier/build')
</head>
```

<a name="inline-assets"></a>
#### 内联资源

有时可能需要包含资源的原始内容，而不是链接到资源的版本化 URL。例如，当将 HTML 内容传递给 PDF 生成器时，你可能需要直接将资源内容包含到页面中。你可以使用 `Vite` Facade 提供的 `content` 方法输出 Vite 资源的内容：

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

有两种方式可以运行 Vite。你可以通过 `dev` 命令运行开发服务器，这在本地开发时很有用。开发服务器会自动检测文件更改，并即时反映到任何打开的浏览器窗口中。

或者，运行 `build` 命令将对应用的资源进行版本化和打包，为部署到生产环境做好准备：

```shell
# Run the Vite development server...
npm run dev

# Build and version the assets for production...
npm run build
```

如果你在 WSL2 上的 [Sail](/docs/{{version}}/sail) 中运行开发服务器，可能需要一些[额外配置](#configuring-hmr-in-sail-on-wsl2)选项。

<a name="working-with-scripts"></a>
## 使用 JavaScript

<a name="aliases"></a>
### 别名

默认情况下，Laravel 插件提供了一个常用别名，帮助你快速上手并方便地导入应用的资源：

```js
{
    '@' => '/resources/js'
}
```

你可以通过在 `vite.config.js` 配置文件中添加自己的别名来覆盖 `'@'` 别名：

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

如果你想使用 [Vue](https://vuejs.org/) 框架构建前端，则还需要安装 `@vitejs/plugin-vue` 插件：

```shell
npm install --save-dev @vitejs/plugin-vue
```

然后，你可以在 `vite.config.js` 配置文件中包含该插件。在 Laravel 中使用 Vue 插件时，还有一些额外的选项需要配置：

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
                    // The Vue plugin will re-write asset URLs, when referenced
                    // in Single File Components, to point to the Laravel web
                    // server. Setting this to `null` allows the Laravel plugin
                    // to instead re-write asset URLs to point to the Vite
                    // server instead.
                    base: null,

                    // The Vue plugin will parse absolute URLs and treat them
                    // as absolute paths to files on disk. Setting this to
                    // `false` will leave absolute URLs un-touched so they can
                    // reference assets in the public directory as expected.
                    includeAbsolute: false,
                },
            },
        }),
    ],
});
```

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Vue 和 Vite 配置。这些入门套件是使用 Laravel、Vue 和 Vite 上手的最快方式。

<a name="react"></a>
### React

如果你想使用 [React](https://reactjs.org/) 框架构建前端，则还需要安装 `@vitejs/plugin-react` 插件：

```shell
npm install --save-dev @vitejs/plugin-react
```

然后，你可以在 `vite.config.js` 配置文件中包含该插件：

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

你需要确保任何包含 JSX 的文件都具有 `.jsx` 或 `.tsx` 扩展名，并在需要时更新入口点，如[上文所示](#configuring-vite)。

你还需要在现有的 `@vite` 指令旁边包含额外的 `@viteReactRefresh` Blade 指令。

```blade
@viteReactRefresh
@vite('resources/js/app.jsx')
```

`@viteReactRefresh` 指令必须在 `@vite` 指令之前调用。

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、React 和 Vite 配置。这些入门套件是使用 Laravel、React 和 Vite 上手的最快方式。

<a name="svelte"></a>
### Svelte

如果你想使用 [Svelte](https://svelte.dev/) 框架构建前端，则还需要安装 `@sveltejs/vite-plugin-svelte` 插件：

```shell
npm install --save-dev @sveltejs/vite-plugin-svelte
```

然后，你可以在 `vite.config.js` 配置文件中包含该插件。

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
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Svelte 和 Vite 配置。这些入门套件是使用 Laravel、Svelte 和 Vite 上手的最快方式。

<a name="inertia"></a>
### Inertia

Laravel Vite 插件提供了一个方便的 `resolvePageComponent` 函数，帮助你解析 Inertia 页面组件。以下是该辅助函数在 Vue 3 中的使用示例；不过，你也可以在 React 或 Svelte 等其他框架中使用该函数：

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

如果你将 Vite 的代码拆分功能与 Inertia 结合使用，我们建议配置[资源预取](#asset-prefetching)。

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Inertia 和 Vite 配置。这些入门套件是使用 Laravel、Inertia 和 Vite 上手的最快方式。

<a name="url-processing"></a>
### URL 处理

在应用 HTML、CSS 或 JS 中使用 Vite 并引用资源时，需要考虑几个注意事项。首先，如果你使用绝对路径引用资源，Vite 不会将资源包含在构建中；因此，你应确保该资源位于 public 目录中。使用[专用 CSS 入口点](#configuring-vite)时，应避免使用绝对路径，因为在开发期间，浏览器会尝试从托管 CSS 的 Vite 开发服务器加载这些路径，而不是从 public 目录加载。

引用相对资源路径时，你应记住路径是相对于引用它们的文件而言的。任何通过相对路径引用的资源都会被 Vite 重写、版本化并打包。

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

以下示例演示了 Vite 如何处理相对和绝对 URL：

```html
<!-- This asset is not handled by Vite and will not be included in the build -->
<img src="/taylor.png">

<!-- This asset will be re-written, versioned, and bundled by Vite -->
<img src="../../images/abigail.png">
```

<a name="working-with-stylesheets"></a>
## 使用样式表

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Tailwind 和 Vite 配置。或者，如果你想在不使用入门套件的情况下使用 Tailwind 和 Laravel，请查看 [Tailwind 的 Laravel 安装指南](https://tailwindcss.com/docs/guides/laravel)。

所有 Laravel 应用都已包含 Tailwind 和正确配置的 `vite.config.js` 文件。因此，你只需启动 Vite 开发服务器或运行 `dev` Composer 命令，它将同时启动 Laravel 和 Vite 开发服务器：

```shell
composer run dev
```

你的应用 CSS 可以放在 `resources/css/app.css` 文件中。

<a name="working-with-fonts"></a>
## 使用字体

Laravel Vite 插件可以为你的应用提供优化、自托管的字体。配置字体后，插件会解析所请求的字体文件，将其作为 Vite 资源输出，生成字体 CSS，并编写可由 Blade 的 [`@fonts` 指令](/docs/{{version}}/blade#fonts)消费的字体清单。

要配置字体，请从 `laravel-vite-plugin/fonts` 导入一个或多个提供方辅助函数，并将它们添加到 Laravel 插件的 `fonts` 选项中：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { google } from 'laravel-vite-plugin/fonts';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.js',
            fonts: [
                google('Inter', {
                    alias: 'sans',
                    weights: [400, 500, 600, 700],
                    styles: ['normal', 'italic'],
                    subsets: ['latin'],
                    display: 'swap',
                    preload: [
                        { weight: 400 },
                        { weight: 700 },
                    ],
                    fallbacks: ['system-ui', 'sans-serif'],
                }),
            ],
        }),
    ],
});
```

在此示例中，`Inter` 字体将通过 `sans` 别名可用。插件将生成 `--font-sans` CSS 变量和 `.font-sans` 工具类，用于应用生成的字体栈。

<a name="font-providers"></a>
### 字体提供方

Laravel Vite 插件包含用于 Google Fonts、Bunny Fonts、Fontsource 和本地字体的提供方辅助函数：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny, fontsource, google, local } from 'laravel-vite-plugin/fonts';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.js',
            fonts: [
                google('Inter', { alias: 'sans' }),
                bunny('Figtree', { alias: 'body' }),
                fontsource('JetBrains Mono', { alias: 'mono' }),
                local('Brand Sans', {
                    alias: 'brand',
                    src: 'resources/fonts/brand-sans',
                }),
            ],
        }),
    ],
});
```

`fontsource` 提供方从已安装的 Fontsource 包中读取字体。默认情况下，包名从字体家族派生，例如 `@fontsource/jetbrains-mono`。如果你的应用使用不同的包名，可以通过 `package` 选项指定。

<a name="local-fonts"></a>
### 本地字体

使用本地字体时，`src` 选项可以指向单个字体文件、目录或 glob 模式。插件将发现受支持的字体文件，并从其文件名推断字重和样式：

```js
local('Brand Sans', {
    alias: 'brand',
    src: 'resources/fonts/brand-sans/*.woff2',
})
```

如果你需要完全控制可用的变体，可以使用 `variants` 选项显式定义它们：

```js
local('Brand Sans', {
    alias: 'brand',
    variants: [
        { src: 'resources/fonts/BrandSans-Regular.woff2', weight: 400 },
        { src: 'resources/fonts/BrandSans-Italic.woff2', weight: 400, style: 'italic' },
        { src: ['resources/fonts/BrandSans-Bold.woff2', 'resources/fonts/BrandSans-Bold.ttf'], weight: 700 },
    ],
})
```

<a name="font-options"></a>
### 字体选项

根据提供方的不同，字体定义可能接受多个选项，允许你自定义生成的字体 CSS：

<div class="content-list" markdown="1">

- `alias` 定义 Blade `@fonts` 指令使用的名称，默认为字体家族名称的 slug 形式。
- `variable` 定义生成的 CSS 变量，默认为 `--font-{alias}`。
- `weights` 定义应解析的远程或 Fontsource 字体字重，默认为 `[400]`。
- `styles` 定义应解析的远程或 Fontsource 字体样式，默认为 `['normal']`。
- `subsets` 定义应解析的远程或 Fontsource 字体子集，默认为 `['latin']`。
- `display` 定义 `font-display` 值，默认为 `swap`。
- `preload` 控制应预加载哪些 WOFF2 字体变体。此选项可以是 `true`、`false` 或 `{ weight, style }` 选择器数组。
- `fallbacks` 定义应附加到生成的字体栈的额外回退字体。
- `optimizedFallbacks` 尝试使用可选的 `fontaine` 包生成度量调整的回退字体面，默认为 `true`。

</div>

优化的回退字体需要 `fontaine` 包，它默认不会安装。如果你希望 Laravel 生成度量调整的回退字体面，应将 `fontaine` 安装为开发依赖：

```shell
npm install --save-dev fontaine
```

如果未安装 `fontaine` 或无法读取字体文件，Laravel 将跳过该字体的优化回退，并继续使用通过 `fallbacks` 选项配置的任何字体。

本地字体从上述 `src` 或 `variants` 选项解析，而不是使用 `weights`、`styles` 和 `subsets`。

<a name="working-with-blade-and-routes"></a>
## 使用 Blade 与路由

<a name="blade-processing-static-assets"></a>
### 使用 Vite 处理静态资源

在 JavaScript 或 CSS 中引用资源时，Vite 会自动处理和版本化它们。此外，在构建基于 Blade 的应用时，Vite 还可以处理和版本化你仅在 Blade 模板中引用的静态资源。

但是，要做到这一点，你需要通过在插件 `assets` 选项中指定资源，让 Vite 感知你的资源。此选项适用于你想要使用 `Vite::asset` 直接引用的静态文件。如果你希望 Laravel 生成字体 CSS 和预加载链接，请改用 [`fonts` 选项](#working-with-fonts)。

例如，如果你想处理并版本化存储在 `resources/images` 中的所有图片以及存储在 `resources/fonts` 中的所有字体，应将以下内容添加到 Vite 配置中：

```js
laravel({
    input: 'resources/js/app.js',
    assets: ['resources/images/**', 'resources/fonts/**'],
})
```

现在，运行 `npm run build` 时，这些资源将被 Vite 处理。然后，你可以使用 `Vite::asset` 方法在 Blade 模板中引用这些资源，该方法将为给定资源返回版本化 URL：

```blade
<img src="{{ Vite::asset('resources/images/logo.png') }}">
```

> [!NOTE]
> 在 Laravel Vite 插件的第 3 版之前，静态资源必须在应用的入口点中使用 `import.meta.glob` 导入。`assets` 选项是由于 Vite 8 的更改而引入的。

<a name="blade-refreshing-on-save"></a>
### 保存时刷新

当你的应用使用 Blade 进行传统服务器端渲染时，Vite 可以通过在应用中的视图文件发生变化时自动刷新浏览器来改善开发工作流。要开始，你可以简单地将 `refresh` 选项指定为 `true`。

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

当 `refresh` 选项为 `true` 时，运行 `npm run dev` 期间，保存以下目录中的文件将触发浏览器执行整页刷新：

- `app/Livewire/**`
- `app/View/Components/**`
- `lang/**`
- `resources/lang/**`
- `resources/views/**`
- `routes/**`

如果你使用 [Ziggy](https://github.com/tighten/ziggy) 在应用前端生成路由链接，监听 `routes/**` 目录会很有用。

如果这些默认路径不适合你的需求，可以指定自己的要监听的路径列表：

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

在底层，Laravel Vite 插件使用 [vite-plugin-full-reload](https://github.com/ElMassimo/vite-plugin-full-reload) 包，它提供了一些高级配置选项来微调此功能的行为。如果你需要这种级别的自定义，可以提供 `config` 定义：

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

在 JavaScript 应用中，为经常引用的目录[创建别名](#aliases)是很常见的。但你也可以在 Blade 中使用 `Illuminate\Support\Facades\Vite` 类的 `macro` 方法创建别名。通常，"宏"应在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中定义：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Vite::macro('image', fn (string $asset) => $this->asset("resources/images/{$asset}"));
}
```

一旦定义了宏，就可以在模板中调用它。例如，我们可以使用上面定义的 `image` 宏引用位于 `resources/images/logo.png` 的资源：

```blade
<img src="{{ Vite::image('logo.png') }}" alt="Laravel Logo">
```

<a name="asset-prefetching"></a>
## 资源预取

使用 Vite 的代码拆分功能构建 SPA 时，每次页面导航都会获取所需的资源。这种行为可能导致 UI 渲染延迟。如果这对你选择的前端框架是个问题，Laravel 提供了在初始页面加载时急切预取应用 JavaScript 和 CSS 资源的能力。

你可以通过在[服务提供者](/docs/{{version}}/providers)的 `boot` 方法中调用 `Vite::prefetch` 方法，指示 Laravel 急切预取你的资源：

```php
<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // ...
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
```

在上面的示例中，每次页面加载时，资源将以最多 `3` 个并发下载进行预取。你可以修改并发数以适合应用需求，或者如果应用应一次性下载所有资源，则不指定并发限制：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Vite::prefetch();
}
```

默认情况下，预取将在[页面 _load_ 事件](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event)触发时开始。如果你想自定义预取开始的时间，可以指定 Vite 将监听的事件：

```php
/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Vite::prefetch(event: 'vite:prefetch');
}
```

鉴于上述代码，预取现在将在你手动在 `window` 对象上触发 `vite:prefetch` 事件时开始。例如，你可以让预取在页面加载三秒后开始：

```html
<script>
    addEventListener('load', () => setTimeout(() => {
        dispatchEvent(new Event('vite:prefetch'))
    }, 3000))
</script>
```

<a name="custom-base-urls"></a>
## 自定义基础 URL

如果你的 Vite 编译资源部署到与应用不同的域（例如通过 CDN），你必须在应用 `.env` 文件中指定 `ASSET_URL` 环境变量：

```env
ASSET_URL=https://cdn.example.com
```

配置资源 URL 后，所有指向资源的重写 URL 都将以配置值为前缀：

```text
https://cdn.example.com/build/assets/app.9dce8d17.js
```

请记住，[绝对 URL 不会被 Vite 重写](#url-processing)，因此它们不会被添加前缀。

<a name="environment-variables"></a>
## 环境变量

你可以通过在应用 `.env` 文件中为环境变量添加 `VITE_` 前缀，将环境变量注入到 JavaScript 中：

```env
VITE_SENTRY_DSN_PUBLIC=http://example.com
```

你可以通过 `import.meta.env` 对象访问注入的环境变量：

```js
import.meta.env.VITE_SENTRY_DSN_PUBLIC
```

<a name="disabling-vite-in-tests"></a>
## 在测试中禁用 Vite

Laravel 的 Vite 集成在运行测试时会尝试解析你的资源，这要求你运行 Vite 开发服务器或构建资源。

如果你更愿意在测试期间模拟 Vite，可以调用 `withoutVite` 方法，它可用于任何继承 Laravel `TestCase` 类的测试：

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
## 服务器端渲染（SSR）

Laravel Vite 插件使使用 Vite 设置服务器端渲染变得轻松。要开始，请在 `resources/js/ssr.js` 创建 SSR 入口点，并通过向 Laravel 插件传递配置选项来指定该入口点：

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

为确保你不会忘记重建 SSR 入口点，我们建议增强应用 `package.json` 中的 "build" 脚本以创建 SSR 构建：

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

如果你使用 [Inertia 的 SSR](https://inertiajs.com/server-side-rendering)，可以使用 `inertia:start-ssr` Artisan 命令启动 SSR 服务器：

```shell
php artisan inertia:start-ssr
```

> [!NOTE]
> Laravel 的[入门套件](/docs/{{version}}/starter-kits)已经包含了正确的 Laravel、Inertia SSR 和 Vite 配置。这些入门套件是使用 Laravel、Inertia SSR 和 Vite 上手的最快方式。

<a name="script-and-style-attributes"></a>
## Script 与 Style 标签属性

<a name="content-security-policy-csp-nonce"></a>
### 内容安全策略（CSP）Nonce

如果你希望作为[内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)的一部分，在 script 和 style 标签上包含 [nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)，可以在自定义[中间件](/docs/{{version}}/middleware)中使用 `useCspNonce` 方法生成或指定 nonce：

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
     * Handle an incoming request.
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

调用 `useCspNonce` 方法后，Laravel 将自动在所有生成的 script 和 style 标签上包含 `nonce` 属性。

如果你需要在其他地方指定 nonce，包括 Laravel [入门套件](/docs/{{version}}/starter-kits)附带的 [Ziggy `@route` 指令](https://github.com/tighten/ziggy#using-routes-with-a-content-security-policy)，你可以使用 `cspNonce` 方法获取它：

```blade
@routes(nonce: Vite::cspNonce())
```

如果你已经有一个希望指示 Laravel 使用的 nonce，可以将该 nonce 传递给 `useCspNonce` 方法：

```php
Vite::useCspNonce($nonce);
```

<a name="subresource-integrity-sri"></a>
### 子资源完整性（SRI）

如果你的 Vite 清单中包含资源的 `integrity` 哈希，Laravel 将自动在其生成的任何 script 和 style 标签上添加 `integrity` 属性，以强制实施[子资源完整性](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)。默认情况下，Vite 不会在其清单中包含 `integrity` 哈希，但你可以通过安装 [vite-plugin-manifest-sri](https://www.npmjs.com/package/vite-plugin-manifest-sri) NPM 插件来启用它：

```shell
npm install --save-dev vite-plugin-manifest-sri
```

然后，你可以在 `vite.config.js` 文件中启用此插件：

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

如有需要，你还可以自定义可以找到完整性哈希的清单键：

```php
use Illuminate\Support\Facades\Vite;

Vite::useIntegrityKey('custom-integrity-key');
```

如果你想完全禁用此自动检测，可以向 `useIntegrityKey` 方法传递 `false`：

```php
Vite::useIntegrityKey(false);
```

<a name="arbitrary-attributes"></a>
### 任意属性

如果你需要在 script 和 style 标签上包含额外的属性，例如 [data-turbo-track](https://turbo.hotwired.dev/handbook/drive#reloading-when-assets-change) 属性，可以通过 `useScriptTagAttributes` 和 `useStyleTagAttributes` 方法指定它们。通常，这些方法应从[服务提供者](/docs/{{version}}/providers)调用：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes([
    'data-turbo-track' => 'reload', // Specify a value for the attribute...
    'async' => true, // Specify an attribute without a value...
    'integrity' => false, // Exclude an attribute that would otherwise be included...
]);

Vite::useStyleTagAttributes([
    'data-turbo-track' => 'reload',
]);
```

如果你需要有条件地添加属性，可以传递一个回调，它将接收资源源路径、其 URL、其清单块和整个清单：

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
> 在 Vite 开发服务器运行期间，`$chunk` 和 `$manifest` 参数将为 `null`。

<a name="advanced-customization"></a>
## 高级自定义

开箱即用，Laravel 的 Vite 插件使用适用于大多数应用的合理约定；不过，有时你可能需要自定义 Vite 的行为。要启用额外的自定义选项，我们提供以下方法和选项，可用于代替 `@vite` Blade 指令：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    {{
        Vite::useHotFile(storage_path('vite.hot')) // Customize the "hot" file...
            ->useBuildDirectory('bundle') // Customize the build directory...
            ->useManifestFilename('assets.json') // Customize the manifest filename...
            ->withEntryPoints(['resources/js/app.js']) // Specify the entry points...
            ->createAssetPathsUsing(function (string $path, ?bool $secure) { // Customize the backend path generation for built assets...
                return "https://cdn.example.com/{$path}";
            })
    }}
</head>
```

然后，在 `vite.config.js` 文件中，你应指定相同的配置：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            hotFile: 'storage/vite.hot', // Customize the "hot" file...
            buildDirectory: 'bundle', // Customize the build directory...
            input: ['resources/js/app.js'], // Specify the entry points...
        }),
    ],
    build: {
      manifest: 'assets.json', // Customize the manifest filename...
    },
});
```

<a name="cors"></a>
### 开发服务器跨源资源共享（CORS）

如果在浏览器中从 Vite 开发服务器获取资源时遇到跨源资源共享（CORS）问题，你可能需要授予自定义来源访问开发服务器的权限。Vite 与 Laravel 插件结合，无需额外配置即可允许以下来源：

- `::1`
- `127.0.0.1`
- `localhost`
- `*.test`
- `*.localhost`
- 项目 `.env` 中的 `APP_URL`

为项目允许自定义来源的最简单方法是确保应用的 `APP_URL` 环境变量与你在浏览器中访问的来源匹配。例如，如果你访问 `https://my-app.laravel`，应更新 `.env` 以匹配：

```env
APP_URL=https://my-app.laravel
```

如果你需要对来源进行更细粒度的控制（例如支持多个来源），应使用 [Vite 全面且灵活的内置 CORS 服务器配置](https://vite.dev/config/server-options.html#server-cors)。例如，你可以在项目 `vite.config.js` 文件的 `server.cors.origin` 配置选项中指定多个来源：

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

你还可以包含正则表达式模式，如果你想允许给定顶级域的所有来源（例如 `*.laravel`），这会很有用：

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
                // Supports: SCHEME://DOMAIN.laravel[:PORT] [tl! add]
                /^https?:\/\/.*\.laravel(:\d+)?$/, //[tl! add]
            ], // [tl! add]
        }, // [tl! add]
    }, // [tl! add]
});
```

<a name="correcting-dev-server-urls"></a>
### 纠正开发服务器 URL

Vite 生态中的某些插件假定以正斜杠开头的 URL 总是指向 Vite 开发服务器。然而，由于 Laravel 集成的性质，情况并非如此。

例如，`vite-imagetools` 插件在 Vite 提供资源时会输出如下 URL：

```html
<img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520">
```

`vite-imagetools` 插件期望输出 URL 会被 Vite 拦截，然后插件可以处理所有以 `/@imagetools` 开头的 URL。如果你使用期望此行为的插件，你需要手动纠正 URL。你可以在 `vite.config.js` 文件中使用 `transformOnServe` 选项来完成此操作。

在此特定示例中，我们将开发服务器 URL 前置到生成代码中所有出现的 `/@imagetools`：

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

现在，在 Vite 提供资源期间，它将输出指向 Vite 开发服务器的 URL：

```html
- <img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520"><!-- [tl! remove] -->
+ <img src="http://[::1]:5173/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520"><!-- [tl! add] -->
```
