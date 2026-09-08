# 哈希

- [简介](#introduction)
- [配置](#configuration)
- [基本用法](#basic-usage)
    - [密码哈希](#hashing-passwords)
    - [验证密码与哈希是否匹配](#verifying-that-a-password-matches-a-hash)
    - [判断密码是否需要重新哈希](#determining-if-a-password-needs-to-be-rehashed)
- [哈希算法校验](#hash-algorithm-verification)

<a name="introduction"></a>
## 简介

Laravel 的 `Hash` [Facade](/docs/{{version}}/facades) 提供安全的 Bcrypt 和 Argon2 哈希算法，用于存储用户密码。如果你使用了 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)，默认情况下注册和认证流程会使用 Bcrypt。

Bcrypt 是密码哈希的绝佳选择，因为它的「工作因子」（work factor）可调。也就是说，随着硬件性能的提升，生成哈希所需的时间也可以相应增加。对密码进行哈希时，速度慢反而是好事。算法对密码进行哈希所花费的时间越长，恶意用户生成「彩虹表」就越困难，从而更难发起针对应用的暴力破解攻击。

<a name="configuration"></a>
## 配置

默认情况下，Laravel 在哈希数据时使用 `bcrypt` 哈希驱动。不过，Laravel 还支持其他几种哈希驱动，包括 [argon](https://en.wikipedia.org/wiki/Argon2) 和 [argon2id](https://en.wikipedia.org/wiki/Argon2)。

你可以通过 `HASH_DRIVER` 环境变量指定应用使用的哈希驱动。如果想自定义 Laravel 哈希驱动的全部选项，则应使用 `config:publish` Artisan 命令发布完整的 `hashing` 配置文件：

```shell
php artisan config:publish hashing
```

<a name="basic-usage"></a>
## 基本用法

<a name="hashing-passwords"></a>
### 密码哈希

你可以调用 `Hash` Facade 的 `make` 方法对密码进行哈希：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PasswordController extends Controller
{
    /**
     * 更新用户的密码。
     */
    public function update(Request $request): RedirectResponse
    {
        // 校验新密码的长度...

        $request->user()->fill([
            'password' => Hash::make($request->newPassword)
        ])->save();

        return redirect('/profile');
    }
}
```

<a name="adjusting-the-bcrypt-work-factor"></a>
#### 调整 Bcrypt 工作因子

如果你使用 Bcrypt 算法，可以通过 `make` 方法的 `rounds` 选项管理该算法的工作因子。不过，Laravel 管理的默认工作因子已经适用于大多数应用：

```php
$hashed = Hash::make('password', [
    'rounds' => 12,
]);
```

<a name="adjusting-the-argon2-work-factor"></a>
#### 调整 Argon2 工作因子

如果你使用 Argon2 算法，可以通过 `make` 方法的 `memory`、`time` 和 `threads` 选项管理该算法的工作因子。不过，Laravel 管理的默认值已经适用于大多数应用：

```php
$hashed = Hash::make('password', [
    'memory' => 1024,
    'time' => 2,
    'threads' => 2,
]);
```

> [!NOTE]
> 想了解更多这些选项的信息，请参阅 [PHP 官方文档中关于 Argon 哈希的部分](https://secure.php.net/manual/en/function.password-hash.php)。

<a name="verifying-that-a-password-matches-a-hash"></a>
### 验证密码与哈希是否匹配

`Hash` Facade 提供的 `check` 方法可用于验证给定的明文字符串是否与给定的哈希值对应：

```php
if (Hash::check('plain-text', $hashedPassword)) {
    // 密码匹配...
}
```

<a name="determining-if-a-password-needs-to-be-rehashed"></a>
### 判断密码是否需要重新哈希

`Hash` Facade 提供的 `needsRehash` 方法可用于判断自密码被哈希以来，哈希器使用的工作因子是否发生了变化。一些应用会选择在应用的认证流程中执行这项检查：

```php
if (Hash::needsRehash($hashed)) {
    $hashed = Hash::make('plain-text');
}
```

<a name="hash-algorithm-verification"></a>
## 哈希算法校验

为防止哈希算法被篡改，Laravel 的 `Hash::check` 方法会先验证给定的哈希值是否使用应用所选的哈希算法生成。如果算法不一致，就会抛出 `RuntimeException` 异常。

对大多数应用而言，这是预期行为：哈希算法通常不会改变，而算法不一致可能意味着恶意攻击。但如果你的应用需要支持多种哈希算法，例如从一种算法迁移到另一种算法时，可以将 `HASH_VERIFY` 环境变量设置为 `false` 来禁用哈希算法校验：

```ini
HASH_VERIFY=false
```
