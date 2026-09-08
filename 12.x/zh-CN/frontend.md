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

Laravel 是一个后端框架，提供了构建现代 Web 应用所需的全部功能，例如[路由](/docs/{{version}}/routing)、[验证](/docs/{{version}}/validation)、[缓存](/docs/{{version}}/cache)、[队列](/docs/{{version}}/queues)、[文件存储](/docs/{{version}}/filesystem)等。不过，我们相信为开发者提供优美的全栈体验同样重要，其中包括构建应用前端的强大方案。

使用 Laravel 构建应用时，主要有两种前端开发方式，选择哪一种取决于你想借助 PHP，还是使用 React、Svelte、Vue 等 JavaScript 框架来构建前端。下面我们将逐一讨论这两种选择，帮助你为应用的前端开发做出明智决策。

<a name="using-php"></a>
## 使用 PHP

<a name="php-and-blade"></a>
### PHP 与 Blade

过去，大多数 PHP 应用通过简单的 HTML 模板向浏览器渲染 HTML，模板中穿插着 PHP `echo` 语句，用于输出请求期间从数据库检索到的数据：

```blade
<div>
    <?php foreach ($users as $user): ?>
        Hello, <?php echo $user->name; ?> <br />
    <?php endforeach; ?>
</div>
```

在 Laravel 中，仍然可以借助[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade) 实现这种 HTML 渲染方式。Blade 是一门极其轻量的模板语言，为展示数据、遍历数据等操作提供了便捷、简短的语法：

```blade
<div>
    @foreach ($users as $user)
        Hello, {{ $user->name }} <br />
    @endforeach
</div>
```

以这种方式构建应用时，表单提交和其他页面交互通常会从服务器收到一份全新的 HTML 文档，浏览器会重新渲染整个页面。即使在今天，许多应用也非常适合用简单的 Blade 模板以这种方式构建前端。

<a name="growing-expectations"></a>
#### 不断增长的期望

然而，随着用户对 Web 应用的期望日益成熟，许多开发者发现需要构建交互更加流畅、体验更加精致的前端。有鉴于此，一些开发者选择开始使用 React、Svelte、Vue 等 JavaScript 框架来构建应用前端。

