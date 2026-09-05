# Laravel Pint

## 简介

[Laravel Pint](https://github.com/laravel/pint) 是一款为"极简"风格定制的、立场鲜明的 PHP 代码风格修复工具。Pint 建立在 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 之上，能让你轻松保持代码风格的整洁与一致。

Pint 已默认随所有新建 Laravel 应用一起安装，因此可以立即开始使用。它开箱即用、无需任何配置，并按 Laravel 自身的代码风格偏好修复代码风格问题。

## 安装

Pint 已经包含在近期版本的 Laravel 框架中，通常不需要单独安装。不过，针对较老版本的应用，仍可以通过 Composer 安装 Laravel Pint：

```shell
composer require laravel/pint --dev
```

## 运行 Pint

可以通过调用项目 `vendor/bin` 目录下的 `pint` 二进制来让 Pint 修复代码风格问题：

```shell
./vendor/bin/pint
```

如果想让 Pint 以并行模式（实验性）运行以获得更好的性能，可以加上 `--parallel` 选项：

```shell
./vendor/bin/pint --parallel
```

并行模式下，还可以使用 `--max-processes` 选项指定允许运行的最大进程数。如果不指定该选项，Pint 会用上机器上所有可用的 CPU 核心：

```shell
./vendor/bin/pint --parallel --max-processes=4
```

也可以针对特定文件或目录运行 Pint：

```shell
./vendor/bin/pint app/Models

./vendor/bin/pint app/Models/User.php
```

默认情况下，Pint 不会格式化 Blade 模板。如果希望同时格式化 `.blade.php` 文件，可以使用 `--blade` 选项——它会在本次运行中启用 [`Pint/laravel_blade`](#laravel-blade) 规则，而不会修改 `pint.json`：

```shell
./vendor/bin/pint --blade
```

Pint 会详细列出所有被它更新的文件。运行 Pint 时加上 `-v` 选项，可以看到更详细的变更信息：

```shell
./vendor/bin/pint -v
```

如果只想让 Pint 检查代码风格问题而不实际改动文件，可以使用 `--test` 选项。如果发现代码风格问题，Pint 会返回非零退出码：

```shell
./vendor/bin/pint --test
```

如果只想让 Pint 处理与指定分支相比发生变化的文件，可以使用 `--diff=[branch]` 选项。这在 CI 环境（例如 GitHub Actions）里非常实用——只检查新增或修改过的文件以节省时间：

```shell
./vendor/bin/pint --diff=main
```

如果只想让 Pint 处理 Git 上有未提交变更的文件，可以使用 `--dirty` 选项：

```shell
./vendor/bin/pint --dirty
```

如果想让 Pint 修复所有存在代码风格问题的文件，同时在确实修复了任何问题时返回非零退出码，可以使用 `--repair` 选项：

```shell
./vendor/bin/pint --repair
```

## 配置 Pint

如前所述，Pint 不需要任何配置。但如果你希望自定义预设、规则或要检查的文件夹，可以在项目根目录创建 `pint.json` 文件进行定制：

```json
{
    "preset": "laravel"
}
```

另外，如果希望使用某个特定目录下的 `pint.json`，可以在调用 Pint 时通过 `--config` 选项指定：

```shell
./vendor/bin/pint --config vendor/my-company/coding-style/pint.json
```

### 预设（Presets）

预设是一组用于修复代码风格问题的规则集合。默认情况下，Pint 使用 `laravel` 预设，按 Laravel 自身的代码风格偏好修复问题。当然，你也可以在调用 Pint 时通过 `--preset` 选项指定其他预设：

```shell
./vendor/bin/pint --preset psr12
```

如果你愿意，也可以在项目的 `pint.json` 中设置预设：

```json
{
    "preset": "psr12"
}
```

Pint 当前支持的预设包括：`laravel`、`per`、`psr12`、`symfony` 以及 `empty`。

### 规则（Rules）

规则是 Pint 用于修复代码风格问题的风格指南。如前所述，预设是一组预定义的规则组合，对于大多数 PHP 项目来说已经足够好，通常无需关心它们各自包含哪些规则。

不过，如果你愿意，也可以在 `pint.json` 中启用或禁用特定规则，或使用 `empty` 预设，从零开始定义规则：

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

Pint 建立在 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 之上。因此，你可以使用它的任意规则来修复项目中的代码风格问题：[PHP CS Fixer Configurator](https://mlocati.github.io/php-cs-fixer-configurator)。

#### 自定义规则

除了 PHP CS Fixer 的规则外，Pint 还提供了一批以 `Pint/` 为前缀的自定义规则。这些规则默认未启用，可以在 `pint.json` 中显式启用。

##### `Pint/laravel_blade`

该规则会格式化 Blade 模板，对 `.blade.php` 文件应用统一的缩进、空格与属性格式。默认情况下 Pint 不会格式化 Blade 文件，所以需要先在 `pint.json` 中启用该规则来开启：

```json
{
    "preset": "laravel",
    "rules": {
        "Pint/laravel_blade": true
    }
}
```

启用后，Pint 在每次运行时除了格式化 PHP 文件，还会一并格式化 Blade 模板：

```shell
./vendor/bin/pint
```

如果只想在单次运行中启用此规则而不修改 `pint.json`，可以使用 `--blade` 选项：

```shell
./vendor/bin/pint --blade
```

该规则底层使用 [Prettier](https://prettier.io) 以及 `prettier-plugin-blade`、`prettier-plugin-tailwindcss` 插件，因此机器上需要先安装 [Node.js](https://nodejs.org)。首次启用该规则运行 Pint 时，Pint 会检测到缺失的 Prettier 依赖并提示你安装。

> [!NOTE]
> 该规则会自动跳过通常依赖自身格式约定的文件，例如 [Laravel Boost](https://github.com/laravel/boost) 指南，以及位于 `resources/views/emails` 和 `resources/views/mail` 目录下的邮件视图。

##### `Pint/phpdoc_type_annotations_only`

该规则会移除代码中所有的注释和 PHPDoc 散文，仅保留包含 `@` 注解（如 `@param`、`@return`、`@var`、`@phpstan-type` 等）的行：

```php
/**
 * Get the posts for the user. [tl! remove]
 * [tl! remove]
 * @return HasMany<Post, $this>
 */
public function posts(): HasMany
```

不含 `@` 注解的单行注释和块注释将被完全删除。如果想保留某个特定注释，可以给它加上 `@note`、`@warning` 或 `@todo` 前缀：

```php
// @note This comment will be preserved.
```

要启用该规则，把它加入 `pint.json`：

```json
{
    "preset": "laravel",
    "rules": {
        "Pint/phpdoc_type_annotations_only": true
    }
}
```

> [!NOTE]
> 该规则会自动跳过 `config` 目录下的文件——因为配置文件通常依赖注释来做文档说明。

### 排除文件 / 文件夹

默认情况下，Pint 会检查项目中除 `vendor` 目录外所有 `.php` 文件。如果希望排除更多文件夹，可以使用 `exclude` 配置项：

```json
{
    "exclude": [
        "my-specific/folder"
    ]
}
```

如果希望按名称模式排除文件，可以使用 `notName` 配置项：

```json
{
    "notName": [
        "*-my-file.php"
    ]
}
```

如果希望按精确路径排除某个文件，可以使用 `notPath` 配置项：

```json
{
    "notPath": [
        "path/to/excluded-file.php"
    ]
}
```

## 持续集成

### GitHub Actions

若想在 GitHub 上自动执行 Pint，可以配置 [GitHub Actions](https://github.com/features/actions)，让每次新代码推送到 GitHub 时都自动运行 Pint。首先，请确认在 GitHub 的 **Settings > Actions > General > Workflow permissions** 中把 workflow 权限授予「Read and write permissions」（读写权限）。然后创建 `.github/workflows/lint.yml`，内容如下：

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
