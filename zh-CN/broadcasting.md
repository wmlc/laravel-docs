# 广播

## 简介

在许多现代 Web 应用中，WebSockets 用于实现实时、动态更新的用户界面。当服务端某些数据更新时，通常会通过 WebSocket 连接向客户端发送消息进行处理。相较于持续轮询应用服务端来获取应在 UI 中反映的数据变更，WebSockets 提供了一种更高效的替代方案。

例如，假设应用可以将用户的数据导出为 CSV 文件并通过电子邮件发送给他们。但创建该 CSV 文件需要几分钟，因此选择在[队列任务](/docs/{{version}}/queues)中创建并发送 CSV。当 CSV 创建并发送给用户后，我们可以使用事件广播来分发一个 `App\Events\UserDataExported` 事件，由应用的 JavaScript 接收。一旦接收到该事件，就可以向用户显示一条消息，告知他们的 CSV 已通过电子邮件发送，而无需刷新页面。

为了帮助你构建这类功能，Laravel 让通过 WebSocket 连接「广播」服务端 Laravel [事件](/docs/{{version}}/events)变得轻而易举。广播 Laravel 事件使你能够在服务端 Laravel 应用与客户端 JavaScript 应用之间共享相同的事件名称和数据。

广播背后的核心概念很简单：客户端在前端连接到命名频道，而 Laravel 应用在后端向这些频道广播事件。这些事件可以包含你希望提供给前端的任何附加数据。

#### 支持的驱动

默认情况下，Laravel 包含三种服务端广播驱动供你选择：[Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com)。

> [!NOTE]
> 在深入研究事件广播之前，请确保已阅读 Laravel 的[事件与监听器](/docs/{{version}}/events)文档。

## 快速入门

默认情况下，新 Laravel 应用未启用广播。可以使用 `install:broadcasting` Artisan 命令启用广播：

```shell
php artisan install:broadcasting
```

`install:broadcasting` 命令会提示你选择要使用的事件广播服务。此外，它会创建 `config/broadcasting.php` 配置文件和 `routes/channels.php` 文件，你可以在其中注册应用的广播授权路由和回调。

