# 入门套件

- [简介](#introduction)
- [使用入门套件创建应用](#creating-an-application)
- [可用的入门套件](#available-starter-kits)
    - [React](#react)
    - [Svelte](#svelte)
    - [Vue](#vue)
    - [Livewire](#livewire)
- [入门套件自定义](#starter-kit-customization)
    - [React](#react-customization)
    - [Svelte](#svelte-customization)
    - [Vue](#vue-customization)
    - [Livewire](#livewire-customization)
- [认证](#authentication)
    - [启用和禁用功能](#enabling-and-disabling-features)
    - [自定义用户创建与密码重置](#customizing-actions)
    - [双因素认证](#two-factor-authentication)
    - [速率限制](#rate-limiting)
- [团队](#teams)
- [WorkOS AuthKit 认证](#workos)
    - [配置你的 WorkOS 入门套件](#configuring-your-workos-starter-kit)
- [Inertia SSR](#inertia-ssr)
- [社区维护的入门套件](#community-maintained-starter-kits)
- [常见问题](#faqs)

<a name="introduction"></a>
## 简介

为了让你在构建新的 Laravel 应用时抢占先机，我们很乐意提供[应用入门套件](https://laravel.com/starter-kits)。这些入门套件让你在构建下一个 Laravel 应用时赢在起跑线上，并包含注册和认证应用用户所需的路由、控制器和视图。入门套件使用 [Laravel Fortify](/docs/{{version}}/fortify) 提供认证。

虽然欢迎你使用这些入门套件，但它们不是必需的。你可以自由地通过简单地安装一份全新的 Laravel 从头构建自己的应用。无论哪种方式，我们知道你都会构建出很棒的东西！

<a name="creating-an-application"></a>
## 使用入门套件创建应用

要使用我们的某个入门套件创建新的 Laravel 应用，你应首先[安装 PHP 和 Laravel CLI 工具](/docs/{{version}}/installation#installing-php)。如果你已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器 CLI 工具：

```shell
composer global require laravel/installer
```

然后，使用 Laravel 安装器 CLI 创建新的 Laravel 应用。Laravel 安装器将提示你选择偏好的入门套件：

```shell
laravel new my-app
```

创建 Laravel 应用后，你只需通过 NPM 安装其前端依赖，并启动 Laravel 开发服务器：

```shell
cd my-app
npm install && npm run build
composer run dev
```

启动 Laravel 开发服务器后，你的应用就可以在浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问了。

<a name="available-starter-kits"></a>
## 可用的入门套件

<a name="react"></a>
### React

我们的 React 入门套件为使用 [Inertia](https://inertiajs.com) 构建带 React 前端的 Laravel 应用提供了一个稳健、现代的起点。

Inertia 允许你使用经典的服务器端路由和控制器构建现代的单页 React 应用。这让你既能享受 React 的前端能力，又能享受 Laravel 惊人的后端生产力和闪电般的 Vite 编译速度。

React 入门套件使用 React 19、TypeScript、Tailwind 和 [shadcn/ui](https://ui.shadcn.com) 组件库。

<a name="svelte"></a>
### Svelte

我们的 Svelte 入门套件为使用 [Inertia](https://inertiajs.com) 构建带 Svelte 前端的 Laravel 应用提供了一个稳健、现代的起点。

Inertia 允许你使用经典的服务器端路由和控制器构建现代的单页 Svelte 应用。这让你既能享受 Svelte 的前端能力，又能享受 Laravel 惊人的后端生产力和闪电般的 Vite 编译速度。

Svelte 入门套件使用 Svelte 5、TypeScript、Tailwind 和 [shadcn-svelte](https://www.shadcn-svelte.com/) 组件库。

<a name="vue"></a>
### Vue

我们的 Vue 入门套件为使用 [Inertia](https://inertiajs.com) 构建带 Vue 前端的 Laravel 应用提供了一个绝佳的起点。

Inertia 允许你使用经典的服务器端路由和控制器构建现代的单页 Vue 应用。这让你既能享受 Vue 的前端能力，又能享受 Laravel 惊人的后端生产力和闪电般的 Vite 编译速度。

Vue 入门套件使用 Vue Composition API、TypeScript、Tailwind 和 [shadcn-vue](https://www.shadcn-vue.com/) 组件库。

<a name="livewire"></a>
### Livewire

我们的 Livewire 入门套件为使用 [Laravel Livewire](https://livewire.laravel.com) 前端构建 Laravel 应用提供了完美的起点。

Livewire 是一种仅使用 PHP 构建动态、响应式前端 UI 的强大方式。它非常适合主要使用 Blade 模板、并正在寻找 React、Svelte 和 Vue 等 JavaScript 驱动 SPA 框架更简单替代方案的团队。

Livewire 入门套件使用 Livewire、Tailwind 和 [Flux UI](https://fluxui.dev) 组件库。

<a name="starter-kit-customization"></a>
## 入门套件自定义

<a name="react-customization"></a>
### React

我们的 React 入门套件使用 Inertia 3、React 19、Tailwind 4 和 [shadcn/ui](https://ui.shadcn.com) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于你的应用中，可以进行完全自定义。

大部分前端代码位于 `resources/js` 目录。你可以自由修改任何代码，以自定义应用的外观和行为：

```text
resources/js/
├── components/    # Reusable React components
├── hooks/         # React hooks
├── layouts/       # Application layouts
├── lib/           # Utility functions and configuration
├── pages/         # Page components
└── types/         # TypeScript definitions
```

要发布额外的 shadcn 组件，首先[找到你想要发布的组件](https://ui.shadcn.com)。然后，使用 `npx` 发布该组件：

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

<a name="react-available-layouts"></a>
#### 可用的布局

React 入门套件包含两种不同的主要布局供你选择：一种"sidebar"（侧边栏）布局和一种"header"（页头）布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/js/layouts/app-layout.tsx` 文件顶部导入的布局来切换到页头布局：

```js
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'; // [tl! remove]
import AppLayoutTemplate from '@/layouts/app/app-header-layout'; // [tl! add]
```

<a name="react-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认的侧边栏变体、"inset"（内嵌）变体和"floating"（浮动）变体。你可以通过修改 `resources/js/components/app-sidebar.tsx` 组件来选择最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="react-authentication-page-layout-variants"></a>
#### 认证页面布局变体

React 入门套件中包含的认证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"（简洁）、"card"（卡片）和"split"（分栏）。

要更改认证布局，请修改应用 `resources/js/layouts/auth-layout.tsx` 文件顶部导入的布局：

```js
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout'; // [tl! remove]
import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout'; // [tl! add]
```

<a name="svelte-customization"></a>
### Svelte

我们的 Svelte 入门套件使用 Inertia 3、Svelte 5、Tailwind 和 [shadcn-svelte](https://www.shadcn-svelte.com/) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于你的应用中，可以进行完全自定义。

大部分前端代码位于 `resources/js` 目录。你可以自由修改任何代码，以自定义应用的外观和行为：

```text
resources/js/
├── components/    # Reusable Svelte components
├── layouts/       # Application layouts
├── lib/           # Utility functions and configuration and Svelte rune modules
├── pages/         # Page components
└── types/         # TypeScript definitions
```

要发布额外的 shadcn-svelte 组件，首先[找到你想要发布的组件](https://www.shadcn-svelte.com)。然后，使用 `npx` 发布该组件：

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

<a name="svelte-available-layouts"></a>
#### 可用的布局

Svelte 入门套件包含两种不同的主要布局供你选择：一种"sidebar"布局和一种"header"布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/js/layouts/AppLayout.svelte` 文件顶部导入的布局来切换到页头布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.svelte'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.svelte'; // [tl! add]
```

<a name="svelte-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认的侧边栏变体、"inset"变体和"floating"变体。你可以通过修改 `resources/js/components/AppSidebar.svelte` 组件来选择最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="svelte-authentication-page-layout-variants"></a>
#### 认证页面布局变体

Svelte 入门套件中包含的认证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"、"card"和"split"。

要更改认证布局，请修改应用 `resources/js/layouts/AuthLayout.svelte` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.svelte'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.svelte'; // [tl! add]
```

<a name="vue-customization"></a>
### Vue

我们的 Vue 入门套件使用 Inertia 3、Vue 3 Composition API、Tailwind 和 [shadcn-vue](https://www.shadcn-vue.com/) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于你的应用中，可以进行完全自定义。

大部分前端代码位于 `resources/js` 目录。你可以自由修改任何代码，以自定义应用的外观和行为：

```text
resources/js/
├── components/    # Reusable Vue components
├── composables/   # Vue composables / hooks
├── layouts/       # Application layouts
├── lib/           # Utility functions and configuration
├── pages/         # Page components
└── types/         # TypeScript definitions
```

要发布额外的 shadcn-vue 组件，首先[找到你想要发布的组件](https://www.shadcn-vue.com)。然后，使用 `npx` 发布该组件：

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

<a name="vue-available-layouts"></a>
#### 可用的布局

Vue 入门套件包含两种不同的主要布局供你选择：一种"sidebar"布局和一种"header"布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/js/layouts/AppLayout.vue` 文件顶部导入的布局来切换到页头布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.vue'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.vue'; // [tl! add]
```

<a name="vue-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认的侧边栏变体、"inset"变体和"floating"变体。你可以通过修改 `resources/js/components/AppSidebar.vue` 组件来选择最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="vue-authentication-page-layout-variants"></a>
#### 认证页面布局变体

Vue 入门套件中包含的认证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"、"card"和"split"。

要更改认证布局，请修改应用 `resources/js/layouts/AuthLayout.vue` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.vue'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.vue'; // [tl! add]
```

<a name="livewire-customization"></a>
### Livewire

我们的 Livewire 入门套件使用 Livewire 4、Tailwind 和 [Flux UI](https://fluxui.dev/) 构建。与我们所有的入门套件一样，所有后端和前端代码都存在于你的应用中，可以进行完全自定义。

大部分前端代码位于 `resources/views` 目录。你可以自由修改任何代码，以自定义应用的外观和行为：

```text
resources/views
├── components            # Reusable components
├── flux                  # Customized Flux components
├── layouts               # Application layouts
├── pages                 # Livewire pages
├── partials              # Reusable Blade partials
├── dashboard.blade.php   # Authenticated user dashboard
├── welcome.blade.php     # Guest user welcome page
```

<a name="livewire-available-layouts"></a>
#### 可用的布局

Livewire 入门套件包含两种不同的主要布局供你选择：一种"sidebar"布局和一种"header"布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/views/layouts/app.blade.php` 文件使用的布局来切换到页头布局。此外，你应该向主 Flux 组件添加 `container` 属性：

```blade
<x-layouts::app.header>
    <flux:main container>
        {{ $slot }}
    </flux:main>
</x-layouts::app.header>
```

<a name="livewire-authentication-page-layout-variants"></a>
#### 认证页面布局变体

Livewire 入门套件中包含的认证页面（如登录页面和注册页面）也提供三种不同的布局变体："simple"、"card"和"split"。

要更改认证布局，请修改应用 `resources/views/layouts/auth.blade.php` 文件使用的布局：

```blade
<x-layouts::auth.split>
    {{ $slot }}
</x-layouts::auth.split>
```

<a name="authentication"></a>
## 认证

所有入门套件都使用 [Laravel Fortify](/docs/{{version}}/fortify) 处理认证。Fortify 为登录、注册、密码重置、邮箱验证等提供路由、控制器和逻辑。

Fortify 会根据应用 `config/fortify.php` 配置文件中启用的功能自动注册以下认证路由：

| 路由                              | 方法 | 描述                         |
| ---------------------------------- | ------ | ----------------------------------- |
| `/login`                           | `GET`    | 显示登录表单                  |
| `/login`                           | `POST`   | 认证用户                   |
| `/logout`                          | `POST`   | 用户登出                        |
| `/register`                        | `GET`    | 显示注册表单           |
| `/register`                        | `POST`   | 创建新用户                     |
| `/forgot-password`                 | `GET`    | 显示密码重置请求表单 |
| `/forgot-password`                 | `POST`   | 发送密码重置链接            |
| `/reset-password/{token}`          | `GET`    | 显示密码重置表单         |
| `/reset-password`                  | `POST`   | 更新密码                     |
| `/email/verify`                    | `GET`    | 显示邮箱验证通知   |
| `/email/verify/{id}/{hash}`        | `GET`    | 验证邮箱地址                |
| `/email/verification-notification` | `POST`   | 重新发送验证邮件           |
| `/user/confirm-password`           | `GET`    | 显示密码确认表单  |
| `/user/confirm-password`           | `POST`   | 确认密码                    |
| `/two-factor-challenge`            | `GET`    | 显示 2FA 质询表单          |
| `/two-factor-challenge`            | `POST`   | 验证 2FA 代码                     |

可以使用 `php artisan route:list` Artisan 命令显示应用中的所有路由。

<a name="enabling-and-disabling-features"></a>
### 启用和禁用功能

你可以在应用 `config/fortify.php` 配置文件中控制启用哪些 Fortify 功能：

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

要禁用某项功能，请从 `features` 数组中注释掉或移除该功能条目。例如，移除 `Features::registration()` 即可禁用公开注册。

使用 [React](#react)、[Svelte](#svelte) 或 [Vue](#vue) 入门套件时，你还需要在前端代码中移除对已禁用功能路由的任何引用。例如，如果禁用了邮箱验证，你应移除 React、Svelte 或 Vue 组件中 `verification` 路由的导入和引用。这样做是必要的，因为这些入门套件使用 Wayfinder 进行类型安全的路由，它会在构建时生成路由定义。如果你引用了不再存在的路由，应用将无法构建。

<a name="customizing-actions"></a>
### 自定义用户创建与密码重置

当用户注册或重置密码时，Fortify 会调用位于应用 `app/Actions/Fortify` 目录中的动作类：

| 文件                          | 描述                           |
| ----------------------------- | ------------------------------------- |
| `CreateNewUser.php`           | 验证并创建新用户       |
| `ResetUserPassword.php`       | 验证并更新用户密码  |
| `PasswordValidationRules.php` | 定义密码验证规则     |

例如，要自定义应用的注册逻辑，你应编辑 `CreateNewUser` 动作：

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

<a name="two-factor-authentication"></a>
### 双因素认证

入门套件包含内置的双因素认证（2FA），允许用户使用任何兼容 TOTP 的认证器应用来保护其账户。通过应用 `config/fortify.php` 配置文件中的 `Features::twoFactorAuthentication()` 默认启用 2FA。

`confirm` 选项要求用户在 2FA 完全启用之前验证一个代码，而 `confirmPassword` 要求在启用或禁用 2FA 之前确认密码。更多细节请参阅 [Fortify 的双因素认证文档](/docs/{{version}}/fortify#two-factor-authentication)。

<a name="rate-limiting"></a>
### 速率限制

速率限制可防止暴力破解和重复登录尝试压垮你的认证端点。你可以在应用的 `FortifyServiceProvider` 中自定义 Fortify 的速率限制行为：

```php
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;

RateLimiter::for('login', function ($request) {
    return Limit::perMinute(5)->by($request->email.$request->ip());
});
```

<a name="teams"></a>
## 团队

React、Svelte、Vue 和 Livewire 入门套件也可以生成团队支持。启用团队功能后，每个用户属于一个或多个团队，并拥有一个当前团队。注册期间，新用户会自动获得一个个人团队。入门套件还包含团队管理界面，用于创建团队、在团队之间切换、邀请成员和更新团队详情。

当路由限定于当前团队时，当前团队的 slug 会包含在 URL 中。例如，仪表板路由变为 `/{current_team}/dashboard`，而团队管理页面使用诸如 `settings/teams/{team}` 的路由。使用 `{current_team}` 和 `{team}` 路由参数时，入门套件会在允许访问路由之前自动确保已认证用户属于请求的团队。

为更方便地生成感知团队的 URL，入门套件会为已认证用户的当前团队注册 URL 默认值。这使得对 `route('dashboard')` 等辅助函数的调用会自动包含当前团队的 slug。当用户登录、注册或切换团队时，入门套件会更新当前团队并刷新这些 URL 默认值，使生成的链接继续使用正确的团队上下文。

创建或重命名团队时，入门套件还会阻止用户选择可能产生不安全或冲突路由段落的保留名称。例如，与 `settings`、`login` 或 `dashboard` 等路由前缀冲突的名称可能无法使用。

<a name="workos"></a>
## WorkOS AuthKit 认证

默认情况下，React、Svelte、Vue 和 Livewire 入门套件都利用 Laravel 内置的认证系统来提供登录、注册、密码重置、邮箱验证等功能。此外，我们还提供每个入门套件的由 [WorkOS AuthKit](https://authkit.com) 驱动的变体，它提供：

<div class="content-list" markdown="1">

- 社交认证（Google、Microsoft、GitHub 和 Apple）
- Passkey 认证
- 基于邮箱的"Magic Auth"
- SSO

</div>

使用 WorkOS 作为认证提供方[需要一个 WorkOS 账户](https://workos.com)。WorkOS 为每月活跃用户数高达 100 万的应用提供免费认证。

要将 WorkOS AuthKit 用作应用的认证提供方，请在通过 `laravel new` 创建新的入门套件驱动的应用时选择 WorkOS 选项。

<a name="configuring-your-workos-starter-kit"></a>
### 配置你的 WorkOS 入门套件

使用 WorkOS 驱动的入门套件创建新应用后，你应在应用的 `.env` 文件中设置 `WORKOS_CLIENT_ID`、`WORKOS_API_KEY` 和 `WORKOS_REDIRECT_URL` 环境变量。这些变量应与 WorkOS 仪表板中为你的应用提供的值一致：

```ini
WORKOS_CLIENT_ID=your-client-id
WORKOS_API_KEY=your-api-key
WORKOS_REDIRECT_URL="${APP_URL}/authenticate"
```

此外，你应该在 WorkOS 仪表板中配置应用主页 URL。用户从你的应用登出后将被重定向到该 URL。

<a name="configuring-authkit-authentication-methods"></a>
#### 配置 AuthKit 认证方法

使用 WorkOS 驱动的入门套件时，我们建议你在应用的 WorkOS AuthKit 配置设置中禁用"Email + Password"认证，让用户只能通过社交认证提供方、passkey、"Magic Auth"和 SSO 进行认证。这能让你的应用完全避免处理用户密码。

<a name="configuring-authkit-session-timeouts"></a>
#### 配置 AuthKit 会话超时

此外，我们建议你将 WorkOS AuthKit 的会话空闲超时配置为与 Laravel 应用配置的会话超时阈值一致，该阈值通常为两个小时。

<a name="inertia-ssr"></a>
### Inertia SSR

React、Svelte 和 Vue 入门套件与 Inertia 的[服务器端渲染](https://inertiajs.com/server-side-rendering)能力兼容。要为应用构建兼容 Inertia SSR 的包，请运行 `build:ssr` 命令：

```shell
npm run build:ssr
```

为方便起见，还提供了一个 `composer dev:ssr` 命令。该命令在为应用构建好 SSR 兼容包后，会启动 Laravel 开发服务器和 Inertia SSR 服务器，让你可以使用 Inertia 的服务器端渲染引擎在本地测试应用：

```shell
composer dev:ssr
```

<a name="community-maintained-starter-kits"></a>
### 社区维护的入门套件

使用 Laravel 安装器创建新的 Laravel 应用时，你可以将 Packagist 上提供的任何社区维护的入门套件提供给 `--using` 标志：

```shell
laravel new my-app --using=example/starter-kit
```

<a name="creating-starter-kits"></a>
#### 创建入门套件

为确保你的入门套件可供他人使用，你需要将其发布到 [Packagist](https://packagist.org)。你的入门套件应在其 `.env.example` 文件中定义所需的环境变量，任何必要的安装后命令都应列在入门套件 `composer.json` 文件的 `post-create-project-cmd` 数组中。

<a name="faqs"></a>
### 常见问题

<a name="faq-upgrade"></a>
#### 我该如何升级？

每个入门套件都为你下一个应用提供了坚实的起点。由于你完全拥有代码，你可以精确地按照自己的设想调整、定制和构建应用。然而，入门套件本身无需更新。

<a name="faq-enable-email-verification"></a>
#### 我该如何启用邮箱验证？

可以通过取消 `App/Models/User.php` 模型中 `MustVerifyEmail` 导入的注释并确保模型实现 `MustVerifyEmail` 接口来添加邮箱验证：

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

注册后，用户将收到一封验证邮件。要在用户的邮箱地址验证通过之前限制对某些路由的访问，请向这些路由添加 `verified` 中间件：

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
```

> [!NOTE]
> 使用入门套件的 [WorkOS](#workos) 变体时，无需邮箱验证。

<a name="faq-modify-email-template"></a>
#### 我该如何修改默认邮件模板？

你可能希望自定义默认邮件模板，以更好地匹配应用的品牌形象。要修改此模板，应使用以下命令将邮件视图发布到你的应用：

```shell
php artisan vendor:publish --tag=laravel-mail
```

这将在 `resources/views/vendor/mail` 中生成几个文件。你可以修改其中任何一个文件以及 `resources/views/vendor/mail/themes/default.css` 文件，来更改默认邮件模板的外观。
