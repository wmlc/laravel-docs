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
- [身份认证](#authentication)
    - [启用与禁用功能](#enabling-and-disabling-features)
    - [自定义用户创建与密码重置](#customizing-actions)
    - [双因素认证](#two-factor-authentication)
    - [速率限制](#rate-limiting)
- [WorkOS AuthKit 身份认证](#workos)
- [Inertia SSR](#inertia-ssr)
- [社区维护的入门套件](#community-maintained-starter-kits)
- [常见问题](#faqs)

<a name="introduction"></a>
## 简介

为了让你的新 Laravel 应用有个良好的开端，我们很高兴地提供[应用入门套件](https://laravel.com/starter-kits)。这些入门套件能帮助你快速上手构建下一个 Laravel 应用，其中包含注册用户和进行身份认证所需的路由、控制器和视图。入门套件使用 [Laravel Fortify](/docs/{{version}}/fortify) 来提供身份认证。

虽然我们欢迎你使用这些入门套件，但它们并不是必需的。你也可以仅仅安装一份全新的 Laravel，从零开始构建自己的应用。无论选择哪种方式，我们都知道你会构建出出色的作品！

<a name="creating-an-application"></a>
## 使用入门套件创建应用

要使用我们的某个入门套件创建新的 Laravel 应用，你首先应[安装 PHP 和 Laravel CLI 工具](/docs/{{version}}/installation#installing-php)。如果你已经安装了 PHP 和 Composer，可以通过 Composer 安装 Laravel 安装器 CLI 工具：

```shell
composer global require laravel/installer
```

然后，使用 Laravel 安装器 CLI 创建一个新的 Laravel 应用。Laravel 安装器会提示你选择偏好的入门套件：

```shell
laravel new my-app
```

创建 Laravel 应用后，你只需通过 NPM 安装其前端依赖并启动 Laravel 开发服务器：

```shell
cd my-app
npm install && npm run build
composer run dev
```

启动 Laravel 开发服务器后，你可以在浏览器中通过 [http://localhost:8000](http://localhost:8000) 访问应用。

<a name="available-starter-kits"></a>
## 可用的入门套件

<a name="react"></a>
### React

我们的 React 入门套件为构建带 React 前端的 Laravel 应用提供了一个健壮、现代的起点，它基于 [Inertia](https://inertiajs.com)。

Inertia 让你能够使用经典的服务端路由和控制器来构建现代的单页 React 应用。这样，你既可以享受 React 的前端能力，又能获得 Laravel 惊人的后端开发效率以及 Vite 极速的编译。

React 入门套件使用 React 19、TypeScript、Tailwind 以及 [shadcn/ui](https://ui.shadcn.com) 组件库。

<a name="svelte"></a>
### Svelte

我们的 Svelte 入门套件为构建带 Svelte 前端的 Laravel 应用提供了一个健壮、现代的起点，它基于 [Inertia](https://inertiajs.com)。

Inertia 让你能够使用经典的服务端路由和控制器来构建现代的单页 Svelte 应用。这样，你既可以享受 Svelte 的前端能力，又能获得 Laravel 惊人的后端开发效率以及 Vite 极速的编译。

Svelte 入门套件使用 Svelte 5、TypeScript、Tailwind 以及 [shadcn-svelte](https://www.shadcn-svelte.com/) 组件库。

<a name="vue"></a>
### Vue

我们的 Vue 入门套件为构建带 Vue 前端的 Laravel 应用提供了一个出色的起点，它基于 [Inertia](https://inertiajs.com)。

Inertia 让你能够使用经典的服务端路由和控制器来构建现代的单页 Vue 应用。这样，你既可以享受 Vue 的前端能力，又能获得 Laravel 惊人的后端开发效率以及 Vite 极速的编译。

Vue 入门套件使用 Vue Composition API、TypeScript、Tailwind 以及 [shadcn-vue](https://www.shadcn-vue.com/) 组件库。

<a name="livewire"></a>
### Livewire

我们的 Livewire 入门套件为构建带 [Laravel Livewire](https://livewire.laravel.com) 前端的 Laravel 应用提供了一个完美的起点。

Livewire 是一种仅用 PHP 就能构建动态、响应式前端 UI 的强大方式。它非常适合主要使用 Blade 模板、并且正在寻找比 React、Svelte、Vue 等 JavaScript 驱动的 SPA 框架更简单替代方案的团队。

Livewire 入门套件使用 Livewire、Tailwind 以及 [Flux UI](https://fluxui.dev) 组件库。

<a name="starter-kit-customization"></a>
## 入门套件自定义

<a name="react-customization"></a>
### React

我们的 React 入门套件基于 Inertia 2、React 19、Tailwind 4 和 [shadcn/ui](https://ui.shadcn.com) 构建。与我们所有的入门套件一样，全部后端和前端代码都位于你的应用中，允许你进行完全自定义。

大部分前端代码位于 `resources/js` 目录中。你可以自由修改其中的任何代码，以自定义应用的外观和行为：

```text
resources/js/
├── components/    # 可复用的 React 组件
├── hooks/         # React hooks
├── layouts/       # 应用布局
├── lib/           # 工具函数与配置
├── pages/         # 页面组件
└── types/         # TypeScript 类型定义
```

要发布额外的 shadcn 组件，请先[找到你想发布的组件](https://ui.shadcn.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn@latest add switch
```

在这个示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/switch.tsx`。组件发布后，你就可以在任何页面中使用它：

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
#### 可用布局

React 入门套件包含两种不同的主布局供你选择：「侧边栏」布局和「顶栏」布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/js/layouts/app-layout.tsx` 文件顶部导入的布局，切换为顶栏布局：

```js
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'; // [tl! remove]
import AppLayoutTemplate from '@/layouts/app/app-header-layout'; // [tl! add]
```

<a name="react-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认的侧边栏变体、「inset」变体和「floating」变体。你可以通过修改 `resources/js/components/app-sidebar.tsx` 组件来选择你最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="react-authentication-page-layout-variants"></a>
#### 认证页面布局变体

React 入门套件附带的认证页面（例如登录页和注册页）同样提供三种不同的布局变体：「simple」、「card」和「split」。

要更改认证布局，请修改应用 `resources/js/layouts/auth-layout.tsx` 文件顶部导入的布局：

```js
import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout'; // [tl! remove]
import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout'; // [tl! add]
```

<a name="svelte-customization"></a>
### Svelte

我们的 Svelte 入门套件基于 Inertia 2、Svelte 5、Tailwind 和 [shadcn-svelte](https://www.shadcn-svelte.com/) 构建。与我们所有的入门套件一样，全部后端和前端代码都位于你的应用中，允许你进行完全自定义。

大部分前端代码位于 `resources/js` 目录中。你可以自由修改其中的任何代码，以自定义应用的外观和行为：

```text
resources/js/
├── components/    # 可复用的 Svelte 组件
├── layouts/       # 应用布局
├── lib/           # 工具函数、配置以及 Svelte rune 模块
├── pages/         # 页面组件
└── types/         # TypeScript 类型定义
```

要发布额外的 shadcn-svelte 组件，请先[找到你想发布的组件](https://www.shadcn-svelte.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn-svelte@latest add switch
```

在这个示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/switch/switch.svelte`。组件发布后，你就可以在任何页面中使用它：

```svelte
<script lang="ts">
    import { Switch } from '@/components/ui/switch'
</script>

<div>
    <Switch />
</div>
```

<a name="svelte-available-layouts"></a>
#### 可用布局

Svelte 入门套件包含两种不同的主布局供你选择：「侧边栏」布局和「顶栏」布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/js/layouts/AppLayout.svelte` 文件顶部导入的布局，切换为顶栏布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.svelte'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.svelte'; // [tl! add]
```

<a name="svelte-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认的侧边栏变体、「inset」变体和「floating」变体。你可以通过修改 `resources/js/components/AppSidebar.svelte` 组件来选择你最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="svelte-authentication-page-layout-variants"></a>
#### 认证页面布局变体

Svelte 入门套件附带的认证页面（例如登录页和注册页）同样提供三种不同的布局变体：「simple」、「card」和「split」。

要更改认证布局，请修改应用 `resources/js/layouts/AuthLayout.svelte` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.svelte'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.svelte'; // [tl! add]
```

<a name="vue-customization"></a>
### Vue

我们的 Vue 入门套件基于 Inertia 2、Vue 3 Composition API、Tailwind 和 [shadcn-vue](https://www.shadcn-vue.com/) 构建。与我们所有的入门套件一样，全部后端和前端代码都位于你的应用中，允许你进行完全自定义。

大部分前端代码位于 `resources/js` 目录中。你可以自由修改其中的任何代码，以自定义应用的外观和行为：

```text
resources/js/
├── components/    # 可复用的 Vue 组件
├── composables/   # Vue 组合式函数 / hooks
├── layouts/       # 应用布局
├── lib/           # 工具函数与配置
├── pages/         # 页面组件
└── types/         # TypeScript 类型定义
```

要发布额外的 shadcn-vue 组件，请先[找到你想发布的组件](https://www.shadcn-vue.com)。然后，使用 `npx` 发布该组件：

```shell
npx shadcn-vue@latest add switch
```

在这个示例中，该命令会将 Switch 组件发布到 `resources/js/components/ui/Switch.vue`。组件发布后，你就可以在任何页面中使用它：

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
#### 可用布局

Vue 入门套件包含两种不同的主布局供你选择：「侧边栏」布局和「顶栏」布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/js/layouts/AppLayout.vue` 文件顶部导入的布局，切换为顶栏布局：

```js
import AppLayout from '@/layouts/app/AppSidebarLayout.vue'; // [tl! remove]
import AppLayout from '@/layouts/app/AppHeaderLayout.vue'; // [tl! add]
```

<a name="vue-sidebar-variants"></a>
#### 侧边栏变体

侧边栏布局包含三种不同的变体：默认的侧边栏变体、「inset」变体和「floating」变体。你可以通过修改 `resources/js/components/AppSidebar.vue` 组件来选择你最喜欢的变体：

```text
<Sidebar collapsible="icon" variant="sidebar"> [tl! remove]
<Sidebar collapsible="icon" variant="inset"> [tl! add]
```

<a name="vue-authentication-page-layout-variants"></a>
#### 认证页面布局变体

Vue 入门套件附带的认证页面（例如登录页和注册页）同样提供三种不同的布局变体：「simple」、「card」和「split」。

要更改认证布局，请修改应用 `resources/js/layouts/AuthLayout.vue` 文件顶部导入的布局：

```js
import AuthLayout from '@/layouts/auth/AuthSimpleLayout.vue'; // [tl! remove]
import AuthLayout from '@/layouts/auth/AuthSplitLayout.vue'; // [tl! add]
```

<a name="livewire-customization"></a>
### Livewire

我们的 Livewire 入门套件基于 Livewire 4、Tailwind 和 [Flux UI](https://fluxui.dev/) 构建。与我们所有的入门套件一样，全部后端和前端代码都位于你的应用中，允许你进行完全自定义。

大部分前端代码位于 `resources/views` 目录中。你可以自由修改其中的任何代码，以自定义应用的外观和行为：

```text
resources/views
├── components            # 可复用组件
├── flux                  # 自定义的 Flux 组件
├── layouts               # 应用布局
├── pages                 # Livewire 页面
├── partials              # 可复用的 Blade 局部模板
├── dashboard.blade.php   # 已认证用户的仪表盘
├── welcome.blade.php     # 访客用户的欢迎页
```

<a name="livewire-available-layouts"></a>
#### 可用布局

Livewire 入门套件包含两种不同的主布局供你选择：「侧边栏」布局和「顶栏」布局。侧边栏布局是默认布局，但你可以通过修改应用 `resources/views/layouts/app.blade.php` 文件所使用的布局，切换为顶栏布局。此外，你还应为主 Flux 组件添加 `container` 属性：

```blade
<x-layouts::app.header>
    <flux:main container>
        {{ $slot }}
    </flux:main>
</x-layouts::app.header>
```

<a name="livewire-authentication-page-layout-variants"></a>
#### 认证页面布局变体

Livewire 入门套件附带的认证页面（例如登录页和注册页）同样提供三种不同的布局变体：「simple」、「card」和「split」。

要更改认证布局，请修改应用 `resources/views/layouts/auth.blade.php` 文件所使用的布局：

```blade
<x-layouts::auth.split>
    {{ $slot }}
</x-layouts::auth.split>
```

<a name="authentication"></a>
## 身份认证

所有入门套件都使用 [Laravel Fortify](/docs/{{version}}/fortify) 来处理身份认证。Fortify 为登录、注册、密码重置、邮箱验证等功能提供路由、控制器和逻辑。

Fortify 会根据应用 `config/fortify.php` 配置文件中启用的功能，自动注册以下认证路由：

| 路由                              | 方法 | 说明                         |
| ---------------------------------- | ------ | ----------------------------------- |
| `/login`                           | `GET`    | 显示登录表单                  |
| `/login`                           | `POST`   | 认证用户                   |
| `/logout`                          | `POST`   | 退出登录                        |
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
| `/two-factor-challenge`            | `GET`    | 显示 2FA 验证表单          |
| `/two-factor-challenge`            | `POST`   | 校验 2FA 验证码                     |

`php artisan route:list` Artisan 命令可用于显示应用中的所有路由。

<a name="enabling-and-disabling-features"></a>
### 启用与禁用功能

你可以在应用的 `config/fortify.php` 配置文件中控制启用哪些 Fortify 功能：

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

要禁用某个功能，只需在 `features` 数组中注释掉或删除对应的功能条目。例如，删除 `Features::registration()` 即可禁用公开注册。

使用 [React](#react)、[Svelte](#svelte) 或 [Vue](#vue) 入门套件时，你还需要在前端代码中移除对被禁用功能路由的所有引用。例如，如果你禁用了邮箱验证，则应移除 React、Svelte 或 Vue 组件中对 `verification` 路由的导入和引用。这一步必不可少，因为这些入门套件使用 Wayfinder 实现类型安全的路由，它会在构建时生成路由定义。如果你引用了已不存在的路由，应用将无法构建。

<a name="customizing-actions"></a>
### 自定义用户创建与密码重置

当用户注册或重置密码时，Fortify 会调用位于应用 `app/Actions/Fortify` 目录中的 Action 类：

| 文件                          | 说明                           |
| ----------------------------- | ------------------------------------- |
| `CreateNewUser.php`           | 验证并创建新用户       |
| `ResetUserPassword.php`       | 验证并更新用户密码  |
| `PasswordValidationRules.php` | 定义密码验证规则     |

例如，要自定义应用的注册逻辑，你应编辑 `CreateNewUser` action：

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

入门套件内置了双因素认证（2FA），允许用户使用任何兼容 TOTP 的验证器应用来保护自己的账户。默认情况下，2FA 已通过应用 `config/fortify.php` 配置文件中的 `Features::twoFactorAuthentication()` 启用。

`confirm` 选项要求用户在 2FA 完全启用前先验证一个验证码，而 `confirmPassword` 选项要求用户在启用或禁用 2FA 前确认密码。更多细节请参阅 [Fortify 的双因素认证文档](/docs/{{version}}/fortify#two-factor-authentication)。

<a name="rate-limiting"></a>
### 速率限制

速率限制可以防止暴力破解和反复的登录尝试拖垮你的认证端点。你可以在应用的 `FortifyServiceProvider` 中自定义 Fortify 的速率限制行为：

```php
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;

RateLimiter::for('login', function ($request) {
    return Limit::perMinute(5)->by($request->email.$request->ip());
});
```

<a name="workos"></a>
## WorkOS AuthKit 身份认证

默认情况下，React、Svelte、Vue 和 Livewire 入门套件都使用 Laravel 内置的认证系统来提供登录、注册、密码重置、邮箱验证等功能。此外，我们还为每个入门套件提供了由 [WorkOS AuthKit](https://authkit.com) 驱动的变体，它提供：

- 社交认证（Google、Microsoft、GitHub 和 Apple）
- 通行密钥（Passkey）认证
- 基于邮箱的 "Magic Auth"
- SSO

使用 WorkOS 作为你的认证提供方[需要 WorkOS 账户](https://workos.com)。WorkOS 为月活用户不超过 100 万的应用提供免费认证。

要将 WorkOS AuthKit 用作应用的认证提供方，请在通过 `laravel new` 创建由入门套件驱动的新应用时选择 WorkOS 选项。

### 配置你的 WorkOS 入门套件

使用 WorkOS 驱动的入门套件创建新应用后，你应在应用的 `.env` 文件中设置 `WORKOS_CLIENT_ID`、`WORKOS_API_KEY` 和 `WORKOS_REDIRECT_URL` 环境变量。这些变量应与 WorkOS 控制台中为你的应用提供的值一致：

```ini
WORKOS_CLIENT_ID=your-client-id
WORKOS_API_KEY=your-api-key
WORKOS_REDIRECT_URL="${APP_URL}/authenticate"
```

此外，你还应在 WorkOS 控制台中配置应用主页 URL。用户退出你的应用后，会被重定向到该 URL。

<a name="configuring-authkit-authentication-methods"></a>
#### 配置 AuthKit 认证方式

使用 WorkOS 驱动的入门套件时，我们建议你在应用的 WorkOS AuthKit 配置设置中禁用「邮箱 + 密码」认证，让用户只能通过社交认证提供方、通行密钥、"Magic Auth" 以及 SSO 进行认证。这样，你的应用就能完全避免处理用户密码。

<a name="configuring-authkit-session-timeouts"></a>
#### 配置 AuthKit 会话超时

此外，我们建议你将 WorkOS AuthKit 的会话不活跃超时配置为与 Laravel 应用配置的会话超时阈值一致，该阈值通常为两小时。

<a name="inertia-ssr"></a>
### Inertia SSR

React、Svelte 和 Vue 入门套件兼容 Inertia 的[服务端渲染](https://inertiajs.com/server-side-rendering)能力。要为应用构建兼容 Inertia SSR 的资源包，请运行 `build:ssr` 命令：

```shell
npm run build:ssr
```

为了方便起见，还提供了 `composer dev:ssr` 命令。该命令会先为应用构建兼容 SSR 的资源包，然后启动 Laravel 开发服务器和 Inertia SSR 服务器，让你能够在本地使用 Inertia 的服务端渲染引擎测试应用：

```shell
composer dev:ssr
```

<a name="community-maintained-starter-kits"></a>
### 社区维护的入门套件

使用 Laravel 安装器创建新的 Laravel 应用时，你可以将 Packagist 上任何可用的社区维护入门套件传给 `--using` 标志：

```shell
laravel new my-app --using=example/starter-kit
```

<a name="creating-starter-kits"></a>
#### 创建入门套件

为确保其他人可以使用你的入门套件，你需要将其发布到 [Packagist](https://packagist.org)。你的入门套件应在 `.env.example` 文件中定义其所需的环境变量，并且任何必要的安装后命令都应列在入门套件 `composer.json` 文件的 `post-create-project-cmd` 数组中。

<a name="faqs"></a>
### 常见问题

<a name="faq-upgrade"></a>
#### 如何升级？

每个入门套件都为你的下一个应用提供了坚实的基础。由于代码完全归你所有，你可以按照自己的设想随意调整、自定义和构建应用。不过，你无需更新入门套件本身。

<a name="faq-enable-email-verification"></a>
#### 如何启用邮箱验证？

取消 `App/Models/User.php` 模型中 `MustVerifyEmail` 导入的注释，并确保该模型实现 `MustVerifyEmail` 接口，即可添加邮箱验证：

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

注册后，用户会收到一封验证邮件。要在用户邮箱地址验证通过之前限制对某些路由的访问，请为这些路由添加 `verified` 中间件：

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
```

> [!NOTE]
> 使用 [WorkOS](#workos) 版本的入门套件时，无需邮箱验证。

<a name="faq-modify-email-template"></a>
#### 如何修改默认邮件模板？

你可能希望自定义默认邮件模板，使其更契合应用的品牌形象。要修改该模板，你应使用以下命令将邮件视图发布到应用中：

```
php artisan vendor:publish --tag=laravel-mail
```

这会在 `resources/views/vendor/mail` 中生成多个文件。你可以修改这些文件以及 `resources/views/vendor/mail/themes/default.css` 文件，来更改默认邮件模板的外观。
