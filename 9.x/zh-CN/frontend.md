# 前端

- [简介](#introduction)
- [使用 PHP](#using-php)
    - [PHP 与 Blade](#php-and-blade)
    - [Livewire](#livewire)
    - [入门套件](#php-starter-kits)
- [使用 Vue / React](#using-vue-react)
    - [Inertia](#inertia)
    - [入门套件](#inertia-starter-kits)
- [资源打包](#bundling-assets)

<a name="introduction"></a>
## 简介

Laravel 是一个后端框架，提供了构建现代 Web 应用所需的所有功能，例如[路由](/docs/{{version}}/routing)、[验证](/docs/{{version}}/validation)、[缓存](/docs/{{version}}/cache)、[队列](/docs/{{version}}/queues)、[文件存储](/docs/{{version}}/filesystem)等。然而，我们相信为开发者提供优美的全栈体验同样重要，包括构建应用前端的强大方案。

使用 Laravel 构建应用时，前端开发主要有两种方式，选择哪种方式取决于你是希望通过 PHP 还是使用 Vue 和 React 等 JavaScript 框架来构建前端。下面我们将讨论这两种方案，帮助你为应用的前端开发做出最佳决策。

<a name="using-php"></a>
## 使用 PHP

<a name="php-and-blade"></a>
### PHP 与 Blade

过去，大多数 PHP 应用通过简单的 HTML 模板向浏览器渲染 HTML，模板中穿插着 PHP `echo` 语句来输出请求期间从数据库检索的数据：

```blade
<div>
    <?php foreach ($users as $user): ?>
        Hello, <?php echo $user->name; ?> <br />
    <?php endforeach; ?>
</div>
```

在 Laravel 中，仍然可以使用[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade)来实现这种 HTML 渲染方式。Blade 是一种极其轻量的模板语言，提供了便捷、简洁的语法来显示数据、遍历数据等：

```blade
<div>
    @foreach ($users as $user)
        Hello, {{ $user->name }} <br />
    @endforeach
</div>
```

以这种方式构建应用时，表单提交和其他页面交互通常会从服务器接收一个全新的 HTML 文档，浏览器会重新渲染整个页面。即使在今天，许多应用仍然非常适合使用简单的 Blade 模板以这种方式构建前端。

<a name="growing-expectations"></a>
#### 不断增长的期望

然而，随着用户对 Web 应用期望的成熟，许多开发者发现需要构建更具动态性的前端，使交互体验更加精致。有鉴于此，一些开发者选择使用 Vue 和 React 等 JavaScript 框架来构建应用前端。

另一些开发者则倾向于继续使用他们熟悉的后端语言，并开发了相应的解决方案，允许在主要使用所选后端语言的同时构建现代 Web 应用 UI。例如，在 [Rails](https://rubyonrails.org/) 生态系统中，这催生了 [Turbo](https://turbo.hotwired.dev/) [Hotwire](https://hotwired.dev/) 和 [Stimulus](https://stimulus.hotwired.dev/) 等库的诞生。

在 Laravel 生态系统中，主要通过 PHP 创建现代、动态前端的需求促成了 [Laravel Livewire](https://laravel-livewire.com) 和 [Alpine.js](https://alpinejs.dev/) 的诞生。

<a name="livewire"></a>
### Livewire

[Laravel Livewire](https://laravel-livewire.com) 是一个用于构建 Laravel 驱动前端的框架，其前端体验如同使用 Vue 和 React 等现代 JavaScript 框架构建的前端一样动态、现代且充满活力。

使用 Livewire 时，你将创建 Livewire「组件」，每个组件渲染 UI 的一个独立部分，并暴露可从前端调用和交互的方法与数据。例如，一个简单的「Counter」组件可能如下所示：

```php
<?php

namespace App\Http\Livewire;

use Livewire\Component;

class Counter extends Component
{
    public $count = 0;

    public function increment()
    {
        $this->count++;
    }

    public function render()
    {
        return view('livewire.counter');
    }
}
```

对应的计数器模板如下编写：

```blade
<div>
    <button wire:click="increment">+</button>
    <h1>{{ $count }}</h1>
</div>
```

如你所见，Livewire 允许你编写新的 HTML 属性（如 `wire:click`）来连接 Laravel 应用的前端和后端。此外，你可以使用简单的 Blade 表达式来渲染组件的当前状态。

对许多人来说，Livewire 彻底改变了 Laravel 的前端开发方式，让他们在构建现代、动态 Web 应用的同时保持在 Laravel 的舒适区内。通常，使用 Livewire 的开发者还会利用 [Alpine.js](https://alpinejs.dev/) 在前端仅在需要的地方「点缀」JavaScript，例如用于渲染对话框窗口。

如果你是 Laravel 新手，我们建议先熟悉[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade)的基本用法。然后，查阅官方 [Laravel Livewire 文档](https://laravel-livewire.com/docs)，学习如何通过交互式 Livewire 组件将应用提升到新的水平。

<a name="php-starter-kits"></a>
### 入门套件

如果你想使用 PHP 和 Livewire 构建前端，可以利用我们的 Breeze 或 Jetstream [入门套件](/docs/{{version}}/starter-kits)来快速启动应用开发。这两个入门套件都使用 [Blade](/docs/{{version}}/blade) 和 [Tailwind](https://tailwindcss.com) 为应用搭建后端和前端认证流程，让你可以直接开始构建下一个伟大的创意。

<a name="using-vue-react"></a>
## 使用 Vue / React

虽然可以使用 Laravel 和 Livewire 构建现代前端，但许多开发者仍然倾向于利用 Vue 或 React 等 JavaScript 框架的强大功能。这使开发者能够充分利用通过 NPM 提供的丰富 JavaScript 包和工具生态系统。

然而，如果没有额外的工具支持，将 Laravel 与 Vue 或 React 配合使用会面临一系列复杂问题，如客户端路由、数据水合（hydration）和认证。客户端路由通常可以通过使用 [Nuxt](https://nuxt.com/) 和 [Next](https://nextjs.org/) 等约定式 Vue / React 框架来简化；但是，当将 Laravel 这样的后端框架与这些前端框架配合使用时，数据水合和认证仍然是复杂且繁琐的问题。

此外，开发者还需要维护两个独立的代码仓库，经常需要在两个仓库之间协调维护、发布和部署。虽然这些问题并非无法解决，但我们认为这不是一种高效或令人愉悦的应用开发方式。

<a name="inertia"></a>
### Inertia

幸运的是，Laravel 提供了两全其美的方案。[Inertia](https://inertiajs.com) 在 Laravel 应用和现代 Vue 或 React 前端之间架起了桥梁，让你能够使用 Vue 或 React 构建功能完善的现代前端，同时利用 Laravel 的路由和控制器来处理路由、数据水合和认证——所有这些都在同一个代码仓库中完成。通过这种方式，你可以同时享受 Laravel 和 Vue / React 的全部功能，而不会削弱任何一个工具的能力。

在 Laravel 应用中安装 Inertia 后，你可以像往常一样编写路由和控制器。但是，你不再从控制器返回 Blade 模板，而是返回一个 Inertia 页面：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * 显示指定用户的个人资料。
     *
     * @param  int  $id
     * @return \Inertia\Response
     */
    public function show($id)
    {
        return Inertia::render('Users/Profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

Inertia 页面对应一个 Vue 或 React 组件，通常存储在应用的 `resources/js/Pages` 目录中。通过 `Inertia::render` 方法传递给页面的数据将用于水合页面组件的「props」：

```vue
<script setup>
import Layout from '@/Layouts/Authenticated.vue';
import { Head } from '@inertiajs/inertia-vue3';

const props = defineProps(['user']);
</script>

<template>
    <Head title="User Profile" />

    <Layout>
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 leading-tight">
                Profile
            </h2>
        </template>

        <div class="py-12">
            Hello, {{ user.name }}
        </div>
    </Layout>
</template>
```

如你所见，Inertia 让你在构建前端时充分利用 Vue 或 React 的全部功能，同时在 Laravel 驱动的后端和 JavaScript 驱动的前端之间提供了一座轻量级的桥梁。

#### 服务端渲染

如果你因为应用需要服务端渲染而对使用 Inertia 有所顾虑，不必担心。Inertia 提供了[服务端渲染支持](https://inertiajs.com/server-side-rendering)。而且，当你通过 [Laravel Forge](https://forge.laravel.com) 部署应用时，确保 Inertia 的服务端渲染进程始终运行非常轻松。

<a name="inertia-starter-kits"></a>
### 入门套件

如果你想使用 Inertia 和 Vue / React 构建前端，可以利用我们的 Breeze 或 Jetstream [入门套件](/docs/{{version}}/starter-kits#breeze-and-inertia)来快速启动应用开发。这两个入门套件都使用 Inertia、Vue / React、[Tailwind](https://tailwindcss.com) 和 [Vite](https://vitejs.dev) 为应用搭建后端和前端认证流程，让你可以开始构建下一个伟大的创意。

<a name="bundling-assets"></a>
## 资源打包

无论你选择使用 Blade 和 Livewire 还是 Vue / React 和 Inertia 开发前端，你很可能都需要将应用的 CSS 打包为生产可用的资源。当然，如果你选择使用 Vue 或 React 构建应用前端，还需要将组件打包为浏览器可用的 JavaScript 资源。

默认情况下，Laravel 使用 [Vite](https://vitejs.dev) 来打包资源。Vite 提供了极速的构建时间和本地开发期间近乎即时的热模块替换（HMR）。在所有新的 Laravel 应用中，包括使用我们[入门套件](/docs/{{version}}/starter-kits)的应用，你都会找到一个 `vite.config.js` 文件，该文件加载了我们的轻量级 Laravel Vite 插件，使 Vite 在 Laravel 应用中使用起来非常愉悦。

开始使用 Laravel 和 Vite 的最快方式是使用 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze) 开始应用开发，这是我们最简单的入门套件，通过提供前端和后端认证脚手架来快速启动你的应用。

> **Note**
> 有关在 Laravel 中使用 Vite 的更详细文档，请参阅我们[关于打包和编译资源的专门文档](/docs/{{version}}/vite)。
