# 前端

- [简介](#introduction)
- [使用 PHP](#using-php)
    - [PHP 与 Blade](#php-and-blade)
    - [Livewire](#livewire)
    - [入门套件](#php-starter-kits)
- [使用 React、Svelte 或 Vue](#using-react-svelte-or-vue)
    - [Inertia](#inertia)
    - [入门套件](#inertia-starter-kits)
- [打包资源](#bundling-assets)

<a name="introduction"></a>
## 简介

Laravel 是一个后端框架，提供了构建现代 Web 应用所需的全部功能，例如[路由](/docs/{{version}}/routing)、[验证](/docs/{{version}}/validation)、[缓存](/docs/{{version}}/cache)、[队列](/docs/{{version}}/queues)、[文件存储](/docs/{{version}}/filesystem) 等。不过，我们相信为开发者提供优雅的全栈体验非常重要，包括构建应用前端的强大方案。

在使用 Laravel 构建应用时，主要有两种方式来开展前端开发，选择哪种方式取决于你希望利用 PHP 还是使用 React、Svelte 和 Vue 等 JavaScript 框架来构建前端。下面我们将讨论这两种选择，以便你就应用前端开发的最佳方案做出明智的决定。

<a name="using-php"></a>
## 使用 PHP

<a name="php-and-blade"></a>
### PHP 与 Blade

过去，大多数 PHP 应用通过简单的 HTML 模板，并穿插 PHP `echo` 语句来向浏览器渲染 HTML，这些语句会渲染在请求期间从数据库检索到的数据：

```blade
<div>
    <?php foreach ($users as $user): ?>
        Hello, <?php echo $user->name; ?> <br />
    <?php endforeach; ?>
</div>
```

在 Laravel 中，这种渲染 HTML 的方式仍然可以使用[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade) 来实现。Blade 是一门极其轻量的模板语言，提供了用于显示数据、遍历数据等操作的便捷简短语法：

```blade
<div>
    @foreach ($users as $user)
        Hello, {{ $user->name }} <br />
    @endforeach
</div>
```

以这种方式构建应用时，表单提交以及其他页面交互通常会从服务器接收一个全新的 HTML 文档，并由浏览器重新渲染整个页面。即使在今天，许多应用仍然非常适合使用简单的 Blade 模板以这种方式构建其前端。

<a name="growing-expectations"></a>
#### 不断增长的期望

然而，随着用户对 Web 应用的期望日益成熟，许多开发者发现需要构建更具动态性、交互更精致的前端。鉴于此，一些开发者选择开始使用 React、Svelte 和 Vue 等 JavaScript 框架来构建应用的前端。

另一些更愿意坚持使用自己熟悉的后端语言的开发者，则开发出了一些解决方案，能够在仍然主要使用自己选择的后端语言的同时，构建出现代 Web 应用的 UI。例如，在 [Rails](https://rubyonrails.org/) 生态中，这促使了 [Turbo](https://turbo.hotwired.dev/)、[Hotwire](https://hotwired.dev/) 和 [Stimulus](https://stimulus.hotwired.dev/) 等库的诞生。

在 Laravel 生态中，主要通过使用 PHP 来创建现代、动态前端的需求，催生了 [Laravel Livewire](https://livewire.laravel.com) 和 [Alpine.js](https://alpinejs.dev/)。

<a name="livewire"></a>
### Livewire

[Laravel Livewire](https://livewire.laravel.com) 是一个用于构建具备 Laravel 驱动的前端的框架，它带来的体验动态、现代且鲜活，就像使用 React、Svelte 和 Vue 等现代 JavaScript 框架构建的前端一样。

使用 Livewire 时，你会创建 Livewire "组件"，这些组件渲染 UI 的一个独立部分，并暴露方法和数据，可供应用前端调用和交互。例如，一个简单的 "Counter" 组件可能如下所示：

```php
<?php

use Livewire\Component;

new class extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }
};
?>

<div>
    <button wire:click="increment">+</button>
    <h1>{{ $count }}</h1>
</div>

```

如你所见，Livewire 让你可以编写 `wire:click` 等新的 HTML 属性，将 Laravel 应用的前端和后端连接起来。此外，你还可以使用简单的 Blade 表达式来渲染组件的当前状态。

对许多人来说，Livewire 彻底改变了 Laravel 的前端开发，让他们能够在构建现代、动态 Web 应用的同时，停留在 Laravel 的舒适区中。通常，使用 Livewire 的开发者还会利用 [Alpine.js](https://alpinejs.dev/) 在需要的地方（例如渲染对话框窗口时）将 JavaScript "点缀" 到前端。

如果你是 Laravel 的新手，我们建议先熟悉[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade) 的基本用法。然后，查阅官方的 [Laravel Livewire 文档](https://livewire.laravel.com/docs)，了解如何通过交互式 Livewire 组件将你的应用提升到新的高度。

<a name="php-starter-kits"></a>
### 入门套件

如果你希望使用 PHP 和 Livewire 构建前端，可以利用我们的 [Livewire 入门套件](/docs/{{version}}/starter-kits) 来快速启动应用的开发。

<a name="using-react-svelte-or-vue"></a>
## 使用 React、Svelte 或 Vue

尽管可以使用 Laravel 和 Livewire 构建现代前端，许多开发者仍然倾向于利用 React、Svelte 或 Vue 等 JavaScript 框架的强大能力。这让开发者能够利用通过 NPM 提供的丰富 JavaScript 包和工具生态。

然而，如果没有额外的工具，将 Laravel 与 React、Svelte 或 Vue 搭配使用会让我们需要解决各种复杂的问题，例如客户端路由、数据水合（hydration）以及认证。客户端路由通常可以通过使用有主见的 React / Svelte / Vue 框架（如 [Next](https://nextjs.org/) 和 [Nuxt](https://nuxt.com/)）来简化；不过，在将 Laravel 等后端框架与这些前端框架搭配使用时，数据水合和认证仍然是复杂且繁琐的问题。

此外，开发者还需要维护两个独立的代码仓库，经常需要协调两个仓库的维护、发布和部署。虽然这些问题并非不可逾越，但我们认为这不是一种高效或愉快的应用开发方式。

<a name="inertia"></a>
### Inertia

幸好，Laravel 提供了两全其美的方案。 [Inertia](https://inertiajs.com) 弥合了你的 Laravel 应用与现代 React、Svelte 或 Vue 前端之间的鸿沟，让你能够使用 React、Svelte 或 Vue 构建完整、现代的前端，同时利用 Laravel 的路由和控制器来处理路由、数据水合和认证——而且这一切都在单一代码仓库中完成。采用这种方式，你可以同时享受 Laravel 和 React / Svelte / Vue 的全部能力，而不会削弱任一工具的功能。

将 Inertia 安装到 Laravel 应用后，你会像往常一样编写路由和控制器。不过，你不会从控制器返回 Blade 模板，而是返回一个 Inertia 页面：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * 显示给定用户的资料。
     */
    public function show(string $id): Response
    {
        return Inertia::render('users/show', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

Inertia 页面对应一个 React、Svelte 或 Vue 组件，通常存储在应用的 `resources/js/pages` 目录中。通过 `Inertia::render` 方法提供给页面的数据将用于水合（hydrate）页面组件的 "props"：

```jsx
import Layout from '@/layouts/authenticated';
import { Head } from '@inertiajs/react';

export default function Show({ user }) {
    return (
        <Layout>
            <Head title="Welcome" />
            <h1>Welcome</h1>
            <p>Hello {user.name}, welcome to Inertia.</p>
        </Layout>
    )
}
```

如你所见，Inertia 让你在构建前端时能够充分利用 React、Svelte 或 Vue 的全部能力，同时在 Laravel 驱动的后端与 JavaScript 驱动的前端之间提供了一座轻量的桥梁。

#### 服务端渲染

如果你因为应用需要服务端渲染而对接触 Inertia 有所顾虑，不必担心。Inertia 提供了[服务端渲染支持](https://inertiajs.com/server-side-rendering)。而且，当通过 [Laravel Cloud](https://cloud.laravel.com) 或 [Laravel Forge](https://forge.laravel.com) 部署应用时，确保 Inertia 的服务端渲染进程始终运行是一件轻而易举的事。

<a name="inertia-starter-kits"></a>
### 入门套件

如果你希望使用 Inertia 和 React / Svelte / Vue 构建前端，可以利用我们的 [React、Svelte 或 Vue 应用入门套件](/docs/{{version}}/starter-kits) 来快速启动应用的开发。所有这些入门套件都使用 Inertia、React / Svelte / Vue、[Tailwind](https://tailwindcss.com) 和 [Vite](https://vitejs.dev) 搭建应用的后端和前端认证流程，让你可以开始构建下一个伟大的想法。

<a name="bundling-assets"></a>
## 打包资源

无论你选择使用 Blade 和 Livewire，还是使用 React / Svelte / Vue 和 Inertia 来开发前端，你都可能需要将应用的 CSS 打包为可用于生产环境的资源。当然，如果你选择使用 React、Svelte 或 Vue 构建应用的前端，你还需要将组件打包为浏览器可用的 JavaScript 资源。

默认情况下，Laravel 使用 [Vite](https://vitejs.dev) 来打包资源。Vite 提供了极快的构建速度，以及在本地开发期间近乎即时的热模块替换（HMR）。在所有新的 Laravel 应用中，包括使用我们[入门套件](/docs/{{version}}/starter-kits)的应用，你都会找到一个 `vite.config.js` 文件，它会加载我们轻量的 Laravel Vite 插件，让 Vite 与 Laravel 应用配合使用成为一种享受。

开始使用 Laravel 和 Vite 的最快方式，是使用[我们的应用入门套件](/docs/{{version}}/starter-kits)开始应用的开发，它通过提供前端和后端认证脚手架来快速启动你的应用。

> [!NOTE]
> 有关将 Vite 与 Laravel 结合使用的更详细文档，请参阅我们[关于打包和编译资源的专门文档](/docs/{{version}}/vite)。
