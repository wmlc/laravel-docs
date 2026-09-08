# Laravel Boost

- [简介](#introduction)
- [安装](#installation)
    - [保持 Boost 资源更新](#keeping-boost-resources-updated)
    - [设置你的智能体](#set-up-your-agents)
- [MCP 服务器](#mcp-server)
    - [可用的 MCP 工具](#available-mcp-tools)
    - [手动注册 MCP 服务器](#manually-registering-the-mcp-server)
- [AI 指南](#ai-guidelines)
    - [可用的 AI 指南](#available-ai-guidelines)
    - [添加自定义 AI 指南](#adding-custom-ai-guidelines)
    - [覆盖 Boost 的 AI 指南](#overriding-boost-ai-guidelines)
    - [第三方包 AI 指南](#third-party-package-ai-guidelines)
- [智能体技能](#agent-skills)
    - [可用的技能](#available-skills)
    - [自定义技能](#custom-skills)
    - [覆盖技能](#overriding-skills)
    - [第三方包技能](#third-party-package-skills)
- [指南与技能的对比](#guidelines-vs-skills)
- [文档 API](#documentation-api)
- [扩展 Boost](#extending-boost)
    - [为其他 IDE / AI 智能体添加支持](#adding-support-for-other-ides-ai-agents)

<a name="introduction"></a>
## 简介

Laravel Boost 可以为 AI 辅助开发提速，它提供了必要的指南和智能体技能，帮助 AI 智能体编写遵循 Laravel 最佳实践的高质量 Laravel 应用。

Boost 还提供了一个强大的 Laravel 生态系统文档 API，它将内置的 MCP 工具与一个包含 17000 余条 Laravel 专属信息的庞大知识库相结合，并通过基于 embedding 的语义搜索能力提供精确、贴合上下文的结果。Boost 会指示 Claude Code、Cursor 等 AI 智能体使用这个 API 来了解 Laravel 的最新特性和最佳实践。

<a name="installation"></a>
## 安装

Laravel Boost 可以通过 Composer 安装：

```shell
composer require laravel/boost --dev
```

接下来，安装 MCP 服务器和编码指南：

```shell
php artisan boost:install
```

`boost:install` 命令会为你在安装过程中选择的编码智能体生成相应的智能体指南文件和技能文件。

Laravel Boost 安装完成后，你就可以使用 Cursor、Claude Code 或你喜欢的 AI 智能体开始编码了。

> [!NOTE]
> 你可以将生成的 MCP 配置文件（`.mcp.json`）、指南文件（`CLAUDE.md`、`AGENTS.md`、`junie/` 等）以及 `boost.json` 配置文件添加到应用的 `.gitignore` 中，因为这些文件在运行 `boost:install` 和 `boost:update` 时会自动重新生成。

<a name="set-up-your-agents"></a>
### 设置你的智能体

```text tab=Cursor
1. Open the command palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Press `enter` on "/open MCP Settings"
3. Turn the toggle on for `laravel-boost`
```

```text tab=Claude Code
Claude Code support is typically enabled automatically. If you find it isn't, open a shell in the project's directory and run the following command:

claude mcp add -s local -t stdio laravel-boost php artisan boost:mcp
```

```text tab=Codex
Codex support is typically enabled automatically. If you find it isn't, open a shell in the project's directory and run the following command:

codex mcp add laravel-boost -- php "artisan" "boost:mcp"
```

```text tab=Gemini CLI
Gemini CLI support is typically enabled automatically. If you find it isn't, open a shell in the project's directory and run the following command:

gemini mcp add -s project -t stdio laravel-boost php artisan boost:mcp
```

```text tab=GitHub Copilot (VS Code)
1. Open the command palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Press `enter` on "MCP: List Servers"
3. Arrow to `laravel-boost` and press `enter`
4. Choose "Start server"
```

```text tab=Junie
1. Press `shift` twice to open the command palette
2. Search "MCP Settings" and press `enter`
3. Check the box next to `laravel-boost`
4. Click "Apply" at the bottom right
```

<a name="keeping-boost-resources-updated"></a>
### 保持 Boost 资源更新

你可能需要定期更新本地的 Boost 资源（AI 指南和技能），以确保它们与你安装的 Laravel 生态包的最新版本保持一致。为此，你可以使用 `boost:update` Artisan 命令。

```shell
php artisan boost:update
```

你也可以把这个过程添加到 Composer 的 "post-update-cmd" 脚本中，实现自动化：

```json
{
  "scripts": {
    "post-update-cmd": [
      "@php artisan boost:update --ansi"
    ]
  }
}
```

<a name="mcp-server"></a>
## MCP 服务器

Laravel Boost 提供了一个 MCP（Model Context Protocol，模型上下文协议）服务器，对外暴露一组工具，供 AI 智能体与你的 Laravel 应用交互。这些工具让智能体能够检查应用结构、查询数据库、执行代码等。

<a name="available-mcp-tools"></a>
### 可用的 MCP 工具

| 名称                 | 说明                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Application Info     | 读取 PHP 和 Laravel 版本、数据库引擎、已安装生态包及其版本列表，以及 Eloquent 模型                          |
| Browser Logs         | 读取来自浏览器的日志和错误                                                                                   |
| Database Connections | 检查可用的数据库连接，包括默认连接                                                                           |
| Database Query       | 对数据库执行查询                                                                                             |
| Database Schema      | 读取数据库结构                                                                                               |
| Get Absolute URL     | 将相对路径 URI 转换为绝对路径，确保智能体生成有效的 URL                                                      |
| Last Error           | 读取应用日志文件中的最后一条错误                                                                             |
| Read Log Entries     | 读取最后 N 条日志记录                                                                                        |
| Search Docs          | 查询 Laravel 托管的文档 API 服务，根据已安装的软件包检索文档                                                  |

<a name="manually-registering-the-mcp-server"></a>
### 手动注册 MCP 服务器

有时你可能需要在所选编辑器中手动注册 Laravel Boost 的 MCP 服务器。注册时应使用以下详细信息：

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

AI 指南是可组合的指令文件，会在启动时预先加载，为 AI 智能体提供关于 Laravel 生态包的必要上下文。这些指南包含核心约定、最佳实践和框架特有的模式，能帮助智能体生成一致、高质量的代码。

<a name="available-ai-guidelines"></a>
### 可用的 AI 指南

Laravel Boost 为以下软件包和框架内置了 AI 指南。其中 `core` 指南为对应的软件包提供通用的、概括性的建议，适用于所有版本。

| 软件包             | 支持的版本             |
| ----------------- | ---------------------- |
| Core & Boost      | core                   |
| Laravel Framework | core, 10.x, 11.x, 12.x |
| Livewire          | core, 2.x, 3.x, 4.x    |
| Flux UI           | core, free, pro        |
| Folio             | core                   |
| Herd              | core                   |
| Inertia Laravel   | core, 1.x, 2.x, 3.x    |
| Inertia React     | core, 1.x, 2.x, 3.x    |
| Inertia Vue       | core, 1.x, 2.x, 3.x    |
| Inertia Svelte    | core, 1.x, 2.x, 3.x    |
| MCP               | core                   |
| Pennant           | core                   |
| Pest              | core, 3.x, 4.x         |
| PHPUnit           | core                   |
| Pint              | core                   |
| Sail              | core                   |
| Tailwind CSS      | core, 3.x, 4.x         |
| Livewire Volt     | core                   |
| Wayfinder         | core                   |
| Enforce Tests     | conditional            |

> **注意：** 若要让 AI 指南保持最新，请参阅[保持 Boost 资源更新](#keeping-boost-resources-updated)一节。

<a name="adding-custom-ai-guidelines"></a>
### 添加自定义 AI 指南

如果想用自己的自定义 AI 指南来增强 Laravel Boost，可以将 `.blade.php` 或 `.md` 文件添加到应用的 `.ai/guidelines/*` 目录。运行 `boost:install` 时，这些文件会自动并入 Laravel Boost 的指南中。

<a name="overriding-boost-ai-guidelines"></a>
### 覆盖 Boost 的 AI 指南

你可以创建文件路径与 Boost 内置 AI 指南相同的自定义指南来覆盖它们。当你创建的自定义指南与现有的 Boost 指南路径匹配时，Boost 将使用你的自定义版本，而不是内置版本。

例如，要覆盖 Boost 的 "Inertia React v2 Form Guidance" 指南，可以在 `.ai/guidelines/inertia-react/2/forms.blade.php` 创建一个文件。当你运行 `boost:install` 时，Boost 将加载你的自定义指南，而不是默认指南。

<a name="third-party-package-ai-guidelines"></a>
### 第三方包 AI 指南

如果你维护一个第三方软件包，并希望 Boost 为它内置 AI 指南，可以在软件包中添加 `resources/boost/guidelines/core.blade.php` 文件。当软件包的用户运行 `php artisan boost:install` 时，Boost 会自动加载你的指南。

AI 指南应简要概述软件包的功能，说明所需的文件结构或约定，并解释如何创建或使用其主要特性（附上示例命令或代码片段）。指南应保持简洁、可操作，并聚焦于最佳实践，这样 AI 才能为你的用户生成正确的代码。下面是一个示例：

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

<a name="agent-skills"></a>
## 智能体技能

[智能体技能（Agent Skills）](https://agentskills.io/home)是轻量、聚焦的知识模块，智能体在处理特定领域的工作时可以按需激活。与预先加载的指南不同，技能允许仅在相关时才加载详细的模式和最佳实践，从而减少上下文膨胀，并提升 AI 生成代码的针对性。

当你运行 `boost:install` 并选择技能作为功能时，Boost 会根据在 `composer.json` 中检测到的软件包自动安装技能。例如，如果你的项目包含 `livewire/livewire`，就会自动安装 `livewire-development` 技能。

<a name="available-skills"></a>
### 可用的技能

| 技能                       | 软件包         |
| -------------------------- | -------------- |
| fluxui-development         | Flux UI        |
| folio-routing              | Folio          |
| inertia-react-development  | Inertia React  |
| inertia-svelte-development | Inertia Svelte |
| inertia-vue-development    | Inertia Vue    |
| livewire-development       | Livewire       |
| mcp-development            | MCP            |
| pennant-development        | Pennant        |
| pest-testing               | Pest           |
| tailwindcss-development    | Tailwind CSS   |
| volt-development           | Volt           |
| wayfinder-development      | Wayfinder      |

> **注意：** 若要让技能保持最新，请参阅[保持 Boost 资源更新](#keeping-boost-resources-updated)一节。

<a name="custom-skills"></a>
### 自定义技能

要创建自己的自定义技能，可以在应用的 `.ai/skills/{skill-name}/` 目录中添加一个 `SKILL.md` 文件。当你运行 `boost:update` 时，你的自定义技能会与 Boost 内置技能一起安装。

例如，要为你的应用领域逻辑创建一个自定义技能：

```
.ai/skills/creating-invoices/SKILL.md
```

<a name="overriding-skills"></a>
### 覆盖技能

你可以创建与 Boost 内置技能同名的自定义技能来覆盖它们。当你创建的自定义技能与现有的 Boost 技能名称匹配时，Boost 将使用你的自定义版本，而不是内置版本。

例如，要覆盖 Boost 的 `livewire-development` 技能，可以在 `.ai/skills/livewire-development/SKILL.md` 创建一个文件。当你运行 `boost:update` 时，Boost 将加载你的自定义技能，而不是默认技能。

<a name="third-party-package-skills"></a>
### 第三方包技能

如果你维护一个第三方软件包，并希望 Boost 为它内置技能，可以在软件包中添加 `resources/boost/skills/{skill-name}/SKILL.md` 文件。当软件包的用户运行 `php artisan boost:install` 时，Boost 会根据用户的偏好自动安装你的技能。

Boost 技能支持[智能体技能格式](https://agentskills.io/what-are-skills)，其结构应为一个包含 `SKILL.md` 文件的目录，`SKILL.md` 文件由 YAML frontmatter 和 Markdown 指令组成。`SKILL.md` 文件必须包含必需的 frontmatter（`name` 和 `description`），还可以选择性地包含脚本、模板和参考资料。

技能应说明所需的文件结构或约定，并解释如何创建或使用其主要特性（附上示例命令或代码片段）。技能应保持简洁、可操作，并聚焦于最佳实践，这样 AI 才能为你的用户生成正确的代码：

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

<a name="guidelines-vs-skills"></a>
## 指南与技能的对比

Laravel Boost 提供了两种为 AI 智能体提供应用上下文的方式：**指南**和**技能**。

**指南**在 AI 智能体启动时预先加载，提供关于 Laravel 约定和最佳实践的必要上下文，广泛应用于整个代码库。

**技能**在处理特定任务时按需激活，包含特定领域（如 Livewire 组件或 Pest 测试）的详细模式。仅在相关时才加载技能，可以减少上下文膨胀，并提升代码质量。

| 维度         | 指南                              | 技能                             |
| ----------- | --------------------------------- | -------------------------------- |
| **加载时机** | 预先加载，始终存在                 | 按需加载，仅在相关时              |
| **范围**     | 宽泛、基础性                       | 聚焦、面向特定任务                |
| **用途**     | 核心约定与最佳实践                 | 详细的实现模式                    |

<a name="documentation-api"></a>
## 文档 API

Laravel Boost 内置了一个文档 API，让 AI 智能体能够访问一个包含 17000 余条 Laravel 专属信息的庞大知识库。该 API 使用基于 embedding 的语义搜索，提供精确、贴合上下文的结果。

`Search Docs` MCP 工具允许智能体查询 Laravel 托管的文档 API 服务，并根据你已安装的软件包检索文档。Boost 的 AI 指南和技能会自动指示你的编码智能体使用这个 API。

| 软件包             | 支持的版本         |
| ----------------- | ------------------ |
| Laravel Framework | 10.x, 11.x, 12.x   |
| Filament          | 2.x, 3.x, 4.x, 5.x |
| Flux UI           | 2.x Free, 2.x Pro  |
| Inertia           | 1.x, 2.x           |
| Livewire          | 1.x, 2.x, 3.x, 4.x |
| Nova              | 4.x, 5.x           |
| Pest              | 3.x, 4.x           |
| Tailwind CSS      | 3.x, 4.x           |

<a name="extending-boost"></a>
## 扩展 Boost

Boost 开箱即用地支持许多流行的 IDE 和 AI 智能体。如果你使用的编码工具尚未获得支持，可以创建自己的智能体并将其集成到 Boost 中。

<a name="adding-support-for-other-ides-ai-agents"></a>
### 为其他 IDE / AI 智能体添加支持

要为新的 IDE 或 AI 智能体添加支持，请创建一个继承 `Laravel\Boost\Install\Agents\Agent` 的类，并根据需要实现以下一个或多个契约：

- `Laravel\Boost\Contracts\SupportsGuidelines` - 添加对 AI 指南的支持。
- `Laravel\Boost\Contracts\SupportsMcp` - 添加对 MCP 的支持。
- `Laravel\Boost\Contracts\SupportsSkills` - 添加对智能体技能的支持。

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
    // 你的实现...
}
```

实现示例可参阅 [ClaudeCode.php](https://github.com/laravel/boost/blob/main/src/Install/Agents/ClaudeCode.php)。

<a name="registering-the-agent"></a>
#### 注册智能体

在应用的 `App\Providers\AppServiceProvider` 的 `boot` 方法中注册你的自定义智能体：

```php
use Laravel\Boost\Boost;

public function boot(): void
{
    Boost::registerAgent('customagent', CustomAgent::class);
}
```

注册完成后，运行 `php artisan boost:install` 时就可以选择你的智能体了。
