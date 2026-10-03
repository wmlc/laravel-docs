# 贡献指南

- [Bug 报告](#bug-reports)
- [支持性问题](#support-questions)
- [核心开发讨论](#core-development-discussion)
- [该用哪个分支？](#which-branch)
- [编译产物](#compiled-assets)
- [安全漏洞](#security-vulnerabilities)
- [代码风格](#coding-style)
    - [PHPDoc](#phpdoc)
    - [StyleCI](#styleci)
- [行为准则](#code-of-conduct)

<a name="bug-reports"></a>
## Bug 报告

为鼓励积极协作，Laravel 强烈鼓励提交 pull request，而不只是 Bug 报告。只有当 pull request 被标记为"ready for review"（而非"draft"状态）且新功能的全部测试通过时，才会进入评审。长期处于"draft"状态且无人跟进的 pull request 会在几天后被关闭。

不过，如果你要提交 Bug 报告，issue 中应包含标题和清晰的问题描述。你还应尽可能多地提供相关信息，以及一个能复现问题的代码示例。提交 Bug 报告的目的是让你自己和他人易于复现该 Bug 并开发修复方案。

请记住，提交 Bug 报告是希望遇到相同问题的其他人能够与你协作解决它。不要期望 Bug 报告会自动得到任何关注，也不要指望别人会立刻跳出来修复它。提交 Bug 报告有助于你和其他人开始着手解决问题。如果你想出一份力，可以帮助修复[我们的问题追踪器中列出的任何 Bug](https://github.com/issues?q=is%3Aopen+is%3Aissue+label%3Abug+user%3Alaravel)。你必须通过 GitHub 认证才能查看 Laravel 的全部 issue。

如果你在使用 Laravel 时发现 DocBlock、PHPStan 或 IDE 警告不正确，请不要创建 GitHub issue，而是提交一个 pull request 来修复问题。

Laravel 源代码在 GitHub 上管理，每个 Laravel 项目都有对应的仓库：

<div class="content-list" markdown="1">

- [Laravel Application](https://github.com/laravel/laravel)
- [Laravel Art](https://github.com/laravel/art)
- [Laravel Breeze](https://github.com/laravel/breeze)
- [Laravel Documentation](https://github.com/laravel/docs)
- [Laravel Dusk](https://github.com/laravel/dusk)
- [Laravel Cashier Stripe](https://github.com/laravel/cashier)
- [Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle)
- [Laravel Echo](https://github.com/laravel/echo)
- [Laravel Envoy](https://github.com/laravel/envoy)
- [Laravel Folio](https://github.com/laravel/folio)
- [Laravel Framework](https://github.com/laravel/framework)
- [Laravel Homestead](https://github.com/laravel/homestead)（[构建脚本](https://github.com/laravel/settler)）
- [Laravel Horizon](https://github.com/laravel/horizon)
- [Laravel Jetstream](https://github.com/laravel/jetstream)
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
- [Laravel Website](https://github.com/laravel/laravel.com)

</div>

<a name="support-questions"></a>
## 支持性问题

Laravel 的 GitHub issue 追踪器并不是用来提供 Laravel 帮助或支持的。请改用以下渠道之一：

<div class="content-list" markdown="1">

- [GitHub Discussions](https://github.com/laravel/framework/discussions)
- [Laracasts Forums](https://laracasts.com/discuss)
- [Laravel.io Forums](https://laravel.io/forum)
- [StackOverflow](https://stackoverflow.com/questions/tagged/laravel)
- [Discord](https://discord.gg/laravel)
- [Larachat](https://larachat.co)
- [IRC](https://web.libera.chat/?nick=artisan&channels=#laravel)

</div>

<a name="core-development-discussion"></a>
## 核心开发讨论

你可以在 Laravel framework 仓库的 [GitHub 讨论区](https://github.com/laravel/framework/discussions)提出新功能或对现有 Laravel 行为的改进建议。如果你提出新功能，请愿意至少实现完成该功能所需的部分代码。

关于 Bug、新功能以及现有功能实现的非正式讨论，都发生在 [Laravel Discord 服务器](https://discord.gg/laravel)的 `#internals` 频道中。Laravel 维护者 Taylor Otwell 通常在工作日 8 点至 17 点（UTC-06:00 或 America/Chicago）出现在该频道，其他时间也会不定期露面。

<a name="which-branch"></a>
## 该用哪个分支？

**所有** Bug 修复都应提交到支持 Bug 修复的最新版本分支（当前为 `11.x`）。除非修复的是即将发布版本才有的功能，否则 Bug 修复**绝不**应提交到 `master` 分支。

与当前发布版本**完全向后兼容**的**小**功能，可以提交到最新的稳定分支（当前为 `11.x`）。

**重大**新功能或包含破坏性变更的功能，应始终提交到包含即将发布版本的 `master` 分支。

<a name="compiled-assets"></a>
## 编译产物

如果你提交的是会影响编译文件的改动（例如 `laravel/laravel` 仓库中 `resources/css` 或 `resources/js` 下的多数文件），请不要提交编译后的文件。由于这些文件体积庞大，维护者实际上无法对它们进行评审。这可能被利用作为向 Laravel 注入恶意代码的途径。为了防御性地避免这种情况，所有编译文件都由 Laravel 维护者生成并提交。

<a name="security-vulnerabilities"></a>
## 安全漏洞

如果你在 Laravel 中发现安全漏洞，请发送邮件给 Taylor Otwell：<a href="mailto:taylor@laravel.com">taylor@laravel.com</a>。所有安全漏洞都会得到及时处理。

<a name="coding-style"></a>
## 代码风格

Laravel 遵循 [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) 编码规范和 [PSR-4](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md) 自动加载规范。

<a name="phpdoc"></a>
### PHPDoc

下面是一个有效的 Laravel 文档注释块示例。请注意，`@param` 属性后面跟两个空格、参数类型、再跟两个空格，最后是变量名：

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

如果使用原生类型后 `@param` 或 `@return` 属性显得冗余，可以把它们删除：

```php
/**
 * 执行任务。
 */
public function handle(AudioProcessor $processor): void
{
    //
}
```

不过，如果原生类型是泛型，请通过 `@param` 或 `@return` 属性指定泛型类型：

```php
/**
 * 获取邮件的所有附件。
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

不必担心你的代码风格不够完美！[StyleCI](https://styleci.io/) 会在 pull request 合并后自动把任何风格修复合并到 Laravel 仓库中。这让我们可以专注于贡献的内容本身，而不是代码风格。

<a name="code-of-conduct"></a>
## 行为准则

Laravel 的行为准则源自 Ruby 的行为准则。任何违反行为准则的行为都可以向 Taylor Otwell（taylor@laravel.com）报告：

<div class="content-list" markdown="1">

- 参与者应容纳不同的观点。
- 参与者必须确保自己的语言和行为不含人身攻击和贬低他人的言论。
- 解读他人的言行时，参与者应始终假设对方出于善意。
- 任何可被合理视为骚扰的行为都将不被容忍。

</div>
