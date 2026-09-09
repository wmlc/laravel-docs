# Laravel Boost

- [简介](#introduction)
- [安装](#installation)
    - [配置你的智能体](#set-up-your-agents)
    - [保持 Boost 资源更新](#keeping-boost-resources-updated)
- [MCP 服务器](#mcp-server)
    - [可用 MCP 工具](#available-mcp-tools)
    - [手动注册 MCP 服务器](#manually-registering-the-mcp-server)
- [AI 指南](#ai-guidelines)
    - [可用 AI 指南](#available-ai-guidelines)
    - [添加自定义 AI 指南](#adding-custom-ai-guidelines)
    - [覆盖 Boost 的 AI 指南](#overriding-boost-ai-guidelines)
    - [第三方包的 AI 指南](#third-party-package-ai-guidelines)
- [智能体技能](#agent-skills)
    - [可用技能](#available-skills)
    - [自定义技能](#custom-skills)
    - [覆盖技能](#overriding-skills)
    - [第三方包技能](#third-party-package-skills)
- [指南与技能对比](#guidelines-vs-skills)
- [项目规则](#project-rules)
    - [记录规则](#recording-rules)
    - [推断应用的约定](#inferring-your-applications-conventions)
    - [禁用项目规则](#disabling-project-rules)
- [文档 API](#documentation-api)
- [扩展 Boost](#extending-boost)
    - [添加对其他 IDE / AI 智能体的支持](#adding-support-for-other-ides-ai-agents)

<a name="introduction"></a>
## 简介

Laravel Boost 通过提供核心指南与智能体技能（Agent Skills），帮助 AI 智能体编写遵循 Laravel 最佳实践的高质量 Laravel 应用，从而加速 AI 辅助开发。

Boost 还提供了一个强大的 Laravel 生态文档 API，它将内置的 MCP 工具与一个包含超过 17,000 条 Laravel 专属信息的庞大知识库结合在一起，并借助基于嵌入向量的语义搜索能力来增强效果，从而提供精准、具备上下文感知能力的结果。Boost 会指示诸如 Claude Code 与 Cursor 之类的 AI 智能体使用该 API 来学习最新的 Laravel 特性与最佳实践。

<a name="installation"></a>
## 安装

可以通过 Composer 安装 Laravel Boost：

```shell
composer require laravel/boost --dev
```

接下来，安装 MCP 服务器与编码指南：

```shell
php artisan boost:install
```

`boost:install` 命令会为你在安装过程中所选的编码智能体生成相应的指南文件与技能文件。

安装 Laravel Boost 后，你就可以使用 Cursor、Claude Code 或你选择的任意 AI 智能体开始编码了。

> [!NOTE]
> 你可以将生成的 MCP 配置文件（`.mcp.json`）、指南文件（`CLAUDE.md`、`AGENTS.md`、`junie/` 等）以及 `boost.json` 配置文件加入应用的 `.gitignore`，因为运行 `boost:install` 与 `boost:update` 时会自动重新生成这些文件。

<a name="set-up-your-agents"></a>
### 配置你的智能体

```text tab=Cursor
1. 打开命令面板（`Cmd+Shift+P` 或 `Ctrl+Shift+P`）
2. 在 "/open MCP Settings" 上按 `enter`
3. 打开 `laravel-boost` 的开关
```

```text tab=Claude Code
Claude Code 的支持通常会自动启用。如果你发现没有启用，请在项目目录中打开一个 shell 并运行以下命令：

claude mcp add -s local -t stdio laravel-boost php artisan boost:mcp
```

```text tab=Codex
Codex 的支持通常会自动启用。如果你发现没有启用，请在项目目录中打开一个 shell 并运行以下命令：

codex mcp add laravel-boost -- php "artisan" "boost:mcp"
```

```text tab=Gemini CLI
Gemini CLI 的支持通常会自动启用。如果你发现没有启用，请在项目目录中打开一个 shell 并运行以下命令：

gemini mcp add -s project -t stdio laravel-boost php artisan boost:mcp
```

```text tab=GitHub Copilot (VS Code)
1. 打开命令面板（`Cmd+Shift+P` 或 `Ctrl+Shift+P`）
2. 在 "MCP: List Servers" 上按 `enter`
3. 移动到 `laravel-boost` 并按 `enter`
4. 选择 "Start server"
```

```text tab=Junie
1. 按两次 `shift` 打开命令面板
2. 搜索 "MCP Settings" 并按 `enter`
3. 勾选 `laravel-boost` 旁边的复选框
4. 点击右下角的 "Apply"
```

<a name="keeping-boost-resources-updated"></a>
### 保持 Boost 资源更新

你可能希望定期更新本地的 Boost 资源（AI 指南与技能），以确保它们反映你所安装 Laravel 生态包的最新版本。为此，可以使用 `boost:update` Artisan 命令。

```shell
php artisan boost:update
```

你也可以通过将其加入 Composer 的 "post-update-cmd" 脚本来自动化这一过程：

```json
{
  "scripts": {
    "post-update-cmd": [
      "@php artisan boost:update --ansi"
    ]
  }
}
```

默认情况下，`boost:update` 命令只会更新应用内已发布的现有 Boost 资源。如果你希望 Boost 扫描应用中是否有新安装的扩展包，并主动提供发布它们对应指南与技能的选项，可以使用 `--discover` 选项：

```shell
php artisan boost:update --discover
```

<a name="mcp-server"></a>
## MCP 服务器

Laravel Boost 提供了一个 MCP（Model Context Protocol）服务器，它对外暴露供 AI 智能体与你的 Laravel 应用交互的工具。借助这些工具，智能体能够检查应用的结构、查询数据库、执行代码等。

<a name="available-mcp-tools"></a>
### 可用 MCP 工具

| 名称                | 说明                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Application Info    | 读取 PHP 与 Laravel 版本、数据库引擎、包含版本的生态包列表，以及 Eloquent 模型               |
| Browser Logs        | 读取浏览器中的日志与错误                                                                     |
| Database Connections | 检查可用的数据库连接，包括默认连接                                                          |
| Database Query      | 针对数据库执行一条查询                                                                       |
| Database Schema     | 读取数据库结构（schema）                                                                     |
| Get Absolute URL    | 将相对路径 URI 转换为绝对 URL，以便智能体生成有效的 URL                                      |
| Last Error          | 读取应用日志文件中的最后一条错误                                                             |
| Read Log Entries    | 读取最后 N 条日志条目                                                                        |
| Record Rule         | 将一条持久化的 [项目规则](#project-rules) 记录到 `.ai/rules`，使后续的智能体继承它          |
| Search Docs         | 查询 Laravel 托管的文档 API 服务，根据已安装的包检索文档                                     |

<a name="manually-registering-the-mcp-server"></a>
### 手动注册 MCP 服务器

有时你可能需要手动将 Laravel Boost 的 MCP 服务器注册到你选择的编辑器中。应使用以下信息来注册 MCP 服务器：

<table>
<tr><td><strong>命令</strong></td><td><code>php</code></td></tr>
<tr><td><strong>参数</strong></td><td><code>artisan boost:mcp</code></td></tr>
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

<a name="ai-guidelines"></a>
## AI 指南

AI 指南是可组合的指令文件，会在启动时就加载，为 AI 智能体提供关于 Laravel 生态包的必要上下文。这些指南包含了核心约定、最佳实践以及框架特定的模式，帮助智能体生成一致、高质量代码。

<a name="available-ai-guidelines"></a>
### 可用 AI 指南

Laravel Boost 为以下包与框架内置了 AI 指南。`core` 指南为给定的包提供适用于所有版本的通用、泛化建议。

| 包                  | 支持的版本                 |
| ------------------- | -------------------------- |
| Core & Boost        | core                       |
| Laravel Framework   | core, 10.x, 11.x, 12.x, 13.x |
| Livewire            | core, 2.x, 3.x, 4.x        |
| Flux UI             | core, free, pro            |
| Folio               | core                       |
| Herd                | core                       |
| Inertia Laravel     | core, 1.x, 2.x, 3.x        |
| Inertia React       | core, 1.x, 2.x, 3.x        |
| Inertia Vue         | core, 1.x, 2.x, 3.x        |
| Inertia Svelte      | core, 1.x, 2.x, 3.x        |
| MCP                 | core                       |
| Pennant             | core                       |
| Pest                | core, 3.x, 4.x             |
| PHPUnit             | core                       |
| Pint                | core                       |
| Sail                | core                       |
| Tailwind CSS        | core, 3.x, 4.x             |
| Livewire Volt       | core                       |
| Wayfinder           | core                       |
| Enforce Tests       | conditional                |

> **注意：** 要让你的 AI 指南保持最新，请参阅 [保持 Boost 资源更新](#keeping-boost-resources-updated) 一节。

<a name="adding-custom-ai-guidelines"></a>
### 添加自定义 AI 指南

若要使用你自己的自定义 AI 指南来扩展 Laravel Boost，请将 `.blade.php` 或 `.md` 文件添加到应用的 `.ai/guidelines/*` 目录中。运行 `boost:install` 时，这些文件会自动与 Laravel Boost 的指南一起被包含。

<a name="overriding-boost-ai-guidelines"></a>
### 覆盖 Boost 的 AI 指南

你可以通过创建路径匹配的自定义指南来覆盖 Boost 内置的 AI 指南。当你创建的自定义指南与某个现有 Boost 指南的路径一致时，Boost 会使用你的自定义版本，而不是内置版本。

例如，要覆盖 Boost 的 "Inertia React v2 Form Guidance" 指南，请在 `.ai/guidelines/inertia-react/2/forms.blade.php` 创建文件。运行 `boost:install` 时，Boost 会包含你的自定义指南，而不是默认的那份。

<a name="third-party-package-ai-guidelines"></a>
### 第三方包的 AI 指南

如果你维护一个第三方包，并希望 Boost 包含它的 AI 指南，可以通过在包中添加 `resources/boost/guidelines/core.blade.php` 文件来实现。当你的包的使用者运行 `php artisan boost:install` 时，Boost 会自动加载你的指南。

AI 指南应当简要概述你的包的功能、说明必要的文件结构或约定，并解释如何创建或使用其主要特性（附上示例命令或代码片段）。保持简洁、可操作，并聚焦于最佳实践，这样 AI 才能为你的使用者生成正确的代码。下面是一个示例：

```php
## 包名称

本包提供 [功能简述]。

### 特性

- 特性 1：[清晰且简短的说明]。
- 特性 2：[清晰且简短的说明]。使用示例：

@verbatim
<code-snippet name="如何使用特性 2" lang="php">
$result = PackageName::featureTwo($param1, $param2);
</code-snippet>
@endverbatim
```

<a name="agent-skills"></a>
## 智能体技能

[Agent Skills](https://agentskills.io/home) 是轻量、针对性的知识模块，智能体在处理特定领域时可按需激活。与在启动时加载的指南不同，技能仅在与当前相关的场景下才加载详细的模式与最佳实践，从而减少上下文膨胀，提升 AI 生成代码的相关性。

当你运行 `boost:install` 并选择将技能作为一个特性时，技能会根据在 `composer.json` 中检测到的包自动安装。例如，如果你的项目包含 `livewire/livewire`，那么 `livewire-development` 技能会被自动安装。Boost 内置的技能（例如 `infer-conventions`）无论你安装了哪些包都会被安装。

<a name="available-skills"></a>
### 可用技能

| 技能                       | 包               |
| -------------------------- | ---------------- |
| fluxui-development         | Flux UI          |
| folio-routing              | Folio            |
| infer-conventions          | Boost            |
| inertia-react-development  | Inertia React    |
| inertia-svelte-development | Inertia Svelte   |
| inertia-vue-development    | Inertia Vue      |
| livewire-development       | Livewire         |
| mcp-development            | MCP              |
| pennant-development        | Pennant          |
| pest-testing               | Pest             |
| tailwindcss-development    | Tailwind CSS     |
| volt-development           | Volt             |
| wayfinder-development      | Wayfinder        |

> **注意：** 要让你的技能保持最新，请参阅 [保持 Boost 资源更新](#keeping-boost-resources-updated) 一节。

<a name="custom-skills"></a>
### 自定义技能

要创建你自己的自定义技能，请在应用的 `.ai/skills/{skill-name}/` 目录中添加 `SKILL.md` 文件。运行 `boost:update` 时，你的自定义技能会随 Boost 内置技能一起被安装。

例如，要为你的应用领域逻辑创建一个自定义技能：

```
.ai/skills/creating-invoices/SKILL.md
```

<a name="overriding-skills"></a>
### 覆盖技能

你可以通过创建名称匹配的自定义技能来覆盖 Boost 内置的技能。当你创建的自定义技能与某个现有 Boost 技能的名称一致时，Boost 会使用你的自定义版本，而不是内置版本。

例如，要覆盖 Boost 的 `livewire-development` 技能，请在 `.ai/skills/livewire-development/SKILL.md` 创建文件。运行 `boost:update` 时，Boost 会包含你的自定义技能，而不是默认的那份。

<a name="third-party-package-skills"></a>
### 第三方包技能

如果你维护一个第三方包，并希望 Boost 包含它的技能，可以通过在包中添加 `resources/boost/skills/{skill-name}/SKILL.md` 文件来实现。当你的包的使用者运行 `php artisan boost:install` 时，Boost 会根据用户偏好自动安装你的技能。

Boost 技能遵循 [Agent Skills 格式](https://agentskills.io/what-are-skills)，其结构应为一个包含 `SKILL.md` 文件的文件夹，该文件带有 YAML frontmatter 与 Markdown 指令。`SKILL.md` 文件必须包含必需的 frontmatter（`name` 与 `description`），并可以可选地包含脚本、模板与参考资料。

技能应当说明必要的文件结构或约定，并解释如何创建或使用其主要特性（附上示例命令或代码片段）。保持简洁、可操作，并聚焦于最佳实践，这样 AI 才能为你的使用者生成正确的代码：

```markdown
---
name: package-name-development
description: 构建并使用 PackageName 特性，包括组件与工作流。
---

# Package Name 开发

## 何时使用此技能
在处理 PackageName 特性时请使用此技能……

## 特性

- 特性 1：[清晰且简短的说明]。
- 特性 2：[清晰且简短的说明]。使用示例：

$result = PackageName::featureTwo($param1, $param2);
```

<a name="guidelines-vs-skills"></a>
## 指南与技能对比

Laravel Boost 提供了两种截然不同的方式为 AI 智能体提供关于你应用的上下文：**指南**与**技能**。

**指南**在 AI 智能体启动时被加载，提供关于适用于你整个代码库的 Laravel 约定与最佳实践的必要上下文。

**技能**在处理特定任务时按需激活，包含面向特定领域的详细模式（如 Livewire 组件或 Pest 测试）。仅在相关时加载技能，可以减少上下文膨胀并提升代码质量。

| 维度      | 指南                            | 技能                              |
| --------- | ------------------------------- | --------------------------------- |
| **加载**  | 启动时，始终存在               | 按需，在相关时加载               |
| **范围**  | 广泛、基础                     | 聚焦、特定于任务                 |
| **目的**  | 核心约定与最佳实践             | 详细的实现模式                   |

指南与技能都描述的是 Laravel 生态。要捕获你自己应用的约定，你应该使用 [项目规则](#project-rules)。

<a name="project-rules"></a>
## 项目规则

指南与技能教智能体如何编写 Laravel，而项目规则则教它们如何编写你的应用。所谓规则，就是你本需要在每个新会话中都要再次解释的内容：

<div class="content-list" markdown="1">

- 你、你的智能体或你的队友在开发过程中做出的决策。
- 难以让智能体遵循的样式指南与偏好。
- 无法从周围代码中推断出的陷阱与约束。

</div>

规则以 Markdown 文件的形式存储在应用的 `.ai/rules` 目录中，并应当提交到源码控制。与智能体自身的内存（个人化、会话作用域）不同，你的规则是与你的团队以及每个在你的应用上工作的智能体共享的。

每个规则文件在其 frontmatter 中声明它所适用的文件 glob：

```markdown
---
paths:
  - app/Http/Controllers/**
---

# Http 控制器

## 为租户作用域继承 BaseController

所有控制器都必须继承 `App\Http\Controllers\BaseController`，它会应用
当前租户的查询作用域。直接继承 Laravel 的基础控制器会导致数据在租户之间泄漏。
```

此外，Boost 维护一个 `.ai/rules/index.md` 文件，用于将 glob 映射到其对应的规则文件。智能体被指示在规划或编辑任何文件之前先查阅该索引，因此规则只在相关时才会被加载：

```markdown
# 项目规则索引

在规划或编辑之前，找到 glob 与文件路径匹配的那一行，并读取对应的规则文件。

| 适用于            | 规则文件              |
| ----------------- | --------------------- |
| app/Http/Controllers/** | .ai/rules/controllers.md |
| app/Models/**          | .ai/rules/models.md       |
```

> [!NOTE]
> 与 `.mcp.json` 及生成的指南文件不同，`.ai/rules` 目录应当提交到源码控制，以便你的规则与团队共享。

<a name="recording-rules"></a>
### 记录规则

要记录一条规则，你只需让你的智能体记住它即可：

```text
记住所有金额都以整数分存储，绝不使用浮点数。
```

智能体会调用 Boost 的 `record-rule` MCP 工具，并传入一个 `glob`、一个简短的 `title` 与一个 `note`。Boost 随后会将这条规则归档到对应的区域，在必要时创建规则文件，并更新索引。

你应当始终使用 `record-rule` 工具来记录规则，而不是手动创建规则文件。Boost 在记录规则时会重新生成 `.ai/rules/index.md`，而智能体依赖该索引来发现哪些规则适用于它们正在处理的文件。手动添加的规则文件在索引下一次重新生成之前不会被发现。

<a name="inferring-your-applications-conventions"></a>
### 推断应用的约定

逐条记录规则在后续工作中效果很好；然而，一个既有的应用已经包含了多年的约定。`infer-conventions` 技能会从你已经写好的代码中引导生成你的规则。要开始使用，请让你的智能体使用此技能：

```text
使用 infer-conventions 技能
```

该技能会按照一份 Laravel 约定维度清单扫描你的应用，包括验证、控制器、授权、模型、架构、测试、前端、数据库与控制台，随后再进行一次开放式的遍历，以发现诸如基类、共享 trait 和模块布局之类的模式。

该技能记录的是你的代码实际做了什么，而不是它应该做什么。它只记录有充分支撑、非默认的约定，跳过框架默认值以及 Pint 或 Rector 已经强制执行的任何内容，并针对真正混杂的模式如实报告，而不是记录它们。在写入任何规则之前，该技能会先展示它发现的每条约定及其支撑证据，供你确认。如果你希望该技能在无需确认的情况下记录所有发现的约定，可以告诉它 "yolo"。

<a name="disabling-project-rules"></a>
### 禁用项目规则

项目规则默认启用。要完全禁用它们，请定义以下环境变量。这会移除 `record-rule` MCP 工具，并停止 Boost 对 `.ai/rules` 目录的管理：

```ini
BOOST_RULES_ENABLED=false
```

<a name="documentation-api"></a>
## 文档 API

Laravel Boost 包含一个文档 API，它为 AI 智能体提供对一个包含超过 17,000 条 Laravel 专属信息的庞大知识库的访问能力。该 API 使用基于嵌入向量的语义搜索来提供精准、具备上下文感知能力的结果。

`Search Docs` MCP 工具允许智能体查询 Laravel 托管的文档 API 服务，根据已安装的包检索文档。Boost 的 AI 指南与技能会自动指示你的编码智能体使用此 API。

| 包                  | 支持的版本            |
| ------------------- | --------------------- |
| Laravel Framework   | 10.x, 11.x, 12.x, 13.x |
| Filament            | 2.x, 3.x, 4.x, 5.x    |
| Flux UI             | 2.x Free, 2.x Pro     |
| Inertia             | 1.x, 2.x              |
| Livewire            | 1.x, 2.x, 3.x, 4.x    |
| Nova                | 4.x, 5.x              |
| Pest                | 3.x, 4.x              |
| Tailwind CSS        | 3.x, 4.x              |

<a name="extending-boost"></a>
## 扩展 Boost

Boost 开箱即用，可与许多流行的 IDE 和 AI 智能体配合工作。如果你的编码工具尚不支持，你可以创建自己的智能体并将其与 Boost 集成。

<a name="adding-support-for-other-ides-ai-agents"></a>
### 添加对其他 IDE / AI 智能体的支持

要添加对新 IDE 或 AI 智能体的支持，请创建一个继承自 `Laravel\Boost\Install\Agents\Agent` 的类，并根据你的需要实现一个或多个以下契约：

- `Laravel\Boost\Contracts\SupportsGuidelines` - 添加对 AI 指南的支持。
- `Laravel\Boost\Contracts\SupportsMcp` - 添加对 MCP 的支持。
- `Laravel\Boost\Contracts\SupportsSkills` - 添加对智能体技能（Agent Skills）的支持。

<a name="writing-the-agent"></a>
#### 编写智能体

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

有关示例实现，请参阅 [ClaudeCode.php](https://github.com/laravel/boost/blob/main/src/Install/Agents/ClaudeCode.php)。

<a name="registering-the-agent"></a>
#### 注册智能体

在你的应用的 `App\Providers\AppServiceProvider` 的 `boot` 方法中注册你的自定义智能体：

```php
use Laravel\Boost\Boost;

public function boot(): void
{
    Boost::registerAgent('customagent', CustomAgent::class);
}
```

注册完成后，运行 `php artisan boost:install` 时你的智能体即可被选用了。
