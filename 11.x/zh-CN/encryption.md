# 加密

- [简介](#introduction)
- [配置](#configuration)
    - [平滑轮换加密密钥](#gracefully-rotating-encryption-keys)
- [使用 Encrypter](#using-the-encrypter)

<a name="introduction"></a>
## 简介

Laravel 的加密服务通过 OpenSSL 提供了一套简单便捷的接口，使用 AES-256 和 AES-128 加密算法来加密和解密文本。Laravel 的所有加密值都使用消息认证码（MAC）签名，以保证其底层值在加密后无法被修改或篡改。

<a name="configuration"></a>
## 配置

在使用 Laravel 的 Encrypter 之前，你必须在 `config/app.php` 配置文件中设置 `key` 配置项。该配置值由 `APP_KEY` 环境变量驱动。你应该使用 `php artisan key:generate` 命令生成这个变量的值，因为 `key:generate` 命令会利用 PHP 的安全随机字节生成器为你的应用构建一个密码学安全的密钥。通常在[安装 Laravel](/docs/{{version}}/installation)期间，`APP_KEY` 环境变量的值会自动为你生成。

<a name="gracefully-rotating-encryption-keys"></a>
### 平滑轮换加密密钥

如果你更换了应用的加密密钥，所有已认证的用户会话都会被强制登出。这是因为每一个 Cookie（包括会话 Cookie）都由 Laravel 加密。此外，用旧加密密钥加密过的数据将再也无法解密。

为了缓解这个问题，Laravel 允许你通过应用的 `APP_PREVIOUS_KEYS` 环境变量列出之前使用过的加密密钥。该变量可以包含一个以逗号分隔的旧加密密钥列表：

```ini
APP_KEY="base64:J63qRTDLub5NuZvP+kb8YIorGS6qFYHKVo6u7179stY="
APP_PREVIOUS_KEYS="base64:2nLsGFGzyoae2ax3EF2Lyq/hH6QghBGLIq5uL+Gp8/w="
```

设置该环境变量后，Laravel 在加密值时始终使用"当前"加密密钥。而在解密值时，Laravel 会先尝试当前密钥；如果使用当前密钥解密失败，Laravel 会依次尝试所有旧密钥，直到某个密钥能够成功解密该值。

这种平滑解密方式使用户即使遇到加密密钥轮换，也能不中断地继续使用你的应用。

<a name="using-the-encrypter"></a>
## 使用 Encrypter

<a name="encrypting-a-value"></a>
#### 加密一个值

你可以使用 `Crypt` Facade 提供的 `encryptString` 方法加密一个值。所有加密值都使用 OpenSSL 和 AES-256-CBC 密码进行加密。此外，所有加密值都会用消息认证码（MAC）签名。集成其中的消息认证码可以阻止任何被恶意用户篡改过的值被解密：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class DigitalOceanTokenController extends Controller
{
    /**
     * 为用户保存一个 DigitalOcean API 令牌。
     */
    public function store(Request $request): RedirectResponse
    {
        $request->user()->fill([
            'token' => Crypt::encryptString($request->token),
        ])->save();

        return redirect('/secrets');
    }
}
```

<a name="decrypting-a-value"></a>
#### 解密一个值

你可以使用 `Crypt` Facade 提供的 `decryptString` 方法解密值。如果值无法被正确解密（例如消息认证码无效），系统会抛出 `Illuminate\Contracts\Encryption\DecryptException`：

```php
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

try {
    $decrypted = Crypt::decryptString($encryptedValue);
} catch (DecryptException $e) {
    // ...
}
```