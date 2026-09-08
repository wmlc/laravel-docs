# 贡献指南

- [Bug 报告](#bug-reports)
- [支持问题](#support-questions)
- [使用哪个分支？](#which-branch)
- [编译资源](#compiled-assets)
- [AI 生成的贡献](#ai-generated-contributions)
- [安全漏洞](#security-vulnerabilities)
- [编码风格](#coding-style)
    - [PHPDoc](#phpdoc)
    - [StyleCI](#styleci)
- [行为准则](#code-of-conduct)

<a name="bug-reports"></a>
## Bug 报告

为了鼓励积极的协作，Laravel 强烈建议使用 pull request 来解决问题，而不是使用 GitHub issue。我们大部分第一方包都禁用了 GitHub issue。

如果你发现了问题，请创建一个解决问题的 pull request。你的 pull request 应包含标题，以及对问题及其解决方案的清晰描述。你还应该尽可能包含相关的信息，以及能够复现该问题的代码示例。pull request 的目标是让你自己和他人都能轻松理解问题并验证修复。

如果你不知道如何修复问题，请向某个编码代理描述该 issue，并借助它来尝试提交 pull request。

只有当 pull request 被标记为「ready for review」（而不是处于「draft」状态）且新功能的所有测试都通过时，才会被审查。长时间停留在「draft」状态、不再活跃的 pull request 会在几天后被关闭。

Laravel 的源代码托管在 GitHub 上，每个 Laravel 项目都有对应的仓库：

<div class="content-list" markdown="1">

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

</div>

<a name="support-questions"></a>
## 支持问题

Laravel 的 GitHub issue 跟踪器并不用于提供 Laravel 相关的帮助或支持。请改用以下渠道之一：

<div class="content-list" markdown="1">

- [GitHub Discussions](https://github.com/laravel/framework/discussions)
- [Laracasts Forums](https://laracasts.com/discuss)
- [Laravel.io Forums](https://laravel.io/forum)
- [StackOverflow](https://stackoverflow.com/questions/tagged/laravel)
- [Discord](https://discord.gg/laravel)
- [Larachat](https://larachat.co)
- [IRC](https://web.libera.chat/?nick=artisan&channels=#laravel)

</div>

<a name="which-branch"></a>
## 使用哪个分支？

**所有** bug 修复都应提交到支持 bug 修复的最新版本（当前为 `13.x`）。除非是修复仅存在于即将发布版本中的功能，否则**绝不**应将 bug 修复提交到 `master` 分支。

与当前版本**完全向后兼容**的**次要**功能，可以提交到最新的稳定分支（当前为 `13.x`）。

带有破坏性变更的**主要**新功能或特性，应始终提交到 `master` 分支，该分支包含即将发布的版本。

<a name="compiled-assets"></a>
## 编译资源

如果你提交的改动会影响编译后的文件（例如 `laravel/laravel` 仓库中 `resources/css` 或 `resources/js` 下的大部分文件），请不要提交编译后的文件。由于这些文件体积较大，维护者实际上无法审查。这可能会被利用来向 Laravel 注入恶意代码。为了防御性地防止这种情况，所有编译后的文件将由 Laravel 维护者生成并提交。

<a name="ai-generated-contributions"></a>
## AI 生成的贡献

我们感谢每一个提交给 Laravel 的 pull request。但是，主要由 AI 生成、缺乏深思熟虑的人工审查与考量的重大贡献是不可接受的。

如果你选择使用 AI 工具来协助完成对框架的大型或复杂贡献，提交前你必须对生成的代码进行彻底审查、测试并充分理解。

pull request 的描述**必须**完全由贡献者本人撰写。带有 AI 生成描述的 pull request 将被关闭。

**大量开启完全由 AI 生成的 issue 或 pull request 将不被容忍。** 此类 pull request 将在不审查的情况下被关闭，相关贡献者可能会被禁止访问该仓库。

我们鼓励贡献者熟悉现有代码库、参与社区交流，并提交能够体现自己对所解决问题有自身理解与审慎考量的 pull request。

<a name="security-vulnerabilities"></a>
## 安全漏洞

如果你在 Laravel 中发现了安全漏洞，请通过 <a href="mailto:security@laravel.com">security@laravel.com</a> 发送邮件给我们的安全团队。所有安全漏洞都会得到及时处理。

<a name="coding-style"></a>
## 编码风格

Laravel 遵循 [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) 编码标准与 [PSR-4](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md) 自动加载标准。

<a name="phpdoc"></a>
### PHPDoc

下面是一个有效的 Laravel 文档注释块示例。注意 `@param` 属性后有两个空格、参数类型、再两个空格，最后是变量名：

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

当 `@param` 或 `@return` 属性由于使用了原生类型而显得冗余时，可以将其删除：

```php
/**
 * Execute the job.
 * [tl! remove]
 * @return void [tl! remove]
 */
public function handle(AudioProcessor $processor): void
{
    // ...
}
```

但是，当原生类型属于泛型时，请通过 `@param` 或 `@return` 属性来指定泛型类型：

```php
/**
 * Get the attachments for the message.
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

<a name="styleci"></a>
### StyleCI

如果你的代码风格不够完美也不用担心！在 pull request 合并后，[StyleCI](https://styleci.io/) 会自动将任何风格修复合并到 Laravel 仓库中。这让我们可以将精力集中在贡献的内容上，而不是代码风格上。

<a name="code-of-conduct"></a>
## 行为准则

Laravel 的行为准则改编自 Ruby 的行为准则。任何违反行为准则的行为都可以向 Taylor Otwell（taylor@laravel.com）举报：

<div class="content-list" markdown="1">

- 参与者应包容对立的观点。
- 参与者必须确保其语言和行为不包含人身攻击与贬低性的个人言论。
- 在解读他人的言行时，参与者应始终假定其出于善意。
- 任何可以被合理认定为骚扰的行为都不会被容忍。

</div>
