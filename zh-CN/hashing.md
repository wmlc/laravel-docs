# 哈希

## 简介

Laravel 的 `Hash` [Facade](/docs/{{version}}/facades) 提供了安全的 Bcrypt 与 Argon2 哈希算法，用于存储用户密码。如果你使用的是 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)之一，默认情况下注册与认证会使用 Bcrypt。

Bcrypt 是密码哈希的绝佳选择，因为它的「工作因子（work factor）」是可调的，这意味着随着硬件性能的提升，你可以增加生成哈希所需的时间。在为密码计算哈希时，越慢越好。算法计算密码哈希所需的时间越长，恶意用户生成「彩虹表（rainbow table）」所需的时间也就越长——彩虹表包含所有可能的字符串哈希值，可被用于对应用发起暴力破解攻击。

## 配置

默认情况下，Laravel 在计算数据哈希时使用 `bcrypt` 哈希驱动。不过，Laravel 也支持其他几种哈希驱动，包括 [argon](https://en.wikipedia.org/wiki/Argon2) 和 [argon2id](https://en.wikipedia.org/wiki/Argon2)。

你可以通过 `HASH_DRIVER` 环境变量指定应用使用的哈希驱动。但如果你想自定义 Laravel 的全部哈希驱动选项，应当使用 `config:publish` Artisan 命令发布完整的 `hashing` 配置文件：

```shell
php artisan config:publish hashing
```

## 基本用法

### 计算密码哈希

你可以调用 `Hash` Facade 的 `make` 方法来计算密码的哈希值：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    /**
     * Update the password for the user.
     */
    public function update(Request $request): RedirectResponse
    {
        // 验证新密码长度...

        $request->user()->fill([
            'password' => Hash::make($request->newPassword)
        ])->save();

        return redirect('/profile');
    }
}
```

#### 调整 Bcrypt 工作因子

如果你使用的是 Bcrypt 算法，`make` 方法允许你通过 `rounds` 选项管理算法的工作因子；不过，对大多数应用而言，Laravel 管理的默认工作因子已经足够：

```php
$hashed = Hash::make('password', [
    'rounds' => 12,
]);
```

#### 调整 Argon2 工作因子

如果你使用的是 Argon2 算法，`make` 方法允许你通过 `memory`、`time` 和 `threads` 选项管理算法的工作因子；不过，对大多数应用而言，Laravel 管理的默认值已经足够：

```php
$hashed = Hash::make('password', [
    'memory' => 1024,
    'time' => 2,
    'threads' => 2,
]);
```

> [!NOTE]
> 关于这些选项的更多信息，请参阅 [PHP 官方关于 Argon 哈希的文档](https://secure.php.net/manual/en/function.password-hash.php)。

### 验证密码是否与哈希值匹配

`Hash` Facade 提供的 `check` 方法允许你验证给定的明文字符串是否与给定的哈希值相对应：

```php
if (Hash::check('plain-text', $hashedPassword)) {
    // 密码匹配...
}
```

### 判断密码是否需要重新计算哈希

`Hash` Facade 提供的 `needsRehash` 方法允许你判断自密码计算哈希以来，哈希器使用的工作因子是否发生了变化。部分应用会选择在认证流程中执行这项检查：

```php
if (Hash::needsRehash($hashed)) {
    $hashed = Hash::make('plain-text');
}
```

## 哈希算法校验

为防止哈希算法被篡改，Laravel 的 `Hash::check` 方法会首先校验给定的哈希值是否由应用所选的哈希算法生成。如果算法不一致，将抛出 `RuntimeException` 异常。

对大多数应用而言，这是预期的行为——哈希算法通常不会改变，出现不同的算法可能意味着存在恶意攻击。不过，如果你需要在应用中支持多种哈希算法（例如在从一种算法迁移到另一种算法时），可以将 `HASH_VERIFY` 环境变量设为 `false` 来禁用哈希算法校验：

```ini
HASH_VERIFY=false
```
