# AI 辅助开发

## 简介

Laravel 在定位上独具优势，是 AI 辅助与智能体（agentic）开发的最佳框架。Claude Code、OpenCode、Cursor、GitHub Copilot 等 AI 编码智能体（coding agent）的兴起，改变了开发者编写代码的方式。这些工具能以空前的速度生成完整功能、调试复杂问题、重构代码——但它们的有效性在很大程度上取决于对代码库的理解程度。

### 为什么选择 Laravel 进行 AI 开发？

Laravel 约定明确、结构清晰，是 AI 辅助开发的理想框架。当你让 AI 智能体新增一个控制器时，它清楚该把控制器放在何处。当你需要新建 Migration 时，命名约定与文件位置都可预期。这种一致性消除了灵活度更高的框架中常令 AI 工具犯错的猜测。

除了文件组织，Laravel 表达力强的语法与详尽的文档，为 AI 智能体提供了生成准确、地道代码所需的上下文。Eloquent 关联（Relationship）、表单请求（form request）、中间件（Middleware）等特性都遵循智能体能够可靠理解与复用的模式。最终生成的 AI 代码如同资深 Laravel 开发者所写，而非拼凑自通用 PHP 片段。

## Laravel Boost

[Laravel Boost](https://github.com/laravel/boost) 弥合了 AI 编码智能体与你的 Laravel 应用之间的鸿沟。Boost 是一个 MCP（Model Context Protocol，模型上下文协议）服务器，配备 15 个以上的专用工具，让 AI 智能体深入洞察应用的结构、数据库、路由等。安装 Boost 后，你的 AI 智能体从通用代码助手蜕变为理解你具体应用的 Laravel 专家。

Boost 提供三大能力：一套用于检查与交互应用的 MCP 工具、专为 Laravel 生态精心打磨的可组合 AI 指南，以及一个包含 17,000 多条 Laravel 专属知识的强大文档 API。

### 安装

Boost 可安装于运行 PHP 8.1 及以上版本的 Laravel 10、11、12、13 应用。开始之前，以开发依赖方式安装 Boost：

```shell
composer require laravel/boost --dev
```

安装完成后，运行交互式安装程序：

```shell
php artisan boost:install
```

安装程序会自动检测你的 IDE 与 AI 智能体，让你选择适合项目的集成方式。Boost 会生成必要的配置文件，例如面向 MCP 兼容编辑器的 `.mcp.json` 与用于 AI 上下文的指南文件。

> [!NOTE]
> 如果你希望每位开发者自行配置环境，可以把 `.mcp.json`、`CLAUDE.md`、`boost.json` 等生成的配置文件安全地加入 `.gitignore`。

### 可用工具

Boost 通过模型上下文协议（Model Context Protocol）向 AI 智能体暴露一整套工具。这些工具让智能体深入理解并与你的 Laravel 应用交互：

- **应用自检（Application Introspection）** - 查询 PHP 与 Laravel 版本、列出已安装包、检查应用配置与环境变量。
- **数据库工具（Database Tools）** - 检查数据库结构、执行只读查询，无需离开对话即可理解数据结构。
- **路由检查（Route Inspection）** - 列出所有已注册路由及其中间件、控制器与参数。
- **Artisan 命令（Artisan Commands）** - 发现可用的 Artisan 命令及其参数，让智能体能为你的任务建议并执行正确命令。
- **日志分析（Log Analysis）** - 读取并分析应用日志文件以协助调试问题。
- **浏览器日志（Browser Logs）** - 使用 Laravel 前端工具开发时，访问浏览器控制台日志与错误。
- **Tinker 集成（Tinker Integration）** - 通过 Laravel Tinker 在应用上下文中执行 PHP 代码，让智能体验证假设与行为。
- **文档搜索（Documentation Search）** - 搜索 Laravel 生态文档，结果按你安装的包版本定制。

### AI 指南

Boost 内置一套专为 Laravel 生态精心打磨的 AI 指南。这些指南教导 AI 智能体如何编写地道 Laravel 代码、遵循框架约定、避免常见陷阱。指南可组合且感知版本，意味着智能体会收到适配你确切包版本的指令。

Laravel 自身及 Laravel 生态中 16 个以上的包都提供指南，包括：

- Livewire（2.x、3.x、4.x）
- Inertia.js（React、Svelte、Vue 变体）
- Tailwind CSS（3.x、4.x）
- Filament（3.x、4.x）
- PHPUnit
- Pest PHP
- Laravel Pint
- 以及更多

当你运行 `boost:install` 时，Boost 会自动检测应用所使用的包，并将相关指南组装进项目的 AI 上下文文件。

### 代理技能

[Agent Skills](https://agentskills.io/home) 是轻量、定向的知识模块，智能体在处理特定领域时可按需激活。与前置加载的指南不同，技能仅在相关时加载详细模式与最佳实践，从而减少上下文膨胀、提升 AI 生成代码的相关性。

Livewire、Inertia、Tailwind CSS、Pest 等热门 Laravel 包都提供技能。当你运行 `boost:install` 并选择技能作为特性时，系统会依据 `composer.json` 中检测到的包自动安装技能。

### 文档搜索

Boost 内置强大的文档 API，让 AI 智能体访问 Laravel 生态中 17,000 多条文档。与通用网络搜索不同，这些文档经过索引、向量化并按你的确切包版本过滤。

当智能体需要理解某项特性的工作原理时，可搜索 Boost 的文档 API 并获取准确的、版本专属信息。这消除了 AI 智能体建议使用旧框架版本的废弃方法或语法的常见问题。

### 代理集成

Boost 与支持模型上下文协议（Model Context Protocol）的流行 IDE 及 AI 工具集成。关于 Cursor、Claude Code、Codex、Gemini CLI、GitHub Copilot、Junie 的详细配置说明，请参阅 Boost 文档的 [配置你的智能体](/topic/Laravel%2013.x/2ev864oyor.html) 章节。
