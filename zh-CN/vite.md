# 资源打包（Vite）

[Vite](https://vitejs.dev) 是一个现代化的前端构建工具，提供极快的开发环境，并为生产环境打包你的代码。在使用 Laravel 构建应用时，你通常会使用 Vite 将应用的 CSS 和 JavaScript 文件打包为可用于生产的资源。

Laravel 通过提供官方的插件和 Blade 指令，与 Vite 无缝集成，用于在开发和生产环境中加载你的资源。

## 安装与配置

> [!NOTE]
> 以下文档介绍了如何手动安装和配置 Laravel Vite 插件。不过，Laravel 的 [入门套件](/docs/{{version}}/starter-kits) 已经包含了所有这些脚手架，是上手 Laravel 与 Vite 最快的方式。

### 安装 Node

在运行 Vite 和 Laravel 插件之前，你必须确保已安装 Node.js（16+）和 NPM：

```shell
node -v
npm -v
```

你可以使用 [Node 官网](https://nodejs.org/en/download/) 提供的简易图形化安装程序来安装最新版本的 Node 和 NPM。或者，如果你在使用 [Laravel Sail](https://laravel.com/docs/{{version}}/sail)，可以通过 Sail 调用 Node 和 NPM：

```shell
./vendor/bin/sail node -v
./vendor/bin/sail npm -v
```

### 安装 Vite 与 Laravel 插件

在一个全新的 Laravel 安装中，你会在应用目录结构的根目录找到一个 `package.json` 文件。默认的 `package.json` 文件已经包含了开始使用 Vite 和 Laravel 插件所需的一切。你可以通过 NPM 安装应用的前端依赖：

```shell
npm install
```

### 配置 Vite

Vite 通过一个位于项目根目录的 `vite.config.js` 文件进行配置。你可以根据需要进行自定义，也可以安装应用所需的其他插件，例如 `@vitejs/plugin-react`、`@sveltejs/vite-plugin-svelte` 或 `@vitejs/plugin-vue`。

Laravel Vite 插件要求你指定应用的入口点。这些入口点可以是 JavaScript 或 CSS 文件，也包括 TypeScript、JSX、TSX 和 Sass 等预处理语言。

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

如果你正在构建一个 SPA（包括使用 Inertia 构建的应用），Vite 在无 CSS 入口点时效果最佳：

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

相反，你应该通过 JavaScript 引入 CSS。通常，这会在应用的 `resources/js/app.js` 文件中完成：

```js
import './bootstrap';
import '../css/app.css'; // [tl! add]
```

Laravel 插件还支持多入口点以及高级配置选项，例如 [SSR 入口点](#ssr)。

#### 使用安全的开发服务器

如果你的本地开发 Web 服务器通过 HTTPS 为应用提供服务，在连接 Vite 开发服务器时可能会遇到问题。

如果你在使用 [Laravel Herd](https://herd.laravel.com) 并已为站点启用安全访问，或者你在使用 [Laravel Valet](/docs/{{version}}/valet) 并已对应用执行过 [secure 命令](/docs/{{version}}/valet#securing-sites)，Laravel Vite 插件会自动检测并使用生成的 TLS 证书。

如果你使用的主机名与应用目录名不匹配，可以在应用的 `vite.config.js` 文件中手动指定主机：

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

如果使用其他 Web 服务器，你应当生成一个受信任的证书，并手动配置 Vite 使用生成的证书：

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

如果你无法为系统生成受信任的证书，可以安装并配置 [@vitejs/plugin-basic-ssl 插件](https://github.com/vitejs/vite-plugin-basic-ssl)。使用不受信任的证书时，你需要在浏览器中接受 Vite 开发服务器的证书警告，方法是运行 `npm run dev` 命令时，在控制台点击 "Local" 链接。

#### 在 Sail 与 WSL2 中运行开发服务器

在 Windows 子系统 Linux 2（WSL2）的 [Laravel Sail](/docs/{{version}}/sail) 中运行 Vite 开发服务器时，你应当向下应用的 `vite.config.js` 文件中添加以下配置，以确保浏览器能够与开发服务器通信：

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

如果在开发服务器运行期间，文件变更没有反映在浏览器中，你可能还需要配置 Vite 的 [server.watch.usePolling 选项](https://vitejs.dev/config/server-options.html#server-watch)。

### 加载脚本与样式

配置好 Vite 入口点后，你现在可以在应用根模板的 `<head>` 中，使用一个 `@vite()` Blade 指令引用它们：

```blade
<!DOCTYPE html>
<head>
    {{-- ... --}}

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

如果你通过 JavaScript 引入 CSS，则只需要引入 JavaScript 入口点：

```blade
<!DOCTYPE html>
<head>
    {{-- ... --}}

    @vite('resources/js/app.js')
</head>
```

`@vite` 指令会自动检测 Vite 开发服务器，并注入 Vite 客户端以启用热模块替换（Hot Module Replacement）。在构建模式下，该指令会加载编译后且带版本号的资源，包括任何被引入的 CSS。

如果需要，你还可以在调用 `@vite` 指令时指定编译资源的构建路径：

```blade
<!doctype html>
<head>
    {{-- 给定的构建路径相对于 public 路径。 --}}

    @vite('resources/js/app.js', 'vendor/courier/build')
</head>
```

#### 内联资源

有时，可能需要包含资源的原始内容，而不是链接到该资源的版本化 URL。例如，在向 PDF 生成器传递 HTML 内容时，可能需要直接将资源内容嵌入到页面中。你可以使用 `Vite` Facade 提供的 `content` 方法输出 Vite 资源的内容：

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

## 运行 Vite

有两种方式可以运行 Vite。你可以通过 `dev` 命令运行开发服务器，这在本地开发时很有用。开发服务器会自动检测文件变更，并立即反映在任何已打开的浏览器窗口中。

或者，运行 `build` 命令会对应用的资源进行版本化和打包，使其准备好部署到生产环境：

```shell
# 运行 Vite 开发服务器……
npm run dev

# 为生产环境构建并版本化资源……
npm run build
```

如果你在 WSL2 的 [Sail](/docs/{{version}}/sail) 中运行开发服务器，可能需要一些 [额外的配置](#configuring-hmr-in-sail-on-wsl2) 选项。

## 使用 JavaScript

### 别名

默认情况下，Laravel 插件提供了一个常用别名，帮助你快速上手并便捷地引入应用的资源：

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

### Vue

如果你想使用 [Vue](https://vuejs.org/) 框架构建前端，还需要安装 `@vitejs/plugin-vue` 插件：

```shell
npm install --save-dev @vitejs/plugin-vue
```

然后，你可以将它包含在 `vite.config.js` 配置文件中。在使用 Vue 插件与 Laravel 配合时，还需要几个额外的选项：

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
                    // 当在单文件组件中引用时，Vue 插件会重写资源 URL，
                    // 使其指向 Laravel Web 服务器。将其设为 `null` 可让
                    // Laravel 插件改为将资源 URL 重写到 Vite 服务器。
                    base: null,

                    // Vue 插件会解析绝对 URL 并将其视为磁盘上的文件路径。
                    // 将其设为 `false` 会保留绝对 URL 不变，以便它们能够
                    // 按预期引用 public 目录中的资源。
                    includeAbsolute: false,
                },
            },
        }),
    ],
});
```

> [!NOTE]
> Laravel 的 [入门套件](/docs/{{version}}/starter-kits) 已经包含了正确的 Laravel、Vue 和 Vite 配置。这些套件是上手 Laravel、Vue 和 Vite 最快的方式。

### React

如果你想使用 [React](https://reactjs.org/) 框架构建前端，还需要安装 `@vitejs/plugin-react` 插件：

```shell
npm install --save-dev @vitejs/plugin-react
```

然后，你可以将它包含在 `vite.config.js` 配置文件中：

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

你需要确保所有包含 JSX 的文件都带有 `.jsx` 或 `.tsx` 扩展名，并在需要时（如 [上文所示](#configuring-vite)）更新你的入口点。

你还需要在现有的 `@vite` 指令旁包含额外的 `@viteReactRefresh` Blade 指令。

```blade
@viteReactRefresh
@vite('resources/js/app.jsx')
```

`@viteReactRefresh` 指令必须在 `@vite` 指令之前调用。

> [!NOTE]
> Laravel 的 [入门套件](/docs/{{version}}/starter-kits) 已经包含了正确的 Laravel、React 和 Vite 配置。这些套件是上手 Laravel、React 和 Vite 最快的方式。

### Svelte

如果你想使用 [Svelte](https://svelte.dev/) 框架构建前端，还需要安装 `@sveltejs/vite-plugin-svelte` 插件：

```shell
npm install --save-dev @sveltejs/vite-plugin-svelte
```

然后，你可以将它包含在 `vite.config.js` 配置文件中。

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
> Laravel 的 [入门套件](/docs/{{version}}/starter-kits) 已经包含了正确的 Laravel、Svelte 和 Vite 配置。这些套件是上手 Laravel、Svelte 和 Vite 最快的方式。

### Inertia

Laravel Vite 插件提供了一个便捷的 `resolvePageComponent` 函数，帮助你解析 Inertia 页面组件。下面是一个在 Vue 3 中使用该辅助函数的示例；不过，你也可以在其他框架（如 React 或 Svelte）中使用该函数：

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

如果你在 Inertia 中使用 Vite 的代码分割功能，我们建议配置 [资源预取](#asset-prefetching)。

> [!NOTE]
> Laravel 的 [入门套件](/docs/{{version}}/starter-kits) 已经包含了正确的 Laravel、Inertia 和 Vite 配置。这些套件是上手 Laravel、Inertia 和 Vite 最快的方式。

### URL 处理

在使用 Vite 并引用应用 HTML、CSS 或 JS 中的资源时，有几个注意事项。首先，如果你使用绝对路径引用资源，Vite 不会将该资源纳入构建；因此，你应当确保该资源在 public 目录中可用。在使用 [专用 CSS 入口点](#configuring-vite) 时，应避免使用绝对路径，因为在开发期间，浏览器会尝试从托管 CSS 的 Vite 开发服务器（而非 public 目录）加载这些路径。

引用相对资源路径时，你应当记住，路径是相对于引用它们的文件而言的。任何通过相对路径引用的资源都会被 Vite 重写、版本化并打包。

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

以下示例展示了 Vite 如何处理相对和绝对 URL：

```html
<!-- 该资源不由 Vite 处理，也不会被纳入构建 -->
<img src="/taylor.png">

<!-- 该资源会被 Vite 重写、版本化并打包 -->
<img src="../../images/abigail.png">
```

## 使用样式表

> [!NOTE]
> Laravel 的 [入门套件](/docs/{{version}}/starter-kits) 已经包含了正确的 Tailwind 和 Vite 配置。或者，如果你想在不使用入门套件的情况下将 Tailwind 与 Laravel 配合使用，请查看 [Tailwind 针对 Laravel 的安装指南](https://tailwindcss.com/docs/guides/laravel)。

所有 Laravel 应用都已经包含了 Tailwind 以及一个配置正确的 `vite.config.js` 文件。因此，你只需启动 Vite 开发服务器，或运行 `dev` Composer 命令，它会同时启动 Laravel 和 Vite 开发服务器：

```shell
composer run dev
```

应用的 CSS 可以放置在 `resources/css/app.css` 文件中。

## 使用字体

Laravel Vite 插件可以为你的应用提供经过优化的自托管字体。配置字体后，插件会解析所请求的字体文件，将它们作为 Vite 资源输出，生成字体 CSS，并写入一个可由 Blade 的 [`@fonts` 指令](/docs/{{version}}/blade#fonts) 消费的字体清单。

要配置字体，从 `laravel-vite-plugin/fonts` 中导入一个或多个 provider 辅助函数，并将它们添加到 Laravel 插件的 `fonts` 选项中：

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

在本例中，`Inter` 字体可通过 `sans` 别名使用。插件会生成一个 `--font-sans` CSS 变量，以及一个应用所生成字体栈的 `.font-sans` 工具类。

### 字体 Provider

Laravel Vite 插件包含了 Google Fonts、Bunny Fonts、Fontsource 和本地字体的 provider 辅助函数：

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

`fontsource` provider 会从已安装的 Fontsource 包中读取字体。默认情况下，包名由字体系列推导而来，例如 `@fontsource/jetbrains-mono`。如果你的应用使用了不同的包名，可以通过 `package` 选项指定。

### 本地字体

使用本地字体时，`src` 选项可以指向单个字体文件、一个目录或一个 glob 模式。插件会识别受支持的字体文件，并从文件名推断其字重和样式：

```js
local('Brand Sans', {
    alias: 'brand',
    src: 'resources/fonts/brand-sans/*.woff2',
})
```

如果你需要对可用的变体拥有完全控制权，可以使用 `variants` 选项显式定义：

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

### 字体选项

根据 provider 的不同，字体定义可以接受多个选项，用于自定义所生成的字体 CSS：

- `alias` 定义 Blade 的 `@fonts` 指令使用的名称，默认为字体系列的 slug。
- `variable` 定义生成的 CSS 变量，默认为 `--font-{alias}`。
- `weights` 定义应当解析的远程或 Fontsource 字重，默认为 `[400]`。
- `styles` 定义应当解析的远程或 Fontsource 字体样式，默认为 `['normal']`。
- `subsets` 定义应当解析的远程或 Fontsource 字体子集，默认为 `['latin']`。
- `display` 定义 `font-display` 的值，默认为 `swap`。
- `preload` 控制应当预加载哪些 WOFF2 字体变体。该选项可以是 `true`、`false`，或一个由 `{ weight, style }` 选择器组成的数组。
- `fallbacks` 定义应当追加到所生成字体栈中的额外回退字体。
- `optimizedFallbacks` 尝试使用可选的 `fontaine` 包生成经过度量调整的回退字体面，默认为 `true`。

优化的回退字体需要 `fontaine` 包，该包默认未安装。如果你想让 Laravel 生成经过度量调整的回退字体面，应将 `fontaine` 作为开发依赖安装：

```shell
npm install --save-dev fontaine
```

如果未安装 `fontaine` 或它无法读取某个字体文件，Laravel 会跳过该字体的优化回退，并继续使用通过 `fallbacks` 选项配置的任何字体。

本地字体是从上文描述的 `src` 或 `variants` 选项解析的，而不是使用 `weights`、`styles` 和 `subsets`。

## 使用 Blade 与路由

### 通过 Vite 处理静态资源

在 JavaScript 或 CSS 中引用资源时，Vite 会自动处理并为其添加版本号。此外，在构建基于 Blade 的应用时，Vite 也可以处理并为你仅在 Blade 模板中引用的静态资源添加版本号。

不过，要做到这一点，你需要通过在插件的 `assets` 选项中指定这些资源，让 Vite 感知到它们。该选项适用于你想要通过 `Vite::asset` 直接引用的静态文件。如果你想让 Laravel 生成字体 CSS 和预加载链接，请改用 [`fonts` 选项](#working-with-fonts)。

例如，如果你想处理并版本化存储在 `resources/images` 中的所有图片以及存储在 `resources/fonts` 中的所有字体，应将以下内容添加到你的 Vite 配置中：

```js
laravel({
    input: 'resources/js/app.js',
    assets: ['resources/images/**', 'resources/fonts/**'],
})
```

这些资源现在会在运行 `npm run build` 时由 Vite 处理。然后，你可以在 Blade 模板中使用 `Vite::asset` 方法引用这些资源，该方法会返回给定资源的版本化 URL：

```blade
<img src="{{ Vite::asset('resources/images/logo.png') }}">
```

> [!NOTE]
> 在 Laravel Vite 插件第 3 版之前，静态资源必须通过 `import.meta.glob` 在应用的入口点中引入。`assets` 选项是由于 Vite 8 的变更而引入的。

### 保存时刷新

当你的应用使用传统的基于 Blade 的服务端渲染构建时，Vite 可以在你修改应用中的视图文件时自动刷新浏览器，从而改进你的开发工作流。要开始使用，只需将 `refresh` 选项设为 `true` 即可。

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

当 `refresh` 选项为 `true` 时，在运行 `npm run dev` 期间保存以下目录中的文件会触发浏览器执行整页刷新：

- `app/Livewire/**`
- `app/View/Components/**`
- `lang/**`
- `resources/lang/**`
- `resources/views/**`
- `routes/**`

监听 `routes/**` 目录在你使用 [Ziggy](https://github.com/tighten/ziggy) 在前端生成路由链接时很有用。

如果这些默认路径不符合你的需求，你可以指定自己要监听的路径列表：

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

在底层，Laravel Vite 插件使用了 [vite-plugin-full-reload](https://github.com/ElMassimo/vite-plugin-full-reload) 包，它提供了一些高级配置选项来微调此功能的行为。如果你需要这种程度的自定义，可以提供一个 `config` 定义：

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

### 别名

在 JavaScript 应用中，[创建别名](#aliases) 来引用常用目录是很常见的做法。不过，你也可以通过 `Illuminate\Support\Facades\Vite` 类上的 `macro` 方法创建在 Blade 中使用的别名。通常，"宏"应当定义在 [服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中：

```php
/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Vite::macro('image', fn (string $asset) => $this->asset("resources/images/{$asset}"));
}
```

定义好宏之后，就可以在模板中调用它。例如，我们可以使用上面定义的 `image` 宏来引用位于 `resources/images/logo.png` 的资源：

```blade
<img src="{{ Vite::image('logo.png') }}" alt="Laravel Logo">
```

## 资源预取

当使用 Vite 的代码分割功能构建 SPA 时，所需的资源会在每次页面导航时获取。这种行为可能导致 UI 渲染延迟。如果你的前端框架存在这个问题，Laravel 提供了在初始页面加载时主动预取应用 JavaScript 和 CSS 资源的能力。

你可以通过在 [服务提供者](/docs/{{version}}/providers) 的 `boot` 方法中调用 `Vite::prefetch` 方法，指示 Laravel 主动预取资源：

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

在上例中，资源会在每次页面加载时以最多 `3` 个并发下载进行预取。你可以修改并发数以适应应用的需求，或者在应用应当一次性下载全部资源时不指定并发限制：

```php
/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Vite::prefetch();
}
```

默认情况下，预取会在 [页面 _load_ 事件](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event) 触发时开始。如果你想自定义预取开始的时间，可以指定一个 Vite 会监听的事件：

```php
/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Vite::prefetch(event: 'vite:prefetch');
}
```

给定上述代码后，预取现在会在你手动在 `window` 对象上派发 `vite:prefetch` 事件时开始。例如，你可以让预取在页面加载三秒后开始：

```html
<script>
    addEventListener('load', () => setTimeout(() => {
        dispatchEvent(new Event('vite:prefetch'))
    }, 3000))
</script>
```

## 自定义基础 URL

如果你的 Vite 编译资源部署在与应用不同的域名下（例如通过 CDN），必须在应用的 `.env` 文件中指定 `ASSET_URL` 环境变量：

```env
ASSET_URL=https://cdn.example.com
```

配置好资源 URL 后，所有被重写的资源 URL 都会加上所配置值作为前缀：

```text
https://cdn.example.com/build/assets/app.9dce8d17.js
```

请记住，[绝对 URL 不会被 Vite 重写](#url-processing)，因此不会加上前缀。

## 环境变量

你可以通过在应用的 `.env` 文件中使用 `VITE_` 前缀，将环境变量注入到 JavaScript 中：

```env
VITE_SENTRY_DSN_PUBLIC=http://example.com
```

你可以通过 `import.meta.env` 对象访问被注入的环境变量：

```js
import.meta.env.VITE_SENTRY_DSN_PUBLIC
```

## 在测试中禁用 Vite

Laravel 的 Vite 集成会尝试在运行测试时解析你的资源，这要求你要么运行 Vite 开发服务器，要么构建资源。

如果你想在测试期间模拟 Vite，可以调用 `withoutVite` 方法，该方法适用于任何继承自 Laravel `TestCase` 类的测试：

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

## 服务端渲染（SSR）

Laravel Vite 插件让使用 Vite 设置服务端渲染变得轻而易举。首先，在 `resources/js/ssr.js` 创建一个 SSR 入口点，并通过向 Laravel 插件传入一个配置选项来指定该入口点：

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

为了确保你不会忘记重新构建 SSR 入口点，我们建议在应用的 `package.json` 中扩展 "build" 脚本以创建 SSR 构建：

```json
"scripts": {
     "dev": "vite",
     "build": "vite build" // [tl! remove]
     "build": "vite build && vite build --ssr" // [tl! add]
}
```

然后，要构建并启动 SSR 服务器，可以运行以下命令：

```shell
npm run build
node bootstrap/ssr/ssr.js
```

如果你在使用 [Inertia 的 SSR](https://inertiajs.com/server-side-rendering)，也可以改用 `inertia:start-ssr` Artisan 命令来启动 SSR 服务器：

```shell
php artisan inertia:start-ssr
```

> [!NOTE]
> Laravel 的 [入门套件](/docs/{{version}}/starter-kits) 已经包含了正确的 Laravel、Inertia SSR 和 Vite 配置。这些套件是上手 Laravel、Inertia SSR 和 Vite 最快的方式。

## 脚本与样式标签属性

### 内容安全策略（CSP）Nonce

如果你想在脚本和样式标签上包含 [nonce 属性](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)，作为 [内容安全策略](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) 的一部分，可以在自定义 [中间件](/docs/{{version}}/middleware) 中使用 `useCspNonce` 方法生成或指定一个 nonce：

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
     * 处理传入的请求。
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

调用 `useCspNonce` 方法后，Laravel 会自动在所有生成的脚本和样式标签上包含 `nonce` 属性。

如果你需要在其他地方指定 nonce（包括 Laravel [入门套件](/docs/{{version}}/starter-kits) 附带的 [Ziggy `@route` 指令](https://github.com/tighten/ziggy#using-routes-with-a-content-security-policy)），可以使用 `cspNonce` 方法获取它：

```blade
@routes(nonce: Vite::cspNonce())
```

如果你已经有一个想让 Laravel 使用的 nonce，可以将该 nonce 传给 `useCspNonce` 方法：

```php
Vite::useCspNonce($nonce);
```

### 子资源完整性（SRI）

如果你的 Vite 清单中包含资源的 `integrity` 哈希，Laravel 会自动在为资源生成的任何脚本和样式标签上添加 `integrity` 属性，以强制执行 [子资源完整性](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)。默认情况下，Vite 不会在其清单中包含 `integrity` 哈希，但你可以通过安装 [vite-plugin-manifest-sri](https://www.npmjs.com/package/vite-plugin-manifest-sri) NPM 插件来启用它：

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

如果需要，你还可以自定义可以找到完整性哈希的清单键：

```php
use Illuminate\Support\Facades\Vite;

Vite::useIntegrityKey('custom-integrity-key');
```

如果你想完全禁用这种自动检测，可以向 `useIntegrityKey` 方法传入 `false`：

```php
Vite::useIntegrityKey(false);
```

### 任意属性

如果你需要在脚本和样式标签上包含额外的属性（例如 [data-turbo-track](https://turbo.hotwired.dev/handbook/drive#reloading-when-assets-change) 属性），可以通过 `useScriptTagAttributes` 和 `useStyleTagAttributes` 方法指定它们。通常，这些方法应当从 [服务提供者](/docs/{{version}}/providers) 中调用：

```php
use Illuminate\Support\Facades\Vite;

Vite::useScriptTagAttributes([
    'data-turbo-track' => 'reload', // 为属性指定一个值……
    'async' => true, // 指定一个不带值的属性……
    'integrity' => false, // 排除一个本会被包含的属性……
]);

Vite::useStyleTagAttributes([
    'data-turbo-track' => 'reload',
]);
```

如果你需要有条件地添加属性，可以传入一个回调，该回调会接收到资源源路径、其 URL、其清单分块以及整个清单：

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
> 在 Vite 开发服务器运行期间，`$chunk` 和 `$manifest` 参数会是 `null`。

## 高级自定义

开箱即用，Laravel 的 Vite 插件使用了合理的约定，应当适用于大多数应用；不过，有时你可能需要自定义 Vite 的行为。为了提供额外的自定义选项，我们提供了以下方法和选项，可用于替代 `@vite` Blade 指令：

```blade
<!doctype html>
<head>
    {{-- ... --}}

    {{
        Vite::useHotFile(storage_path('vite.hot')) // 自定义 "hot" 文件……
            ->useBuildDirectory('bundle') // 自定义构建目录……
            ->useManifestFilename('assets.json') // 自定义清单文件名……
            ->withEntryPoints(['resources/js/app.js']) // 指定入口点……
            ->createAssetPathsUsing(function (string $path, ?bool $secure) { // 自定义已构建资源的后端路径生成……
                return "https://cdn.example.com/{$path}";
            })
    }}
</head>
```

在 `vite.config.js` 文件中，你应当指定相同的配置：

```js
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            hotFile: 'storage/vite.hot', // 自定义 "hot" 文件……
            buildDirectory: 'bundle', // 自定义构建目录……
            input: ['resources/js/app.js'], // 指定入口点……
        }),
    ],
    build: {
      manifest: 'assets.json', // 自定义清单文件名……
    },
});
```

### 开发服务器跨源资源共享（CORS）

如果你在从 Vite 开发服务器获取资源时，于浏览器中遇到跨源资源共享（CORS）问题，可能需要为开发服务器授予你的自定义源访问权限。Vite 与 Laravel 插件组合后，无需任何额外配置即可允许以下源：

- `::1`
- `127.0.0.1`
- `localhost`
- `*.test`
- `*.localhost`
- 项目 `.env` 中的 `APP_URL`

为项目允许自定义源最简单的方式，是确保应用的 `APP_URL` 环境变量与你浏览器中访问的源相匹配。例如，如果你访问的是 `https://my-app.laravel`，应当将 `.env` 更新为相匹配：

```env
APP_URL=https://my-app.laravel
```

如果你需要对允许的源进行更细粒度的控制（例如支持多个源），应当使用 [Vite 全面而灵活的内置 CORS 服务器配置](https://vite.dev/config/server-options.html#server-cors)。例如，你可以在项目的 `vite.config.js` 文件中，于 `server.cors.origin` 配置选项中指定多个源：

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

你还可以包含正则表达式模式，当你想允许某个给定顶级域名（例如 `*.laravel`）的所有源时，这会很有帮助：

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

### 修正开发服务器 URL

Vite 生态中的某些插件假设以斜杠开头的 URL 始终指向 Vite 开发服务器。然而，由于 Laravel 集成的特性，事实并非如此。

例如，`vite-imagetools` 插件在 Vite 为你的资源提供服务时，会输出如下 URL：

```html
<img src="/@imagetools/f0b2f404b13f052c604e632f2fb60381bf61a520">
```

`vite-imagetools` 插件期望 Vite 拦截该输出 URL，然后插件就可以处理所有以 `/@imagetools` 开头的 URL。如果你使用的插件期望这种行为，就需要手动修正这些 URL。你可以在 `vite.config.js` 文件中，使用 `transformOnServe` 选项来完成。

在这个特定示例中，我们会在生成的代码中，为所有出现的 `/@imagetools` 加上开发服务器的 URL 前缀：

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
