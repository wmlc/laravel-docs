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

[Laravel Pint](https://github.com/laravel/pint) 是一款为极简主义者打造的 PHP 代码风格修复工具。Pint 构建在 PHP-CS-Fixer 之上，让你轻松确保代码风格保持简洁一致。

Pint 会随所有全新的 Laravel 应用自动安装，因此你可以立即开始使用。默认情况下，Pint 不需要任何配置，会按照 Laravel 一贯的代码风格修复代码中的风格问题。

<a name="installation"></a>
## 安装

Pint 已包含在 Laravel 框架的近期发行版中，因此通常无需安装。不过，对于较旧的应用，你可以通过 Composer 安装 Laravel Pint：

```shell
composer require laravel/pint --dev
```

<a name="running-pint"></a>
## 运行 Pint

你可以通过调用项目 `vendor/bin` 目录中提供的 `pint` 可执行文件，让 Pint 修复代码风格问题：

```shell
./vendor/bin/pint
```

你也可以只对特定文件或目录运行 Pint：

```shell
./vendor/bin/pint app/Models

./vendor/bin/pint app/Models/User.php
```

Pint 会显示它更新的所有文件的完整列表。调用 Pint 时加上 `-v` 选项，可以查看关于 Pint 所做改动的更多细节：

```shell
./vendor/bin/pint -v
```

如果你希望 Pint 只检查代码中的风格错误而不实际修改文件，可以使用 `--test` 选项。如果发现任何代码风格错误，Pint 会返回非零退出码：

```shell
./vendor/bin/pint --test
```

如果你希望 Pint 只修改与 Git 中指定分支存在差异的文件，可以使用 `--diff=[branch]` 选项。在 CI 环境（如 GitHub Actions）中，这样可以有效节省时间，只检查新增或修改过的文件：

```shell
./vendor/bin/pint --diff=main
```

如果你希望 Pint 只修改 Git 中存在未提交改动的文件，可以使用 `--dirty` 选项：

```shell
./vendor/bin/pint --dirty
```

如果你希望 Pint 修复存在代码风格错误的文件，同时在修复了错误时返回非零退出码，可以使用 `--repair` 选项：

```shell
./vendor/bin/pint --repair
```

<a name="configuring-pint"></a>
## 配置 Pint

如前所述，Pint 不需要任何配置。不过，如果你想自定义预设、规则或检查的目录，可以在项目根目录创建一个 `pint.json` 文件：

```json
{
    "preset": "laravel"
}
```

此外，如果你想使用某个特定目录下的 `pint.json`，可以在调用 Pint 时提供 `--config` 选项：

```shell
./vendor/bin/pint --config vendor/my-company/coding-style/pint.json
```

<a name="presets"></a>
### 预设

预设定义了一组可用于修复代码风格问题的规则。默认情况下，Pint 使用 `laravel` 预设，它按照 Laravel 一贯的代码风格修复问题。不过，你也可以给 Pint 提供 `--preset` 选项来指定其他预设：

```shell
./vendor/bin/pint --preset psr12
```

如果需要，你也可以在项目的 `pint.json` 文件中设置预设：

```json
{
    "preset": "psr12"
}
```

Pint 当前支持的预设包括：`laravel`、`per`、`psr12`、`symfony` 和 `empty`。

<a name="rules"></a>
### 规则

规则是 Pint 用于修复代码风格问题的风格指南。如上所述，预设是预定义的规则分组，对大多数 PHP 项目来说已经足够完善，因此你通常不必操心它们包含的每一条具体规则。

不过，如果需要，你可以在 `pint.json` 文件中启用或禁用特定规则，或者使用 `empty` 预设然后从头开始定义规则：

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

Pint 构建在 [PHP-CS-Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 之上，因此你可以使用它的任何规则来修复项目中的代码风格问题：[PHP-CS-Fixer Configurator](https://mlocati.github.io/php-cs-fixer-configurator)。

<a name="excluding-files-or-folders"></a>
### 排除文件 / 目录

默认情况下，Pint 会检查项目中除 `vendor` 目录以外的所有 `.php` 文件。如果你想排除更多目录，可以使用 `exclude` 配置选项：

```json
{
    "exclude": [
        "my-specific/folder"
    ]
}
```

如果你想排除所有包含某个名称模式的文件，可以使用 `notName` 配置选项：

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

要用 Laravel Pint 自动对项目进行代码检查，可以配置 [GitHub Actions](https://github.com/features/actions)，以便每次有新代码推送到 GitHub 时都运行 Pint。首先，务必在 GitHub 的 **Settings > Actions > General > Workflow permissions** 中为工作流授予"Read and write permissions"。然后，创建一个内容如下的 `.github/workflows/lint.yml` 文件：

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
        uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: json, dom, curl, libxml, mbstring
          coverage: none

      - name: Install Pint
        run: composer global require laravel/pint

      - name: Run Pint
        run: pint

      - name: Commit linted files
        uses: stefanzweifel/git-auto-commit-action@v5
```
