# Laravel Pint

- [简介](#introduction)
- [安装](#installation)
- [运行 Pint](#running-pint)
- [配置 Pint](#configuring-pint)
    - [预设](#presets)
    - [规则](#rules)
    - [排除文件 / 文件夹](#excluding-files-or-folders)
- [持续集成](#continuous-integration)
    - [GitHub Actions](#running-tests-on-github-actions)

<a name="introduction"></a>
## 简介

[Laravel Pint](https://github.com/laravel/pint) 是一款为极简主义者打造的、带有默认主张的 PHP 代码风格修复工具。Pint 基于 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 构建，可以让你轻松保持代码风格的整洁与一致。

所有新建的 Laravel 应用都会自动安装 Pint，因此你可以立即使用它。默认情况下，Pint 无需任何配置，它会按照 Laravel 官方主张的编码风格来修复代码中的风格问题。

<a name="installation"></a>
## 安装

Laravel 框架的近期版本已经内置了 Pint，因此通常无需单独安装。不过，对于较旧的应用，你可以通过 Composer 来安装 Laravel Pint：

```shell
composer require laravel/pint --dev
```

<a name="running-pint"></a>
## 运行 Pint

你可以通过调用项目 `vendor/bin` 目录下的 `pint` 可执行文件，让 Pint 修复代码风格问题：

```shell
./vendor/bin/pint
```

如果希望 Pint 以并行模式（实验性）运行以提升性能，可以使用 `--parallel` 选项：

```shell
./vendor/bin/pint --parallel
```

并行模式还允许你通过 `--max-processes` 选项指定运行的最大进程数。如果不提供该选项，Pint 将使用你机器上所有可用的核心：

```shell
./vendor/bin/pint --parallel --max-processes=4
```

你也可以只对特定的文件或目录运行 Pint：

```shell
./vendor/bin/pint app/Models

./vendor/bin/pint app/Models/User.php
```

Pint 会列出它更新的所有文件的详尽清单。调用 Pint 时加上 `-v` 选项，可以查看其修改的更多细节：

```shell
./vendor/bin/pint -v
```

如果只想让 Pint 检查代码中的风格错误，而不实际修改文件，可以使用 `--test` 选项。一旦发现任何代码风格错误，Pint 将返回非零的退出码：

```shell
./vendor/bin/pint --test
```

如果希望 Pint 只修改那些根据 Git 与指定分支存在差异的文件，可以使用 `--diff=[branch]` 选项。这在 CI 环境（如 GitHub Actions）中非常实用，通过只检查新增或修改过的文件来节省时间：

```shell
./vendor/bin/pint --diff=main
```

如果希望 Pint 只修改那些根据 Git 存在未提交变更的文件，可以使用 `--dirty` 选项：

```shell
./vendor/bin/pint --dirty
```

如果希望 Pint 修复存在代码风格错误的文件，同时在修复了任何错误时以非零退出码退出，可以使用 `--repair` 选项：

```shell
./vendor/bin/pint --repair
```

<a name="configuring-pint"></a>
## 配置 Pint

正如前文所述，Pint 不需要任何配置。不过，如果你想自定义预设、规则或要检查的文件夹，可以在项目的根目录下创建一个 `pint.json` 文件：

```json
{
    "preset": "laravel"
}
```

此外，如果你想使用某个特定目录中的 `pint.json`，可以在调用 Pint 时提供 `--config` 选项：

```shell
./vendor/bin/pint --config vendor/my-company/coding-style/pint.json
```

<a name="presets"></a>
### 预设

预设定义了一组可用于修复代码风格问题的规则。默认情况下，Pint 使用 `laravel` 预设，它会按照 Laravel 官方主张的编码风格来修复问题。不过，你可以向 Pint 提供 `--preset` 选项来指定其他预设：

```shell
./vendor/bin/pint --preset psr12
```

如果愿意，你也可以在项目的 `pint.json` 文件中设置预设：

```json
{
    "preset": "psr12"
}
```

Pint 目前支持的预设包括：`laravel`、`per`、`psr12`、`symfony` 和 `empty`。

<a name="rules"></a>
### 规则

规则是 Pint 用来修复代码风格问题的风格指南。如上所述，预设是预先定义好的规则组合，对大多数 PHP 项目来说应该都很合适，因此通常你无需关心其中包含的具体规则。

不过，如果你愿意，可以在 `pint.json` 文件中启用或禁用特定规则，或者使用 `empty` 预设并从头定义规则：

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

Pint 基于 [PHP CS Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 构建。因此，你可以使用它的任何规则来修复项目中的代码风格问题：[PHP CS Fixer Configurator](https://mlocati.github.io/php-cs-fixer-configurator)。

<a name="custom-rules"></a>
#### 自定义规则

除了 PHP CS Fixer 的规则之外，Pint 还提供了一组以 `Pint/` 为前缀的自定义规则。这些规则默认不启用，但你可以在 `pint.json` 文件中启用它们。

<a name="phpdoc-type-annotations-only"></a>
##### `Pint/phpdoc_type_annotations_only`

该规则会移除代码中的所有注释和 docblock 说明文字，只保留包含 `@` 注解的行，例如 `@param`、`@return`、`@var`、`@phpstan-type` 等：

```php
/**
 * 获取用户的文章。 [tl! remove]
 * [tl! remove]
 * @return HasMany<Post, $this>
 */
public function posts(): HasMany
```

单行注释以及不包含 `@` 注解的块注释将被完全移除。如果你想保留某个特定的注释，可以在其前面加上 `@note`、`@warning` 或 `@todo`：

```php
// @note 此注释将被保留。
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
> 该规则会自动跳过 `config` 目录中的文件，因为配置文件通常依赖注释来说明用途。

<a name="excluding-files-or-folders"></a>
### 排除文件 / 文件夹

默认情况下，Pint 会检查项目中除 `vendor` 目录之外的所有 `.php` 文件。如果你想排除更多文件夹，可以使用 `exclude` 配置选项：

```json
{
    "exclude": [
        "my-specific/folder"
    ]
}
```

如果想排除所有包含给定名称模式的文件，可以使用 `notName` 配置选项：

```json
{
    "notName": [
        "*-my-file.php"
    ]
}
```

如果想通过提供文件的精确路径来排除某个文件，可以使用 `notPath` 配置选项：

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

要使用 Laravel Pint 自动化检查项目的代码风格，你可以配置 [GitHub Actions](https://github.com/features/actions)，在每次有新代码推送到 GitHub 时运行 Pint。首先，请务必在 GitHub 的 **Settings > Actions > General > Workflow permissions** 中为工作流授予「Read and write permissions」（读写权限）。然后，创建一个 `.github/workflows/lint.yml` 文件，内容如下：

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
