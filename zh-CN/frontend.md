# 前端

## 简介

Laravel 是一个后端框架，提供了构建现代 Web 应用所需的全部功能，例如 [路由](/docs/{{version}}/routing)、[验证](/docs/{{version}}/validation)、[缓存](/docs/{{version}}/cache)、[队列](/docs/{{version}}/queues)、[文件存储](/docs/{{version}}/filesystem) 等。但我们一直认为，为开发者提供完整的全栈体验同样重要——包括构建应用前端时所需的强大方案。

使用 Laravel 构建应用时，有两种主要的前端开发方式——选择哪种取决于你希望用 PHP 构建前端，还是使用 React、Svelte 和 Vue 等 JavaScript 框架。下面我们会分别介绍这两种方案，方便你做出最符合应用需求的选择。

## 使用 PHP

### PHP 与 Blade

过去，大多数 PHP 应用通过简单的 HTML 模板渲染浏览器视图，并夹杂 PHP 的 `echo` 语句输出请求期间从数据库取回的数据：

```blade
<div>
    <?php foreach ($users as $user): ?>
        Hello, <?php echo $user->name; ?> <br />
    <?php endforeach; ?>
</div>
```

在 Laravel 中，依然可以使用 [视图](/docs/{{version}}/views) 和 [Blade](/docs/{{version}}/blade) 实现这种渲染方式。Blade 是一种非常轻量的模板语言，用简洁的语法完成数据展示、迭代等操作：

```blade
<div>
    @foreach ($users as $user)
        Hello, {{ $user->name }} <br />
    @endforeach
</div>
```

按这种模式构建应用时，表单提交与其他页面交互通常会从服务端收到一个完整的 HTML 文档，浏览器重新渲染整页。时至今日，许多应用仍然非常适合用这种简单 Blade 模板搭建前端。

#### 持续增长的预期

然而，随着用户对 Web 应用的期望日益提升，许多开发者发现需要构建更有活力、交互更精致的前端。为此，一部分开发者选择用 React、Svelte、Vue 等 JavaScript 框架来构建应用的前端。

