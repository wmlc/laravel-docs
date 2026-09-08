# 发行说明

- [版本规范](#versioning-scheme)
- [支持策略](#support-policy)
- [Laravel 12](#laravel-12)

<a name="versioning-scheme"></a>
## 版本规范

Laravel 及其其他第一方软件包遵循[语义化版本](https://semver.org)。框架的主版本每年（约第一季度）发布一次，而次版本和修订版本可能每周都会发布。次版本和修订版本**绝不**包含破坏性变更。

在应用或软件包中引用 Laravel 框架或其组件时，应始终使用类似 `^12.0` 的版本约束，因为 Laravel 的主版本确实包含破坏性变更。不过，我们一直在努力确保你能在一天甚至更短时间内完成向新主版本的升级。

<a name="named-arguments"></a>
#### 命名参数

[命名参数](https://www.php.net/manual/en/functions.arguments.php#functions.named-arguments)不在 Laravel 的向后兼容保障范围内。为了改进 Laravel 代码库，必要时我们可能会选择重命名函数参数。因此，在调用 Laravel 方法时应谨慎使用命名参数，并理解参数名称未来可能会发生变化。

<a name="support-policy"></a>
## 支持策略

对于所有 Laravel 版本，错误修复提供 18 个月，安全修复提供 2 年。对于所有其他扩展库，只有最新的主版本会获得错误修复。此外，请查看 Laravel [支持的数据库版本](/docs/{{version}}/database#introduction)。

| 版本 | PHP (*)   | 发布时间             | 错误修复截至         | 安全修复截至         |
| ------- |-----------| ------------------- | ------------------- | -------------------- |
| 10      | 8.1 - 8.3 | 2023 年 2 月 14 日  | 2024 年 8 月 6 日   | 2025 年 2 月 4 日    |
| 11      | 8.2 - 8.4 | 2024 年 3 月 12 日  | 2025 年 9 月 3 日   | 2026 年 3 月 12 日   |
| 12      | 8.2 - 8.5 | 2025 年 2 月 24 日  | 2026 年 8 月 13 日  | 2027 年 2 月 24 日   |
| 13      | 8.3 - 8.5 | 2026 年第一季度      | 2027 年第三季度      | 2028 年第一季度       |

<div class="version-colors">
    <div class="end-of-life">
        <div class="color-box"></div>
        <div>已停止维护</div>
    </div>
    <div class="security-fixes">
        <div class="color-box"></div>
        <div>仅提供安全修复</div>
    </div>
</div>

(*) 支持的 PHP 版本

<a name="laravel-12"></a>
## Laravel 12

Laravel 12 延续了 Laravel 11.x 的改进方向，更新了上游依赖，并为 React、Svelte、Vue 和 Livewire 引入了全新的入门套件，其中包括可选的 [WorkOS AuthKit](https://authkit.com) 用户认证方案。我们入门套件的 WorkOS 版本支持社交认证、通行密钥（passkey）以及 SSO。

<a name="minimal-breaking-changes"></a>
### 极少的破坏性变更

在本次发布周期中，我们的重心之一就是将破坏性变更降到最低。我们更倾向于全年持续发布不会破坏现有应用的易用性改进。

因此，Laravel 12 是一次相对较小的"维护性发布"，主要目的是升级现有依赖。基于这一点，大多数 Laravel 应用无需修改任何应用代码即可升级到 Laravel 12。

<a name="new-application-starter-kits"></a>
### 全新的应用入门套件

Laravel 12 为 React、Svelte、Vue 和 Livewire 引入了全新的[应用入门套件](/docs/{{version}}/starter-kits)。React、Svelte 和 Vue 入门套件采用了 Inertia 2、TypeScript、[shadcn/ui](https://ui.shadcn.com) 和 Tailwind；而 Livewire 入门套件则采用了基于 Tailwind 的 [Flux UI](https://fluxui.dev) 组件库和 Laravel Volt。

React、Svelte、Vue 和 Livewire 入门套件均使用 Laravel 内置的认证系统，提供登录、注册、密码重置、邮箱验证等功能。此外，我们还为每个入门套件推出了由 [WorkOS AuthKit 驱动](https://authkit.com)的版本，支持社交认证、通行密钥和 SSO。WorkOS 为月活跃用户不超过 100 万的应用提供免费认证服务。

随着全新应用入门套件的推出，Laravel Breeze 和 Laravel Jetstream 将不再获得后续更新。

要开始使用我们全新的入门套件，请查阅[入门套件文档](/docs/{{version}}/starter-kits)。
