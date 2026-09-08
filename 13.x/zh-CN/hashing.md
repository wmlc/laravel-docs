# 哈希

- [简介](#introduction)
- [配置](#configuration)
- [基本用法](#basic-usage)
    - [哈希密码](#hashing-passwords)
    - [验证密码是否与哈希匹配](#verifying-that-a-password-matches-a-hash)
    - [判断密码是否需要重新哈希](#determining-if-a-password-needs-to-be-rehashed)
- [哈希算法校验](#hash-algorithm-verification)

<a name="introduction"></a>
## 简介

Laravel 的 `Hash` [facade](/docs/{{version}}/facades) 提供了安全的 Bcrypt 和 Argon2 哈希，用于存储用户密码。如果你正在使用某个 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)，默认会使用 Bcrypt 进行注册和认证。

Bcrypt 是哈希密码的绝佳选择，因为它的 "工作因子（work factor）" 是可调的，这意味着随着硬件性能的提升，生成哈希所需的时间也可以相应增加。在哈希密码时，慢是好事。一个算法对密码进行哈希所花的时间越长，恶意用户生成所有可能字符串哈希值的 "彩虹表" 所需的时间就越长，而这类彩虹表可能被用于针对应用的暴力攻击。

<a name="configuration"></a>
## 配置

默认情况下，Laravel 在哈希数据时使用 `bcrypt` 哈希驱动。不过，也支持其他几种哈希驱动，包括 [argon](https://en.wikipedia.org/wiki/Argon2) 和 [argon2id](https://en.wikipedia.org/wiki/Argon2)。

你可以使用 `HASH_DRIVER` 环境变量来指定应用的哈希驱动。不过，如果你想自定义 Laravel 所有的哈希驱动选项，应该使用 `config:publish` Artisan 命令发布完整的 `hashing` 配置文件：

```shell
php artisan config:publish hashing
```

<a name="basic-usage"></a>
## 基本用法

<a name="hashing-passwords"></a>
### 哈希密码

你可以通过调用 `Hash` facade 上的 `make` 方法来哈希密码：

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
        // 验证新密码的长度……

        $request->user()->fill([
            'password' => Hash::make($request->newPassword)
        ])->save();

        return redirect('/profile');
    }
}
```

<a name="adjusting-the-bcrypt-work-factor"></a>
#### 调整 Bcrypt 工作因子

如果你使用 Bcrypt 算法，`make` 方法允许你使用 `rounds` 选项来管理算法的工作因子；不过，Laravel 管理的默认工作因子对大多数应用来说已经足够：

```php
$hashed = Hash::make('password', [
    'rounds' => 12,
]);
```

<a name="adjusting-the-argon2-work-factor"></a>
#### 调整 Argon2 工作因子

如果你使用 Argon2 算法，`make` 方法允许你使用 `memory`、`time` 和 `threads` 选项来管理算法的工作因子；不过，Laravel 管理的默认值对大多数应用来说已经足够：

```php
$hashed = Hash::make('password', [
    'memory' => 1024,
    'time' => 2,
    'threads' => 2,
]);
```

> [!NOTE]
> 有关这些选项的更多信息，请参阅 [PHP 官方关于 Argon 哈希的文档](https://secure.php.net/manual/en/function.password-hash.php)。

<a name="verifying-that-a-password-matches-a-hash"></a>
### 验证密码是否与哈希匹配

`Hash` facade 提供的 `check` 方法让你可以验证给定的明文是否与给定的哈希相对应：

```php
if (Hash::check('plain-text', $hashedPassword)) {
    // 密码匹配……
}
```

<a name="determining-if-a-password-needs-to-be-rehashed"></a>
### 判断密码是否需要重新哈希

`Hash` facade 提供的 `needsRehash` 方法让你可以判断，自密码被哈希以来，哈希器所使用的工作因子是否已发生变化。一些应用会选择在应用的认证过程中执行此检查：

```php
if (Hash::needsRehash($hashed)) {
    $hashed = Hash::make('plain-text');
}
```

<a name="hash-algorithm-verification"></a>
## 哈希算法校验

为了防止哈希算法被篡改，Laravel 的 `Hash::check` 方法会先验证给定哈希是否由应用选定的哈希算法生成。如果算法不同，会抛出 `RuntimeException` 异常。

对于大多数应用来说，这是预期的行为——哈希算法通常不会变更，而不同的算法可能意味着恶意攻击。不过，如果你的应用需要支持多种哈希算法（例如在从一种算法迁移到另一种算法时），可以通过将 `HASH_VERIFY` 环境变量设为 `false` 来禁用哈希算法校验：

```ini
HASH_VERIFY=false
```
