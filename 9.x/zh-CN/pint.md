# Laravel Pint

- [简介](#introduction)
- [安装](#installation)
- [运行 Pint](#running-pint)
- [配置 Pint](#configuring-pint)
    - [预设](#presets)
    - [规则](#rules)
    - [排除文件 / 文件夹](#excluding-files-or-folders)

<a name="introduction"></a>
## 简介

[Laravel Pint](https://github.com/laravel/pint) 是一款面向极简主义者的固执的 PHP 代码风格修复工具。Pint 基于 PHP-CS-Fixer 构建，让你能够轻松确保代码风格保持整洁和一致。

Pint 会随所有新的 Laravel 应用程序自动安装，因此你可以立即开始使用它。默认情况下，Pint 不需要任何配置，会按照 Laravel 固执的编码风格修复代码中的代码风格问题。

<a name="installation"></a>
## 安装

Pint 已包含在 Laravel 框架的近期版本中，因此通常无需安装。但对于旧应用程序，你可以通过 Composer 安装 Laravel Pint：

```shell
composer require laravel/pint --dev
```

<a name="running-pint"></a>
## 运行 Pint

你可以通过调用项目 `vendor/bin` 目录中可用的 `pint` 二进制文件来指示 Pint 修复代码风格问题：

```shell
./vendor/bin/pint
```

你也可以在特定文件或目录上运行 Pint：

```shell
./vendor/bin/pint app/Models

./vendor/bin/pint app/Models/User.php
```

Pint 会显示它更新的所有文件的详细列表。你可以在调用 Pint 时提供 `-v` 选项来查看有关 Pint 更改的更多细节：

```shell
./vendor/bin/pint -v
```

如果你希望 Pint 仅检查代码中的风格错误而不实际更改文件，可以使用 `--test` 选项：

```shell
./vendor/bin/pint --test
```

如果你希望 Pint 仅修改根据 Git 有未提交更改的文件，可以使用 `--dirty` 选项：

```shell
./vendor/bin/pint --dirty
```

<a name="configuring-pint"></a>
## 配置 Pint

如前所述，Pint 不需要任何配置。但是，如果你希望自定义预设、规则或检查的文件夹，可以在项目的根目录中创建一个 `pint.json` 文件来实现：

```json
{
    "preset": "laravel"
}
```

此外，如果你希望使用特定目录中的 `pint.json`，可以在调用 Pint 时提供 `--config` 选项：

```shell
pint --config vendor/my-company/coding-style/pint.json
```

<a name="presets"></a>
### 预设

预设定义了一组规则，可用于修复代码中的代码风格问题。默认情况下，Pint 使用 `laravel` 预设，它按照 Laravel 固执的编码风格修复问题。但是，你可以通过向 Pint 提供 `--preset` 选项来指定不同的预设：

```shell
pint --preset psr12
```

如果你愿意，也可以在项目的 `pint.json` 文件中设置预设：

```json
{
    "preset": "psr12"
}
```

Pint 目前支持的预设为：`laravel`、`psr12` 和 `symfony`。

<a name="rules"></a>
### 规则

规则是 Pint 用于修复代码中代码风格问题的风格指南。如上所述，预设是预定义的规则组，应该适用于大多数 PHP 项目，因此你通常无需担心它们包含的各个规则。

但是，如果你愿意，可以在 `pint.json` 文件中启用或禁用特定规则：

```json
{
    "preset": "laravel",
    "rules": {
        "simplified_null_return": true,
        "braces": false,
        "new_with_braces": {
            "anonymous_class": false,
            "named_class": false
        }
    }
}
```

Pint 基于 [PHP-CS-Fixer](https://github.com/FriendsOfPHP/PHP-CS-Fixer) 构建。因此，你可以使用其任何规则来修复项目中的代码风格问题：[PHP-CS-Fixer Configurator](https://mlocati.github.io/php-cs-fixer-configurator)。

<a name="excluding-files-or-folders"></a>
### 排除文件 / 文件夹

默认情况下，Pint 会检查项目中所有的 `.php` 文件，`vendor` 目录中的文件除外。如果你希望排除更多文件夹，可以使用 `exclude` 配置选项来实现：

```json
{
    "exclude": [
        "my-specific/folder"
    ]
}
```

如果你希望排除所有包含给定名称模式的文件，可以使用 `notName` 配置选项：

```json
{
    "notName": [
        "*-my-file.php"
    ]
}
```

如果你希望通过提供文件的精确路径来排除文件，可以使用 `notPath` 配置选项：

```json
{
    "notPath": [
        "path/to/excluded-file.php"
    ]
}
```