另一些开发者则更愿意坚持使用自己熟悉的后端语言，并开发出了相应的解决方案，让他们仍以自己选择的后端语言为主来构建现代 Web 应用的 UI。例如，在 [Rails](https://rubyonrails.org/) 生态中，这一需求催生了 [Turbo](https://turbo.hotwired.dev/)[Hotwire](https://hotwired.dev/) 和 [Stimulus](https://stimulus.hotwired.dev/) 等库。

在 Laravel 生态中，以 PHP 为主构建现代、动态前端的需求催生了 [Laravel Livewire](https://livewire.laravel.com) 和 [Alpine.js](https://alpinejs.dev/)。

<a name="livewire"></a>
### Livewire

[Laravel Livewire](https://livewire.laravel.com) 是一个用于构建由 Laravel 驱动的前端的框架，用它构建的前端如同用 React、Svelte、Vue 等现代 JavaScript 框架构建的前端一样，充满动态感、现代感和活力。

使用 Livewire 时，你会创建 Livewire「组件」，每个组件渲染 UI 的一个独立部分，并暴露可从应用前端调用和交互的方法与数据。例如，一个简单的「计数器」组件可能如下所示：

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

如你所见，Livewire 让你能够编写 `wire:click` 之类的新 HTML 属性，将 Laravel 应用的前端与后端连接起来。此外，你还可以用简单的 Blade 表达式渲染组件的当前状态。

对许多人而言，Livewire 彻底改变了 Laravel 的前端开发方式，让他们在享受 Laravel 舒适生态的同时构建现代、动态的 Web 应用。通常，使用 Livewire 的开发者还会借助 [Alpine.js](https://alpinejs.dev/)，只在必要之处为前端「点缀」少量 JavaScript，例如渲染对话框窗口。

如果你刚接触 Laravel，我们建议你先熟悉[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade) 的基本用法。然后，查阅 [Laravel Livewire 官方文档](https://livewire.laravel.com/docs)，学习如何用交互式 Livewire 组件将你的应用提升到新的水平。

<a name="php-starter-kits"></a>
### 入门套件

如果你想使用 PHP 和 Livewire 构建前端，可以借助我们的 [Livewire 入门套件](/docs/{{version}}/starter-kits)来快速启动应用开发。

<a name="using-react-svelte-or-vue"></a>
## 使用 React、Svelte 或 Vue

虽然可以结合 Laravel 和 Livewire 构建现代前端，但许多开发者仍更青睐 React、Svelte、Vue 这类 JavaScript 框架的强大能力。这样开发者就能利用 NPM 上丰富的 JavaScript 包和工具生态。

然而，如果没有额外的工具支持，将 Laravel 与 React、Svelte、Vue 搭配使用，就需要解决客户端路由、数据注水（hydration）、认证等一系列复杂问题。使用 [Next](https://nextjs.org/) 和 [Nuxt](https://nuxt.com/) 这类约定式的 React / Svelte / Vue 框架可以简化客户端路由；但将 Laravel 这样的后端框架与这些前端框架搭配时，数据注水和认证仍是复杂而繁琐的问题。

此外，开发者还不得不维护两个独立的代码仓库，并且常常需要在两个仓库之间协调维护、发布和部署。虽然这些问题并非无法克服，但我们认为这不是一种高效或愉快的应用开发方式。

<a name="inertia"></a>
### Inertia

好在 Laravel 提供了两全其美的方案。[Inertia](https://inertiajs.com) 在你的 Laravel 应用与 React、Svelte、Vue 现代前端之间架起了桥梁，让你在利用 Laravel 路由和控制器处理路由、数据注水和认证的同时，用 React、Svelte、Vue 构建功能完善的现代前端——所有代码都在同一个仓库中。采用这种方式，你可以同时发挥 Laravel 和 React / Svelte / Vue 的全部威力，而不会削弱任何一方的功能。

在 Laravel 应用中安装 Inertia 后，你会像平常一样编写路由和控制器。不过，控制器不再返回 Blade 模板，而是返回一个 Inertia 页面：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * 显示指定用户的个人资料。
     */
    public function show(string $id): Response
    {
        return Inertia::render('users/show', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

Inertia 页面对应一个 React、Svelte 或 Vue 组件，通常存放在应用的 `resources/js/pages` 目录中。通过 `Inertia::render` 方法传给页面的数据，将用于注水页面组件的「props」：

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

如你所见，Inertia 让你在构建前端时充分发挥 React、Svelte、Vue 的全部能力，同时在 Laravel 驱动的后端与 JavaScript 驱动的前端之间架起一座轻量的桥梁。

#### 服务端渲染

如果你的应用需要服务端渲染，因而对使用 Inertia 有所顾虑，请不必担心。Inertia 提供[服务端渲染支持](https://inertiajs.com/server-side-rendering)。而且，通过 [Laravel Cloud](https://cloud.laravel.com) 或 [Laravel Forge](https://forge.laravel.com) 部署应用时，确保 Inertia 的服务端渲染进程始终运行也非常轻松。

<a name="inertia-starter-kits"></a>
### 入门套件

如果你想使用 Inertia 和 React / Svelte / Vue 构建前端，可以借助我们的 [React、Svelte 或 Vue 应用入门套件](/docs/{{version}}/starter-kits)来快速启动应用开发。这两个入门套件都会使用 Inertia、React / Svelte / Vue、[Tailwind](https://tailwindcss.com) 和 [Vite](https://vitejs.dev)，为你的应用前后端认证流程搭建脚手架，让你可以直接开始构建下一个宏伟创意。

<a name="bundling-assets"></a>
## 打包资源

无论你选择使用 Blade 和 Livewire，还是 React / Svelte / Vue 和 Inertia 来开发前端，多半都需要将应用的 CSS 打包为可用于生产环境的资源。当然，如果你选择用 React、Svelte、Vue 构建应用前端，还需要将组件打包为可在浏览器中运行的 JavaScript 资源。

默认情况下，Laravel 使用 [Vite](https://vitejs.dev) 打包资源。Vite 提供闪电般的构建速度，以及本地开发期间近乎即时的热模块替换（HMR）。在所有新的 Laravel 应用（包括使用我们[入门套件](/docs/{{version}}/starter-kits)的应用）中，你都会找到一个 `vite.config.js` 文件，它加载了我们轻量的 Laravel Vite 插件，让 Vite 与 Laravel 应用搭配使用成为一种享受。

上手 Laravel 和 Vite 最快的方式，是使用[我们的应用入门套件](/docs/{{version}}/starter-kits)开始应用开发，它通过提供前后端认证脚手架来帮助你快速启动应用。

> [!NOTE]
> 关于在 Laravel 中使用 Vite 的更详细文档，请参阅我们[专门的资源打包与编译文档](/docs/{{version}}/vite)。
