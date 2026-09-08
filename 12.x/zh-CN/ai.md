# AI 辅助开发

 - [简介](#introduction)
     - [为什么 Laravel 适合 AI 开发？](#why-laravel-for-ai-development)
 - [Laravel Boost](#laravel-boost)
     - [安装](#installation)
     - [可用工具](#available-tools)
     - [AI 指南](#ai-guidelines)
     - [智能体技能](#agent-skills)
     - [文档搜索](#documentation-search)
     - [智能体集成](#agents-integration)

<a name="introduction"></a>
## 简介

Laravel 在 AI 辅助开发与智能体开发领域拥有得天独厚的定位，堪称最佳框架。[Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[OpenCode](https://opencode.ai)、[Cursor](https://cursor.com) 和 [GitHub Copilot](https://github.com/features/copilot) 等 AI 编程智能体的兴起，彻底改变了开发者编写代码的方式。这些工具能够以前所未有的速度生成完整功能、调试复杂问题并重构代码，但其效果在很大程度上取决于它们对你代码库的理解程度。

<a name="why-laravel-for-ai-development"></a>
### 为什么 Laravel 适合 AI 开发？

Laravel 的强约定设计和结构清晰的架构，使其成为 AI 辅助开发的理想框架。当你让 AI 智能体添加一个控制器时，它确切知道该把它放在哪里；当你需要一个新的数据库迁移时，命名约定和文件位置都是可预测的。这种一致性消除了 AI 工具在更灵活的框架中经常出现的「瞎猜」问题。

除了文件组织之外，Laravel 富有表现力的语法和完善的文档，为 AI 智能体提供了生成准确、地道代码所需的上下文。Eloquent 关联、表单请求、中间件等功能都遵循固定模式，智能体可以可靠地理解并复现这些模式。其结果是，AI 生成的代码看起来就像出自资深 Laravel 开发者之手，而不是由通用 PHP 片段拼凑而成。

<a name="laravel-boost"></a>
## Laravel Boost

[Laravel Boost](https://github.com/laravel/boost) 在 AI 编程智能体与你的 Laravel 应用之间架起了桥梁。Boost 是一个 MCP（Model Context Protocol，模型上下文协议）服务器，配备 15 个以上的专用工具，让 AI 智能体能够深入洞察你应用的结构、数据库、路由等内容。安装 Boost 之后，你的 AI 智能体将从通用代码助手蜕变为懂你应用的 Laravel 专家。

Boost 提供三大核心能力：一套用于检查应用并与应用交互的 MCP 工具、专为 Laravel 生态精心打造的可组合 AI 指南，以及一个包含 17,000 多条 Laravel 专属知识的强大文档 API。

<a name="installation"></a>
### 安装

Boost 可以安装在运行 PHP 8.1 或更高版本的 Laravel 10、11 和 12 应用中。首先，将 Boost 安装为开发依赖：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装器：

```shell
php artisan boost:install
```

安装器会自动检测你的 IDE 和 AI 智能体，让你选择适合项目的集成方式。Boost 会生成必要的配置文件，例如面向兼容 MCP 的编辑器的 `.mcp.json`，以及用于 AI 上下文的指南文件。

> [!NOTE]
> 如果你希望每位开发者各自配置自己的环境，可以将 `.mcp.json`、`CLAUDE.md` 和 `boost.json` 等生成的配置文件安全地添加到 `.gitignore` 中。

<a name="available-tools"></a>
### 可用工具

Boost 通过模型上下文协议向 AI 智能体提供一整套全面的工具。这些工具让智能体能够深入理解你的 Laravel 应用并与之交互：

<div class="content-list" markdown="1">

- **应用内省** - 查询你的 PHP 和 Laravel 版本、列出已安装的扩展包，以及检查应用的配置和环境变量。
- **数据库工具** - 检查数据库结构、执行只读查询，无需离开对话即可理解你的数据结构。
- **路由检查** - 列出所有已注册的路由及其中间件、控制器和参数。
- **Artisan 命令** - 发现可用的 Artisan 命令及其参数，让智能体能够为你的任务建议并执行正确的命令。
- **日志分析** - 读取并分析应用的日志文件，帮助排查问题。
- **浏览器日志** - 使用 Laravel 前端工具开发时，访问浏览器控制台日志和错误信息。
- **Tinker 集成** - 通过 Laravel Tinker 在应用上下文中执行 PHP 代码，让智能体能够验证假设并确认行为。
- **文档搜索** - 搜索 Laravel 生态文档，结果会根据你安装的扩展包版本进行定制。

</div>

<a name="ai-guidelines"></a>
### AI 指南

Boost 内置了一套专为 Laravel 生态精心打造的完整 AI 指南。这些指南教会 AI 智能体如何编写地道的 Laravel 代码、遵循框架约定并避开常见的坑。指南是可组合且具备版本感知能力的，也就是说，智能体收到的指令与你实际使用的扩展包版本相匹配。

Laravel 本身以及 Laravel 生态中 16 个以上的扩展包都提供了相应的指南，包括：

<div class="content-list" markdown="1">

- Livewire（2.x、3.x 和 4.x）
- Inertia.js（React、Svelte 和 Vue 变体）
- Tailwind CSS（3.x 和 4.x）
- Filament（3.x 和 4.x）
- PHPUnit
- Pest PHP
- Laravel Pint
- 以及更多

</div>

运行 `boost:install` 时，Boost 会自动检测你的应用使用了哪些扩展包，并将相关的指南汇编到项目的 AI 上下文文件中。

<a name="agent-skills"></a>
### 智能体技能

[智能体技能](https://agentskills.io/home) 是轻量级、针对性强的知识模块，智能体在处理特定领域的工作时可以按需激活。与预先加载的指南不同，技能只在相关时才加载详细的模式和最佳实践，从而减少上下文膨胀，并提升 AI 生成代码的相关性。

Livewire、Inertia、Tailwind CSS、Pest 等热门 Laravel 扩展包都提供了相应的技能。运行 `boost:install` 并选择技能功能时，系统会根据 `composer.json` 中检测到的扩展包自动安装相应技能。

<a name="documentation-search"></a>
### 文档搜索

Boost 包含一个强大的文档 API，让 AI 智能体可以访问 17,000 多条 Laravel 生态文档。与通用的网络搜索不同，这些文档经过了索引和向量化处理，并根据你实际使用的扩展包版本进行过滤。

当智能体需要了解某个功能的工作原理时，它可以搜索 Boost 的文档 API，并获得准确的、与版本对应的信息。这样就消除了 AI 智能体推荐旧版框架中已弃用方法或语法的常见问题。

<a name="agent-integration"></a>
### 智能体集成

Boost 可以与支持模型上下文协议的主流 IDE 和 AI 工具集成。有关 Cursor、Claude Code、Codex、Gemini CLI、GitHub Copilot 和 Junie 的详细设置说明，请参阅 Boost 文档中的[配置你的智能体](/docs/{{version}}/boost#set-up-your-agents)部分。
