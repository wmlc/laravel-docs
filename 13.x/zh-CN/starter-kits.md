# 入门套件

## 简介

为了帮你更快上手构建新的 Laravel 应用程序，我们很高兴提供[应用程序起步套件](https://laravel.com/starter-kits)。这些起步套件为构建下一个 Laravel 应用程序提供了一个良好的起点，并包含了注册和对应用程序用户进行身份验证所需的路由、控制器和视图。起步套件使用 [Laravel Fortify](/topic/Laravel%2013.x/x3vo0x4vm1.html) 提供身份验证。

虽然欢迎你使用这些起步套件，但它们并非必需。你可以简单地安装一份全新的 Laravel 来从零开始构建自己的应用程序。无论哪种方式，我们都知道你会构建出很棒的东西！

## 使用入门套件创建应用

要使用我们的某个起步套件创建一个新的 Laravel 应用程序，你应首先[安装 PHP 和 Laravel CLI 工具](/topic/Laravel%2013.x/2wy3lj3ykm.html)。如果你已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器 CLI 工具：

```shell
composer global require laravel/installer
```

然后，使用 Laravel 安装器 CLI 创建一个新的 Laravel 应用程序。Laravel 安装器会提示你选择偏好的起步套件：

```shell
laravel new my-app
```

创建 Laravel 应用程序后，你只需通过 NPM 安装其前端依赖并启动 Laravel 开发服务器：

```shell
cd my-app
npm install && npm run build
composer run dev
```

一旦启动 Laravel 开发服务器，你的应用程序将可以在 Web 浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问。

## 可用入门套件

### React

我们的 React 起步套件提供了一个稳健、现代的起点，用于通过 [Inertia](https://inertiajs.com) 构建带有 React 前端的 Laravel 应用程序。

Inertia 允许你使用经典的服务器端 路由 和控制器构建现代的、单页的 React 应用。这让你能享受 React 的前端威力，结合 Laravel 令人难以置信的后端生产力，以及极速的 Vite 编译。

React 起步套件使用了 React 19、TypeScript、Tailwind 和 [shadcn/ui](https://ui.shadcn.com) 组件库。

### Svelte

我们的 Svelte 起步套件提供了一个稳健、现代的起点，用于通过 [Inertia](https://inertiajs.com) 构建带有 Svelte 前端的 Laravel 应用程序。

Inertia 允许你使用经典的服务器端 路由 和控制器构建现代的、单页的 Svelte 应用。这让你能享受 Svelte 的前端威力，结合 Laravel 令人难以置信的后端生产力，以及极速的 Vite 编译。

Svelte 起步套件使用了 Svelte 5、TypeScript、Tailwind 和 [shadcn-svelte](https://www.shadcn-svelte.com/) 组件库。

### Vue

我们的 Vue 起步套件提供了一个很好的起点，用于通过 [Inertia](https://inertiajs.com) 构建带有 Vue 前端的 Laravel 应用程序。

Inertia 允许你使用经典的服务器端 路由 和控制器构建现代的、单页的 Vue 应用。这让你能享受 Vue 的前端威力，结合 Laravel 令人难以置信的后端生产力，以及极速的 Vite 编译。

Vue 起步套件使用了 Vue Composition API、TypeScript、Tailwind 和 [shadcn-vue](https://www.shadcn-vue.com/) 组件库。

### Livewire

我们的 Livewire 起步套件提供了一个完美的起点，用于构建带有 [Laravel Livewire](https://livewire.laravel.com) 前端的 Laravel 应用程序。

Livewire 是一种仅使用 PHP 构建动态、响应式前端 UI 的强大方式。它非常适合主要使用 Blade 模板、并正在寻找 React、Svelte 和 Vue 等 JavaScript 驱动的 SPA 框架的更简单替代方案的团队。

Livewire 起步套件使用了 Livewire、Tailwind 和 [Flux UI](https://fluxui.dev) 组件库。

## 入门套件自定义

### React

我们的 React 起步套件基于 Inertia 3、React 19、Tailwind 4 和 [shadcn/ui](https://ui.shadcn.com) 构建。与我们的所有起步套件一样，所有的后端和前端代码都存在于你的应用程序中，以便进行完全自定义。

大部分前端代码位于 `resources/js` 目录中。你可以自由修改任何代码以自定义应用程序的外观和行为：

```text
resources/js/
├── components/    # 可复用的 React 组件
├── hooks/         # React hooks
├── layouts/       # 应用布局
├── lib/           # 工具函数与配置
├── pages/         # 页面组件
└── types/         # TypeScript 定义
```

要发布额外的 shadcn 组件，首先[找到你想发布的组件](https://ui.shadcn.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn@latest add switch
```

在此示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/switch.tsx`。组件发布后，你可以在任何页面中使用它：

```jsx
import { Switch } from "@/components/ui/switch"

const MyPage = () => {
  return (
    <div>
      <Switch />
    </div>
  );
};

export default MyPage;
```

#### 可用布局

React 起步套件包含两种不同的主要布局供你选择："sidebar"布局和 "header" 布局。sidebar 布局是默认布局，但你可以通过修改应用程序 `resources/js/layouts/app-layout.tsx` 文件顶部导入的布局来切换到 header 布局：

```js
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'; // [tl! remove]
import AppLayoutTemplate from '@/layouts/app/app-header-layout'; // [tl! add]
```

#### 侧边栏变体

sidebar 布局包含三种不同的变体：默认 sidebar 变体、"inset" 变体和 "floating" 变体。你可以通过修改 `resources/js/components/app-sidebar.tsx` 组件来选择你最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

#### 认证页面布局变体

React 起步套件附带的身份验证页面（例如登录页和注册页）也提供三种不同的布局变体："simple"、"card" 和 "split"。

要更改你的身份验证布局，请修改应用程序 `resources/js/layouts/auth-layout.tsx` 文件顶部导入的布局：

```js
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout'; // [tl! remove]
import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout'; // [tl! add]
```

### Svelte

我们的 Svelte 起步套件基于 Inertia 3、Svelte 5、Tailwind 和 [shadcn-svelte](https://www.shadcn-svelte.com/) 构建。与我们的所有起步套件一样，所有的后端和前端代码都存在于你的应用程序中，以便进行完全自定义。

大部分前端代码位于 `resources/js` 目录中。你可以自由修改任何代码以自定义应用程序的外观和行为：

```text
resources/js/
├── components/    # 可复用的 Svelte 组件
├── layouts/       # 应用布局
├── lib/           # 工具函数与配置以及 Svelte rune 模块
├── pages/         # 页面组件
└── types/         # TypeScript 定义
```

要发布额外的 shadcn-svelte 组件，首先[找到你想发布的组件](https://www.shadcn-svelte.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn-svelte@latest add switch
```

在此示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/switch/switch.svelte`。组件发布后，你可以在任何页面中使用它：

```svelte
<script lang="ts">
    import { Switch } from '@/components/ui/switch'
</script>

<div>
    <Switch />
</div>
```

#### 可用布局

Svelte 起步套件包含两种不同的主要布局供你选择："sidebar" 布局和 "header" 布局。sidebar 布局是默认布局，但你可以通过修改应用程序 `resources/js/layouts/AppLayout.svelte` 文件顶部导入的布局来切换到 header 布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.svelte'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.svelte'; // [tl! add]
```

#### 侧边栏变体

sidebar 布局包含三种不同的变体：默认 sidebar 变体、"inset" 变体和 "floating" 变体。你可以通过修改 `resources/js/components/AppSidebar.svelte` 组件来选择你最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

#### 认证页面布局变体

Svelte 起步套件附带的身份验证页面（例如登录页和注册页）也提供三种不同的布局变体："simple"、"card" 和 "split"。

要更改你的身份验证布局，请修改应用程序 `resources/js/layouts/AuthLayout.svelte` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.svelte'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.svelte'; // [tl! add]
```

### Vue

我们的 Vue 起步套件基于 Inertia 3、Vue 3 Composition API、Tailwind 和 [shadcn-vue](https://www.shadcn-vue.com/) 构建。与我们的所有起步套件一样，所有的后端和前端代码都存在于你的应用程序中，以便进行完全自定义。

大部分前端代码位于 `resources/js` 目录中。你可以自由修改任何代码以自定义应用程序的外观和行为：

```text
resources/js/
├── components/    # 可复用的 Vue 组件
├── composables/   # Vue composables / hooks
├── layouts/       # 应用布局
├── lib/           # 工具函数与配置
├── pages/         # 页面组件
└── types/         # TypeScript 定义
```

要发布额外的 shadcn-vue 组件，首先[找到你想发布的组件](https://www.shadcn-vue.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn-vue@latest add switch
```

在此示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/Switch.vue`。组件发布后，你可以在任何页面中使用它：

```vue
<script setup lang="ts">
import { Switch } from '@/components/ui/switch'
</script>

<template>
    <div>
        <Switch />
    </div>
</template>
```

#### 可用布局

Vue 起步套件包含两种不同的主要布局供你选择："sidebar" 布局和 "header" 布局。sidebar 布局是默认布局，但你可以通过修改应用程序 `resources/js/layouts/AppLayout.vue` 文件顶部导入的布局来切换到 header 布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.vue'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.vue'; // [tl! add]
```

#### 侧边栏变体

sidebar 布局包含三种不同的变体：默认 sidebar 变体、"inset" 变体和 "floating" 变体。你可以通过修改 `resources/js/components/AppSidebar.vue` 组件来选择你最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

#### 认证页面布局变体

Vue 起步套件附带的身份验证页面（例如登录页和注册页）也提供三种不同的布局变体："simple"、"card" 和 "split"。

要更改你的身份验证布局，请修改应用程序 `resources/js/layouts/AuthLayout.vue` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.vue'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.vue'; // [tl! add]
```

### Livewire

我们的 Livewire 起步套件基于 Livewire 4、Tailwind 和 [Flux UI](https://fluxui.dev/) 构建。与我们的所有起步套件一样，所有的后端和前端代码都存在于你的应用程序中，以便进行完全自定义。

大部分前端代码位于 `resources/views` 目录中。你可以自由修改任何代码以自定义应用程序的外观和行为：

```text
resources/views
├── components            # 可复用组件
├── flux                  # 自定义的 Flux 组件
├── layouts               # 应用布局
├── pages                 # Livewire 页面
├── partials              # 可复用的 Blade 局部视图
├── dashboard.blade.php   # 已认证用户仪表盘
├── welcome.blade.php     # 访客欢迎页
```

#### 可用布局

Livewire 起步套件包含两种不同的主要布局供你选择："sidebar" 布局和 "header" 布局。sidebar 布局是默认布局，但你可以通过修改应用程序 `resources/views/layouts/app.blade.php` 文件所使用的布局来切换到 header 布局。此外，你还应该向主 Flux 组件添加 `container` 属性：

```blade
<x-layouts::app.header>
    <flux:main container>
        {{ $slot }}
    </flux:main>
</x-layouts::app.header>
```

#### 认证页面布局变体

Livewire 起步套件附带的身份验证页面（例如登录页和注册页）也提供三种不同的布局变体："simple"、"card" 和 "split"。

要更改你的身份验证布局，请修改应用程序 `resources/views/layouts/auth.blade.php` 文件所使用的布局：

```blade
<x-layouts::auth.split>
    {{ $slot }}
</x-layouts::auth.split>
```

## 认证

所有起步套件都使用 [Laravel Fortify](/topic/Laravel%2013.x/x3vo0x4vm1.html) 处理身份验证。Fortify 提供了用于登录、注册、密码重置、邮箱验证等的路由、控制器和逻辑。

Fortify 会根据你的应用程序 `config/fortify.php` 配置文件中启用的功能自动注册以下身份验证路由：

| Route                              | Method | Description                         |
| ---------------------------------- | ------ | ----------------------------------- |
| `/login`                           | `GET`    | 显示登录表单                  |
| `/login`                           | `POST`   | 对用户进行身份验证                   |
| `/logout`                          | `POST`   | 注销用户                        |
| `/register`                        | `GET`    | 显示注册表单           |
| `/register`                        | `POST`   | 创建新用户                     |
| `/forgot-password`                 | `GET`    | 显示密码重置请求表单 |
| `/forgot-password`                 | `POST`   | 发送密码重置链接            |
| `/reset-password/{token}`          | `GET`    | 显示密码重置表单         |
| `/reset-password`                  | `POST`   | 更新密码                     |
| `/email/verify`                    | `GET`    | 显示邮箱验证提示   |
| `/email/verify/{id}/{hash}`        | `GET`    | 验证邮箱地址                |
| `/email/verification-notification` | `POST`   | 重新发送验证邮件           |
| `/user/confirm-password`           | `GET`    | 显示密码确认表单  |
| `/user/confirm-password`           | `POST`   | 确认密码                    |
| `/two-factor-challenge`            | `GET`    | 显示 2FA 挑战表单          |
| `/two-factor-challenge`            | `POST`   | 验证 2FA 代码                     |

`php artisan route:list` Artisan 命令可用于显示应用程序中的所有路由。

### 启用与禁用功能

你可以在应用程序的 `config/fortify.php` 配置文件中控制启用哪些 Fortify 功能：

```php
use Laravel\Fortify\Features;

'features' => [
    Features::registration(),
    Features::resetPasswords(),
    Features::emailVerification(),
    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]),
],
```

要禁用某个功能，将该功能条目从 `features` 数组中注释掉或移除。例如，移除 `Features::registration()` 以禁用公开注册。

使用 React、Svelte 或 Vue 起步套件时，你还需要在前端代码中移除对已禁用功能路由的任何引用。例如，如果禁用邮箱验证，你应该移除 React、Svelte 或 Vue 组件中对 `verification` 路由的导入和引用。这是必要的，因为这些起步套件使用 Wayfinder 进行类型安全的路由生成，它会在构建时生成路由定义。如果你引用了不再存在的路由，应用程序将无法构建。

### 自定义用户创建与密码重置

当用户注册或重置密码时，Fortify 会调用位于应用程序 `app/Actions/Fortify` 目录中的动作类：

| File                          | Description                           |
| ----------------------------- | ------------------------------------- |
| `CreateNewUser.php`           | 验证并创建新用户       |
| `ResetUserPassword.php`       | 验证并更新用户密码  |
| `PasswordValidationRules.php` | 定义密码验证规则     |

例如，要自定义应用程序的注册逻辑，你应该编辑 `CreateNewUser` 动作：

```php
public function create(array $input): User
{
    Validator::make($input, [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users'],
        'phone' => ['required', 'string', 'max:20'], // [tl! add]
        'password' => $this->passwordRules(),
    ])->validate();

    return User::create([
        'name' => $input['name'],
        'email' => $input['email'],
        'phone' => $input['phone'], // [tl! add]
        'password' => Hash::make($input['password']),
    ]);
}
```

### 双因素认证

起步套件内置了双因素身份验证（2FA），允许用户使用任何兼容 TOTP 的身份验证器应用来保护他们的账户。2FA 默认通过应用程序 `config/fortify.php` 配置文件中的 `Features::twoFactorAuthentication()` 启用。

`confirm` 选项要求用户在 2FA 完全启用之前验证一个代码，而 `confirmPassword` 要求在启用或禁用 2FA 之前进行密码确认。更多详情，请参阅 [Fortify 的双因素身份验证文档](/topic/Laravel%2013.x/x3vo0x4vm1.html)。

### 限流

速率限制可防止暴力破解和重复的登录尝试压垮你的身份验证端点。你可以在应用程序的 `FortifyServiceProvider` 中自定义 Fortify 的速率限制行为：

```php
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;

RateLimiter::for('login', function ($request) {
    return Limit::perMinute(5)->by($request->email.$request->ip());
});
```

## 团队

React、Svelte、Vue 和 Livewire 起步套件也可以生成带团队支持的应用。启用团队功能后，每个用户属于一个或多个团队，并拥有一个当前团队。在注册期间，新用户会自动获得一个个人团队。起步套件还包含用于创建团队、切换团队、邀请成员和更新团队详情的团队管理界面。

当路由限定于当前团队时，当前团队的 slug 会包含在 URL 中。例如，仪表盘路由变为 `/{current_team}/dashboard`，而团队管理页面使用诸如 `settings/teams/{team}` 之类的路由。使用 `{current_team}` 和 `{team}` 路由参数时，起步套件会在允许访问路由之前自动确保已验证用户属于所请求的团队。

为了使生成感知团队的 URL 更加便捷，起步套件会为已验证用户的当前团队注册 URL 默认值。这样，对 `route('dashboard')` 等辅助函数的调用就能自动包含当前团队的 slug。当用户登录、注册或切换团队时，起步套件会更新当前团队并刷新这些 URL 默认值，以便生成的链接继续使用正确的团队上下文。

创建或重命名团队时，起步套件还会阻止用户选择可能与路由段产生不安全或冲突的保留名称。例如，会与 `settings`、`login` 或 `dashboard` 等路由前缀冲突的名称不能使用。

## WorkOS AuthKit 认证

默认情况下，React、Svelte、Vue 和 Livewire 起步套件都使用 Laravel 内置的身份验证系统来提供登录、注册、密码重置、邮箱验证等功能。此外，我们还提供每个起步套件的 [WorkOS AuthKit](https://authkit.com) 变体，它提供：

- 社交身份验证（Google、Microsoft、GitHub 和 Apple）
- Passkey 身份验证
- 基于电子邮件的"Magic Auth"
- SSO

使用 WorkOS 作为你的身份验证提供方[需要一个 WorkOS 账户](https://workos.com)。WorkOS 为月活跃用户数不超过 100 万的应用程序提供免费身份验证。

要使用 WorkOS AuthKit 作为应用程序的身份验证提供方，请在使用 `laravel new` 创建新的起步套件驱动的应用程序时选择 WorkOS 选项。

### 配置你的 WorkOS 入门套件

使用 WorkOS 驱动的起步套件创建新应用程序后，你应在应用程序的 `.env` 文件中设置 `WORKOS_CLIENT_ID`、`WORKOS_API_KEY` 和 `WORKOS_REDIRECT_URL` 环境变量。这些变量应与 WorkOS 控制台中为你的应用程序提供的值相匹配：

```ini
WORKOS_CLIENT_ID=your-client-id
WORKOS_API_KEY=your-api-key
WORKOS_REDIRECT_URL="${APP_URL}/authenticate"
```

此外，你还应在 WorkOS 控制台中配置应用程序主页 URL。该 URL 是用户注销应用程序后将被重定向到的位置。

#### 配置 AuthKit 认证方式

使用 WorkOS 驱动的起步套件时，我们建议你在应用程序的 WorkOS AuthKit 配置设置中禁用"Email + Password"身份验证，仅允许用户通过社交身份验证提供方、Passkey、"Magic Auth" 和 SSO 进行身份验证。这样你的应用程序就可以完全避免处理用户密码。

#### 配置 AuthKit 会话超时

此外，我们建议将 WorkOS AuthKit 会话非活动超时配置为与你的 Laravel 应用程序配置的会话超时阈值相匹配，该阈值通常为两小时。

### Inertia SSR

React、Svelte 和 Vue 起步套件兼容 Inertia 的[服务器端渲染](https://inertiajs.com/server-side-rendering)能力。要为你的应用程序构建兼容 Inertia SSR 的包，请运行 `build:ssr` 命令：

```shell
npm run build:ssr
```

为方便起见，还提供了一个 `composer dev:ssr` 命令。该命令会在为你的应用程序构建兼容 SSR 的包后启动 Laravel 开发服务器和 Inertia SSR 服务器，让你可以使用 Inertia 的服务器端渲染引擎在本地测试你的应用程序：

```shell
composer dev:ssr
```

### 社区维护的入门套件

使用 Laravel 安装器创建新的 Laravel 应用程序时，你可以将 Packagist 上可用的任何社区维护的起步套件通过 `--using` 标志提供：

```shell
laravel new my-app --using=example/starter-kit
```

#### 创建入门套件

为确保你的起步套件对他人可用，你需要将其发布到 [Packagist](https://packagist.org)。你的起步套件应在其 `.env.example` 文件中定义所需的环境变量，任何必要的安装后命令都应列在起步套件 `composer.json` 文件的 `post-create-project-cmd` 数组中。

### 常见问题

#### 如何升级？

每个起步套件都为你的下一个应用程序提供了一个扎实的起点。由于你完全拥有代码，你可以按照自己的设想调整、自定义并构建应用程序。不过，无需更新起步套件本身。

#### 如何启用邮箱验证？

可以通过取消注释 `App/Models/User.php` 模型中的 `MustVerifyEmail` 导入，并确保该模型实现了 `MustVerifyEmail` 接口来添加邮箱验证：

```php
<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
// ...

class User extends Authenticatable implements MustVerifyEmail
{
    // ...
}
```

注册后，用户将收到一封验证邮件。要限制对某些路由的访问，直到用户的邮箱地址通过验证，可以向路由添加 `verified` 中间件：

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
```

> [!NOTE]
> 使用起步套件的 WorkOS 变体时不需要邮箱验证。

#### 如何修改默认邮件模板？

你可能希望自定义默认邮件模板，以更好地契合应用程序的品牌形象。要修改此模板，应使用以下命令将邮件视图发布到你的应用程序：

```shell
php artisan vendor:publish --tag=laravel-mail
```

这会在 `resources/views/vendor/mail` 中生成多个文件。你可以修改其中任何文件以及 `resources/views/vendor/mail/themes/default.css` 文件，以更改默认邮件模板的外观。