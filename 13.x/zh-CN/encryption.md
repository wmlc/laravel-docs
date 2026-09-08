# 加密

## 简介

Laravel 的加密服务提供了一个简单、便捷的接口，用于通过 OpenSSL 使用 AES-256 和 AES-128 加密算法对文本进行加密和解密。Laravel 的所有加密值都使用消息认证码（MAC）进行签名，因此一旦加密，其底层值就无法被修改或篡改。

## 配置

在使用 Laravel 的加密器之前，你必须在 `config/app.php` 配置文件中设置 `key` 配置项。该配置值由 `APP_KEY` 环境变量驱动。你应该使用 `php artisan key:generate` 命令来生成该变量的值，因为 `key:generate` 命令会使用 PHP 的安全随机字节生成器，为你的应用生成一个密码学安全的密钥。通常情况下，`APP_KEY` 环境变量的值会在 [Laravel 安装](/topic/Laravel%2013.x/2wy3lj3ykm.html) 过程中自动为你生成。

### 优雅地轮换加密密钥

如果你更改了应用的加密密钥，所有已认证的用户会话都会从应用中登出。这是因为包括会话 Cookie 在内的每个 Cookie 都是由 Laravel 加密的。此外，使用旧加密密钥加密的任何数据都将无法再被解密。

为了缓解这个问题，Laravel 允许你在应用的 `APP_PREVIOUS_KEYS` 环境变量中列出你之前使用的加密密钥。该变量可以包含一个由逗号分隔的所有旧加密密钥列表：

```ini
APP_KEY="base64:J63qRTDLub5NuZvP+kb8YIorGS6qFYHKVo6u7179stY="
APP_PREVIOUS_KEYS="base64:2nLsGFGzyoae2ax3EF2Lyq/hH6QghBGLIq5uL+Gp8/w="
```

当你设置该环境变量后，Laravel 在加密值时会始终使用"当前"加密密钥。但在解密值时，Laravel 会先尝试当前密钥，如果使用当前密钥解密失败，Laravel 会依次尝试所有旧密钥，直到其中一个密钥能够解密该值。

这种优雅解密的方式，使得即使在轮换加密密钥的情况下，用户也能不受干扰地继续使用你的应用。

## 使用加密器

#### 加密一个值

你可以使用 `Crypt` facade 提供的 `encryptString` 方法来加密一个值。所有加密值都使用 OpenSSL 和 AES-256-CBC 密码算法进行加密。此外，所有加密值都会使用消息认证码（MAC）进行签名。集成的消息认证码能够防止解密任何被恶意用户篡改过的值：

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class DigitalOceanTokenController extends Controller
{
    /**
     * 为用户存储一个 DigitalOcean API 令牌。
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

#### 解密一个值

你可以使用 `Crypt` facade 提供的 `decryptString` 方法来解密值。如果该值无法被正确解密（例如消息认证码无效），将会抛出 `Illuminate\Contracts\Encryption\DecryptException` 异常：

```php
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

try {
    $decrypted = Crypt::decryptString($encryptedValue);
} catch (DecryptException $e) {
    // ...
}
```
