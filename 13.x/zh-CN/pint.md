# Laravel Pint

- [简介](#introduction)
- [安装](#installation)
- [运行 Pint](#running-pint)
- [配置 Pint](#configuring-pint)
    - [预设](#presets)
    - [规则](#rules)
    - [排除文件 / 目录](#excluding-files-or-folders)
- [持续集成](#continuous-integration)
    - [GitHub Actions](#running-tests-on-github-actions)

<a name="introduction"></a>
## 简介

[Laravel Pint](https://github.com/laravel/pint) 是一款为极简主义者打造的、有主见的 PHP 代码风格修复工具。Pint 构建于 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 之上，可以轻松确保你的代码风格保持整洁与一致。

Pint 会随所有新的 Laravel 应用自动安装，因此你可以立即开始使用。默认情况下，Pint 不需要任何配置，它会遵循 Laravel 有主见的编码风格来修复代码中的风格问题。

<a name="installation"></a>
## 安装

Pint 已包含在近期发布的 Laravel 框架中，因此通常无需额外安装。不过，对于较旧的应用，你可以通过 Composer 安装 Laravel Pint：

```shell
composer require laravel/pint --dev
```

<a name="running-pint"></a>
## 运行 Pint

你可以通过调用项目 `vendor/bin` 目录中提供的 `pint` 可执行文件，指示 Pint 修复代码风格问题：

```shell
./vendor/bin/pint
```

如果你希望 Pint 以并行模式运行（实验性）以获得更好的性能，可以使用 `--parallel` 选项：

```shell
./vendor/bin/pint --parallel
```

并行模式还允许你通过 `--max-processes` 选项指定要运行的最大进程数。如果未提供该选项，Pint 将使用你机器上的所有可用核心：

```shell
./vendor/bin/pint --parallel --max-processes=4
```

你也可以在特定文件或目录上运行 Pint：

```shell
./vendor/bin/pint app/Models

./vendor/bin/pint app/Models/User.php
```

默认情况下，Pint 不会格式化 Blade 模板。如果你也希望格式化 `.blade.php` 文件，可以使用 `--blade` 选项，它会在本次运行中启用 [`Pint/laravel_blade`](#laravel-blade) 规则，而无需修改你的 `pint.json` 文件：

```shell
./vendor/bin/pint --blade
```

Pint 会显示一份详尽的、所有被更新文件的列表。你可以通过在调用 Pint 时提供 `-v` 选项，查看关于 Pint 更改的更多细节：

```shell
./vendor/bin/pint -v
```

如果你希望 Pint 仅检查代码的风格错误而不实际修改文件，可以使用 `--test` 选项。如果发现任何代码风格错误，Pint 将返回非零退出码：

```shell
./vendor/bin/pint --test
```

如果你希望 Pint 只修改与提供的分支存在差异的文件（依据 Git 判断），可以使用 `--diff=[branch]` 选项。这在你的 CI 环境（如 GitHub Actions）中非常有效，可以通过只检查新增或修改的文件来节省时间：

```shell
./vendor/bin/pint --diff=main
```

如果你希望 Pint 只修改依据 Git 判断存在未提交更改的文件，可以使用 `--dirty` 选项：

```shell
./vendor/bin/pint --dirty
```

如果你希望 Pint 修复存在代码风格错误的文件，但同时在任何错误被修复后以非零退出码退出，可以使用 `--repair` 选项：

```shell
./vendor/bin/pint --repair
```

<a name="configuring-pint"></a>
## 配置 Pint

如前所述，Pint 不需要任何配置。不过，如果你想自定义预设、规则或受检目录，可以在项目根目录创建 `pint.json` 文件：

```json
{
    "preset": "laravel"
}
```

此外，如果你希望使用某个特定目录下的 `pint.json`，可以在调用 Pint 时提供 `--config` 选项：

```shell
./vendor/bin/pint --config vendor/my-company/coding-style/pint.json
```

<a name="presets"></a>
### 预设

预设定义了一组可用于修复代码风格问题的规则。默认情况下，Pint 使用 `laravel` 预设，它会遵循 Laravel 有主见的编码风格来修复问题。不过，你可以通过向 Pint 提供 `--preset` 选项来指定其他预设：

```shell
./vendor/bin/pint --preset psr12
```

如果你愿意，也可以在项目的 `pint.json` 文件中设置预设：

```json
{
    "preset": "psr12"
}
```

Pint 当前支持的预设为：`laravel`、`per`、`psr12`、`symfony` 和 `empty`。

<a name="rules"></a>
### 规则

规则是 Pint 用于修复代码风格问题的风格准则。如上所述，预设是预先定义好的规则组，对于大多数 PHP 项目来说应该非常合适，因此你通常无需担心它们包含的各个规则。

不过，如果你愿意，可以在 `pint.json` 文件中启用或禁用特定规则，或使用 `empty` 预设从头定义规则：

```json
{
    "preset": "laravel",
    "rules": {
        "simplified_null_return": true,
        "array_indentation": false,
        "new_with_parentheses": {
            "anonymous_class": true,
            "named_class": true
        }
    }
}
```

Pint 构建于 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 之上。因此，你可以使用它的任何规则来修复项目中的代码风格问题：[PHP CS Fixer Configurator](https://mlocati.github.io/php-cs-fixer-configurator)。

<a name="custom-rules"></a>
#### 自定义规则

除了 PHP CS Fixer 规则之外，Pint 还提供以 `Pint/` 为前缀的自定义规则。这些规则默认不会启用，但你可以在 `pint.json` 文件中启用它们。

<a name="laravel-blade"></a>
##### `Pint/laravel_blade`

该规则会格式化你的 Blade 模板，为 `.blade.php` 文件应用一致的缩进、间距和属性格式。默认情况下，Pint 不会格式化 Blade 文件，因此你必须在 `pint.json` 文件中启用该规则以选择加入：

```json
{
    "preset": "laravel",
    "rules": {
        "Pint/laravel_blade": true
    }
}
```

一旦启用，Pint 在运行时除了格式化 PHP 文件之外，还会格式化你的 Blade 模板：

```shell
./vendor/bin/pint
```

另外，如果你想在不修改 `pint.json` 文件的情况下仅为单次运行启用该规则，可以使用 `--blade` 选项：

```shell
./vendor/bin/pint --blade
```

在底层，该规则使用 [Prettier](https://prettier.io) 以及 `prettier-plugin-blade` 和 `prettier-plugin-tailwindcss` 插件，因此你的机器上必须安装 [Node.js](https://nodejs.org)。启用该规则后第一次运行 Pint 时，Pint 会检测任何缺失的 Prettier 依赖，并提示你安装它们。

> [!NOTE]
> 该规则会自动跳过通常依赖自身格式的文件，例如 [Laravel Boost](https://github.com/laravel/boost) 规范，以及位于 `resources/views/emails` 和 `resources/views/mail` 目录中的邮件视图。

<a name="phpdoc-type-annotations-only"></a>
##### `Pint/phpdoc_type_annotations_only`

该规则会移除代码中的所有注释与 PHPDoc 说明性文字，只保留包含 `@param`、`@return`、`@var`、`@phpstan-type` 等 `@` 注解的行：

```php
/**
 * Get the posts for the user. [tl! remove]
 * [tl! remove]
 * @return HasMany<Post, $this>
 */
public function posts(): HasMany
```

不包含 `@` 注解的单行注释和块注释会被完全移除。如果你想保留某条特定注释，可以为它加上 `@note`、`@warning` 或 `@todo` 前缀：

```php
// @note This comment will be preserved.
```

要启用该规则，请将其添加到你的 `pint.json` 文件中：

```json
{
    "preset": "laravel",
    "rules": {
        "Pint/phpdoc_type_annotations_only": true
    }
}
```

> [!NOTE]
> 该规则会自动跳过 `config` 目录中的文件，因为配置文件通常依赖注释作为文档说明。

<a name="excluding-files-or-folders"></a>
### 排除文件 / 目录

默认情况下，Pint 会检查项目中除 `vendor` 目录外的所有 `.php` 文件。如果你想排除更多目录，可以使用 `exclude` 配置选项：

```json
{
    "exclude": [
        "my-specific/folder"
    ]
}
```

如果你想排除所有包含给定名称模式的文件，可以使用 `notName` 配置选项：

```json
{
    "notName": [
        "*-my-file.php"
    ]
}
```

如果你想通过提供文件的精确路径来排除某个文件，可以使用 `notPath` 配置选项：

```json
{
    "notPath": [
        "path/to/excluded-file.php"
    ]
}
```

<a name="continuous-integration"></a>
## 持续集成

<a name="running-tests-on-github-actions"></a>
### GitHub Actions

要使用 Laravel Pint 自动化检查项目，你可以配置 [GitHub Actions](https://github.com/features/actions)，使 Pint 在新代码推送到 GitHub 时运行。首先，请务必在 GitHub 的 **Settings > Actions > General > Workflow permissions** 中为工作流授予"读取与写入权限"。然后，创建包含以下内容的 `.github/workflows/lint.yml` 文件：

```yaml
name: Fix Code Style

on: [push]

jobs:
  lint:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: true
      matrix:
        php: [8.4]

    steps:
      - name: Checkout code
        uses: actions/checkout@v5

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          tools: pint

      - name: Run Pint
        run: pint

      - name: Commit linted files
        uses: stefanzweifel/git-auto-commit-action@v6
```
