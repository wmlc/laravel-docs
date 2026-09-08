# 贡献指南

- [Bug 报告](#bug-reports)
- [支持问题](#support-questions)
- [核心开发讨论](#core-development-discussion)
- [提交到哪个分支？](#which-branch)
- [编译资源](#compiled-assets)
- [AI 生成的贡献](#ai-generated-contributions)
- [安全漏洞](#security-vulnerabilities)
- [编码风格](#coding-style)
    - [PHPDoc](#phpdoc)
    - [StyleCI](#styleci)
- [行为准则](#code-of-conduct)

<a name="bug-reports"></a>
## Bug 报告

为了鼓励积极协作，Laravel 更鼓励提交 pull request，而不仅仅是 bug 报告。只有标记为「ready for review」（而非「draft」状态）且新功能的所有测试均已通过的 pull request，才会进入评审。长期处于「draft」状态、无人跟进的 pull request 会在几天后被关闭。

如果你提交的是 bug 报告，issue 中应包含标题和对问题的清晰描述。你还应尽可能提供相关的信息，以及能复现该问题的代码示例。bug 报告的目标是让你自己和他人都能轻松复现这个 bug 并着手修复。

请记住，创建 bug 报告是希望遇到相同问题的人能与你协作解决问题。不要指望 bug 报告会自动获得关注，也不要指望他人会立刻着手修复。创建 bug 报告是为了帮助你和他人踏上修复问题之路。如果你想出一份力，可以协助修复[我们 issue 跟踪器中列出的任何 bug](https://github.com/issues?q=is%3Aopen+is%3Aissue+label%3Abug+user%3Alaravel)。你必须登录 GitHub 才能查看 Laravel 的全部 issue。

如果你在使用 Laravel 时发现不规范的 DocBlock、PHPStan 或 IDE 警告，请不要创建 GitHub issue，而应提交 pull request 来修复问题。

Laravel 的源代码托管在 GitHub 上，每个 Laravel 项目都有对应的仓库：

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

<a name="support-questions"></a>
## 支持问题

Laravel 的 GitHub issue 跟踪器不用于提供 Laravel 帮助或支持。请改用以下渠道：

- [GitHub Discussions](https://github.com/laravel/framework/discussions)
- [Laracasts Forums](https://laracasts.com/discuss)
- [Laravel.io Forums](https://laravel.io/forum)
- [StackOverflow](https://stackoverflow.com/questions/tagged/laravel)
- [Discord](https://discord.gg/laravel)
- [Larachat](https://larachat.co)
- [IRC](https://web.libera.chat/?nick=artisan&channels=#laravel)

<a name="core-development-discussion"></a>
## 核心开发讨论

你可以在 Laravel 框架仓库的 [GitHub 讨论区](https://github.com/laravel/framework/discussions)中提出新功能或对现有 Laravel 行为的改进建议。如果你提议一个新功能，请愿意至少实现完成该功能所需的部分代码。

关于 bug、新功能以及现有功能实现的非正式讨论，在 [Laravel Discord 服务器](https://discord.gg/laravel)的 `#internals` 频道进行。Laravel 的维护者 Taylor Otwell 通常在工作日 8am-5pm（UTC-06:00，即 America/Chicago）在线该频道，其他时间偶尔在线。

<a name="which-branch"></a>
## 提交到哪个分支？

**所有** bug 修复都应提交到支持 bug 修复的最新版本（目前为 `12.x`）。**绝不**应将 bug 修复提交到 `master` 分支，除非它们修复的功能仅存在于即将发布的版本中。

与当前版本**完全向后兼容**的**次要**功能，可以提交到最新的稳定分支（目前为 `12.x`）。

**重大**新功能或包含破坏性变更的功能，应始终提交到包含即将发布版本的 `master` 分支。

<a name="compiled-assets"></a>
## 编译资源

如果你提交的更改会影响某个编译文件，例如 `laravel/laravel` 仓库 `resources/css` 或 `resources/js` 中的大多数文件，请不要提交编译后的文件。由于编译文件体积庞大，维护者实际上无法对其进行评审，这可能被利用来向 Laravel 注入恶意代码。为了防范这一风险，所有编译文件都将由 Laravel 维护者生成并提交。

<a name="ai-generated-contributions"></a>
## AI 生成的贡献

我们感谢提交给 Laravel 的每一个 pull request。但是，那些主要由 AI 生成、未经认真人工评审和思考的贡献是不可接受的。

如果你选择使用 AI 工具辅助贡献，那么提交前，你**必须**对生成的代码进行彻底的评审、测试和理解。

**批量创建完全由 AI 生成的 issue 或 pull request 是不被容忍的。**此类 pull request 将未经评审即被关闭，相关用户也可能被禁止访问仓库。

我们鼓励贡献者熟悉现有代码库，积极参与社区交流，提交能够体现自己对该问题的理解和深入思考的 pull request。

<a name="security-vulnerabilities"></a>
## 安全漏洞

如果你在 Laravel 中发现安全漏洞，请发送邮件至 Taylor Otwell：<a href="mailto:taylor@laravel.com">taylor@laravel.com</a>。所有安全漏洞都会得到及时处理。

<a name="coding-style"></a>
## 编码风格

Laravel 遵循 [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) 编码标准和 [PSR-4](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md) 自动加载标准。

<a name="phpdoc"></a>
### PHPDoc

下面是一个有效的 Laravel 文档块示例。注意，`@param` 属性后跟两个空格、参数类型、再两个空格，最后是变量名：

```php
/**
 * Register a binding with the container.
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

当 `@param` 或 `@return` 属性因使用了原生类型而显得冗余时，可以将其省略：

```php
/**
 * Execute the job.
 */
public function handle(AudioProcessor $processor): void
{
    // ...
}
```

但当原生类型是泛型时，请通过 `@param` 或 `@return` 属性指明泛型类型：

```php
/**
 * Get the attachments for the message.
 *
 * @return array<int, \Illuminate\Mail\Mailables\Attachment>
 */
public function attachments(): array
{
    return [
        Attachment::fromStorage('/path/to/file'),
    ];
}
```

<a name="styleci"></a>
### StyleCI

不必担心你的代码风格不够完美！pull request 合并后，[StyleCI](https://styleci.io/) 会自动将任何风格修正合并到 Laravel 仓库中。这让我们能够专注于贡献的内容，而非代码风格。

<a name="code-of-conduct"></a>
## 行为准则

Laravel 的行为准则源自 Ruby 的行为准则。任何违反行为准则的行为均可报告给 Taylor Otwell（taylor@laravel.com）：

- 参与者应包容不同的观点。
- 参与者必须确保自己的言行不包含人身攻击和贬损性的个人评论。
- 在解读他人的言行时，参与者应始终假定对方出于善意。
- 任何可以合理认定为骚扰的行为都将不被容忍。
