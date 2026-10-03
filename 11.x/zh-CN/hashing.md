# 哈希

- [简介](#introduction)
- [配置](#configuration)
- [基本用法](#basic-usage)
    - [对密码进行哈希](#hashing-passwords)
    - [验证密码是否匹配哈希](#verifying-that-a-password-matches-a-hash)
    - [判断密码是否需要重新哈希](#determining-if-a-password-needs-to-be-rehashed)
- [哈希算法验证](#hash-algorithm-verification)

<a name="introduction"></a>
## 简介

Laravel 的 `Hash` [Facade](/docs/{{version}}/facades) 提供安全的 Bcrypt 和 Argon2 哈希，用于存储用户密码。如果你使用的是某个 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)，默认会在注册和认证时使用 Bcrypt。

Bcrypt 是对密码进行哈希的优秀选择，因为它的"工作因子"可以调整，这意味着随着硬件算力提升，生成一个哈希所需的时间可以相应增加。对密码进行哈希时，慢是好事。算法哈希一个密码所需的时间越长，恶意用户为暴力破解应用而生成所有可能字符串哈希值的"彩虹表"所需的时间就越长。

<a name="configuration"></a>
## 配置

默认情况下，Laravel 在对数据进行哈希时使用 `bcrypt` 哈希驱动。不过它还支持其他几个哈希驱动，包括 [`argon`](https://en.wikipedia.org/wiki/Argon2) 和 [`argon2id`](https://en.wikipedia.org/wiki/Argon2)。

你可以通过 `HASH_DRIVER` 环境变量指定应用使用的哈希驱动。不过，如果你想自定义 Laravel 的全部哈希驱动选项，应使用 `config:publish` Artisan 命令发布完整的 `hashing` 配置文件：

```bash
php artisan config:publish hashing
```

<a name="basic-usage"></a>
## 基本用法

<a name="hashing-passwords"></a>
### 对密码进行哈希

你可以调用 `Hash` Facade 上的 `make` 方法对一个密码进行哈希：

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

<a name="adjusting-the-bcrypt-work-factor"></a>
#### 调整 Bcrypt 工作因子

如果你使用 Bcrypt 算法，`make` 方法允许你通过 `rounds` 选项管理算法的工作因子；不过 Laravel 管理的默认工作因子对大多数应用来说已经够用：

    $hashed = Hash::make('password', [
        'rounds' => 12,
    ]);

<a name="adjusting-the-argon2-work-factor"></a>
#### 调整 Argon2 工作因子

如果你使用 Argon2 算法，`make` 方法允许你通过 `memory`、`time` 和 `threads` 选项管理算法的工作因子；不过 Laravel 管理的默认值对大多数应用来说已经够用：

    $hashed = Hash::make('password', [
        'memory' => 1024,
        'time' => 2,
        'threads' => 2,
    ]);

> [!NOTE]
> 想了解这些选项的更多信息，请参阅 [PHP 官方文档中关于 Argon 哈希的说明](https://secure.php.net/manual/en/function.password-hash.php)。

<a name="verifying-that-a-password-matches-a-hash"></a>
### 验证密码是否匹配哈希

`Hash` Facade 提供的 `check` 方法允许你验证给定的明文字符串是否对应给定的哈希：

    if (Hash::check('plain-text', $hashedPassword)) {
        // 密码匹配……
    }

<a name="determining-if-a-password-needs-to-be-rehashed"></a>
### 判断密码是否需要重新哈希

`Hash` Facade 提供的 `needsRehash` 方法允许你判断哈希器使用的工作因子在密码被哈希之后是否发生了变化。有些应用选择在认证流程中执行这项检查：

    if (Hash::needsRehash($hashed)) {
        $hashed = Hash::make('plain-text');
    }

<a name="hash-algorithm-verification"></a>
## 哈希算法验证

为防止哈希算法被篡改，Laravel 的 `Hash::check` 方法会先验证给定哈希确实是使用应用所选的哈希算法生成的。如果算法不同，系统会抛出 `RuntimeException` 异常。

这对大多数应用来说都是预期行为：哈希算法本不应改变，而算法不一致往往意味着可能存在恶意攻击。不过，如果你的应用需要支持多种哈希算法（例如正从一种算法迁移到另一种算法），可以把 `HASH_VERIFY` 环境变量设为 `false` 来关闭哈希算法验证：

```ini
HASH_VERIFY=false
```