Laravel 开箱即支持几种广播驱动：[Laravel Reverb](/docs/{{version}}/reverb)、[Pusher Channels](https://pusher.com/channels)、[Ably](https://ably.com) 以及用于本地开发和调试的 `log` 驱动。此外，还包含一个 `null` 驱动，允许你在测试期间禁用广播。`config/broadcasting.php` 配置文件中包含了每个驱动的配置示例。

应用的所有事件广播配置都存储在 `config/broadcasting.php` 配置文件中。如果你的应用中不存在此文件，请不要担心——运行 `install:broadcasting` Artisan 命令时将创建该文件。

#### 后续步骤

启用事件广播后，你就可以了解有关[定义广播事件](#defining-broadcast-events)和[监听事件](#listening-for-events)的更多信息。如果你使用 Laravel 的 React、Vue 或 Svelte [starter kit](/docs/{{version}}/starter-kits)，则可以使用 Echo 的 [useEcho 钩子](#using-react-or-vue)监听事件。

> [!NOTE]
> 在广播任何事件之前，应先配置并运行[队列工作进程](/docs/{{version}}/queues)。所有事件广播都通过队列任务完成，以免应用响应时间受到广播事件的严重影响。

## 服务端安装

要开始使用 Laravel 的事件广播，我们需要在 Laravel 应用中进行一些配置，并安装一些软件包。

事件广播由服务端广播驱动完成，该驱动会广播你的 Laravel 事件，以便 Laravel Echo（一个 JavaScript 库）可以在浏览器客户端接收它们。不用担心——我们将一步步引导你完成安装过程的每个部分。

### Reverb

要在使用 Reverb 作为事件广播器时快速启用对 Laravel 广播功能的支持，请使用 `--reverb` 选项调用 `install:broadcasting` Artisan 命令。该 Artisan 命令将安装 Reverb 所需的 Composer 和 NPM 软件包，并在应用的 `.env` 文件中添加相应的变量：

```shell
php artisan install:broadcasting --reverb
```

#### 手动安装

运行 `install:broadcasting` 命令时，系统会提示你安装 [Laravel Reverb](/docs/{{version}}/reverb)。当然，你也可以使用 Composer 包管理器手动安装 Reverb：

```shell
composer require laravel/reverb
```

安装完软件包后，可以运行 Reverb 的安装命令来发布配置、添加 Reverb 所需的环境变量，并在应用中启用事件广播：

```shell
php artisan reverb:install
```

你可以在 [Reverb 文档](/docs/{{version}}/reverb)中找到详细的 Reverb 安装和使用说明。

### Pusher Channels

要在使用 Pusher 作为事件广播器时快速启用对 Laravel 广播功能的支持，请使用 `--pusher` 选项调用 `install:broadcasting` Artisan 命令。该 Artisan 命令将提示你输入 Pusher 凭据，安装 Pusher PHP 和 JavaScript SDK，并在应用的 `.env` 文件中添加相应的变量：

```shell
php artisan install:broadcasting --pusher
```

#### 手动安装

要手动安装 Pusher 支持，应使用 Composer 包管理器安装 Pusher Channels PHP SDK：

```shell
composer require pusher/pusher-php-server
```

接下来，应在 `config/broadcasting.php` 配置文件中配置 Pusher Channels 凭据。此文件中已包含 Pusher Channels 配置示例，使你能够快速指定密钥、密钥和应用 ID。通常，应在应用的 `.env` 文件中配置 Pusher Channels 凭据：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"
```

`config/broadcasting.php` 文件的 `pusher` 配置还允许你指定 Channels 支持的附加 `options`，例如 cluster。

然后，在应用的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `pusher`：

```ini
BROADCAST_CONNECTION=pusher
```

最后，你已准备好安装和配置 [Laravel Echo](#client-side-installation)，它将在客户端接收广播事件。

### Ably

> [!NOTE]
> 以下文档讨论了如何在「Pusher 兼容」模式下使用 Ably。但是，Ably 团队推荐并维护了一款广播器和 Echo 客户端，能够利用 Ably 提供的独特功能。有关使用 Ably 维护的驱动的更多信息，请[参阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

要在使用 [Ably](https://ably.com) 作为事件广播器时快速启用对 Laravel 广播功能的支持，请使用 `--ably` 选项调用 `install:broadcasting` Artisan 命令。该 Artisan 命令将提示你输入 Ably 凭据，安装 Ably PHP 和 JavaScript SDK，并在应用的 `.env` 文件中添加相应的变量：

```shell
php artisan install:broadcasting --ably
```

**在继续之前，你应在 Ably 应用设置中启用 Pusher 协议支持。可以在 Ably 应用设置仪表板的「Protocol Adapter Settings」部分中启用此功能。**

#### 手动安装

要手动安装 Ably 支持，应使用 Composer 包管理器安装 Ably PHP SDK：

```shell
composer require ably/ably-php
```

接下来，应在 `config/broadcasting.php` 配置文件中配置 Ably 凭据。此文件中已包含 Ably 配置示例，使你能够快速指定你的密钥。通常，应通过 `ABLY_KEY` [环境变量](/docs/{{version}}/configuration#environment-configuration)设置此值：

```ini
ABLY_KEY=your-ably-key
```

然后，在应用的 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `ably`：

```ini
BROADCAST_CONNECTION=ably
```

最后，你已准备好安装和配置 [Laravel Echo](#client-side-installation)，它将在客户端接收广播事件。

## 客户端安装

### Reverb

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，可以轻松地订阅频道并监听服务端广播驱动广播的事件。

通过 `install:broadcasting` Artisan 命令安装 Laravel Reverb 时，Reverb 和 Echo 的脚手架及配置将自动注入到你的应用中。但是，如果你希望手动配置 Laravel Echo，可以按照以下说明进行操作。

#### 手动安装

要为应用的前端手动配置 Laravel Echo，首先安装 `pusher-js` 包，因为 Reverb 使用 Pusher 协议进行 WebSocket 订阅、频道和消息传递：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装 Echo 后，就可以在应用的 JavaScript 中创建一个新的 Echo 实例。理想的位置是在 Laravel 框架附带的 `resources/js/app.js` 文件底部：

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

```js tab=Svelte
import { configureEcho } from "@laravel/echo-svelte";

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

接下来，应编译应用的资源：

```shell
npm run build
```

> [!WARNING]
> Laravel Echo `reverb` 广播器需要 laravel-echo v1.16.0+。

### Pusher Channels

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，可以轻松地订阅频道并监听服务端广播驱动广播的事件。

通过 `install:broadcasting --pusher` Artisan 命令安装广播支持时，Pusher 和 Echo 的脚手架及配置将自动注入到你的应用中。但是，如果你希望手动配置 Laravel Echo，可以按照以下说明进行操作。

#### 手动安装

要为应用的前端手动配置 Laravel Echo，首先安装 `laravel-echo` 和 `pusher-js` 包，这些包使用 Pusher 协议进行 WebSocket 订阅、频道和消息传递：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装 Echo 后，就可以在应用的 `resources/js/app.js` 文件中创建一个新的 Echo 实例：

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

```js tab=Svelte
import { configureEcho } from "@laravel/echo-svelte";

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

接下来，应在应用的 `.env` 文件中为 Pusher 环境变量定义相应的值。如果这些变量在 `.env` 文件中尚不存在，应添加它们：

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

根据应用的需要调整 Echo 配置后，可以编译应用的资源：

```shell
npm run build
```

> [!NOTE]
> 要了解有关编译应用 JavaScript 资源的更多信息，请参阅 [Vite](/docs/{{version}}/vite) 文档。

#### 使用现有客户端实例

如果你已有一个预先配置的 Pusher Channels 客户端实例，希望 Echo 使用它，则可以通过 `client` 配置选项将其传递给 Echo：

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

### Ably

> [!NOTE]
> 以下文档讨论了如何在「Pusher 兼容」模式下使用 Ably。但是，Ably 团队推荐并维护了一款广播器和 Echo 客户端，能够利用 Ably 提供的独特功能。有关使用 Ably 维护的驱动的更多信息，请[参阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，可以轻松地订阅频道并监听服务端广播驱动广播的事件。

通过 `install:broadcasting --ably` Artisan 命令安装广播支持时，Ably 和 Echo 的脚手架及配置将自动注入到你的应用中。但是，如果你希望手动配置 Laravel Echo，可以按照以下说明进行操作。

#### 手动安装

要为应用的前端手动配置 Laravel Echo，首先安装 `laravel-echo` 和 `pusher-js` 包，这些包使用 Pusher 协议进行 WebSocket 订阅、频道和消息传递：

```shell
npm install --save-dev laravel-echo pusher-js
```

**在继续之前，你应在 Ably 应用设置中启用 Pusher 协议支持。可以在 Ably 应用设置仪表板的「Protocol Adapter Settings」部分中启用此功能。**

安装 Echo 后，就可以在应用的 `resources/js/app.js` 文件中创建一个新的 Echo 实例：

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

```js tab=Svelte
import { configureEcho } from "@laravel/echo-svelte";

configureEcho({
    broadcaster: "ably",
    // key: import.meta.env.VITE_ABLY_PUBLIC_KEY,
    // wsHost: "realtime-pusher.ably.io",
    // wsPort: 443,
    // disableStats: true,
    // encrypted: true,
});
```

你可能已经注意到我们的 Ably Echo 配置引用了 `VITE_ABLY_PUBLIC_KEY` 环境变量。该变量的值应为你的 Ably 公钥。公钥是 Ably 密钥中 `:` 字符之前的部分。

根据需要调整 Echo 配置后，可以编译应用的资源：

```shell
npm run dev
```

> [!NOTE]
> 要了解有关编译应用 JavaScript 资源的更多信息，请参阅 [Vite](/docs/{{version}}/vite) 文档。

## 概念概述

Laravel 的事件广播允许你使用基于驱动的方法通过 WebSocket 将服务端 Laravel 事件广播到客户端 JavaScript 应用。目前，Laravel 附带 [Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com) 驱动。可以使用 [Laravel Echo](#client-side-installation) JavaScript 包轻松地在客户端消费事件。

事件通过「频道」广播，频道可以指定为公共或私有。任何访问者都可以订阅公共频道而无需任何身份认证或授权；但是，要订阅私有频道，用户必须经过身份认证并被授权收听该频道。

### 使用示例应用

在深入研究事件广播的每个组件之前，让我们以一个电子商务商店为例进行高层次概述。

在我们的应用中，假设我们有一个允许用户查看其订单发货状态的页面。还假设在应用处理发货状态更新时会触发 `OrderShipmentStatusUpdated` 事件：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

#### `ShouldBroadcast` 接口

当用户查看其订单之一时，我们不希望他们必须刷新页面才能查看状态更新。相反，我们希望在创建状态更新时将其广播给应用。因此，我们需要使用 `ShouldBroadcast` 接口标记 `OrderShipmentStatusUpdated` 事件。这将指示 Laravel 在事件被触发时广播该事件：

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
     * The order instance.
     *
     * @var \App\Models\Order
     */
    public $order;
}
```

`ShouldBroadcast` 接口要求我们的事件定义一个 `broadcastOn` 方法。此方法负责返回事件应广播到的频道。此方法的一个空存根已定义在生成的事件类上，因此我们只需填写其详细信息即可。我们只希望订单的创建者能够查看状态更新，因此我们将在与订单绑定的私有频道上广播该事件：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channel the event should broadcast on.
 */
public function broadcastOn(): Channel
{
    return new PrivateChannel('orders.'.$this->order->id);
}
```

如果希望事件在多个频道上广播，可以改为返回一个 `array`：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channels the event should broadcast on.
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

#### 授权频道

请记住，必须授权用户才能收听私有频道。我们可以在应用的 `routes/channels.php` 文件中定义频道授权规则。在此示例中，我们需要验证任何尝试收听私有 `orders.1` 频道的用户实际上是订单的创建者：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道的名称和一个返回 `true` 或 `false` 的回调，指示用户是否被授权收听该频道。

所有授权回调都将当前 authenticated 用户作为其第一个参数，将任何其他通配符参数作为其后续参数接收。在此示例中，我们使用 `{orderId}` 占位符来指示频道名称的「ID」部分是通配符。

#### 监听事件广播

接下来，剩下的就是在 JavaScript 应用中监听事件。我们可以使用 [Laravel Echo](#client-side-installation) 来执行此操作。Laravel Echo 内置的 React、Vue 和 Svelte 钩子使入门变得简单，并且默认情况下，事件的所有公共属性都将包含在广播事件中：

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

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

## 定义广播事件

要通知 Laravel 应广播给定事件，必须在事件类上实现 `Illuminate\Contracts\Broadcasting\ShouldBroadcast` 接口。该接口已导入到框架生成的所有事件类中，因此可以轻松地将其添加到任何事件。

`ShouldBroadcast` 接口要求你实现一个方法：`broadcastOn`。`broadcastOn` 方法应返回一个频道或事件应广播到的频道数组。频道应为 `Channel`、`PrivateChannel` 或 `PresenceChannel` 的实例。`Channel` 实例表示任何用户都可以订阅的公共频道，而 `PrivateChannel` 和 `PresenceChannel` 表示需要[频道授权](#authorizing-channels)的私有频道：

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
     * Create a new event instance.
     */
    public function __construct(
        public User $user,
    ) {}

    /**
     * Get the channels the event should broadcast on.
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

实现 `ShouldBroadcast` 接口后，只需像往常一样[触发事件](/docs/{{version}}/events)。一旦事件被触发，[队列任务](/docs/{{version}}/queues)将使用你指定的广播驱动自动广播该事件。

### 广播名称

默认情况下，Laravel 将使用事件的类名广播该事件。但是，你可以通过在事件上定义 `broadcastAs` 方法来自定义广播名称：

```php
/**
 * The event's broadcast name.
 */
public function broadcastAs(): string
{
    return 'server.created';
}
```

如果使用 `broadcastAs` 方法自定义广播名称，请确保使用前导 `.` 字符注册监听器。这将指示 Echo 不要将应用的命名空间前缀添加到事件：

```javascript
.listen('.server.created', function (e) {
    // ...
});
```

### 广播数据

广播事件时，其所有 `public` 属性都将自动序列化并作为事件的有效载荷进行广播，使你能够从 JavaScript 应用访问其任何公共数据。因此，例如，如果你的事件有一个包含 Eloquent 模型的公共 `$user` 属性，则事件的广播有效载荷将是：

```json
{
    "user": {
        "id": 1,
        "name": "Patrick Stewart"
        ...
    }
}
```

但是，如果希望对广播有效载荷进行更细粒度的控制，则可以向事件添加 `broadcastWith` 方法。此方法应返回你希望作为事件有效载荷广播的数据数组：

```php
/**
 * Get the data to broadcast.
 *
 * @return array<string, mixed>
 */
public function broadcastWith(): array
{
    return ['id' => $this->user->id];
}
```

### 广播队列

默认情况下，每个广播事件都会放在 `queue.php` 配置文件中指定的默认队列连接的默认队列上。你可以通过在事件类上使用 `Connection` 和 `Queue` 属性来自定义广播器使用的队列连接和名称：

```php
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\Attributes\Queue;

#[Connection('redis')]
#[Queue('default')]
class ServerCreated implements ShouldBroadcast
{
    // ...
}
```

或者，你可以通过在事件上定义 `broadcastQueue` 方法来自定义队列名称：

```php
/**
 * The name of the queue on which to place the broadcasting job.
 */
public function broadcastQueue(): string
{
    return 'default';
}
```

如果希望使用 `sync` 队列而不是默认队列驱动来广播事件，则可以实现 `ShouldBroadcastNow` 接口而不是 `ShouldBroadcast`：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class OrderShipmentStatusUpdated implements ShouldBroadcastNow
{
    // ...
}
```

### 广播条件

有时你希望仅在给定条件为真时才广播事件。你可以通过向事件类添加 `broadcastWhen` 方法来定义这些条件：

```php
/**
 * Determine if this event should broadcast.
 */
public function broadcastWhen(): bool
{
    return $this->order->value > 100;
}
```

#### 广播与数据库事务

在数据库事务中分发广播事件时，它们可能会在数据库事务提交之前由队列处理。发生这种情况时，在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映在数据库中。此外，在事务中创建的任何模型或数据库记录可能不存在于数据库中。如果你的事件依赖于这些模型，则在处理广播事件的任务时可能会发生意外错误。

如果队列连接的 `after_commit` 配置选项设置为 `false`，则仍可以通过在事件类上实现 `ShouldDispatchAfterCommit` 接口来指示应在所有打开的数据库事务提交后再分发特定的广播事件：

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
> 要了解有关解决这些问题的更多信息，请查看有关[队列任务和数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

## 授权频道

私有频道要求你授权当前 authenticated 用户实际上可以收听该频道。这是通过使用频道名称向 Laravel 应用发起 HTTP 请求并允许应用确定用户是否可以收听该频道来完成的。在使用 [Laravel Echo](#client-side-installation) 时，授权私有频道订阅的 HTTP 请求将自动发起。

安装广播后，Laravel 会尝试自动注册 `/broadcasting/auth` 路由来处理授权请求。如果 Laravel 未能自动注册这些路由，则可以在应用的 `/bootstrap/app.php` 文件中手动注册它们：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    channels: __DIR__.'/../routes/channels.php',
    health: '/up',
)
```

### 定义授权回调

接下来，我们需要定义实际确定当前 authenticated 用户是否可以收听给定频道的逻辑。这是在由 `install:broadcasting` Artisan 命令创建的 `routes/channels.php` 文件中完成的。在此文件中，可以使用 `Broadcast::channel` 方法注册频道授权回调：

```php
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道的名称和一个返回 `true` 或 `false` 的回调，指示用户是否被授权收听该频道。

所有授权回调都将当前 authenticated 用户作为其第一个参数，将任何其他通配符参数作为其后续参数接收。在此示例中，我们使用 `{orderId}` 占位符来指示频道名称的「ID」部分是通配符。

可以使用 `channel:list` Artisan 命令查看应用的广播授权回调列表：

```shell
php artisan channel:list
```

#### 授权回调模型绑定

与 HTTP 路由一样，频道路由也可以利用隐式和显式[路由模型绑定](/docs/{{version}}/routing#route-model-binding)。例如，可以请求实际的 `Order` 模型实例，而不是接收字符串或数字订单 ID：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{order}', function (User $user, Order $order) {
    return $user->id === $order->user_id;
});
```

> [!WARNING]
> 与 HTTP 路由模型绑定不同，频道模型绑定不支持自动[隐式模型绑定作用域](/docs/{{version}}/routing#implicit-model-binding-scoping)。但是，这很少是问题，因为大多数频道可以根据单个模型的唯一主键进行作用域限定。

#### 授权回调身份认证

私有和状态广播频道通过应用的默认身份认证 guard 来对当前用户进行身份认证。如果用户未经过身份认证，则频道授权将自动被拒绝，并且永远不会执行授权回调。但是，你可以根据需要分配应对传入请求进行身份认证的多个自定义 guard：

```php
Broadcast::channel('channel', function () {
    // ...
}, ['guards' => ['web', 'admin']]);
```

### 定义频道类

如果你的应用使用了许多不同的频道，那么 `routes/channels.php` 文件可能会变得臃肿。因此，可以使用频道类代替闭包来授权频道。要生成频道类，请使用 `make:channel` Artisan 命令。此命令会将新的频道类放入 `App/Broadcasting` 目录中。

```shell
php artisan make:channel OrderChannel
```

接下来，在 `routes/channels.php` 文件中注册你的频道：

```php
use App\Broadcasting\OrderChannel;

Broadcast::channel('orders.{order}', OrderChannel::class);
```

最后，你可以将频道的授权逻辑放入频道类的 `join` 方法中。此 `join` 方法将包含你通常放在频道授权闭包中的相同逻辑。你还可以利用频道模型绑定：

```php
<?php

namespace App\Broadcasting;

use App\Models\Order;
use App\Models\User;

class OrderChannel
{
    /**
     * Create a new channel instance.
     */
    public function __construct() {}

    /**
     * Authenticate the user's access to the channel.
     */
    public function join(User $user, Order $order): array|bool
    {
        return $user->id === $order->user_id;
    }
}
```

> [!NOTE]
> 与 Laravel 中的许多其他类一样，频道类将自动由[服务容器](/docs/{{version}}/container)解析。因此，你可以在频道类的构造函数中对频道所需的任何依赖项进行类型提示。

## 广播事件

定义事件并使用 `ShouldBroadcast` 接口标记它后，只需使用事件的 dispatch 方法触发事件即可。事件调度器将注意到该事件标记有 `ShouldBroadcast` 接口，并将该事件加入队列以进行广播：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

### 仅广播给其他用户

在构建使用事件广播的应用时，你可能偶尔需要将事件广播到给定频道的所有订阅者，但当前用户除外。可以使用 `broadcast` 辅助函数和 `toOthers` 方法来完成此操作：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->toOthers();
```

为了更好地理解何时可能要使用 `toOthers` 方法，让我们想象一个任务列表应用，其中用户可以通过输入任务名称来创建新任务。要创建任务，应用可能向 `/task` URL 发起请求，该请求会广播任务的创建并返回新任务的 JSON 表示。当你的 JavaScript 应用收到端点的响应时，它可能直接将新任务插入其任务列表，如下所示：

```js
axios.post('/task', task)
    .then((response) => {
        this.tasks.push(response.data);
    });
```

但是，请记住，我们也会广播任务的创建。如果你的 JavaScript 应用也在监听此事件以便将任务添加到任务列表中，则列表中将出现重复的任务：一个来自端点，一个来自广播。可以通过使用 `toOthers` 方法来解决此问题，该方法指示广播器不要将事件广播给当前用户。

> [!WARNING]
> 你的事件必须使用 `Illuminate\Broadcasting\InteractsWithSockets` Trait 才能调用 `toOthers` 方法。

#### 配置

初始化 Laravel Echo 实例时，会为连接分配一个 socket ID。如果你使用全局 [Axios](https://github.com/axios/axios) 实例从 JavaScript 应用发起 HTTP 请求，则 socket ID 将自动作为 `X-Socket-ID` 头部附加到每个传出的请求。然后，当你调用 `toOthers` 方法时，Laravel 将从头部提取 socket ID 并指示广播器不要向具有该 socket ID 的任何连接广播。

如果你未使用全局 Axios 实例，则需要手动配置 JavaScript 应用以向所有传出的请求发送 `X-Socket-ID` 头部。可以使用 `Echo.socketId` 方法获取 socket ID：

```js
var socketId = Echo.socketId();
```

### 自定义连接

如果你的应用与多个广播连接交互，并且你希望使用默认广播器以外的广播器来广播事件，则可以使用 `via` 方法指定要将事件推送到哪个连接：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->via('pusher');
```

或者，你可以通过在事件的构造函数中调用 `broadcastVia` 方法来指定事件的广播连接。但是，在执行此操作之前，应确保事件类使用 `InteractsWithBroadcasting` Trait：

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
     * Create a new event instance.
     */
    public function __construct()
    {
        $this->broadcastVia('pusher');
    }
}
```

### 匿名事件

有时，你可能希望将简单事件广播到应用的前端，而无需创建专用的事件类。为了适应这种情况，`Broadcast` Facade 允许你广播「匿名事件」：

```php
Broadcast::on('orders.'.$order->id)->send();
```

上面的示例将广播以下事件：

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

上面的示例将广播类似以下内容的事件：

```json
{
    "event": "OrderPlaced",
    "data": "{ id: 1, total: 100 }",
    "channel": "orders.1"
}
```

如果希望在私有或状态频道上广播匿名事件，则可以使用 `private` 和 `presence` 方法：

```php
Broadcast::private('orders.'.$order->id)->send();
Broadcast::presence('channels.'.$channel->id)->send();
```

使用 `send` 方法广播匿名事件会将事件分发到应用的[队列](/docs/{{version}}/queues)以进行处理。但是，如果你希望立即广播事件，则可以使用 `sendNow` 方法：

```php
Broadcast::on('orders.'.$order->id)->sendNow();
```

要将事件广播到除当前 authenticated 用户之外的所有频道订阅者，可以调用 `toOthers` 方法：

```php
Broadcast::on('orders.'.$order->id)
    ->toOthers()
    ->send();
```

### 挽救广播

当应用的队列服务器不可用或 Laravel 在广播事件时遇到错误时，将引发异常，通常会导致最终用户看到应用错误。由于事件广播通常是应用核心功能的补充，因此你可以通过在事件上实现 `ShouldRescue` 接口来防止这些异常中断用户体验。

实现 `ShouldRescue` 接口的事件在广播尝试期间自动利用 Laravel 的 [rescue 辅助函数](/docs/{{version}}/helpers#method-rescue)。此辅助函数捕获任何异常，将其报告给应用的异常 handler进行记录，并允许应用在不中断用户工作流的情况下正常继续执行：

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

## 接收广播

### 监听事件

一旦你已[安装并实例化 Laravel Echo](#client-side-installation)，就可以开始监听从 Laravel 应用广播的事件。首先，使用 `channel` 方法检索频道的实例，然后调用 `listen` 方法监听指定事件：

```js
Echo.channel(`orders.${this.order.id}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order.name);
    });
```

如果要在私有频道上监听事件，请改用 `private` 方法。你可以继续链接对 `listen` 方法的调用，以监听单个频道上的多个事件：

```js
Echo.private(`orders.${this.order.id}`)
    .listen(/* ... */)
    .listen(/* ... */)
    .listen(/* ... */);
```

#### 停止监听事件

如果要在不[离开频道](#leaving-a-channel)的情况下停止监听给定事件，可以使用 `stopListening` 方法：

```js
Echo.private(`orders.${this.order.id}`)
    .stopListening('OrderShipmentStatusUpdated');
```

### 离开频道

要离开频道，可以在 Echo 实例上调用 `leaveChannel` 方法：

```js
Echo.leaveChannel(`orders.${this.order.id}`);
```

如果要离开频道及其关联的私有和状态频道，可以调用 `leave` 方法：

```js
Echo.leave(`orders.${this.order.id}`);
```

### 命名空间

你可能已经在上面的示例中注意到，我们没有为事件类指定完整的 `App\Events` 命名空间。这是因为 Echo 将自动假定事件位于 `App\Events` 命名空间中。但是，你可以在实例化 Echo 时通过传递 `namespace` 配置选项来配置根命名空间：

```js
window.Echo = new Echo({
    broadcaster: 'pusher',
    // ...
    namespace: 'App.Other.Namespace'
});
```

或者，在使用 Echo 订阅事件时，可以使用 `.` 作为事件类的前缀。这将允许你始终指定完全限定的类名：

```js
Echo.channel('orders')
    .listen('.Namespace\\Event\\Class', (e) => {
        // ...
    });
```

### 使用 React、Vue 或 Svelte

Laravel Echo 包含 React、Vue 和 Svelte 钩子，使监听事件变得轻松。要开始使用，请调用 `useEcho` 钩子，该钩子用于监听私有事件。`useEcho` 钩子将在使用它的组件卸载时自动离开频道：

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

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);
</script>
```

你可以通过向 `useEcho` 提供事件数组来监听多个事件：

```js
useEcho(
    `orders.${orderId}`,
    ["OrderShipmentStatusUpdated", "OrderShipped"],
    (e) => {
        console.log(e.order);
    },
);
```

你还可以指定广播事件有效载荷数据的形状，从而提供更高的类型安全性和编辑便利性：

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

`useEcho` 钩子将在使用它的组件卸载时自动离开频道；但是，你可以利用返回的函数在必要时以编程方式手动停止/开始监听频道：

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 在不离开频道的情况下停止监听...
stopListening();

// 重新开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开频道及其关联的私有和状态频道...
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

// 在不离开频道的情况下停止监听...
stopListening();

// 重新开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开频道及其关联的私有和状态频道...
leave();
</script>
```

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 在不离开频道的情况下停止监听...
stopListening();

// 重新开始监听...
listen();

// 离开频道...
leaveChannel();

// 离开频道及其关联的私有和状态频道...
leave();
</script>
```

#### 连接到公共频道

要连接到公共频道，可以使用 `useEchoPublic` 钩子：

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

```svelte tab=Svelte
<script>
import { useEchoPublic } from "@laravel/echo-svelte";

useEchoPublic("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

#### 连接到状态频道

要连接到状态频道，可以使用 `useEchoPresence` 钩子：

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

```svelte tab=Svelte
<script>
import { useEchoPresence } from "@laravel/echo-svelte";

useEchoPresence("posts", "PostPublished", (e) => {
    console.log(e.post);
});
</script>
```

#### 连接状态

可以使用 `useConnectionStatus` 钩子检索当前 WebSocket 连接状态，该钩子提供响应式状态，在连接状态更改时会自动更新：

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

```svelte tab=Svelte
<script>
import { useConnectionStatus } from "@laravel/echo-svelte";

const status = useConnectionStatus();
</script>

<div>Connection: {status()}</div>
```

可能的状态值为：

- `connected` - 已成功连接到 WebSocket 服务器。
- `connecting` - 正在尝试初始连接。
- `reconnecting` - 正在尝试在断开连接后重新连接。
- `disconnected` - 未连接且未尝试重新连接。
- `failed` - 连接失败且不会重试。

#### Socket ID

可以使用 `useSocketId` 钩子检索当前 WebSocket socket ID，该钩子提供一个响应式值，在连接使用新 socket ID 重新连接时会自动更新：

```js tab=React
import { useSocketId } from "@laravel/echo-react";

function SocketIndicator() {
    const socketId = useSocketId();

    return <div>Socket ID: {socketId}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useSocketId } from "@laravel/echo-vue";

const socketId = useSocketId();
</script>

<template>
    <div>Socket ID: {{ socketId }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useSocketId } from "@laravel/echo-svelte";

const socketId = useSocketId();
</script>

<div>Socket ID: {socketId()}</div>
```

## 状态频道

状态频道在私有频道安全性的基础上，公开了有关谁订阅了该频道的附加感知功能。这使得构建强大的协作应用功能变得容易，例如在其他用户正在查看同一页面时通知用户，或列出聊天室中的居民。

### 授权状态频道

所有状态频道也是私有频道；因此，用户必须被[授权访问它们](#authorizing-channels)。但是，在为状态频道定义授权回调时，如果用户被授权加入频道，你将不会返回 `true`。相反，你应该返回包含用户相关数据的数组。

授权回调返回的数据将可用于 JavaScript 应用中的状态频道事件监听器。如果用户未被授权加入状态频道，则应返回 `false` 或 `null`：

```php
use App\Models\User;

Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
    if ($user->canJoinRoom($roomId)) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
```

### 加入状态频道

要加入状态频道，可以使用 Echo 的 `join` 方法。`join` 方法将返回一个 `PresenceChannel` 实现，除了公开 `listen` 方法外，还允许你订阅 `here`、`joining` 和 `leaving` 事件。

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

`here` 回调将在成功加入频道后立即执行，并将接收一个包含当前订阅该频道的所有其他用户信息的数组。`joining` 方法将在新用户加入频道时执行，而 `leaving` 方法将在用户离开频道时执行。当身份认证端点返回 200 以外的 HTTP 状态码，或在解析返回的 JSON 时出现问题时，将执行 `error` 方法。

### 广播到状态频道

状态频道可以像公共或私有频道一样接收事件。以聊天室为例，我们可能希望将 `NewMessage` 事件广播到房间的状态频道。为此，我们将从事件的 `broadcastOn` 方法返回 `PresenceChannel` 的实例：

```php
/**
 * Get the channels the event should broadcast on.
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

与其他事件一样，你可以使用 `broadcast` 辅助函数和 `toOthers` 方法将当前用户排除在接收广播之外：

```php
broadcast(new NewMessage($message));

broadcast(new NewMessage($message))->toOthers();
```

与其他类型的事件一样，你可以使用 Echo 的 `listen` 方法监听发送到状态频道的事件：

```js
Echo.join(`chat.${roomId}`)
    .here(/* ... */)
    .joining(/* ... */)
    .leaving(/* ... */)
    .listen('NewMessage', (e) => {
        // ...
    });
```

## 模型广播

> [!WARNING]
> 在阅读以下有关模型广播的文档之前，我们建议你熟悉 Laravel 模型广播服务的一般概念，以及如何手动创建和监听广播事件。

当应用的 [Eloquent 模型](/docs/{{version}}/eloquent)被创建、更新或删除时，广播事件是很常见的。当然，这可以通过手动[为 Eloquent 模型状态变化定义自定义事件](/docs/{{version}}/eloquent#events)并使用 `ShouldBroadcast` 接口标记这些事件来轻松实现。

但是，如果你的应用中没有出于任何其他目的使用这些事件，则仅为广播它们而创建事件类可能很麻烦。为了解决此问题，Laravel 允许你指示 Eloquent 模型自动广播其状态变化。

首先，你的 Eloquent 模型应使用 `Illuminate\Database\Eloquent\BroadcastsEvents` Trait。此外，模型应定义一个 `broadcastOn` 方法，该方法将返回模型事件应广播到的频道数组：

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
     * Get the user that the post belongs to.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the channels that model events should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>
     */
    public function broadcastOn(string $event): array
    {
        return [$this, $this->user];
    }
}
```

一旦你的模型包含此 Trait 并定义其广播频道，它将在模型实例被创建、更新、删除、扔进垃圾桶或恢复时开始自动广播事件。

此外，你可能已经注意到 `broadcastOn` 方法接收一个字符串 `$event` 参数。此参数包含模型上发生的事件类型，其值将为 `created`、`updated`、`deleted`、`trashed` 或 `restored`。通过检查此变量的值，你可以确定模型针对特定事件应广播到哪些频道（如果有）：

```php
/**
 * Get the channels that model events should broadcast on.
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

#### 自定义模型广播事件的创建

有时，你可能希望自定义 Laravel 创建基础模型广播事件的方式。你可以通过在 Eloquent 模型上定义 `newBroadcastableEvent` 方法来实现。此方法应返回 `Illuminate\Database\Eloquent\BroadcastableModelEventOccurred` 实例：

```php
use Illuminate\Database\Eloquent\BroadcastableModelEventOccurred;

/**
 * Create a new broadcastable model event for the model.
 */
protected function newBroadcastableEvent(string $event): BroadcastableModelEventOccurred
{
    return (new BroadcastableModelEventOccurred(
        $this, $event
    ))->dontBroadcastToCurrentUser();
}
```

### 模型广播约定

#### 频道约定

你可能已经注意到，上面模型示例中的 `broadcastOn` 方法没有返回 `Channel` 实例。相反，是直接返回了 Eloquent 模型。如果你的模型的 `broadcastOn` 方法返回了 Eloquent 模型实例（或该方法返回的数组中包含），那么 Laravel 将使用模型的类名和主键标识符作为频道名称，自动为模型实例化私有频道实例。

因此，一个 `id` 为 `1` 的 `App\Models\User` 模型将转换为名称为 `App.Models.User.1` 的 `Illuminate\Broadcasting\PrivateChannel` 实例。当然，除了从模型的 `broadcastOn` 方法返回 Eloquent 模型实例外，还可以返回完整的 `Channel` 实例，以便完全控制模型的频道名称：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * Get the channels that model events should broadcast on.
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

如果你计划从模型的 `broadcastOn` 方法显式返回频道实例，则可以将 Eloquent 模型实例传递给频道的构造函数。这样做时，Laravel 将使用上面讨论的模型频道约定将 Eloquent 模型转换为频道名称字符串：

```php
return [new Channel($this->user)];
```

如果需要确定模型的频道的频道名称，可以调用任何模型实例上的 `broadcastChannel` 方法。例如，对于 `id` 为 `1` 的 `App\Models\User` 模型，此方法返回字符串 `App.Models.User.1`：

```php
$user->broadcastChannel();
```

#### 事件约定

由于模型广播事件与应用 `App\Events` 目录中的「实际」事件无关联，因此会根据约定为其分配名称和有效载荷。Laravel 的约定是使用模型的类名（不包括命名空间）和触发广播的模型事件的名称来广播事件。

例如，更新 `App\Models\Post` 模型会向客户端应用广播事件 `PostUpdated`，并具有以下有效载荷：

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

删除 `App\Models\User` 模型会广播名为 `UserDeleted` 的事件。

如果需要，你可以通过向模型添加 `broadcastAs` 和 `broadcastWith` 方法来定义自定义广播名称和有效载荷。这些方法接收正在发生的模型事件/操作的名称，使你能够针对每个模型操作自定义事件的名称和有效载荷。如果从 `broadcastAs` 方法返回 `null`，则 Laravel 在广播事件时将使用上面讨论的模型广播事件名称约定：

```php
/**
 * The model event's broadcast name.
 */
public function broadcastAs(string $event): string|null
{
    return match ($event) {
        'created' => 'post.created',
        default => null,
    };
}

/**
 * Get the data to broadcast for the model.
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

### 监听模型广播

将 `BroadcastsEvents` Trait 添加到模型并定义模型的 `broadcastOn` 方法后，就可以开始在客户端应用中监听广播的模型事件。在开始之前，你可能希望查阅有关[监听事件](#listening-for-events)的完整文档。

首先，使用 `private` 方法检索频道的实例，然后调用 `listen` 方法监听指定的事件。通常，传递给 `private` 方法的频道名称应与 Laravel 的[模型广播约定](#model-broadcasting-conventions)相对应。

获得频道实例后，可以使用 `listen` 方法监听特定事件。由于模型广播事件与应用 `App\Events` 目录中的「实际」事件无关联，因此[事件名称](#model-broadcasting-event-conventions)必须以 `.` 为前缀，以表明它不属于特定命名空间。每个模型广播事件都有一个 `model` 属性，其中包含模型的所有可广播属性：

```js
Echo.private(`App.Models.User.${this.user.id}`)
    .listen('.UserUpdated', (e) => {
        console.log(e.model);
    });
```

#### 使用 React、Vue 或 Svelte

如果你使用的是 React、Vue 或 Svelte，则可以使用 Laravel Echo 附带的 `useEchoModel` 钩子轻松监听模型广播：

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

```svelte tab=Svelte
<script>
import { useEchoModel } from "@laravel/echo-svelte";

useEchoModel("App.Models.User", userId, ["UserUpdated"], (e) => {
    console.log(e.model);
});
</script>
```

你还可以指定模型事件有效载荷数据的形状，从而提供更高的类型安全性和编辑便利性：

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

## 客户端事件

> [!NOTE]
> 使用 [Pusher Channels](https://pusher.com/channels) 时，必须在[应用仪表板](https://dashboard.pusher.com/)的「App Settings」部分启用「Client Events」选项才能发送客户端事件。

有时你可能希望在不访问 Laravel 应用的情况下向其他连接的客户端广播事件。这对于像「正在输入」通知这样的场景特别有用，在这种情况下，你希望通知应用的其他用户有用户正在给定屏幕上输入消息。

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

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

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

```svelte tab=Svelte
<script>
import { useEcho } from "@laravel/echo-svelte";

const { channel } = useEcho(`chat.${roomId}`, ['update'], (e) => {
    console.log('Chat event received:', e);
});

channel().listenForWhisper('typing', (e) => {
    console.log(e.name);
});
</script>
```

## 通知

通过将事件广播与[通知](/docs/{{version}}/notifications)配对，你的 JavaScript 应用可以在新通知发生时接收它们，而无需刷新页面。在开始之前，请务必阅读有关使用[广播通知频道](/docs/{{version}}/notifications#broadcast-notifications)的文档。

将通知配置为使用广播频道后，可以使用 Echo 的 `notification` 方法监听广播事件。请记住，频道名称应与接收通知的实体的类名匹配：

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

```svelte tab=Svelte
<script>
import { useEchoModel } from "@laravel/echo-svelte";

const { channel } = useEchoModel('App.Models.User', userId);

channel().notification((notification) => {
    console.log(notification.type);
});
</script>
```

在此示例中，通过 `broadcast` 频道发送给 `App\Models\User` 实例的所有通知都将被回调接收。`App.Models.User.{id}` 频道的频道授权回调包含在应用的 `routes/channels.php` 文件中。

#### 停止监听通知

如果要在不[离开频道](#leaving-a-channel)的情况下停止监听通知，可以使用 `stopListeningForNotification` 方法：

```js
const callback = (notification) => {
    console.log(notification.type);
}

// 开始监听...
Echo.private(`App.Models.User.${userId}`)
    .notification(callback);

// 停止监听（回调必须相同）...
Echo.private(`App.Models.User.${userId}`)
    .stopListeningForNotification(callback);
```