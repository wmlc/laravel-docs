# 贡献指南

## Bug 报告

为了鼓励积极的协作，Laravel 强烈建议使用 pull request 来解决问题，而不是使用 GitHub issues。我们的多数第一方包都禁用了 GitHub issues。

如果你发现了问题，请创建一个解决该问题的 pull request。你的 pull request 应当包含一个标题，以及对问题和解决方案的清晰描述。你还应当尽可能提供相关信息，以及一个能够复现该问题的代码示例。pull request 的目的是让你自己和其他人都能轻松理解问题并验证修复。

如果你不知道如何修复问题，可以向编码代理描述该问题，并借助它来尝试提交一个 pull request。

只有被标记为"待审核"（而非"草稿"状态）且新功能的所有测试均已通过的 pull request 才会被审核。停留在"草稿"状态、长期未活跃的 pull request 将在几天后被关闭。

Laravel 源代码托管在 GitHub 上，每个 Laravel 项目都有对应的仓库：

- [Laravel AI SDK](https://github.com/laravel/ai)
- [Laravel Application](https://github.com/laravel/laravel)
- [Laravel Art](https://github.com/laravel/art)
- [Laravel Boost](https://github.com/laravel/boost)
- [Laravel Documentation](https://github.com/laravel/docs)
- [Laravel Dusk](https://github.com/laravel/dusk)
- [Laravel Cashier Stripe](https://github.com/laravel/cashier)
- [Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle)
- [Laravel Echo](https://github.com/laravel/echo)
- [Laravel Envoy](https://github.com/laravel/envoy)
- [Laravel Folio](https://github.com/laravel/folio)
- [Laravel Framework](https://github.com/laravel/framework)
- [Laravel Horizon](https://github.com/laravel/horizon)
- [Laravel Passport](https://github.com/laravel/passport)
- [Laravel Pennant](https://github.com/laravel/pennant)
- [Laravel Pint](https://github.com/laravel/pint)
- [Laravel Prompts](https://github.com/laravel/prompts)
- [Laravel Reverb](https://github.com/laravel/reverb)
- [Laravel Sail](https://github.com/laravel/sail)
- [Laravel Sanctum](https://github.com/laravel/sanctum)
- [Laravel Scout](https://github.com/laravel/scout)
- [Laravel Socialite](https://github.com/laravel/socialite)
- [Laravel Telescope](https://github.com/laravel/telescope)
- [Laravel Livewire Starter Kit](https://github.com/laravel/livewire-starter-kit)
- [Laravel React Starter Kit](https://github.com/laravel/react-starter-kit)
- [Laravel Svelte Starter Kit](https://github.com/laravel/svelte-starter-kit)
- [Laravel Vue Starter Kit](https://github.com/laravel/vue-starter-kit)

## 支持问题

Laravel 的 GitHub issue 跟踪器并非用于提供 Laravel 相关的帮助或支持。请改用以下渠道之一：

- [GitHub Discussions](https://github.com/laravel/framework/discussions)
- [Laracasts Forums](https://laracasts.com/discuss)
- [Laravel.io Forums](https://laravel.io/forum)
- [StackOverflow](https://stackoverflow.com/questions/tagged/laravel)
- [Discord](https://discord.gg/laravel)
- [Larachat](https://larachat.co)
- [IRC](https://web.libera.chat/?nick=artisan&channels=#laravel)

## 使用哪个分支？

所有的 bug 修复都应发送到当前支持 bug 修复的最新版本（目前是 `13.x`）。除非修复的是仅在即将发布的版本中才存在的功能，否则**绝不要**将 bug 修复发送到 `master` 分支。

与当前发行版**完全向后兼容**的**次要**功能可以发送到最新的稳定分支（目前是 `13.x`）。

带有破坏性变更的**主要**新功能或特性，应始终发送到包含即将发布版本的 `master` 分支。

## 编译后的资源

如果你提交的更改会影响某个编译后的文件，例如 `laravel/laravel` 仓库中 `resources/css` 或 `resources/js` 下的大部分文件，请不要提交这些编译后的文件。由于体积庞大，维护者无法实际审查它们。这可能被利用来向 Laravel 注入恶意代码。为了从防御角度杜绝这种情况，所有编译后的文件都将由 Laravel 维护者生成并提交。

## AI 生成的贡献

我们感谢每一个提交给 Laravel 的 pull request。但是，主要由 AI 生成、缺乏人工细致审查与考量的大量贡献是不被接受的。

如果你选择使用 AI 工具来协助完成对框架的大型或复杂贡献，在提交之前，你**必须**彻底审查、测试并理解生成的代码。

pull request 的描述**必须**完全由贡献者本人撰写。带有 AI 生成描述的 pull request 将被关闭。

**大量开启完全由 AI 生成的 issue 或 pull request 将不被容忍。** 此类 pull request 将在未经审查的情况下被关闭，相关贡献者可能会被禁止访问该仓库。

我们鼓励贡献者熟悉现有代码库、参与社区，并提交能够体现自己对所解决问题理解与审慎思考的 pull request。

## 安全漏洞

如果你在 Laravel 中发现安全漏洞，请通过 <a href="mailto:security@laravel.com">security@laravel.com</a> 邮件联系我们的安全团队。所有安全漏洞都会得到及时处理。

## 代码风格

Laravel 遵循 [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) 编码标准以及 [PSR-4](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md) 自动加载标准。

### PHPDoc

以下是一个有效的 Laravel 文档块示例。注意 `@param` 属性后跟两个空格、参数类型、再两个空格，最后是变量名：

```php
/**
 * 在容器中注册一个绑定。
 *
 * @param  string|array  $abstract
 * @param  \Closure|string|null  $concrete
 * @param  bool  $shared
 * @return void
 *
 * @throws \Exception
 */
public function bind($abstract, $concrete = null, $shared = false)
{
    // ...
}
```

当 `@param` 或 `@return` 属性因使用了原生类型而变得冗余时，可以将其删除：

```php
/**
 * 执行任务。
 * [tl! remove]
 * @return void [tl! remove]
 */
public function handle(AudioProcessor $processor): void
{
    // ...
}
```

但是，当原生类型是泛型时，请通过 `@param` 或 `@return` 属性来指明泛型类型：

```php
/**
 * 获取消息的附件。
 * [tl! add]
 * @return array<int, \Illuminate\Mail\Mailables\Attachment> [tl! add]
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file'),
    ];
}
```

### StyleCI

如果你代码的风格不够完美也无需担心！在 pull request 合并后，[StyleCI](https://styleci.io/) 会自动将任何风格修复合并进 Laravel 仓库。这让我们能够专注于贡献的内容，而不是代码风格。

## 行为准则

Laravel 的行为准则派生自 Ruby 的行为准则。任何违反行为准则的行为都可以向 Taylor Otwell（taylor@laravel.com）举报：

- 参与者应当包容对立的观点。
- 参与者必须确保自己的语言和举止不包含人身攻击与贬损性言论。
- 在解读他人言行时，参与者应始终假定对方善意。
- 任何可以被合理地视为骚扰的行为都绝不被容忍。
