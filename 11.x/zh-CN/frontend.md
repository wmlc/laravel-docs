# 前端

- [简介](#introduction)
- [使用 PHP](#using-php)
    - [PHP 与 Blade](#php-and-blade)
    - [Livewire](#livewire)
    - [入门套件](#php-starter-kits)
- [使用 Vue / React](#using-vue-react)
    - [Inertia](#inertia)
    - [入门套件](#inertia-starter-kits)
- [打包资源](#bundling-assets)

<a name="introduction"></a>
## 简介

Laravel 是一个后端框架，提供了构建现代 Web 应用所需的全部功能，例如[路由](/docs/{{version}}/routing)、[验证](/docs/{{version}}/validation)、[缓存](/docs/{{version}}/cache)、[队列](/docs/{{version}}/queues)、[文件存储](/docs/{{version}}/filesystem)等等。不过我们认为，为开发者提供优美的全栈体验也很重要，其中包括构建应用前端的强大方案。

使用 Laravel 构建应用时，前端开发主要有两种方式。选择哪一种取决于你想借助 PHP，还是使用 Vue、React 之类的 JavaScript 框架来构建前端。下面会讨论这两种方案，帮助你就最适合应用的前端开发方式做出明智决定。

<a name="using-php"></a>
## 使用 PHP

<a name="php-and-blade"></a>
### PHP 与 Blade

过去，大多数 PHP 应用通过简单的 HTML 模板渲染 HTML 到浏览器，并在其中穿插 PHP `echo` 语句来输出请求期间从数据库取回的数据：

```blade
<div>
    <?php foreach ($users as $user): ?>
        Hello, <?php echo $user->name; ?> <br />
    <?php endforeach; ?>
</div>
```

在 Laravel 中，这种渲染 HTML 的方式仍然可以通过[视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade)实现。Blade 是一门极轻量的模板语言，提供了方便简洁的语法来展示数据、遍历数据等等：

```blade
<div>
    @foreach ($users as $user)
        Hello, {{ $user->name }} <br />
    @endforeach
</div>
```

以这种方式构建应用时，表单提交和其他页面交互通常会从服务器获取一份全新的 HTML 文档，浏览器随之重新渲染整个页面。时至今日，许多应用仍然非常适合使用简单的 Blade 模板以这种方式构建前端。

<a name="growing-expectations"></a>
#### 日益增长的期待

然而，随着用户对 Web 应用的期待日益成熟，许多开发者发现需要构建更动态、交互体验更精致的前端。正因如此，一些开发者选择使用 Vue、React 等 JavaScript 框架来构建应用的前端。

另一些开发者则更愿意坚持自己熟悉的后端语言，并探索出既能构建现代 Web 应用 UI、又主要使用自己首选后端语言的方案。例如在 [Rails](https://rubyonrails.org/) 生态中，这催生了 [Turbo](https://turbo.hotwired.dev/)、[Hotwire](https://hotwired.dev/) 和 [Stimulus](https://stimulus.hotwired.dev/) 等库。

在 Laravel 生态中，主要使用 PHP 创建现代动态前端的需求，催生了 [Laravel Livewire](https://livewire.laravel.com) 和 [Alpine.js](https://alpinejs.dev/)。

<a name="livewire"></a>
### Livewire

[Laravel Livewire](https://livewire.laravel.com) 是一个用于构建 Laravel 前端的框架，它的前端体验动态、现代且富有生机，与使用 Vue、React 等现代 JavaScript 框架构建的前端别无二致。

使用 Livewire 时，你会创建 Livewire"组件"，用于渲染 UI 的一个离散部分，并暴露可从应用前端调用和交互的方法与数据。例如，一个简单的"计数器"组件可能如下所示：

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

而计数器对应的模板则这样编写：

```blade
<div>
    <button wire:click="increment">+</button>
    <h1>{{ $count }}</h1>
</div>
```

如你所见，Livewire 让你可以编写 `wire:click` 这样的新 HTML 属性，把 Laravel 应用的前端与后端连接起来。此外，你还可以用简单的 Blade 表达式渲染组件的当前状态。

对许多人来说，Livewire 革新了 Laravel 的前端开发方式，让他们得以留在 Laravel 熟悉的舒适区内，同时构建出现代的动态 Web 应用。通常，使用 Livewire 的开发者还会使用 [Alpine.js](https://alpinejs.dev/) 在前端需要的地方（比如渲染对话框时）"撒"一点 JavaScript。

如果你是 Laravel 新手，建议先熟悉 [视图](/docs/{{version}}/views)和 [Blade](/docs/{{version}}/blade)的基本用法。然后查阅 [Laravel Livewire 官方文档](https://livewire.laravel.com/docs)，了解如何用交互式 Livewire 组件把应用提升到新水平。

<a name="php-starter-kits"></a>
### 入门套件

如果你希望使用 PHP 和 Livewire 构建前端，可以利用我们的 Breeze 或 Jetstream [入门套件](/docs/{{version}}/starter-kits)快速启动应用开发。这两个入门套件都使用 [Blade](/docs/{{version}}/blade) 和 [Tailwind](https://tailwindcss.com) 搭建应用的后端与前端认证流程，让你可以直接开始构建下一个大想法。

<a name="using-vue-react"></a>
## 使用 Vue / React

虽然借助 Laravel 和 Livewire 也能构建现代前端，但许多开发者仍更愿意利用 Vue 或 React 这类 JavaScript 框架的能力。这让开发者可以用上通过 NPM 提供的丰富 JavaScript 包和工具生态。

不过，如果不借助额外工具，把 Laravel 与 Vue 或 React 搭配起来会让我们面对一系列复杂问题，比如客户端路由、数据水合（hydration）和认证。客户端路由通常可以通过使用 [Nuxt](https://nuxt.com/) 和 [Next](https://nextjs.org/) 这类有强约定的 Vue / React 框架来简化；然而，把 Laravel 这样的后端框架与这些前端框架搭配时，数据水合和认证仍然是复杂而麻烦的问题。

此外，开发者还需要维护两个独立的代码仓库，常常要在两个仓库之间协调维护、发布和部署。虽然这些问题并非无法解决，但我们认为这不是一种高效或愉快的应用开发方式。

<a name="inertia"></a>
### Inertia

幸运的是，Laravel 提供了两全其美的方案。[Inertia](https://inertiajs.com) 在你的 Laravel 应用与基于 Vue 或 React 的现代前端之间架起桥梁，让你可以在单一代码仓库中构建完整且现代的 Vue 或 React 前端，同时利用 Laravel 的路由和控制器来处理路由、数据水合和认证。采用这种方式，你既能享受 Laravel 的全部能力，也能发挥 Vue / React 的全部优势，而不会削弱任何一方的功能。

把 Inertia 安装到 Laravel 应用后，你照常编写路由和控制器。不过，控制器不再返回 Blade 模板，而是返回一个 Inertia 页面：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * 显示给定用户的个人资料。
     */
    public function show(string $id): Response
    {
        return Inertia::render('Users/Profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
```

一个 Inertia 页面对应一个 Vue 或 React 组件，通常存放在应用的 `resources/js/Pages` 目录中。通过 `Inertia::render` 方法传给页面的数据，会用于水合（hydrate）页面组件的"props"：

```vue
<script setup>
import Layout from '@/Layouts/Authenticated.vue';
import { Head } from '@inertiajs/vue3';

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

如你所见，Inertia 让你在构建前端时能充分发挥 Vue 或 React 的能力，同时在 Laravel 后端与 JavaScript 前端之间提供了一层轻量的桥梁。

#### 服务端渲染

如果你因为应用需要服务端渲染而对使用 Inertia 有所顾虑，不必担心。Inertia 提供了[服务端渲染支持](https://inertiajs.com/server-side-rendering)。而且，通过 [Laravel Forge](https://forge.laravel.com) 部署应用时，确保 Inertia 的服务端渲染进程持续运行非常简单。

<a name="inertia-starter-kits"></a>
### 入门套件

如果你希望使用 Inertia 和 Vue / React 构建前端，可以利用我们的 Breeze 或 Jetstream [入门套件](/docs/{{version}}/starter-kits#breeze-and-inertia)快速启动应用开发。这两个入门套件都使用 Inertia、Vue / React、[Tailwind](https://tailwindcss.com) 和 [Vite](https://vitejs.dev) 搭建应用的后端与前端认证流程，让你可以直接开始构建下一个大想法。

<a name="bundling-assets"></a>
## 打包资源

无论你选择使用 Blade 和 Livewire，还是使用 Vue / React 和 Inertia 来开发前端，你都很可能需要把应用的 CSS 打包成可用于生产的资源。当然，如果你选择用 Vue 或 React 构建应用前端，还需要把组件打包成可在浏览器中运行的 JavaScript 资源。

默认情况下，Laravel 使用 [Vite](https://vitejs.dev) 打包资源。Vite 提供闪电般的构建速度，以及本地开发时近乎即时的热模块替换（HMR）。在所有全新的 Laravel 应用中（包括使用我们[入门套件](/docs/{{version}}/starter-kits)的应用），你都会找到一个 `vite.config.js` 文件，它会加载我们轻量的 Laravel Vite 插件，让 Vite 在 Laravel 应用中用起来非常愉快。

上手 Laravel 与 Vite 最快的方式，是使用 [Laravel Breeze](/docs/{{version}}/starter-kits#laravel-breeze)开始你的应用开发，这是我们最简单的入门套件，通过提供前后端认证脚手架让你的应用快速起步。

> [!NOTE]
> 想了解在 Laravel 中使用 Vite 的更详细文档，请查阅我们关于[打包与编译资源的专项文档](/docs/{{version}}/vite)。
