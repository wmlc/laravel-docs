# Laravel Boost

## 简介

Laravel Boost 通过提供 AI agent 所需的准则与 agent skills，加速 AI 辅助开发——帮助 AI agent 编写出遵循 Laravel 最佳实践的高质量 Laravel 应用。

Boost 同时提供一套强大的 Laravel 生态文档 API——它结合了一个内置的 MCP 工具与超过 17,000 条 Laravel 专属信息的庞大知识库，并通过 embedding 提供语义搜索能力，确保结果准确且贴合上下文。Boost 会指示 Claude Code、Cursor 等 AI agent 使用这套 API，来学习最新的 Laravel 特性与最佳实践。

## 安装

Laravel Boost 可以通过 Composer 安装：

```shell
composer require laravel/boost --dev
```

接下来，安装 MCP 服务器与编码准则：

```shell
php artisan boost:install
```

`boost:install` 命令会根据你在安装过程中选择的编码 agent，生成对应的 agent 准则与 skill 文件。

安装好 Laravel Boost 后，就可以配合 Cursor、Claude Code 或你选择的 AI agent 开始编码了。

> [!NOTE]
> 你可以放心把生成的 MCP 配置文件（`.mcp.json`）、准则文件（`CLAUDE.md`、`AGENTS.md`、`junie/` 等）与 `boost.json` 配置文件加入 `.gitignore`，因为这些文件会在运行 `boost:install` 与 `boost:update` 时自动重新生成。

### 配置 Agent

```text tab=Cursor
1. 打开命令面板（`Cmd+Shift+P` 或 `Ctrl+Shift+P`）
2. 在「/open MCP Settings」上按 `回车`
3. 打开 `laravel-boost` 的开关
```

```text tab=Claude Code
Claude Code 的支持通常是自动启用的。如果发现没有启用，请在项目目录打开 shell 并执行以下命令：

claude mcp add -s local -t stdio laravel-boost php artisan boost:mcp
```

```text tab=Codex
Codex 的支持通常也是自动启用的。如果发现没有启用，请在项目目录打开 shell 并执行以下命令：

codex mcp add laravel-boost -- php "artisan" "boost:mcp"
```

```text tab=Gemini CLI
Gemini CLI 的支持通常自动启用。如果发现没有启用，请在项目目录打开 shell 并执行以下命令：

gemini mcp add -s project -t stdio laravel-boost php artisan boost:mcp
```

```text tab=GitHub Copilot (VS Code)
1. 打开命令面板（`Cmd+Shift+P` 或 `Ctrl+Shift+P`）
2. 在「MCP: List Servers」上按 `回车`
3. 移动到 `laravel-boost` 并按 `回车`
4. 选择「Start server」
```

```text tab=Junie
1. 连按两次 `shift` 打开命令面板
2. 搜索「MCP Settings」并按 `回车`
3. 勾选 `laravel-boost` 旁边的复选框
4. 点击右下角「Apply」
```

### 保持 Boost 资源更新

你可能希望定期更新本地的 Boost 资源（AI 准则与 skill），以确保它们反映你安装的最新 Laravel 生态扩展包版本。可以使用 `boost:update` Artisan 命令来执行：

```shell
php artisan boost:update
```

也可以通过加入 Composer 的 `post-update-cmd` 脚本来自动化：

```json
{
  "scripts": {
    "post-update-cmd": [
      "@php artisan boost:update --ansi"
    ]
  }
}
```

默认情况下，`boost:update` 命令只会更新应用内已经发布的 Boost 资源。如果希望 Boost 同时扫描应用中新安装的扩展包，并提示发布它们对应的准则和 skill，可以加上 `--discover` 选项：

```shell
php artisan boost:update --discover
```

## MCP 服务器

Laravel Boost 提供了一个 MCP（Model Context Protocol）服务器，向 AI agent 暴露与 Laravel 应用交互的工具。这些工具让 agent 能够检查应用结构、查询数据库、执行代码，等等。

### 可用的 MCP 工具

| 名称 | 备注 |
| --- | --- |
| Application Info | 读取 PHP & Laravel 版本、数据库引擎、生态扩展包版本列表以及 Eloquent 模型 |
| Browser Logs | 读取浏览器的日志与错误 |
| Database Connections | 检查可用的数据库连接，包括默认连接 |
| Database Query | 对数据库执行查询 |
| Database Schema | 读取数据库结构 |
| Get Absolute URL | 把相对路径 URI 转为绝对路径，方便 agent 生成合法 URL |
| Last Error | 读取应用日志文件中最近一次错误 |
| Read Log Entries | 读取最近的 N 条日志 |
| Record Rule | 将一条持久的 项目规则 写入 `.ai/rules`，让未来的 agent 继承 |
| Search Docs | 查询 Laravel 官方托管的文档 API 服务，获取基于已安装扩展包的文档 |

