# AI 辅助开发

 - [简介](#introduction)
     - [为什么选择 Laravel 进行 AI 开发？](#why-laravel-for-ai-development)
 - [Laravel Boost](#laravel-boost)
     - [安装](#installation)
     - [可用工具](#available-tools)
     - [AI 指南](#ai-guidelines)
     - [Agent Skills](#agent-skills)
     - [文档搜索](#documentation-search)
     - [与 Agents 集成](#agents-integration)

<a name="introduction"></a>
## 简介

Laravel 在定位上独树一帜，是进行 AI 辅助与智能体（agentic）开发的最佳框架。随着 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[OpenCode](https://opencode.ai)、[Cursor](https://cursor.com) 以及 [GitHub Copilot](https://github.com/features/copilot) 等 AI 编程智能体的兴起，开发者编写代码的方式已经发生了转变。这些工具能够以空前的速度生成完整的功能、调试复杂问题并重构代码——但它们的有效性在很大程度上取决于它们对你代码库的理解程度。

<a name="why-laravel-for-ai-development"></a>
### 为什么选择 Laravel 进行 AI 开发？

Laravel 约定优于配置（opinionated）的规范与结构清晰的定义，使其成为 AI 辅助开发的理想框架。当你让一个 AI 智能体添加控制器时，它清楚地知道应将其放置在哪里。当你需要一个新的数据库迁移时，命名规范与文件位置都是可预测的。这种一致性消除了在更灵活的框架中常常困扰 AI 工具的猜测工作。

除了文件组织之外，Laravel 富有表现力的语法与全面的文档，为 AI 智能体提供了生成准确、符合语言习惯的代码所需的上下文。诸如 Eloquent 关联、表单请求（form request）与中间件等特性，都遵循智能体能够可靠理解与复现的模式。其结果是，AI 生成的代码看起来就像出自一位经验丰富的 Laravel 开发者之手，而非由通用 PHP 片段拼凑而成。

<a name="laravel-boost"></a>
## Laravel Boost

[Laravel Boost](https://github.com/laravel/boost) 弥合了 AI 编程智能体与你的 Laravel 应用之间的鸿沟。Boost 是一个模型上下文协议（Model Context Protocol，MCP）服务器，配备了 15 个以上的专用工具，能够为 AI 智能体提供对你应用结构、数据库、路由等的深入洞察。安装 Boost 后，你的 AI 智能体会从一个通用代码助手，转变为一个理解你特定应用的 Laravel 专家。

Boost 提供三大核心能力：一套用于检查并与你的应用交互的 MCP 工具、专为 Laravel 生态精心打造的、可组合的 AI 指南，以及一个包含 17000 余条 Laravel 特定知识的强大文档 API。

<a name="installation"></a>
### 安装

Boost 可安装在运行 PHP 8.1 或更高版本的 Laravel 10、11、12 与 13 应用中。要开始使用，请将 Boost 作为开发依赖进行安装：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装程序：

```shell
php artisan boost:install
```

安装程序会自动检测你的 IDE 与 AI 智能体，让你可以选择适合你项目的集成方式。Boost 会生成必要的配置文件，例如面向 MCP 兼容编辑器的 `.mcp.json`，以及用于提供 AI 上下文的指南文件。

> [!NOTE]
> 像 `.mcp.json`、`CLAUDE.md` 和 `boost.json` 这样的生成配置文件，如果你希望每位开发者自行配置其环境，可以安全地添加到你的 `.gitignore` 中。

<a name="available-tools"></a>
### 可用工具

Boost 通过模型上下文协议向 AI 智能体暴露了一整套全面的工具。这些工具让智能体能够深入理解你的 Laravel 应用并与之交互：

<div class="content-list" markdown="1">

- **应用探查（Application Introspection）** - 查询你的 PHP 与 Laravel 版本，列出已安装的包，并检查应用的配置与环境变量。
- **数据库工具（Database Tools）** - 检查你的数据库结构，执行只读查询，并在不离开对话的情况下理解你的数据结构。
- **路由检查（Route Inspection）** - 列出所有已注册的路由及其中间件、控制器与参数。
- **Artisan 命令** - 发现可用的 Artisan 命令及其参数，使智能体能够为你的任务建议并执行正确的命令。
- **日志分析（Log Analysis）** - 读取并分析你的应用日志文件，以协助调试问题。
- **浏览器日志（Browser Logs）** - 在使用 Laravel 前端工具开发时，访问浏览器控制台日志与错误。
- **Tinker 集成** - 通过 Laravel Tinker 在应用的上下文中执行 PHP 代码，让智能体能够验证假设并确认行为。
- **文档搜索（Documentation Search）** - 搜索 Laravel 生态文档，结果会针对你所安装的包版本进行定制。

</div>

<a name="ai-guidelines"></a>
### AI 指南

Boost 包含一套专为 Laravel 生态精心打造的、全面的 AI 指南。这些指南教导 AI 智能体如何编写符合语言习惯的 Laravel 代码、遵循框架规范，并规避常见的陷阱。指南是可组合且版本感知的，这意味着智能体会收到与你确切包版本相适应的指令。

指南适用于 Laravel 本身以及 Laravel 生态中 16 个以上的包，包括：

<div class="content-list" markdown="1">

- Livewire（2.x、3.x 与 4.x）
- Inertia.js（React、Svelte 与 Vue 变体）
- Tailwind CSS（3.x 与 4.x）
- Filament（3.x 与 4.x）
- PHPUnit
- Pest PHP
- Laravel Pint
- 以及更多

</div>

当你运行 `boost:install` 时，Boost 会自动检测你的应用使用了哪些包，并将相关的指南组装进你项目的 AI 上下文文件中。

<a name="agent-skills"></a>
### Agent Skills

[Agent Skills](https://agentskills.io/home) 是轻量级的、有针对性的知识模块，智能体在处理特定领域时可以按需激活。与在前端加载的指南不同，技能仅在相关时才加载详细的模式与最佳实践，从而减少上下文膨胀并提升 AI 生成代码的相关性。

技能适用于 Livewire、Inertia、Tailwind CSS、Pest 等流行的 Laravel 包以及更多。当你运行 `boost:install` 并选择将技能作为功能时，技能会根据在你的 `composer.json` 中检测到的包自动安装。

<a name="documentation-search"></a>
### 文档搜索

Boost 包含一个强大的文档 API，使 AI 智能体能够访问 17000 余条 Laravel 生态文档。与通用的网络搜索不同，这些文档经过索引、向量化，并经过筛选以匹配你确切的包版本。

当智能体需要理解某个功能的工作原理时，它可以搜索 Boost 的文档 API，并接收到准确的、特定于版本的信息。这消除了 AI 智能体建议来自旧框架版本的已弃用方法或语法的常见问题。

<a name="agents-integration"></a>
### 与 Agents 集成

Boost 与支持模型上下文协议的流行 IDE 和 AI 工具集成。关于 Cursor、Claude Code、Codex、Gemini CLI、GitHub Copilot 与 Junie 的详细设置说明，请参阅 Boost 文档中的 [设置你的智能体（Set Up Your Agents）](/docs/{{version}}/boost#set-up-your-agents) 一节。
