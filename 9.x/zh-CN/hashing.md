# 哈希

- [简介](#introduction)
- [配置](#configuration)
- [基本用法](#basic-usage)
    - [哈希密码](#hashing-passwords)
    - [验证密码是否与哈希值匹配](#verifying-that-a-password-matches-a-hash)
    - [判断密码是否需要重新哈希](#determining-if-a-password-needs-to-be-rehashed)

<a name="introduction"></a>
## 简介

Laravel 的 `Hash` [Facade](/docs/{{version}}/facades) 为存储用户密码提供了安全的 Bcrypt 和 Argon2 哈希。如果你使用 [Laravel 应用入门套件](/docs/{{version}}/starter-kits)之一，默认情况下注册和认证将使用 Bcrypt。

Bcrypt 是哈希密码的绝佳选择，因为它的"工作因子"（work factor）可调。这意味着随着硬件算力的提升，生成哈希所需的时间也可以相应增加。哈希密码时，慢即是好。算法哈希密码的时间越长，恶意用户生成所有可能字符串哈希值的"彩虹表"所需的时间就越长，而这些彩虹表可能被用于对应用发起暴力破解攻击。

<a name="configuration"></a>
## 配置

应用的默认哈希驱动在 `config/hashing.php` 配置文件中配置。目前支持以下几种驱动：[Bcrypt](https://en.wikipedia.org/wiki/Bcrypt) 和 [Argon2](https://en.wikipedia.org/wiki/Argon2)（Argon2i 和 Argon2id 变体）。

<a name="basic-usage"></a>
## 基本用法

<a name="hashing-passwords"></a>
### 哈希密码

你可以通过在 `Hash` Facade 上调用 `make` 方法来哈希密码：

    <?php

    namespace App\Http\Controllers;

    use App\Http\Controllers\Controller;
    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Hash;

    class PasswordController extends Controller
    {
        /**
         * 更新用户密码。
         *
         * @param  \Illuminate\Http\Request  $request
         * @return \Illuminate\Http\Response
         */
        public function update(Request $request)
        {
            // 验证新密码长度...

            $request->user()->fill([
                'password' => Hash::make($request->newPassword)
            ])->save();
        }
    }

<a name="adjusting-the-bcrypt-work-factor"></a>
#### 调整 Bcrypt 工作因子

如果你使用 Bcrypt 算法，`make` 方法允许你通过 `rounds` 选项管理算法的工作因子；不过，Laravel 管理的默认工作因子对大多数应用来说已经足够：

    $hashed = Hash::make('password', [
        'rounds' => 12,
    ]);

<a name="adjusting-the-argon2-work-factor"></a>
#### 调整 Argon2 工作因子

如果你使用 Argon2 算法，`make` 方法允许你通过 `memory`、`time` 和 `threads` 选项管理算法的工作因子；不过，Laravel 管理的默认值对大多数应用来说已经足够：

    $hashed = Hash::make('password', [
        'memory' => 1024,
        'time' => 2,
        'threads' => 2,
    ]);

> **Note**
> 欲了解更多有关这些选项的信息，请参阅 [PHP 官方关于 Argon 哈希的文档](https://secure.php.net/manual/en/function.password-hash.php)。

<a name="verifying-that-a-password-matches-a-hash"></a>
### 验证密码是否与哈希值匹配

`Hash` Facade 提供的 `check` 方法可用于验证给定的明文字符串是否与给定的哈希值匹配：

    if (Hash::check('plain-text', $hashedPassword)) {
        // 密码匹配...
    }

<a name="determining-if-a-password-needs-to-be-rehashed"></a>
### 判断密码是否需要重新哈希

`Hash` Facade 提供的 `needsRehash` 方法可用于判断自密码哈希以来，哈希器所使用的工作因子是否已变更。一些应用选择在应用的认证过程中执行此检查：

    if (Hash::needsRehash($hashed)) {
        $hashed = Hash::make('plain-text');
    }