另一些开发者更倾向沿用熟悉的后端语言，于是开发出了一些方案，让我们继续主要使用后端语言的同时，构建出现代化的 Web UI。例如，在 [Rails](https://rubyonrails.org/) 生态，这催生了 [Turbo](https://turbo.hotwired.dev/)、[Hotwire](https://hotwired.dev/) 和 [Stimulus](https://stimulus.hotwired.dev/) 等库。

在 Laravel 生态中，主要使用 PHP 构建现代化动态前端的需求催生了 [Laravel Livewire](https://livewire.laravel.com) 和 [Alpine.js](https://alpinejs.dev/)。

### Livewire

[Laravel Livewire](https://livewire.laravel.com) 是一个专门为 Laravel 设计的前端框架，让前端像 React、Svelte、Vue 等现代 JavaScript 框架一样，充满活力、现代感和"鲜活感"。

使用 Livewire 时，你会创建 Livewire「组件」，用于渲染 UI 的特定片段，并对外暴露可被前端调用和交互的方法与数据。例如，一个简单的「计数器」组件可能长这样：

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

可以看到，Livewire 让你可以使用 `wire:click` 这样的新 HTML 属性，把 Laravel 应用的前后端连接起来。此外，你可以用简洁的 Blade 表达式渲染组件的当前状态。

对很多人来说，Livewire 革新了 Laravel 的前端开发——保持 Laravel 的熟悉度，又能构建现代化、动态化的 Web 应用。通常，使用 Livewire 的开发者还会使用 [Alpine.js](https://alpinejs.dev/)，在仅需要的地方"点缀"JavaScript——例如渲染一个对话框。

如果你是 Laravel 新手，建议先熟悉 [视图](/docs/{{version}}/views) 与 [Blade](/docs/{{version}}/blade) 的基础用法，再查阅 [Laravel Livewire 官方文档](https://livewire.laravel.com/docs)，学会用交互式 Livewire 组件让应用达到新的高度。

### 入门套件

如果你想用 PHP 和 Livewire 构建前端，可以使用 [Livewire 入门套件](/docs/{{version}}/starter-kits) 来快速启动应用开发。

## 使用 React、Svelte 或 Vue

尽管用 Laravel + Livewire 完全可以构建现代化的前端，许多开发者仍然倾向于发挥 React、Svelte 或 Vue 等 JavaScript 框架的力量。这能让他们利用 NPM 上丰富的 JavaScript 包与工具生态。

但如果不借助额外工具，把 Laravel 与 React、Svelte 或 Vue 搭配使用时，仍需要解决不少棘手问题，比如客户端路由、数据水合与认证。客户端路由通常可以借助 [Next](https://nextjs.org/) 或 [Nuxt](https://nuxt.com/) 等定制化的 React / Svelte / Vue 框架简化；但数据水合与认证，仍然是与 Laravel 这类后端框架搭配这些前端框架时的痛点。

此外，开发者需要同时维护两个代码仓库，常常要在两边协调维护、发布与部署。这些问题虽非不能解决，但我们并不认为这是一种高效、愉悦的开发方式。

### Inertia

幸运的是，Laravel 提供了"鱼与熊掌兼得"的方案。[Inertia](https://inertiajs.com) 在 Laravel 应用与现代 React、Svelte 或 Vue 前端之间架起了一座桥梁——让你在单一代码仓库中，用 React、Svelte 或 Vue 构建功能完备的现代前端，同时复用 Laravel 路由与控制器来做路由、数据水合和认证。这样既能享受 Laravel 的全部能力，也不损失 React / Svelte / Vue 的能力。

把 Inertia 安装到 Laravel 应用后，你可以像平常一样编写路由与控制器。只是控制器不再返回 Blade 模板，而是返回一个 Inertia 页面：

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * 展示指定用户的资料。
     */
    public function show(string $id): Response
    {
        return Inertia::render('users/show', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

Inertia 页面对应一个 React、Svelte 或 Vue 组件，通常放在应用的 `resources/js/pages` 目录下。通过 `Inertia::render` 方法传给页面的数据，会被用于水合页面组件的「props」：

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

可以看到，Inertia 让你在构建前端时既能发挥 React、Svelte 或 Vue 的全部能力，又能在 Laravel 后端与 JavaScript 前端之间搭起一座轻量级的桥梁。

#### 服务端渲染（SSR）

如果你担心应用需要服务端渲染而犹豫是否采用 Inertia，请放心——Inertia 提供 [服务端渲染支持](https://inertiajs.com/server-side-rendering)。而且，通过 [Laravel Cloud](https://cloud.laravel.com) 或 [Laravel Forge](https://forge.laravel.com) 部署应用时，确保 Inertia 的服务端渲染进程始终保持运行非常容易。

### 入门套件

如果你想用 Inertia + React / Svelte / Vue 构建前端，可以使用我们的 [React、Svelte 或 Vue 入门套件](/docs/{{version}}/starter-kits) 来快速启动应用开发。这些套件会基于 Inertia、React / Svelte / Vue、[Tailwind](https://tailwindcss.com) 与 [Vite](https://vitejs.dev)，为你搭建好前后端认证流程，方便你立即着手实现下一个创意。

## 打包资源

无论选择 Blade + Livewire 还是 React / Svelte / Vue + Inertia 来构建前端，几乎都需要把应用 CSS 打包成可直接上线的资源。当然，如果选用 React、Svelte 或 Vue，还需要把组件打包成可在浏览器中直接运行的 JavaScript 资源。

Laravel 默认使用 [Vite](https://vitejs.dev) 来打包资源。Vite 提供闪电般的构建速度，以及在本地开发中近乎即时的模块热替换（HMR）。在所有全新的 Laravel 应用（包括使用我们的 [入门套件](/docs/{{version}}/starter-kits) 的应用）中，都会有一个 `vite.config.js` 文件，它会加载我们轻量级的 Laravel Vite 插件，让 Vite 与 Laravel 协作更顺畅。

最快的入门方法是直接使用 [应用入门套件](/docs/{{version}}/starter-kits) 启动你的应用开发，它通过预置的前后端认证脚手架，让你的应用一上来就具备完整形态。

> [!NOTE]
> 关于如何在 Laravel 中使用 Vite 的更多细节，请参考我们的 [资源打包与编译专项文档](/docs/{{version}}/vite)。