### 手动注册 MCP 服务器

有时需要在你选择的编辑器中手动注册 Laravel Boost 的 MCP 服务器。请使用以下信息注册：

<table>
<tr><td><strong>Command</strong></td><td><code>php</code></td></tr>
<tr><td><strong>Args</strong></td><td><code>artisan boost:mcp</code></td></tr>
</table>

JSON 示例：

```json
{
    "mcpServers": {
        "laravel-boost": {
            "command": "php",
            "args": ["artisan", "boost:mcp"]
        }
    }
}
```

## AI 准则

AI 准则是可组合的指令文件，会在启动时加载，向 AI agent 提供 Laravel 生态扩展包的关键上下文。这些准则包含核心约定、最佳实践与框架特有的模式，帮助 agent 生成一致且高质量的代码。

### 可用的 AI 准则

Laravel Boost 为以下扩展包和框架提供 AI 准则。其中 `core` 准则提供通用、与版本无关的建议，适用于指定的扩展包。

| 扩展包 | 支持的版本 |
| --- | --- |
| Core & Boost | core |
| Laravel Framework | core, 10.x, 11.x, 12.x, 13.x |
| Livewire | core, 2.x, 3.x, 4.x |
| Flux UI | core, free, pro |
| Folio | core |
| Herd | core |
| Inertia Laravel | core, 1.x, 2.x, 3.x |
| Inertia React | core, 1.x, 2.x, 3.x |
| Inertia Vue | core, 1.x, 2.x, 3.x |
| Inertia Svelte | core, 1.x, 2.x, 3.x |
| MCP | core |
| Pennant | core |
| Pest | core, 3.x, 4.x |
| PHPUnit | core |
| Pint | core |
| Sail | core |
| Tailwind CSS | core, 3.x, 4.x |
| Livewire Volt | core |
| Wayfinder | core |
| Enforce Tests | conditional |

> **Note：** 若希望保持 AI 准则的持续更新，请参考 保持 Boost 资源更新 一节。

### 添加自定义 AI 准则

如果想为 Laravel Boost 增加自定义的 AI 准则，可以把 `.blade.php` 或 `.md` 文件添加到应用的 `.ai/guidelines/*` 目录中。运行 `boost:install` 时，这些文件会自动与 Boost 的准则一同被包含。

### 覆盖 Boost 的 AI 准则

可以通过创建路径匹配的自定义准则来覆盖 Boost 内置的 AI 准则。当你创建的自定义准则路径与某条 Boost 已有准则匹配时，Boost 会使用你的版本，而非内置版本。

例如，要覆盖 Boost 内置的「Inertia React v2 Form Guidance」准则，请在 `.ai/guidelines/inertia-react/2/forms.blade.php` 创建文件。运行 `boost:install` 时，Boost 会包含你自定义的准则，而不是默认版本。

### 第三方扩展包的 AI 准则

如果你是某个第三方扩展包的维护者，希望 Boost 也为它包含 AI 准则，可以在扩展包中添加 `resources/boost/guidelines/core.blade.php` 文件。当你的用户运行 `php artisan boost:install` 时，Boost 会自动加载你的准则。

AI 准则应简洁地概述扩展包的功能、说明需要的文件结构与约定，并示范如何创建或使用其主要特性（可附示例命令或代码片段）。请保持内容简洁、可执行，专注于最佳实践，方便 AI 为你的用户写出正确的代码。示例：

```php
## Package Name

This package provides [brief description of functionality].

### Features

- Feature 1: [clear & short description].
- Feature 2: [clear & short description]. Example usage:

@verbatim
<code-snippet name="How to use Feature 2" lang="php">
$result = PackageName::featureTwo($param1, $param2);
</code-snippet>
@endverbatim
```

## Agent Skills

