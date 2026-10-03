# 加密

- [简介](#introduction)
- [配置](#configuration)
- [使用加密器](#using-the-encrypter)

<a name="introduction"></a>
## 简介

Laravel 的加密服务提供了一个简单、便捷的接口，通过 OpenSSL 使用 AES-256 和 AES-128 加密来加密和解密文本。Laravel 所有加密值都使用消息认证码（MAC）进行签名，以确保其底层值在加密后不会被修改或篡改。

<a name="configuration"></a>
## 配置

在使用 Laravel 的加密器之前，你必须在 `config/app.php` 配置文件中设置 `key` 配置选项。此配置值由 `APP_KEY` 环境变量驱动。你应该使用 `php artisan key:generate` 命令来生成此变量的值，因为 `key:generate` 命令会使用 PHP 的安全随机字节生成器为你的应用程序构建一个加密安全的密钥。通常，`APP_KEY` 环境变量的值会在 [Laravel 安装](/docs/{{version}}/installation)期间为你生成。

<a name="using-the-encrypter"></a>
## 使用加密器

<a name="encrypting-a-value"></a>
#### 加密值

你可以使用 `Crypt` Facade 提供的 `encryptString` 方法加密值。所有加密值都使用 OpenSSL 和 AES-256-CBC 密码进行加密。此外，所有加密值都使用消息认证码（MAC）进行签名。集成的消息认证码将阻止解密任何被恶意用户篡改的值：

```php
<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class DigitalOceanTokenController extends Controller
{
    /**
     * 为用户存储 DigitalOcean API 令牌。
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function storeSecret(Request $request)
    {
        $request->user()->fill([
            'token' => Crypt::encryptString($request->token),
        ])->save();
    }
}
```

<a name="decrypting-a-value"></a>
#### 解密值

你可以使用 `Crypt` Facade 提供的 `decryptString` 方法解密值。如果值无法被正确解密，例如消息认证码无效时，将抛出 `Illuminate\Contracts\Encryption\DecryptException` 异常：

```php
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

try {
    $decrypted = Crypt::decryptString($encryptedValue);
} catch (DecryptException $e) {
    //
}
```