# 贡献指南

- [Bug 报告](#bug-reports)
- [支持问题](#support-questions)
- [核心开发讨论](#core-development-discussion)
- [选择分支](#which-branch)
- [编译资源](#compiled-assets)
- [安全漏洞](#security-vulnerabilities)
- [编码风格](#coding-style)
    - [PHPDoc](#phpdoc)
    - [StyleCI](#styleci)
- [行为准则](#code-of-conduct)

<a name="bug-reports"></a>
## Bug 报告

为了鼓励积极的协作，Laravel 强烈鼓励提交 Pull Request，而不仅仅是 Bug 报告。Pull Request 只有在标记为 "ready for review"（而非 "draft" 状态）且新功能的所有测试通过时才会被审查。停留在 "draft" 状态且不活跃的 Pull Request 将在几天后被关闭。

不过，如果你提交了 Bug 报告，你的 Issue 应包含标题和清晰的问题描述。你还应尽可能包含相关的信息，以及能复现该问题的代码示例。Bug 报告的目标是让你自己和其他人都能轻松地复现该 Bug 并开发修复方案。

请记住，创建 Bug 报告是希望其他遇到相同问题的人能与你协作解决它。不要期望 Bug 报告会自动获得关注，也不要期望他人会立即着手修复。创建 Bug 报告的目的是帮助你自己和其他人开始着手修复问题。如果你想参与，可以通过修复 [我们 Issue 跟踪器中列出的任何 Bug](https://github.com/issues?q=is%3Aopen+is%3Aissue+label%3Abug+user%3Alaravel) 来帮忙。你必须通过 GitHub 身份验证才能查看 Laravel 的所有 Issue。

Laravel 的源代码托管在 GitHub 上，每个 Laravel 项目都有对应的仓库：

- [Laravel Application](https://github.com/laravel/laravel)
- [Laravel Art](https://github.com/laravel/art)
- [Laravel Documentation](https://github.com/laravel/docs)
- [Laravel Dusk](https://github.com/laravel/dusk)
- [Laravel Cashier Stripe](https://github.com/laravel/cashier)
- [Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle)
- [Laravel Echo](https://github.com/laravel/echo)
- [Laravel Envoy](https://github.com/laravel/envoy)
- [Laravel Framework](https://github.com/laravel/framework)
- [Laravel Homestead](https://github.com/laravel/homestead)
- [Laravel Homestead Build Scripts](https://github.com/laravel/settler)
- [Laravel Horizon](https://github.com/laravel/horizon)
- [Laravel Jetstream](https://github.com/laravel/jetstream)
- [Laravel Passport](https://github.com/laravel/passport)
- [Laravel Pint](https://github.com/laravel/pint)
- [Laravel Sail](https://github.com/laravel/sail)
- [Laravel Sanctum](https://github.com/laravel/sanctum)
- [Laravel Scout](https://github.com/laravel/scout)
- [Laravel Socialite](https://github.com/laravel/socialite)
- [Laravel Telescope](https://github.com/laravel/telescope)
- [Laravel Website](https://github.com/laravel/laravel.com-next)

<a name="support-questions"></a>
## 支持问题

Laravel 的 GitHub Issue 跟踪器不用于提供 Laravel 帮助或支持。请改用以下渠道之一：

- [GitHub Discussions](https://github.com/laravel/framework/discussions)
- [Laracasts Forums](https://laracasts.com/discuss)
- [Laravel.io Forums](https://laravel.io/forum)
- [StackOverflow](https://stackoverflow.com/questions/tagged/laravel)
- [Discord](https://discord.gg/laravel)
- [Larachat](https://larachat.co)
- [IRC](https://web.libera.chat/?nick=artisan&channels=#laravel)

<a name="core-development-discussion"></a>
## 核心开发讨论

你可以在 Laravel 框架仓库的 [GitHub 讨论板](https://github.com/laravel/framework/discussions) 中提出新功能或对现有 Laravel 行为的改进建议。如果你提出了新功能，请愿意至少实现完成该功能所需的部分代码。

关于 Bug、新功能以及现有功能实现的非正式讨论在 [Laravel Discord 服务器](https://discord.gg/laravel) 的 `#internals` 频道进行。Laravel 的维护者 Taylor Otwell 通常在工作日 8am-5pm（UTC-06:00 或 America/Chicago）出现在该频道，其他时间偶尔也会出现。

<a name="which-branch"></a>
## 选择分支？

**所有** Bug 修复都应发送到支持 Bug 修复的最新版本（当前为 `9.x`）。Bug 修复**绝不**应发送到 `master` 分支，除非它们修复了仅存在于即将发布版本中的功能。

与当前版本**完全向后兼容**的**次要**功能可以发送到最新的稳定分支（当前为 `9.x`）。

**重大**新功能或具有破坏性变更的功能应始终发送到 `master` 分支，该分支包含即将发布的版本。

<a name="compiled-assets"></a>
## 编译资源

如果你提交的更改会影响编译文件，例如 `laravel/laravel` 仓库中 `resources/css` 或 `resources/js` 中的大多数文件，请不要提交编译后的文件。由于这些文件体积过大，维护者实际上无法对其进行审查。这可能被利用作为向 Laravel 注入恶意代码的途径。为了防御性地防止这种情况，所有编译文件都将由 Laravel 维护者生成并提交。

<a name="security-vulnerabilities"></a>
## 安全漏洞

如果你在 Laravel 中发现安全漏洞，请发送电子邮件至 Taylor Otwell 的邮箱 <a href="mailto:taylor@laravel.com">taylor@laravel.com</a>。所有安全漏洞都将得到及时处理。

<a name="coding-style"></a>
## 编码风格

Laravel 遵循 [PSR-2](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-2-coding-style-guide.md) 编码标准和 [PSR-4](https://github.com/php-fig/fig-standards/blob/master/accepted/PSR-4-autoloader.md) 自动加载标准。

<a name="phpdoc"></a>
### PHPDoc

以下是一个有效的 Laravel 文档块示例。请注意，`@param` 属性后跟两个空格、参数类型、再两个空格，最后是变量名：

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
        //
    }

<a name="styleci"></a>
### StyleCI

如果你的代码风格不够完美，不必担心！[StyleCI](https://styleci.io/) 会在 Pull Request 合并后自动将任何风格修复合并到 Laravel 仓库中。这让我们可以专注于贡献的内容，而非代码风格。

<a name="code-of-conduct"></a>
## 行为准则

Laravel 的行为准则源自 Ruby 的行为准则。任何违反行为准则的行为都可以向 Taylor Otwell（taylor@laravel.com）报告：

- 参与者应容忍对立观点。
- 参与者必须确保其言辞和行为不包含人身攻击和贬损性的个人言论。
- 在解读他人的言辞和行为时，参与者应始终假设其出于善意。
- 任何可合理视为骚扰的行为都将不被容忍。