[Agent Skills](https://agentskills.io/home) 是一些轻量、专注的知识模块，agent 可以按需加载，适用于特定领域。与启动时加载的准则不同，skill 仅在相关时被加载——既能减小上下文体积，也能提升 AI 生成代码的相关性。

运行 `boost:install` 并选择 skill 特性后，系统会根据 `composer.json` 中检测到的扩展包自动安装相应 skill。例如，如果项目引入了 `livewire/livewire`，则会自动安装 `livewire-development` skill。而 Boost 内置的 skill（如 `infer-conventions`）则会无论如何都安装。

### 可用的 Skill

| Skill | 扩展包 |
| --- | --- |
| fluxui-development | Flux UI |
| folio-routing | Folio |
| infer-conventions | Boost |
| inertia-react-development | Inertia React |
| inertia-svelte-development | Inertia Svelte |
| inertia-vue-development | Inertia Vue |
| livewire-development | Livewire |
| mcp-development | MCP |
| pennant-development | Pennant |
| pest-testing | Pest |
| tailwindcss-development | Tailwind CSS |
| volt-development | Volt |
| wayfinder-development | Wayfinder |

> **Note：** 若希望保持 skill 持续更新，请参考 保持 Boost 资源更新 一节。

### 自定义 Skill

要创建自定义 skill，请在应用的 `.ai/skills/{skill-name}/` 目录下添加 `SKILL.md` 文件。运行 `boost:update` 时，自定义 skill 会与 Boost 内置的 skill 一起被安装。

例如，要为应用领域逻辑创建一个自定义 skill：

```
.ai/skills/creating-invoices/SKILL.md
```

### 覆盖 Skill

可以通过创建同名自定义 skill 来覆盖 Boost 内置的 skill。当自定义 skill 的名称与某个 Boost 已存在 skill 匹配时，Boost 会使用你的版本，而不是内置版本。

例如，要覆盖 Boost 的 `livewire-development` skill，请在 `.ai/skills/livewire-development/SKILL.md` 创建文件。运行 `boost:update` 时，Boost 会包含你自定义的 skill，而不是默认版本。

### 第三方扩展包的 Skill

如果你是某个第三方扩展包的维护者，希望 Boost 为它包含 skill，可以在扩展包中添加 `resources/boost/skills/{skill-name}/SKILL.md` 文件。当你的用户运行 `php artisan boost:install` 时，Boost 会根据用户偏好自动安装你的 skill。

Boost Skill 支持 [Agent Skills 格式](https://agentskills.io/what-are-skills)，应当按一个包含 `SKILL.md` 文件的目录来组织，`SKILL.md` 包含 YAML frontmatter 与 Markdown 指令。`SKILL.md` 必须带有必填的 frontmatter（`name` 与 `description`），可以可选地包含脚本、模板与参考资料。

Skill 应说明需要的文件结构或约定，并展示如何创建或使用其主要特性（可附示例命令或代码片段）。请保持简洁、可执行，专注最佳实践，帮助 AI 为你的用户生成正确的代码：

```markdown
---
name: package-name-development
description: Build and work with PackageName features, including components and workflows.
---

# Package Name Development

## When to use this skill
Use this skill when working with PackageName features...

## Features

- Feature 1: [clear & short description].
- Feature 2: [clear & short description]. Example usage:

$result = PackageName::featureTwo($param1, $param2);
```

## 准则 vs. Skill

Laravel Boost 提供了两种不同的方式向 AI agent 提供应用上下文：**准则** 与 **skill**。

**准则** 会在 AI agent 启动时加载，提供适用于整个代码库的 Laravel 约定与最佳实践的基础上下文。

**Skill** 会在处理特定任务时按需加载，包含特定领域（如 Livewire 组件或 Pest 测试）的详细模式。仅在相关时加载 skill 可以减少上下文体积，提升代码质量。

| 维度 | 准则 | Skill |
| --- | --- | --- |
| **加载时机** | 启动时，始终存在 | 按需，在相关时 |
| **范围** | 广泛、基础 | 专注、任务相关 |
| **目的** | 核心约定与最佳实践 | 详细的实现模式 |

准则和 skill 都是用来描述 Laravel 生态体系的。要捕捉你自己的应用约定，应当使用 项目规则。

## 项目规则

虽然准则和 skill 教 agent 如何写 Laravel，项目规则则教它们如何写**你的**应用。一条规则就是你在每次新会话中可能需要重新解释的任何事情：

- 由你、你的 agent 或你的队友沿途做出的决策。
- 难以让 agent 主动遵循的风格准则与偏好。
- 无法从周围代码直接推断出的陷阱与约束。

规则以 Markdown 文件的形式存放在应用的 `.ai/rules` 目录下，应当提交到源码控制。与仅属于个人、仅本次会话生效的 agent 自身记忆不同，你的规则是与团队以及参与你应用的每个 agent 共享的。

每条规则文件都在 frontmatter 中声明它适用的文件通配：

```markdown
---
paths:
  - app/Http/Controllers/**
---

# Http Controllers

## Extend BaseController for tenant scoping

All controllers must extend `App\Http\Controllers\BaseController`, which applies the
current tenant's query scope. Extending Laravel's base controller directly will leak
data across tenants.
```

此外，Boost 维护一个 `.ai/rules/index.md` 文件，把通配映射到对应的规则文件。Boost 会指示 agent 在规划或编辑任何文件之前先查阅这个索引——只有匹配的规则会被加载：

```markdown
# Project Rules Index

Before planning or editing, find the row whose globs match the file's path and read that rule file.

| Applies to | Rule file |
| --- | --- |
| app/Http/Controllers/** | .ai/rules/controllers.md |
| app/Models/** | .ai/rules/models.md |
```

> [!NOTE]
> 与 `.mcp.json` 和自动生成的准则文件不同，`.ai/rules` 目录应当提交到源码控制，以便与团队共享规则。

### 记录规则

要记录一条规则，只需让 agent「记住」它即可：

```text
Remember that all money values are stored as integer cents, never as floats.
```

agent 会调用 Boost 的 `record-rule` MCP 工具，并传入一个 `glob`、简短的 `title` 和 `note`。Boost 会把这条规则归档到匹配的区域，必要时新建规则文件，并更新索引。

请务必通过 `record-rule` 工具记录规则，而不是手动创建规则文件。Boost 在记录规则时会重新生成 `.ai/rules/index.md`，而 agent 也依赖该索引去发现某文件所对应的规则。手动新增的规则文件在下一次重新生成索引之前都不会被发现。

### 推断应用的约定

逐条记录规则在后续很自然；但一个既有应用已经积累了很多既有约定。`infer-conventions` skill 可以根据你已经写好的代码自举出规则集。要开始使用，请让 agent 调用该 skill：

```text
Use the infer-conventions skill
```

该 skill 会按一套 Laravel 约定维度清单扫描你的应用——包括 validation、controllers、authorization、models、architecture、testing、frontend、database 与 console 等，再进行一轮开放式扫描，寻找像基类、共享 trait、模块布局这样的模式。

skill 会记录你代码里实际存在的做法，而不是应该存在的做法；只记录有充分证据的非默认约定，跳过框架默认或 Pint / Rector 已经在强制约束的项；遇到真正混杂的做法，会如实报告，而不是强行记录。在写入规则前，skill 会展示它发现的每条约定及其佐证证据供你确认。如果希望 skill 不再询问、直接记录所有发现的约定，可以告诉它「yolo」。

### 关闭项目规则

项目规则默认启用。如果需要整体关闭，可以定义以下环境变量。它会移除 `record-rule` MCP 工具，并停止 Boost 对 `.ai/rules` 目录的管理：

```ini
BOOST_RULES_ENABLED=false
```

## 文档 API

Laravel Boost 提供一个文档 API，向 AI agent 提供超过 17,000 条 Laravel 专属信息的庞大知识库。该 API 使用基于 embedding 的语义搜索来返回精确且贴合上下文的结果。

`Search Docs` MCP 工具让 agent 能够查询 Laravel 官方托管的文档 API 服务，获取对应已安装扩展包的文档。Boost 的 AI 准则与 skill 会自动指示你的编码 agent 使用该 API。

| 扩展包 | 支持的版本 |
| --- | --- |
| Laravel Framework | 10.x, 11.x, 12.x, 13.x |
| Filament | 2.x, 3.x, 4.x, 5.x |
| Flux UI | 2.x Free, 2.x Pro |
| Inertia | 1.x, 2.x |
| Livewire | 1.x, 2.x, 3.x, 4.x |
| Nova | 4.x, 5.x |
| Pest | 3.x, 4.x |
| Tailwind CSS | 3.x, 4.x |

## 扩展 Boost

Boost 默认即可与多种流行的 IDE 与 AI agent 协作。如果你的编码工具暂未支持，也可以创建自己的 agent 并接入 Boost。

### 增加对其他 IDE / AI agent 的支持

要为新的 IDE 或 AI agent 增加支持，请创建一个继承 `Laravel\Boost\Install\Agents\Agent` 的类，按需实现以下一项或多项契约：

- `Laravel\Boost\Contracts\SupportsGuidelines` - 增加 AI 准则支持。
- `Laravel\Boost\Contracts\SupportsMcp` - 增加 MCP 支持。
- `Laravel\Boost\Contracts\SupportsSkills` - 增加 Agent Skills 支持。

#### 编写 Agent

```php
<?php

declare(strict_types=1);

namespace App;

use Laravel\Boost\Contracts\SupportsGuidelines;
use Laravel\Boost\Contracts\SupportsMcp;
use Laravel\Boost\Contracts\SupportsSkills;
use Laravel\Boost\Install\Agents\Agent;

class CustomAgent extends Agent implements SupportsGuidelines, SupportsMcp, SupportsSkills
{
    // 你的实现……
}
```

可以参考 [ClaudeCode.php](https://github.com/laravel/boost/blob/main/src/Install/Agents/ClaudeCode.php) 中的示例实现。

#### 注册 Agent

在应用的 `App\Providers\AppServiceProvider` 的 `boot` 方法中注册自定义 agent：

```php
use Laravel\Boost\Boost;

public function boot(): void
{
    Boost::registerAgent('customagent', CustomAgent::class);
}
```

注册后，运行 `php artisan boost:install` 时即可在选择列表中看到该 agent。