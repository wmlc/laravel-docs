# 事件广播

- [简介](#introduction)
- [快速入门](#quickstart)
- [服务端安装](#server-side-installation)
    - [Reverb](#reverb)
    - [Pusher Channels](#pusher-channels)
    - [Ably](#ably)
- [客户端安装](#client-side-installation)
    - [Reverb](#client-reverb)
    - [Pusher Channels](#client-pusher-channels)
    - [Ably](#client-ably)
- [概念概述](#concept-overview)
    - [示例应用](#using-example-application)
- [定义广播事件](#defining-broadcast-events)
    - [广播名称](#broadcast-name)
    - [广播数据](#broadcast-data)
    - [广播队列](#broadcast-queue)
    - [广播条件](#broadcast-conditions)
    - [广播与数据库事务](#broadcasting-and-database-transactions)
- [频道授权](#authorizing-channels)
    - [定义授权回调](#defining-authorization-callbacks)
    - [定义频道类](#defining-channel-classes)
- [广播事件](#broadcasting-events)
    - [仅向他人广播](#only-to-others)
    - [自定义连接](#customizing-the-connection)
    - [匿名事件](#anonymous-events)
    - [广播救援](#rescuing-broadcasts)
- [接收广播](#receiving-broadcasts)
    - [监听事件](#listening-for-events)
    - [离开频道](#leaving-a-channel)
    - [命名空间](#namespaces)
    - [使用 React 或 Vue](#using-react-or-vue)
- [Presence 频道](#presence-channels)
    - [为 Presence 频道授权](#authorizing-presence-channels)
    - [加入 Presence 频道](#joining-presence-channels)
    - [向 Presence 频道广播](#broadcasting-to-presence-channels)
- [模型广播](#model-broadcasting)
    - [模型广播约定](#model-broadcasting-conventions)
    - [监听模型广播](#listening-for-model-broadcasts)
- [客户端事件](#client-events)
- [通知](#notifications)

<a name="introduction"></a>
## 简介

在许多现代 Web 应用中，WebSocket 被用来实现实时的动态更新界面。当服务器上的某些数据被更新时，通常会通过 WebSocket 连接发送一条消息，由客户端进行处理。与不断轮询应用程序服务器来获取应反映到 UI 中的数据变更相比，WebSocket 提供了一种更高效的替代方案。

例如，假设你的应用程序能够将用户数据导出为 CSV 文件并通过电子邮件发送给用户。不过，创建该 CSV 文件需要几分钟时间，因此你选择在[队列作业](/docs/{{version}}/queues)中创建并邮寄该 CSV。当 CSV 创建完成并邮寄给用户后，我们可以使用事件广播来分发一个 `App\Events\UserDataExported` 事件，由应用程序的 JavaScript 接收。收到该事件后，我们就可以向用户显示一条消息，告知 CSV 已通过电子邮件发送，用户完全无需刷新页面。

为了帮助你构建这类功能，Laravel 让你能够轻松地通过 WebSocket 连接「广播」服务端的 Laravel [事件](/docs/{{version}}/events)。广播 Laravel 事件可以让你在服务端 Laravel 应用与客户端 JavaScript 应用之间共享相同的事件名称和数据。

广播背后的核心概念很简单：客户端在前端连接到命名频道，而 Laravel 应用在后端向这些频道广播事件。这些事件可以包含你希望提供给前端的任何附加数据。

<a name="supported-drivers"></a>
#### 支持的驱动

默认情况下，Laravel 内置三个服务端广播驱动供你选择：[Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com)。

> [!NOTE]
> 在深入事件广播之前，请确保你已阅读 Laravel 关于[事件与监听器](/docs/{{version}}/events)的文档。

<a name="quickstart"></a>
## 快速入门

默认情况下，新的 Laravel 应用程序未启用广播。你可以使用 `install:broadcasting` Artisan 命令启用广播：

```shell
php artisan install:broadcasting
```

`install:broadcasting` 命令会提示你选择要使用的事件广播服务。此外，它还会创建 `config/broadcasting.php` 配置文件和 `routes/channels.php` 文件，你可以在其中注册应用程序的广播授权路由和回调。

Laravel 开箱即用地支持多种广播驱动：[Laravel Reverb](/docs/{{version}}/reverb)、[Pusher Channels](https://pusher.com/channels)、[Ably](https://ably.com)，以及用于本地开发和调试的 `log` 驱动。此外还包含一个 `null` 驱动，允许你在测试期间禁用广播。`config/broadcasting.php` 配置文件中包含了这些驱动的配置示例。

应用程序的所有事件广播配置都存储在 `config/broadcasting.php` 配置文件中。如果你的应用程序中没有这个文件也不必担心，运行 `install:broadcasting` Artisan 命令时会自动创建。

<a name="quickstart-next-steps"></a>
#### 后续步骤

启用事件广播后，你就可以进一步了解[定义广播事件](#defining-broadcast-events)和[监听事件](#listening-for-events)了。如果你使用的是 Laravel 的 React 或 Vue [入门套件](/docs/{{version}}/starter-kits)，可以使用 Echo 的 [useEcho 钩子](#using-react-or-vue)来监听事件。

> [!NOTE]
> 在广播任何事件之前，你应先配置并运行一个[队列工作进程](/docs/{{version}}/queues)。所有事件广播都通过队列作业完成，这样应用程序的响应时间就不会因事件广播而受到严重影响。

<a name="server-side-installation"></a>
## 服务端安装

要开始使用 Laravel 的事件广播，我们需要在 Laravel 应用中进行一些配置，并安装几个包。

事件广播由服务端广播驱动完成，它广播你的 Laravel 事件，让 Laravel Echo（一个 JavaScript 库）能够在浏览器客户端接收这些事件。别担心，我们会逐步讲解安装过程的每个部分。

<a name="reverb"></a>
### Reverb

要在使用 Reverb 作为事件广播器的同时快速启用 Laravel 的广播功能，请使用带 `--reverb` 选项的 `install:broadcasting` Artisan 命令。该 Artisan 命令会安装 Reverb 所需的 Composer 和 NPM 包，并使用适当的变量更新应用程序的 `.env` 文件：

```shell
php artisan install:broadcasting --reverb
```

<a name="reverb-manual-installation"></a>
#### 手动安装

运行 `install:broadcasting` 命令时，系统会提示你安装 [Laravel Reverb](/docs/{{version}}/reverb)。当然，你也可以使用 Composer 包管理器手动安装 Reverb：

```shell
composer require laravel/reverb
```

安装该包后，你可以运行 Reverb 的安装命令来发布配置、添加 Reverb 所需的环境变量，并在应用程序中启用事件广播：

```shell
php artisan reverb:install
```

你可以在 [Reverb 文档](/docs/{{version}}/reverb)中找到详细的 Reverb 安装和使用说明。

<a name="pusher-channels"></a>
### Pusher Channels

要在使用 Pusher 作为事件广播器的同时快速启用 Laravel 的广播功能，请使用带 `--pusher` 选项的 `install:broadcasting` Artisan 命令。该 Artisan 命令会提示你输入 Pusher 凭证，安装 Pusher 的 PHP 和 JavaScript SDK，并使用适当的变量更新应用程序的 `.env` 文件：

```shell
php artisan install:broadcasting --pusher
```

<a name="pusher-manual-installation"></a>
#### 手动安装

要手动安装 Pusher 支持，你应当使用 Composer 包管理器安装 Pusher Channels PHP SDK：

```shell
composer require pusher/pusher-php-server
```

接下来，你应当在 `config/broadcasting.php` 配置文件中配置 Pusher Channels 凭证。该文件中已包含 Pusher Channels 的配置示例，让你能够快速指定密钥、密钥串和应用 ID。通常，你应当在应用程序的 `.env` 文件中配置 Pusher Channels 凭证：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"
```

`config/broadcasting.php` 文件的 `pusher` 配置还允许你指定 Channels 支持的其他 `options`，例如集群（cluster）。

然后，在应用程序的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `pusher`：

```ini
BROADCAST_CONNECTION=pusher
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation) 了，它将在客户端接收广播事件。

<a name="ably"></a>
### Ably

> [!NOTE]
> 下面的文档讨论如何在「Pusher 兼容」模式下使用 Ably。不过，Ably 团队推荐并维护着一套能够充分利用 Ably 独特能力的广播器和 Echo 客户端。要了解使用 Ably 维护的驱动的更多信息，请[查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

要在使用 [Ably](https://ably.com) 作为事件广播器的同时快速启用 Laravel 的广播功能，请使用带 `--ably` 选项的 `install:broadcasting` Artisan 命令。该 Artisan 命令会提示你输入 Ably 凭证，安装 Ably 的 PHP 和 JavaScript SDK，并使用适当的变量更新应用程序的 `.env` 文件：

```shell
php artisan install:broadcasting --ably
```

**在继续之前，你应当在 Ably 应用设置中启用 Pusher 协议支持。可以在 Ably 应用设置面板的「Protocol Adapter Settings」部分启用该功能。**

<a name="ably-manual-installation"></a>
#### 手动安装

要手动安装 Ably 支持，你应当使用 Composer 包管理器安装 Ably PHP SDK：

```shell
composer require ably/ably-php
```

接下来，你应当在 `config/broadcasting.php` 配置文件中配置 Ably 凭证。该文件中已包含 Ably 的配置示例，让你能够快速指定密钥。通常，该值应通过 `ABLY_KEY` [环境变量](/docs/{{version}}/configuration#environment-configuration)设置：

```ini
ABLY_KEY=your-ably-key
```

然后，在应用程序的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `ably`：

```ini
BROADCAST_CONNECTION=ably
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation) 了，它将在客户端接收广播事件。

<a name="client-side-installation"></a>
## 客户端安装

<a name="client-reverb"></a>
### Reverb

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让订阅频道和监听服务端广播驱动广播的事件变得毫不费力。

通过 `install:broadcasting` Artisan 命令安装 Laravel Reverb 时，Reverb 和 Echo 的脚手架与配置会被自动注入到你的应用程序中。不过，如果你想手动配置 Laravel Echo，可以按照下面的说明操作。

<a name="reverb-client-manual-installation"></a>
#### 手动安装

要为应用程序的前端手动配置 Laravel Echo，首先安装 `pusher-js` 包，因为 Reverb 使用 Pusher 协议进行 WebSocket 订阅、频道和消息通信：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装好 Echo 后，你就可以在应用程序的 JavaScript 中创建一个新的 Echo 实例了。Laravel 框架自带的 `resources/js/bootstrap.js` 文件末尾是完成这项工作的绝佳位置：

```js tab=JavaScript
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
});
```

```js tab=React
import { configureEcho } from "@laravel/echo-react";

configureEcho({
    broadcaster: "reverb",
    // key: import.meta.env.VITE_REVERB_APP_KEY,
    // wsHost: import.meta.env.VITE_REVERB_HOST,
    // wsPort: import.meta.env.VITE_REVERB_PORT,
    // wssPort: import.meta.env.VITE_REVERB_PORT,
    // forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    // enabledTransports: ['ws', 'wss'],
});
```

```js tab=Vue
import { configureEcho } from "@laravel/echo-vue";

configureEcho({
    broadcaster: "reverb",
    // key: import.meta.env.VITE_REVERB_APP_KEY,
    // wsHost: import.meta.env.VITE_REVERB_HOST,
    // wsPort: import.meta.env.VITE_REVERB_PORT,
    // wssPort: import.meta.env.VITE_REVERB_PORT,
    // forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    // enabledTransports: ['ws', 'wss'],
});
```

接下来，你应当编译应用程序的资源：

```shell
npm run build
```

> [!WARNING]
> Laravel Echo 的 `reverb` 广播器要求 laravel-echo v1.16.0 及以上版本。

<a name="client-pusher-channels"></a>
### Pusher Channels

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让订阅频道和监听服务端广播驱动广播的事件变得毫不费力。

通过 `install:broadcasting --pusher` Artisan 命令安装广播支持时，Pusher 和 Echo 的脚手架与配置会被自动注入到你的应用程序中。不过，如果你想手动配置 Laravel Echo，可以按照下面的说明操作。

<a name="pusher-client-manual-installation"></a>
#### 手动安装

要为应用程序的前端手动配置 Laravel Echo，首先安装使用 Pusher 协议进行 WebSocket 订阅、频道和消息通信的 `laravel-echo` 和 `pusher-js` 包：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装好 Echo 后，你就可以在应用程序的 `resources/js/bootstrap.js` 文件中创建一个新的 Echo 实例：

```js tab=JavaScript
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true
});
```

```js tab=React
import { configureEcho } from "@laravel/echo-react";

configureEcho({
    broadcaster: "pusher",
    // key: import.meta.env.VITE_PUSHER_APP_KEY,
    // cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    // forceTLS: true,
    // wsHost: import.meta.env.VITE_PUSHER_HOST,
    // wsPort: import.meta.env.VITE_PUSHER_PORT,
    // wssPort: import.meta.env.VITE_PUSHER_PORT,
    // enabledTransports: ["ws", "wss"],
});
```

```js tab=Vue
import { configureEcho } from "@laravel/echo-vue";

configureEcho({
    broadcaster: "pusher",
    // key: import.meta.env.VITE_PUSHER_APP_KEY,
    // cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    // forceTLS: true,
    // wsHost: import.meta.env.VITE_PUSHER_HOST,
    // wsPort: import.meta.env.VITE_PUSHER_PORT,
    // wssPort: import.meta.env.VITE_PUSHER_PORT,
    // enabledTransports: ["ws", "wss"],
});
```

接下来，你应当在应用程序的 `.env` 文件中为 Pusher 环境变量定义适当的值。如果这些变量尚未存在于 `.env` 文件中，你应当添加它们：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"

VITE_APP_NAME="${APP_NAME}"
VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="${PUSHER_HOST}"
VITE_PUSHER_PORT="${PUSHER_PORT}"
VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
```

根据应用程序的需要调整好 Echo 配置后，你就可以编译应用程序的资源了：

```shell
npm run build
```

> [!NOTE]
> 要了解有关编译应用程序 JavaScript 资源的更多信息，请查阅 [Vite](/docs/{{version}}/vite) 相关文档。

<a name="using-an-existing-client-instance"></a>
#### 使用现有客户端实例

如果你已有一个配置好的 Pusher Channels 客户端实例，并希望 Echo 使用它，可以通过 `client` 配置选项将其传递给 Echo：

```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const options = {
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY
}

window.Echo = new Echo({
    ...options,
    client: new Pusher(options.key, options)
});
```

<a name="client-ably"></a>
### Ably

> [!NOTE]
> 下面的文档讨论如何在「Pusher 兼容」模式下使用 Ably。不过，Ably 团队推荐并维护着一套能够充分利用 Ably 独特能力的广播器和 Echo 客户端。要了解使用 Ably 维护的驱动的更多信息，请[查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让订阅频道和监听服务端广播驱动广播的事件变得毫不费力。

通过 `install:broadcasting --ably` Artisan 命令安装广播支持时，Ably 和 Echo 的脚手架与配置会被自动注入到你的应用程序中。不过，如果你想手动配置 Laravel Echo，可以按照下面的说明操作。

<a name="ably-client-manual-installation"></a>
#### 手动安装

要为应用程序的前端手动配置 Laravel Echo，首先安装使用 Pusher 协议进行 WebSocket 订阅、频道和消息通信的 `laravel-echo` 和 `pusher-js` 包：

```shell
npm install --save-dev laravel-echo pusher-js
```

**在继续之前，你应当在 Ably 应用设置中启用 Pusher 协议支持。可以在 Ably 应用设置面板的「Protocol Adapter Settings」部分启用该功能。**

安装好 Echo 后，你就可以在应用程序的 `resources/js/bootstrap.js` 文件中创建一个新的 Echo 实例：

```js tab=JavaScript
import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    wsHost: 'realtime-pusher.ably.io',
    wsPort: 443,
    disableStats: true,
    encrypted: true,
});
```

```js tab=React
import { configureEcho } from "@laravel/echo-react";

configureEcho({
    broadcaster: "ably",
    // key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    // wsHost: "realtime-pusher.ably.io",
    // wsPort: 443,
    // disableStats: true,
    // encrypted: true,
});
```

```js tab=Vue
import { configureEcho } from "@laravel/echo-vue";

configureEcho({
    broadcaster: "ably",
    // key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    // wsHost: "realtime-pusher.ably.io",
    // wsPort: 443,
    // disableStats: true,
    // encrypted: true,
});
```

你可能已经注意到，我们的 Ably Echo 配置引用了 `VITE_ABLY_PUBLIC_KEY` 环境变量。该变量的值应为你的 Ably 公钥。公钥是 Ably 密钥中 `:` 字符之前的部分。

根据你的需要调整好 Echo 配置后，你就可以编译应用程序的资源了：

```shell
npm run dev
```

> [!NOTE]
> 要了解有关编译应用程序 JavaScript 资源的更多信息，请查阅 [Vite](/docs/{{version}}/vite) 相关文档。

<a name="concept-overview"></a>
## 概念概述

Laravel 的事件广播允许你采用基于驱动的方式处理 WebSocket，将服务端的 Laravel 事件广播到客户端的 JavaScript 应用。目前，Laravel 内置了 [Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com) 驱动。使用 [Laravel Echo](#client-side-installation) JavaScript 包，可以在客户端轻松消费这些事件。

事件通过「频道」进行广播，频道可以指定为公共或私有。应用程序的任何访问者都可以订阅公共频道，无需任何认证或授权；但要订阅私有频道，用户必须通过认证并被授权监听该频道。

<a name="using-example-application"></a>
### 示例应用

在深入事件广播的各个组件之前，我们先以一个电商商店为例，从宏观层面做一个概览。

在我们的应用程序中，假设有一个页面允许用户查看其订单的物流状态。再假设当应用程序处理物流状态更新时，会触发一个 `OrderShipmentStatusUpdated` 事件：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="the-shouldbroadcast-interface"></a>
#### `ShouldBroadcast` 接口

当用户查看自己的某个订单时，我们不希望他们必须刷新页面才能看到状态更新。相反，我们希望在状态更新产生时就将其广播给应用程序。因此，我们需要为 `OrderShipmentStatusUpdated` 事件标记 `ShouldBroadcast` 接口。这会指示 Laravel 在该事件触发时对其进行广播：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OrderShipmentStatusUpdated implements ShouldBroadcast
{
    /**
     * 订单实例。
     *
     * @var \App\Models\Order
     */
    public $order;
}
```

`ShouldBroadcast` 接口要求我们的事件定义一个 `broadcastOn` 方法。该方法负责返回事件应广播到的频道。生成的事件类中已经定义了该方法的空存根，因此我们只需填入细节即可。我们只希望订单的创建者能够查看状态更新，因此我们将事件广播到与该订单绑定的私有频道上：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取事件应广播到的频道。
 */
public function broadcastOn(): Channel
{
    return new PrivateChannel('orders.'.$this->order->id);
}
```

如果你希望事件广播到多个频道，可以改为返回一个 `array`：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取事件应广播到的频道。
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(): array
{
    return [
        new PrivateChannel('orders.'.$this->order->id),
        // ...
    ];
}
```

<a name="example-application-authorizing-channels"></a>
#### 频道授权

请记住，用户必须经过授权才能监听私有频道。我们可以在应用程序的 `routes/channels.php` 文件中定义频道授权规则。在这个示例中，我们需要验证任何尝试监听私有 `orders.1` 频道的用户确实是该订单的创建者：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道名称，以及一个返回 `true` 或 `false` 的回调，用于指明用户是否被授权监听该频道。

所有授权回调都以当前已认证的用户作为第一个参数，任何额外的通配符参数作为后续参数。在这个示例中，我们使用 `{orderId}` 占位符来指明频道名称中的「ID」部分是一个通配符。

<a name="listening-for-event-broadcasts"></a>
#### 监听事件广播

接下来，剩下的就是在 JavaScript 应用中监听该事件了。我们可以使用 [Laravel Echo](#client-side-installation) 来完成。Laravel Echo 内置的 React 和 Vue 钩子让上手变得非常简单，并且默认情况下，事件的所有公共属性都会包含在广播事件中：

```js tab=React
import { useEcho } from "@laravel/echo-react";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

<a name="defining-broadcast-events"></a>
## 定义广播事件

要告知 Laravel 某个给定事件应被广播，你必须在事件类上实现 `Illuminate\Contracts\Broadcasting\ShouldBroadcast` 接口。该接口已导入到框架生成的所有事件类中，因此你可以轻松地将其添加到任何事件上。

`ShouldBroadcast` 接口要求你实现一个方法：`broadcastOn`。`broadcastOn` 方法应返回事件应广播到的一个频道或频道数组。频道应是 `Channel`、`PrivateChannel` 或 `PresenceChannel` 的实例。`Channel` 实例表示任何用户都可以订阅的公共频道，而 `PrivateChannel` 和 `PresenceChannel` 实例表示需要[频道授权](#authorizing-channels)的私有频道：

```php
<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ServerCreated implements ShouldBroadcast
{
    use SerializesModels;

    /**
     * 创建新的事件实例。
     */
    public function __construct(
        public User $user,
    ) {}

    /**
     * 获取事件应广播到的频道。
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.'.$this->user->id),
        ];
    }
}
```

实现 `ShouldBroadcast` 接口后，你只需像平常一样[触发事件](/docs/{{version}}/events)即可。事件触发后，一个[队列作业](/docs/{{version}}/queues)会自动使用你指定的广播驱动广播该事件。

<a name="broadcast-name"></a>
### 广播名称

默认情况下，Laravel 会使用事件的类名来广播事件。不过，你可以通过在事件上定义 `broadcastAs` 方法来自定义广播名称：

```php
/**
 * 事件的广播名称。
 */
public function broadcastAs(): string
{
    return 'server.created';
}
```

如果你使用 `broadcastAs` 方法自定义了广播名称，请确保注册监听器时在名称前加上 `.` 字符。这会指示 Echo 不要在事件名前加上应用程序的命名空间：

```javascript
.listen('.server.created', function (e) {
    // ...
});
```

<a name="broadcast-data"></a>
### 广播数据

事件被广播时，其所有 `public` 属性都会被自动序列化并作为事件的负载广播出去，让你能够在 JavaScript 应用中访问其中的任何公共数据。例如，假设你的事件有一个包含 Eloquent 模型的公共 `$user` 属性，那么事件的广播负载将是：

```json
{
    "user": {
        "id": 1,
        "name": "Patrick Stewart"
        ...
    }
}
```

不过，如果你希望对广播负载进行更细粒度的控制，可以在事件上添加 `broadcastWith` 方法。该方法应返回你希望作为事件负载广播的数据数组：

```php
/**
 * 获取要广播的数据。
 *
 * @return array<string, mixed>
 */
public function broadcastWith(): array
{
    return ['id' => $this->user->id];
}
```

<a name="broadcast-queue"></a>
### 广播队列

默认情况下，每个广播事件都会被放入 `queue.php` 配置文件中指定的默认队列连接的默认队列。你可以通过在事件类上定义 `connection` 和 `queue` 属性，来自定义广播器使用的队列连接和名称：

```php
/**
 * 广播事件时使用的队列连接名称。
 *
 * @var string
 */
public $connection = 'redis';

/**
 * 广播作业应放置到的队列名称。
 *
 * @var string
 */
public $queue = 'default';
```

或者，你也可以通过在事件上定义 `broadcastQueue` 方法来自定义队列名称：

```php
/**
 * 广播作业应放置到的队列名称。
 */
public function broadcastQueue(): string
{
    return 'default';
}
```

如果你想使用 `sync` 队列而非默认队列驱动来广播事件，可以实现 `ShouldBroadcastNow` 接口来代替 `ShouldBroadcast`：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class OrderShipmentStatusUpdated implements ShouldBroadcastNow
{
    // ...
}
```

<a name="broadcast-conditions"></a>
### 广播条件

有时，你可能希望只在给定条件为真时才广播事件。你可以通过在事件类上添加 `broadcastWhen` 方法来定义这些条件：

```php
/**
 * 判断该事件是否应广播。
 */
public function broadcastWhen(): bool
{
    return $this->order->value > 100;
}
```

<a name="broadcasting-and-database-transactions"></a>
#### 广播与数据库事务

当广播事件在数据库事务中被分发时，队列可能会在数据库事务提交之前就处理它们。一旦发生这种情况，你在数据库事务期间对模型或数据库记录所做的更新可能尚未写入数据库。此外，事务中创建的模型或数据库记录也可能尚不存在于数据库中。如果你的事件依赖这些模型，那么当广播该事件的作业被处理时，就可能出现意外错误。

如果队列连接的 `after_commit` 配置选项为 `false`，你仍然可以通过在事件类上实现 `ShouldDispatchAfterCommit` 接口，来指示特定的广播事件应在所有未完成的数据库事务提交后再分发：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Queue\SerializesModels;

class ServerCreated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use SerializesModels;
}
```

> [!NOTE]
> 要了解更多关于规避这些问题的方法，请查阅[队列作业与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)相关文档。

<a name="authorizing-channels"></a>
## 频道授权

私有频道要求你授权当前已认证的用户确实可以监听该频道。这是通过向 Laravel 应用发起一个携带频道名称的 HTTP 请求来实现的，由应用程序判断用户是否可以监听该频道。使用 [Laravel Echo](#client-side-installation) 时，授权私有频道订阅的 HTTP 请求会自动发起。

安装广播功能后，Laravel 会尝试自动注册 `/broadcasting/auth` 路由来处理授权请求。如果 Laravel 未能自动注册这些路由，你可以在应用程序的 `/bootstrap/app.php` 文件中手动注册：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    channels: __DIR__.'/../routes/channels.php',
    health: '/up',
)
```

<a name="defining-authorization-callbacks"></a>
### 定义授权回调

接下来，我们需要定义真正用来判断当前已认证用户能否监听给定频道的逻辑。这要在 `install:broadcasting` Artisan 命令创建的 `routes/channels.php` 文件中完成。在该文件中，你可以使用 `Broadcast::channel` 方法注册频道授权回调：

```php
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道名称，以及一个返回 `true` 或 `false` 的回调，用于指明用户是否被授权监听该频道。

所有授权回调都以当前已认证的用户作为第一个参数，任何额外的通配符参数作为后续参数。在这个示例中，我们使用 `{orderId}` 占位符来指明频道名称中的「ID」部分是一个通配符。

你可以使用 `channel:list` Artisan 命令查看应用程序的广播授权回调列表：

```shell
php artisan channel:list
```

<a name="authorization-callback-model-binding"></a>
#### 授权回调模型绑定

与 HTTP 路由一样，频道路由也可以利用隐式和显式的[路由模型绑定](/docs/{{version}}/routing#route-model-binding)。例如，你可以请求一个实际的 `Order` 模型实例，而非接收字符串或数字形式的订单 ID：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{order}', function (User $user, Order $order) {
    return $user->id === $order->user_id;
});
```

> [!WARNING]
> 与 HTTP 路由模型绑定不同，频道模型绑定不支持自动的[隐式模型绑定作用域](/docs/{{version}}/routing#implicit-model-binding-scoping)。不过，这很少成为问题，因为大多数频道都可以基于单个模型的唯一主键来划分作用域。

<a name="authorization-callback-authentication"></a>
#### 授权回调认证

私有和 Presence 广播频道通过应用程序的默认认证守卫对当前用户进行认证。如果用户未通过认证，频道授权会自动拒绝，授权回调永远不会执行。不过，如有必要，你可以分配多个自定义守卫来认证传入的请求：

```php
Broadcast::channel('channel', function () {
    // ...
}, ['guards' => ['web', 'admin']]);
```

<a name="defining-channel-classes"></a>
### 定义频道类

如果你的应用程序使用许多不同的频道，`routes/channels.php` 文件可能会变得臃肿。因此，你可以使用频道类来代替闭包授权频道。要生成频道类，请使用 `make:channel` Artisan 命令。该命令会将一个新的频道类放置在 `App/Broadcasting` 目录中。

```shell
php artisan make:channel OrderChannel
```

接下来，在 `routes/channels.php` 文件中注册你的频道：

```php
use App\Broadcasting\OrderChannel;

Broadcast::channel('orders.{order}', OrderChannel::class);
```

最后，你可以将频道的授权逻辑放在频道类的 `join` 方法中。这个 `join` 方法承载的逻辑与你通常放在频道授权闭包中的逻辑相同。你还可以利用频道模型绑定：

```php
<?php

namespace App\Broadcasting;

use App\Models\Order;
use App\Models\User;

class OrderChannel
{
    /**
     * 创建新的频道实例。
     */
    public function __construct() {}

    /**
     * 认证用户对该频道的访问权限。
     */
    public function join(User $user, Order $order): array|bool
    {
        return $user->id === $order->user_id;
    }
}
```

> [!NOTE]
> 与 Laravel 中的许多其他类一样，频道类会被[服务容器](/docs/{{version}}/container)自动解析。因此，你可以在频道类的构造函数中为所需的任何依赖添加类型提示。

<a name="broadcasting-events"></a>
## 广播事件

定义好事件并为其标记 `ShouldBroadcast` 接口后，你只需使用事件的 dispatch 方法触发事件即可。事件分发器会注意到该事件标记了 `ShouldBroadcast` 接口，并将其放入队列以待广播：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="only-to-others"></a>
### 仅向他人广播

在构建使用事件广播的应用程序时，有时你可能需要将事件广播给某个频道的所有订阅者，但当前用户除外。你可以使用 `broadcast` 辅助函数和 `toOthers` 方法来实现：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->toOthers();
```

为了更好地理解何时需要使用 `toOthers` 方法，我们设想一个任务清单应用，用户可以通过输入任务名称来创建新任务。创建任务时，应用程序可能会请求 `/task` URL，该请求会广播任务的创建并返回新任务的 JSON 表示。当 JavaScript 应用收到该端点的响应后，可能会直接将新任务插入其任务列表，就像这样：

```js
axios.post('/task', task)
    .then((response) => {
        this.tasks.push(response.data);
    });
```

不过，请记住我们还广播了任务的创建。如果你的 JavaScript 应用也在监听该事件以向任务列表添加任务，列表中就会出现重复的任务：一个来自端点，一个来自广播。你可以使用 `toOthers` 方法来解决这个问题，指示广播器不要向当前用户广播该事件。

> [!WARNING]
> 你的事件必须使用 `Illuminate\Broadcasting\InteractsWithSockets` Trait 才能调用 `toOthers` 方法。

<a name="only-to-others-configuration"></a>
#### 配置

初始化 Laravel Echo 实例时，系统会为该连接分配一个 socket ID。如果你使用全局 [Axios](https://github.com/axios/axios) 实例从 JavaScript 应用发起 HTTP 请求，socket ID 会自动以 `X-Socket-ID` 头的形式附加到每个外发请求上。之后，当你调用 `toOthers` 方法时，Laravel 会从头中提取 socket ID，并指示广播器不向任何使用该 socket ID 的连接广播。

如果你没有使用全局 Axios 实例，就需要手动配置 JavaScript 应用，使其在所有外发请求中发送 `X-Socket-ID` 头。你可以使用 `Echo.socketId` 方法获取 socket ID：

```js
var socketId = Echo.socketId();
```

<a name="customizing-the-connection"></a>
### 自定义连接

如果你的应用程序与多个广播连接交互，并且希望使用默认广播器以外的广播器来广播事件，可以使用 `via` 方法指定将事件推送到哪个连接：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->via('pusher');
```

或者，你也可以通过在事件的构造函数中调用 `broadcastVia` 方法来指定事件的广播连接。不过，在此之前，你应确保事件类使用了 `InteractsWithBroadcasting` Trait：

```php
<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithBroadcasting;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OrderShipmentStatusUpdated implements ShouldBroadcast
{
    use InteractsWithBroadcasting;

    /**
     * 创建新的事件实例。
     */
    public function __construct()
    {
        $this->broadcastVia('pusher');
    }
}
```

<a name="anonymous-events"></a>
### 匿名事件

有时，你可能希望向应用程序的前端广播一个简单事件，而不必创建专门的事件类。为此，`Broadcast` Facade 允许你广播「匿名事件」：

```php
Broadcast::on('orders.'.$order->id)->send();
```

上面的示例将广播如下事件：

```json
{
    "event": "AnonymousEvent",
    "data": "[]",
    "channel": "orders.1"
}
```

使用 `as` 和 `with` 方法，你可以自定义事件的名称和数据：

```php
Broadcast::on('orders.'.$order->id)
    ->as('OrderPlaced')
    ->with($order)
    ->send();
```

上面的示例将广播如下事件：

```json
{
    "event": "OrderPlaced",
    "data": "{ id: 1, total: 100 }",
    "channel": "orders.1"
}
```

如果要在私有频道或 Presence 频道上广播匿名事件，可以使用 `private` 和 `presence` 方法：

```php
Broadcast::private('orders.'.$order->id)->send();
Broadcast::presence('channels.'.$channel->id)->send();
```

使用 `send` 方法广播匿名事件时，事件会被分发到应用程序的[队列](/docs/{{version}}/queues)进行处理。不过，如果你想立即广播该事件，可以使用 `sendNow` 方法：

```php
Broadcast::on('orders.'.$order->id)->sendNow();
```

要将事件广播给除当前已认证用户之外的所有频道订阅者，可以调用 `toOthers` 方法：

```php
Broadcast::on('orders.'.$order->id)
    ->toOthers()
    ->send();
```

<a name="rescuing-broadcasts"></a>
### 广播救援

当应用程序的队列服务器不可用，或 Laravel 在广播事件时遇到错误，通常会抛出异常并导致最终用户看到应用程序错误。由于事件广播往往只是应用程序核心功能的补充，你可以在事件上实现 `ShouldRescue` 接口，防止这些异常打断用户体验。

实现了 `ShouldRescue` 接口的事件会在广播尝试期间自动使用 Laravel 的 [rescue 辅助函数](/docs/{{version}}/helpers#method-rescue)。该辅助函数会捕获所有异常，将其报告给应用程序的异常处理器进行记录，并允许应用程序继续正常执行，而不会中断用户的工作流：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;

class ServerCreated implements ShouldBroadcast, ShouldRescue
{
    // ...
}
```

<a name="receiving-broadcasts"></a>
## 接收广播

<a name="listening-for-events"></a>
### 监听事件

[安装并实例化 Laravel Echo](#client-side-installation) 之后，你就可以开始监听从 Laravel 应用广播的事件了。首先，使用 `channel` 方法获取频道实例，然后调用 `listen` 方法监听指定事件：

```js
Echo.channel(`orders.${this.order.id}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order.name);
    });
```

如果你想监听私有频道上的事件，请改用 `private` 方法。你可以继续链式调用 `listen` 方法，监听同一频道上的多个事件：

```js
Echo.private(`orders.${this.order.id}`)
    .listen(/* ... */)
    .listen(/* ... */)
    .listen(/* ... */);
```

<a name="stop-listening-for-events"></a>
#### 停止监听事件

如果你想停止监听某个给定事件，但[不离开频道](#leaving-a-channel)，可以使用 `stopListening` 方法：

```js
Echo.private(`orders.${this.order.id}`)
    .stopListening('OrderShipmentStatusUpdated');
```

<a name="leaving-a-channel"></a>
### 离开频道

要离开某个频道，可以在 Echo 实例上调用 `leaveChannel` 方法：

```js
Echo.leaveChannel(`orders.${this.order.id}`);
```

如果你想同时离开某个频道及其关联的私有频道和 Presence 频道，可以调用 `leave` 方法：

```js
Echo.leave(`orders.${this.order.id}`);
```
<a name="namespaces"></a>
### 命名空间

你可能已经注意到，在上面的示例中，我们没有为事件类指定完整的 `App\Events` 命名空间。这是因为 Echo 会自动假定事件位于 `App\Events` 命名空间中。不过，你可以在实例化 Echo 时通过传递 `namespace` 配置选项来配置根命名空间：

```js
window.Echo = new Echo({
    broadcaster: 'pusher',
    // ...
    namespace: 'App.Other.Namespace'
});
```

或者，在使用 Echo 订阅事件时，可以在事件类名前加上 `.` 前缀。这样你就可以始终指定完全限定的类名：

```js
Echo.channel('orders')
    .listen('.Namespace\\Event\\Class', (e) => {
        // ...
    });
```

<a name="using-react-or-vue"></a>
### 使用 React 或 Vue

Laravel Echo 包含 React 和 Vue 钩子，让监听事件变得毫不费力。首先，调用用于监听私有事件的 `useEcho` 钩子。当使用该钩子的组件卸载时，`useEcho` 钩子会自动离开频道：

```js tab=React
import { useEcho } from "@laravel/echo-react";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

你可以通过向 `useEcho` 提供一个事件数组来监听多个事件：

```js
useEcho(
    `orders.${orderId}`,
    ["OrderShipmentStatusUpdated", "OrderShipped"],
    (e) => {
        console.log(e.order);
    },
);
```

你还可以指定广播事件负载数据的结构，从而获得更好的类型安全性和编辑便利性：

```ts
type OrderData = {
    order: {
        id: number;
        user: {
            id: number;
            name: string;
        };
        created_at: string;
    };
};

useEcho<OrderData>(`orders.${orderId}`, "OrderShipmentStatusUpdated", (e) => {
    console.log(e.order.id);
    console.log(e.order.user.id);
});
```

当使用该钩子的组件卸载时，`useEcho` 钩子会自动离开频道；不过，必要时你也可以利用返回的函数，以编程方式手动停止 / 开始监听频道：

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 停止监听但不离开频道...
stopListening();

// 再次开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开某个频道及其关联的私有频道和 Presence 频道...
leave();
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 停止监听但不离开频道...
stopListening();

// 再次开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开某个频道及其关联的私有频道和 Presence 频道...
leave();
</script>
```

<a name="react-vue-connecting-to-public-channels"></a>
#### 连接到公共频道

要连接公共频道，可以使用 `useEchoPublic` 钩子：

```js tab=React
import { useEchoPublic } from "@laravel/echo-react";

useEchoPublic("posts", "PostPublished", (e) => {
    console.log(e.post);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoPublic } from "@laravel/echo-vue";

useEchoPublic("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

<a name="react-vue-connecting-to-presence-channels"></a>
#### 连接到 Presence 频道

要连接 Presence 频道，可以使用 `useEchoPresence` 钩子：

```js tab=React
import { useEchoPresence } from "@laravel/echo-react";

useEchoPresence("posts", "PostPublished", (e) => {
    console.log(e.post);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoPresence } from "@laravel/echo-vue";

useEchoPresence("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

<a name="react-vue-connection-status"></a>
#### 连接状态

你可以使用 `useConnectionStatus` 钩子获取当前 WebSocket 连接状态，它提供响应式的状态，并在连接状态变化时自动更新：

```js tab=React
import { useConnectionStatus } from "@laravel/echo-react";

function ConnectionIndicator() {
    const status = useConnectionStatus();

    return <div>Connection: {status}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useConnectionStatus } from "@laravel/echo-vue";

const status = useConnectionStatus();
</script>

<template>
    <div>Connection: {{ status }}</div>
</template>
```

可能的状态值有：

- `connected` - 已成功连接到 WebSocket 服务器。
- `connecting` - 初始连接尝试正在进行中。
- `reconnecting` - 断开连接后正在尝试重新连接。
- `disconnected` - 未连接且未尝试重新连接。
- `failed` - 连接失败且不会重试。

<a name="presence-channels"></a>
## Presence 频道

Presence 频道建立在私有频道的安全性之上，同时额外提供了感知频道订阅者的能力。这让构建强大的协作式应用功能变得轻松，例如当其他用户正在查看同一页面时通知用户，或列出聊天室的成员。

<a name="authorizing-presence-channels"></a>
### 为 Presence 频道授权

所有 Presence 频道同时也是私有频道；因此，用户必须[获得授权才能访问](#authorizing-channels)。不过，在为 Presence 频道定义授权回调时，如果用户被授权加入频道，你不应返回 `true`，而应返回一个包含该用户数据的数组。

授权回调返回的数据将提供给 JavaScript 应用中的 Presence 频道事件监听器。如果用户未被授权加入该 Presence 频道，则应返回 `false` 或 `null`：

```php
use App\Models\User;

Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
    if ($user->canJoinRoom($roomId)) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
```

<a name="joining-presence-channels"></a>
### 加入 Presence 频道

要加入 Presence 频道，可以使用 Echo 的 `join` 方法。`join` 方法会返回一个 `PresenceChannel` 实现，除了提供 `listen` 方法外，它还允许你订阅 `here`、`joining` 和 `leaving` 事件。

```js
Echo.join(`chat.${roomId}`)
    .here((users) => {
        // ...
    })
    .joining((user) => {
        console.log(user.name);
    })
    .leaving((user) => {
        console.log(user.name);
    })
    .error((error) => {
        console.error(error);
    });
```

`here` 回调会在成功加入频道后立即执行，并接收一个包含当前订阅该频道的所有其他用户信息的数组。`joining` 方法会在新用户加入频道时执行，而 `leaving` 方法会在用户离开频道时执行。`error` 方法会在认证端点返回非 200 的 HTTP 状态码，或解析返回的 JSON 出现问题时执行。

<a name="broadcasting-to-presence-channels"></a>
### 向 Presence 频道广播

Presence 频道可以像公共或私有频道一样接收事件。以聊天室为例，我们可能希望向房间的 Presence 频道广播 `NewMessage` 事件。为此，我们在事件的 `broadcastOn` 方法中返回一个 `PresenceChannel` 实例：

```php
/**
 * 获取事件应广播到的频道。
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(): array
{
    return [
        new PresenceChannel('chat.'.$this->message->room_id),
    ];
}
```

与其他事件一样，你可以使用 `broadcast` 辅助函数和 `toOthers` 方法，将当前用户排除在广播接收者之外：

```php
broadcast(new NewMessage($message));

broadcast(new NewMessage($message))->toOthers();
```

与其他类型的事件一样，你可以使用 Echo 的 `listen` 方法监听发送到 Presence 频道的事件：

```js
Echo.join(`chat.${roomId}`)
    .here(/* ... */)
    .joining(/* ... */)
    .leaving(/* ... */)
    .listen('NewMessage', (e) => {
        // ...
    });
```

<a name="model-broadcasting"></a>
## 模型广播

> [!WARNING]
> 在阅读下面有关模型广播的文档之前，我们建议你先熟悉 Laravel 模型广播服务的总体概念，以及如何手动创建和监听广播事件。

当应用程序的 [Eloquent 模型](/docs/{{version}}/eloquent)被创建、更新或删除时，广播事件是很常见的需求。当然，你可以通过手动[为 Eloquent 模型状态变化定义自定义事件](/docs/{{version}}/eloquent#events)并为这些事件标记 `ShouldBroadcast` 接口来轻松实现。

不过，如果你没有在应用程序中将这些事件用于其他目的，仅为广播它们而创建事件类就很麻烦。为解决这一问题，Laravel 允许你指定某个 Eloquent 模型应自动广播其状态变化。

首先，你的 Eloquent 模型应使用 `Illuminate\Database\Eloquent\BroadcastsEvents` Trait。此外，模型还应定义一个 `broadcastOn` 方法，返回模型事件应广播到的频道数组：

```php
<?php

namespace App\Models;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Database\Eloquent\BroadcastsEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Post extends Model
{
    use BroadcastsEvents, HasFactory;

    /**
     * 获取文章所属的用户。
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 获取模型事件应广播到的频道。
     *
     * @return array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>
     */
    public function broadcastOn(string $event): array
    {
        return [$this, $this->user];
    }
}
```

模型包含该 Trait 并定义好广播频道后，当模型实例被创建、更新、删除、软删除或恢复时，它就会自动开始广播事件。

此外，你可能已经注意到 `broadcastOn` 方法接收一个字符串类型的 `$event` 参数。该参数包含模型上所发生事件的类型，其值为 `created`、`updated`、`deleted`、`trashed` 或 `restored`。通过检查该变量的值，你可以确定对于特定事件，模型应（或不应）广播到哪些频道：

```php
/**
 * 获取模型事件应广播到的频道。
 *
 * @return array<string, array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>>
 */
public function broadcastOn(string $event): array
{
    return match ($event) {
        'deleted' => [],
        default => [$this, $this->user],
    };
}
```

<a name="customizing-model-broadcasting-event-creation"></a>
#### 自定义模型广播事件的创建

有时，你可能希望自定义 Laravel 创建底层模型广播事件的方式。为此，你可以在 Eloquent 模型上定义 `newBroadcastableEvent` 方法。该方法应返回一个 `Illuminate\Database\Eloquent\BroadcastableModelEventOccurred` 实例：

```php
use Illuminate\Database\Eloquent\BroadcastableModelEventOccurred;

/**
 * 为模型创建新的可广播模型事件。
 */
protected function newBroadcastableEvent(string $event): BroadcastableModelEventOccurred
{
    return (new BroadcastableModelEventOccurred(
        $this, $event
    ))->dontBroadcastToCurrentUser();
}
```

<a name="model-broadcasting-conventions"></a>
### 模型广播约定

<a name="model-broadcasting-channel-conventions"></a>
#### 频道约定

你可能已经注意到，上面模型示例中的 `broadcastOn` 方法并没有返回 `Channel` 实例，而是直接返回了 Eloquent 模型。如果模型的 `broadcastOn` 方法返回了一个 Eloquent 模型实例（或该实例包含在返回的数组中），Laravel 会自动为该模型实例化一个私有频道实例，并使用模型的类名和主键标识符作为频道名称。

因此，`id` 为 `1` 的 `App\Models\User` 模型将被转换为一个名为 `App.Models.User.1` 的 `Illuminate\Broadcasting\PrivateChannel` 实例。当然，除了从模型的 `broadcastOn` 方法返回 Eloquent 模型实例外，你还可以返回完整的 `Channel` 实例，从而完全掌控模型的频道名称：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取模型事件应广播到的频道。
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(string $event): array
{
    return [
        new PrivateChannel('user.'.$this->id)
    ];
}
```

如果你计划从模型的 `broadcastOn` 方法显式返回频道实例，可以向频道构造函数传递一个 Eloquent 模型实例。此时，Laravel 会使用上文讨论的模型频道约定，将 Eloquent 模型转换为频道名称字符串：

```php
return [new Channel($this->user)];
```

如果你需要确定某个模型的频道名称，可以在任何模型实例上调用 `broadcastChannel` 方法。例如，对于 `id` 为 `1` 的 `App\Models\User` 模型，该方法返回字符串 `App.Models.User.1`：

```php
$user->broadcastChannel();
```

<a name="model-broadcasting-event-conventions"></a>
#### 事件约定

由于模型广播事件并不与应用程序 `App\Events` 目录中的「实际」事件相关联，因此会按照约定为其分配名称和负载。Laravel 的约定是：使用模型的类名（不含命名空间）加上触发广播的模型事件名称来广播事件。

例如，对 `App\Models\Post` 模型的更新会向客户端应用广播一个名为 `PostUpdated` 的事件，其负载如下：

```json
{
    "model": {
        "id": 1,
        "title": "My first post"
        ...
    },
    ...
    "socket": "someSocketId"
}
```

删除 `App\Models\User` 模型则会广播一个名为 `UserDeleted` 的事件。

如果你愿意，可以通过在模型上添加 `broadcastAs` 和 `broadcastWith` 方法来定义自定义的广播名称和负载。这些方法会接收正在发生的模型事件 / 操作的名称，让你能够为每个模型操作自定义事件的名称和负载。如果 `broadcastAs` 方法返回 `null`，Laravel 将在广播事件时使用上文讨论的模型广播事件名称约定：

```php
/**
 * 模型事件的广播名称。
 */
public function broadcastAs(string $event): string|null
{
    return match ($event) {
        'created' => 'post.created',
        default => null,
    };
}

/**
 * 获取模型要广播的数据。
 *
 * @return array<string, mixed>
 */
public function broadcastWith(string $event): array
{
    return match ($event) {
        'created' => ['title' => $this->title],
        default => ['model' => $this],
    };
}
```

<a name="listening-for-model-broadcasts"></a>
### 监听模型广播

为模型添加 `BroadcastsEvents` Trait 并定义好模型的 `broadcastOn` 方法后，你就可以在客户端应用中开始监听广播的模型事件了。在开始之前，你可能希望先查阅[监听事件](#listening-for-events)的完整文档。

首先，使用 `private` 方法获取频道实例，然后调用 `listen` 方法监听指定事件。通常，传递给 `private` 方法的频道名称应符合 Laravel 的[模型广播约定](#model-broadcasting-conventions)。

获取频道实例后，你可以使用 `listen` 方法监听特定事件。由于模型广播事件并不与应用程序 `App\Events` 目录中的「实际」事件相关联，[事件名称](#model-broadcasting-event-conventions)必须以 `.` 为前缀，以表明它不属于任何特定命名空间。每个模型广播事件都有一个 `model` 属性，包含模型的所有可广播属性：

```js
Echo.private(`App.Models.User.${this.user.id}`)
    .listen('.UserUpdated', (e) => {
        console.log(e.model);
    });
```

<a name="model-broadcasts-with-react-or-vue"></a>
#### 使用 React 或 Vue

如果你在使用 React 或 Vue，可以使用 Laravel Echo 内置的 `useEchoModel` 钩子轻松监听模型广播：

```js tab=React
import { useEchoModel } from "@laravel/echo-react";

useEchoModel("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoModel } from "@laravel/echo-vue";

useEchoModel("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model);
});
</script>
```

你还可以指定模型事件负载数据的结构，从而获得更好的类型安全性和编辑便利性：

```ts
type User = {
    id: number;
    name: string;
    email: string;
};

useEchoModel<User, "App.Models.User">("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model.id);
    console.log(e.model.name);
});
```

<a name="client-events"></a>
## 客户端事件

> [!NOTE]
> 使用 [Pusher Channels](https://pusher.com/channels) 时，你必须在[应用面板](https://dashboard.pusher.com/)的「App Settings」部分启用「Client Events」选项，才能发送客户端事件。

有时，你可能希望向其他已连接的客户端广播事件，而完全不经过 Laravel 应用。这对于「正在输入」这类通知尤其有用：你希望提醒应用的用户，有其他用户正在某个界面上输入消息。

要广播客户端事件，可以使用 Echo 的 `whisper` 方法：

```js tab=JavaScript
Echo.private(`chat.${roomId}`)
    .whisper('typing', {
        name: this.user.name
    });
```

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().whisper('typing', { name: user.name });
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().whisper('typing', { name: user.name });
</script>
```

要监听客户端事件，可以使用 `listenForWhisper` 方法：

```js tab=JavaScript
Echo.private(`chat.${roomId}`)
    .listenForWhisper('typing', (e) => {
        console.log(e.name);
    });
```

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().listenForWhisper('typing', (e) => {
    console.log(e.name);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEcho } from "@laravel/echo-vue";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().listenForWhisper('typing', (e) => {
    console.log(e.name);
});
</script>
```

<a name="notifications"></a>
## 通知

将事件广播与[通知](/docs/{{version}}/notifications)结合使用，你的 JavaScript 应用就能在通知产生时实时接收，而无需刷新页面。在开始之前，请务必阅读有关使用[广播通知频道](/docs/{{version}}/notifications#broadcast-notifications)的文档。

配置好通知使用广播频道后，你就可以使用 Echo 的 `notification` 方法监听广播事件了。请记住，频道名称应与接收通知实体的类名相匹配：

```js tab=JavaScript
Echo.private(`App.Models.User.${userId}`)
    .notification((notification) => {
        console.log(notification.type);
    });
```

```js tab=React
import { useEchoModel } from "@laravel/echo-react";

const { channel } = useEchoModel('App.Models.User', userId);

channel().notification((notification) => {
    console.log(notification.type);
});
```

```vue tab=Vue
<script setup lang="ts">
import { useEchoModel } from "@laravel/echo-vue";

const { channel } = useEchoModel('App.Models.User', userId);

channel().notification((notification) => {
    console.log(notification.type);
});
</script>
```

在这个示例中，所有通过 `broadcast` 频道发送给 `App\Models\User` 实例的通知都会被该回调接收。应用程序的 `routes/channels.php` 文件中已包含 `App.Models.User.{id}` 频道的频道授权回调。

<a name="stop-listening-for-notifications"></a>
#### 停止监听通知

如果你想停止监听通知，但[不离开频道](#leaving-a-channel)，可以使用 `stopListeningForNotification` 方法：

```js
const callback = (notification) => {
    console.log(notification.type);
}

// 开始监听...
Echo.private(`App.Models.User.${userId}`)
    .notification(callback);

// 停止监听（回调必须是同一个）...
Echo.private(`App.Models.User.${userId}`)
    .stopListeningForNotification(callback);
```
