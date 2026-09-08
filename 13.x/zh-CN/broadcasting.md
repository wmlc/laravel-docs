# 广播

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
- [概念概览](#concept-overview)
    - [使用示例应用](#using-example-application)
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
    - [仅发送给其他人](#only-to-others)
    - [自定义连接](#customizing-the-connection)
    - [匿名事件](#anonymous-events)
    - [抢救广播](#rescuing-broadcasts)
- [接收广播](#receiving-broadcasts)
    - [监听事件](#listening-for-events)
    - [离开频道](#leaving-a-channel)
    - [命名空间](#namespaces)
    - [使用 React、Vue 或 Svelte](#using-react-or-vue)
- [在线状态频道](#presence-channels)
    - [授权在线状态频道](#authorizing-presence-channels)
    - [加入在线状态频道](#joining-presence-channels)
    - [向在线状态频道广播](#broadcasting-to-presence-channels)
- [模型广播](#model-broadcasting)
    - [模型广播约定](#model-broadcasting-conventions)
    - [监听模型广播](#listening-for-model-broadcasts)
- [客户端事件](#client-events)
- [通知](#notifications)

<a name="introduction"></a>
## 简介

在许多现代 Web 应用中，WebSocket 被用于实现实时、自动更新的用户界面。当服务端某些数据被更新时，通常会通过 WebSocket 连接发送一条消息，交由客户端处理。WebSocket 提供了一种比持续轮询应用服务器以查找需要在 UI 中反映的数据变化更高效的替代方案。

例如，假设你的应用能够将用户的数据导出为 CSV 文件并通过邮件发送给他们。然而，创建这个 CSV 文件需要几分钟，因此你选择在 [队列任务](/docs/{{version}}/queues) 中创建并邮寄该 CSV。当 CSV 已经创建并邮寄给用户后，我们可以使用事件广播来分发一个 `App\Events\UserDataExported` 事件，该事件由我们应用的 JavaScript 接收。一旦接收到该事件，我们就可以向用户显示一条消息，告知他们的 CSV 已通过邮件发送，而无需刷新页面。

为了帮助你构建这类功能，Laravel 让你可以轻松地将服务端 Laravel [事件](/docs/{{version}}/events) 通过 WebSocket 连接"广播"出去。广播你的 Laravel 事件，使你能够在服务端 Laravel 应用与客户端 JavaScript 应用之间共享相同的事件名称与数据。

广播背后的核心概念很简单：客户端在前端连接到具名频道，而你的 Laravel 应用则在后端向这些频道广播事件。这些事件可以包含你希望提供给前端的任何附加数据。

<a name="supported-drivers"></a>
#### 支持的驱动

默认情况下，Laravel 内置了三种服务端广播驱动供你选择：[Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 与 [Ably](https://ably.com)。

> [!NOTE]
> 在深入事件广播之前，请确保你已阅读 Laravel 关于 [事件与监听器](/docs/{{version}}/events) 的文档。

<a name="quickstart"></a>
## 快速入门

默认情况下，新创建的 Laravel 应用中并未启用广播。你可以使用 `install:broadcasting` Artisan 命令来启用广播：

```shell
php artisan install:broadcasting
```

`install:broadcasting` 命令会提示你选择希望使用的事件广播服务。此外，它还会创建 `config/broadcasting.php` 配置文件以及 `routes/channels.php` 文件，你可以在其中注册应用的广播授权路由与回调。

Laravel 开箱即用地支持多种广播驱动：[Laravel Reverb](/docs/{{version}}/reverb)、[Pusher Channels](https://pusher.com/channels)、[Ably](https://ably.com)，以及一个用于本地开发与调试的 `log` 驱动。此外，还包含一个 `null` 驱动，让你在测试期间禁用广播。`config/broadcasting.php` 配置文件中为上述每个驱动都包含了一份配置示例。

你应用的所有事件广播配置都存储在 `config/broadcasting.php` 配置文件中。如果此文件在你的应用中不存在也不必担心；当你运行 `install:broadcasting` Artisan 命令时它会自动创建。

<a name="quickstart-next-steps"></a>
#### 后续步骤

一旦你启用了事件广播，就可以进一步了解 [定义广播事件](#defining-broadcast-events) 与 [监听事件](#listening-for-events)。如果你正在使用 Laravel 的 React、Vue 或 Svelte [入门套件](/docs/{{version}}/starter-kits)，可以使用 Echo 的 [useEcho hook](#using-react-or-vue) 来监听事件。

> [!NOTE]
> 在广播任何事件之前，你应当先配置并运行一个 [队列 worker](/docs/{{version}}/queues)。所有事件广播都是通过队列任务来完成的，这样你的应用响应时间就不会因事件广播而受到严重影响。

<a name="server-side-installation"></a>
## 服务端安装

要开始使用 Laravel 的事件广播，我们需要在 Laravel 应用内进行一些配置，并安装几个扩展包。

事件广播是通过一个服务端广播驱动来完成的，该驱动会广播你的 Laravel 事件，以便 Laravel Echo（一个 JavaScript 库）能够在浏览器客户端中接收它们。别担心——我们会一步一步地走完安装的每一个环节。

<a name="reverb"></a>
### Reverb

要在使用 Reverb 作为事件广播器时快速启用对 Laravel 广播特性的支持，请使用 `--reverb` 选项调用 `install:broadcasting` Artisan 命令。该 Artisan 命令会安装 Reverb 所需的 Composer 与 NPM 包，并使用相应的变量更新应用的 `.env` 文件：

```shell
php artisan install:broadcasting --reverb
```

<a name="reverb-manual-installation"></a>
#### 手动安装

运行 `install:broadcasting` 命令时，会提示你安装 [Laravel Reverb](/docs/{{version}}/reverb)。当然，你也可以使用 Composer 包管理器手动安装 Reverb：

```shell
composer require laravel/reverb
```

安装好该包之后，你可以运行 Reverb 的安装命令来发布配置、添加 Reverb 所需的的环境变量，并在你的应用中启用事件广播：

```shell
php artisan reverb:install
```

你可以在 [Reverb 文档](/docs/{{version}}/reverb) 中找到详细的 Reverb 安装与使用说明。

<a name="pusher-channels"></a>
### Pusher Channels

要在使用 Pusher 作为事件广播器时快速启用对 Laravel 广播特性的支持，请使用 `--pusher` 选项调用 `install:broadcasting` Artisan 命令。该 Artisan 命令会提示你输入 Pusher 凭据、安装 Pusher 的 PHP 与 JavaScript SDK，并使用相应的变量更新应用的 `.env` 文件：

```shell
php artisan install:broadcasting --pusher
```

<a name="pusher-manual-installation"></a>
#### 手动安装

要手动安装 Pusher 支持，你应该使用 Composer 包管理器安装 Pusher Channels 的 PHP SDK：

```shell
composer require pusher/pusher-php-server
```

接下来，你应该在 `config/broadcasting.php` 配置文件中配置你的 Pusher Channels 凭据。该文件中已包含一份 Pusher Channels 配置示例，让你可以快速指定 key、secret 与应用 ID。通常，你应该在应用的 `.env` 文件中配置你的 Pusher Channels 凭据：

```ini
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_APP_KEY="your-pusher-key"
PUSHER_APP_SECRET="your-pusher-secret"
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME="https"
PUSHER_APP_CLUSTER="mt1"
```

`config/broadcasting.php` 文件中 `pusher` 的配置还允许你指定 Channels 所支持的其他 `options`，例如 cluster。

然后，在应用 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `pusher`：

```ini
BROADCAST_CONNECTION=pusher
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation)，它将在客户端接收广播事件。

<a name="ably"></a>
### Ably

> [!NOTE]
> 以下文档讨论的是如何在"Pusher 兼容"模式下使用 Ably。不过，Ably 团队推荐并维护着一套能够利用 Ably 独有能力的广播器与 Echo 客户端。有关使用 Ably 维护的驱动的更多信息，请 [查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

要在使用 [Ably](https://ably.com) 作为事件广播器时快速启用对 Laravel 广播特性的支持，请使用 `--ably` 选项调用 `install:broadcasting` Artisan 命令。该 Artisan 命令会提示你输入 Ably 凭据、安装 Ably 的 PHP 与 JavaScript SDK，并使用相应的变量更新应用的 `.env` 文件：

```shell
php artisan install:broadcasting --ably
```

**在继续之前，你应在 Ably 应用设置中启用 Pusher 协议支持。你可以在 Ably 应用设置面板的"Protocol Adapter Settings"部分中启用此功能。**

<a name="ably-manual-installation"></a>
#### 手动安装

要手动安装 Ably 支持，你应该使用 Composer 包管理器安装 Ably 的 PHP SDK：

```shell
composer require ably/ably-php
```

接下来，你应该在 `config/broadcasting.php` 配置文件中配置你的 Ably 凭据。该文件中已包含一份 Ably 配置示例，让你可以快速指定 key。通常，该值应通过 `ABLY_KEY` [环境变量](/docs/{{version}}/configuration#environment-configuration) 来设置：

```ini
ABLY_KEY=your-ably-key
```

然后，在应用 `.env` 文件中将 `BROADCAST_CONNECTION` 环境变量设置为 `ably`：

```ini
BROADCAST_CONNECTION=ably
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation)，它将在客户端接收广播事件。

<a name="client-side-installation"></a>
## 客户端安装

<a name="client-reverb"></a>
### Reverb

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，它能让你轻松订阅频道并监听由你服务端广播驱动所广播的事件。

通过 `install:broadcasting` Artisan 命令安装 Laravel Reverb 时，Reverb 与 Echo 的脚手架和配置会自动注入到你的应用中。不过，如果你希望手动配置 Laravel Echo，可以按照以下说明进行。

<a name="reverb-client-manual-installation"></a>
#### 手动安装

要手动为应用的客户端配置 Laravel Echo，请先安装 `pusher-js` 包，因为 Reverb 使用 Pusher 协议来实现 WebSocket 订阅、频道与消息：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装好 Echo 之后，你就可以在应用的 JavaScript 中创建一个新的 Echo 实例。一个合适的位置是 Laravel 框架自带的 `resources/js/app.js` 文件底部：

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

接下来，你应该编译应用的资源文件：

```shell
npm run build
```

> [!WARNING]
> Laravel Echo 的 `reverb` 广播器需要 laravel-echo v1.16.0+。

<a name="client-pusher-channels"></a>
### Pusher Channels

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，它能让你轻松订阅频道并监听由你服务端广播驱动所广播的事件。

通过 `install:broadcasting --pusher` Artisan 命令安装广播支持时，Pusher 与 Echo 的脚手架和配置会自动注入到你的应用中。不过，如果你希望手动配置 Laravel Echo，可以按照以下说明进行。

<a name="pusher-client-manual-installation"></a>
#### 手动安装

要手动为应用的客户端配置 Laravel Echo，请先安装 `laravel-echo` 与 `pusher-js` 包，它们使用 Pusher 协议来实现 WebSocket 订阅、频道与消息：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装好 Echo 之后，你就可以在应用的 `resources/js/app.js` 文件中创建一个新的 Echo 实例：

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

接下来，你应该在应用 `.env` 文件中为 Pusher 的环境变量定义相应的值。如果这些变量在你的 `.env` 文件中尚不存在，你应该添加它们：

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

根据你的应用需求调整好 Echo 配置后，你可以编译应用的资源文件：

```shell
npm run build
```

> [!NOTE]
> 要了解更多关于编译应用 JavaScript 资源文件的信息，请查阅 [Vite](/docs/{{version}}/vite) 文档。

<a name="using-an-existing-client-instance"></a>
#### 使用已有的客户端实例

如果你已经有一个预先配置好的 Pusher Channels 客户端实例，并希望 Echo 使用它，可以通过 `client` 配置项将其传递给 Echo：

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
> 以下文档讨论的是如何在"Pusher 兼容"模式下使用 Ably。不过，Ably 团队推荐并维护着一套能够利用 Ably 独有能力的广播器与 Echo 客户端。有关使用 Ably 维护的驱动的更多信息，请 [查阅 Ably 的 Laravel 广播器文档](https://github.com/ably/laravel-broadcaster)。

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，它能让你轻松订阅频道并监听由你服务端广播驱动所广播的事件。

通过 `install:broadcasting --ably` Artisan 命令安装广播支持时，Ably 与 Echo 的脚手架和配置会自动注入到你的应用中。不过，如果你希望手动配置 Laravel Echo，可以按照以下说明进行。

<a name="ably-client-manual-installation"></a>
#### 手动安装

要手动为应用的客户端配置 Laravel Echo，请先安装 `laravel-echo` 与 `pusher-js` 包，它们使用 Pusher 协议来实现 WebSocket 订阅、频道与消息：

```shell
npm install --save-dev laravel-echo pusher-js
```

**在继续之前，你应在 Ably 应用设置中启用 Pusher 协议支持。你可以在 Ably 应用设置面板的"Protocol Adapter Settings"部分中启用此功能。**

安装好 Echo 之后，你就可以在应用的 `resources/js/app.js` 文件中创建一个新的 Echo 实例：

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

你可能已经注意到，我们的 Ably Echo 配置引用了一个 `VITE_ABLY_PUBLIC_KEY` 环境变量。该变量的值应该是你的 Ably 公钥。公钥就是 Ably key 中 `:` 字符之前的部分。

根据你的需求调整好 Echo 配置后，你可以编译应用的资源文件：

```shell
npm run dev
```

> [!NOTE]
> 要了解更多关于编译应用 JavaScript 资源文件的信息，请查阅 [Vite](/docs/{{version}}/vite) 文档。

<a name="concept-overview"></a>
## 概念概览

Laravel 的事件广播允许你使用基于驱动的 WebSocket 方案，将服务端 Laravel 事件广播到客户端 JavaScript 应用。目前，Laravel 自带 [Laravel Reverb](https://reverb.laravel.com)、[Pusher Channels](https://pusher.com/channels) 与 [Ably](https://ably.com) 几个驱动。这些事件可以使用 [Laravel Echo](#client-side-installation) JavaScript 包在客户端轻松消费。

事件通过"频道"进行广播，频道可以指定为公开或私有。任何访问你应用的访客都可以订阅公开频道而无需任何认证或授权；然而，要订阅私有频道，用户必须经过认证并被授权在该频道上监听。

<a name="using-example-application"></a>
### 使用示例应用

在深入事件广播的各个组成部分之前，让我们以一个电子商务商店为例，从较高层面做个概览。

在我们的应用中，假设我们有一个页面，允许用户查看其订单的配送状态。再假设当应用处理完一次配送状态更新时，会触发一个 `OrderShipmentStatusUpdated` 事件：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="the-shouldbroadcast-interface"></a>
#### `ShouldBroadcast` 接口

当用户查看自己的某个订单时，我们不希望他们需要刷新页面才能看到状态更新。相反，我们希望在更新创建时将其广播到应用。因此，我们需要用 `ShouldBroadcast` 接口标记 `OrderShipmentStatusUpdated` 事件。这会指示 Laravel 在事件被触发时对其进行广播：

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

`ShouldBroadcast` 接口要求我们的事件定义一个 `broadcastOn` 方法。该方法负责返回事件应当在其上广播的频道。生成事件类时已经为此方法定义了一个空的桩代码，因此我们只需填充其细节即可。我们只希望订单的创建者能够查看状态更新，因此我们将在一个与该订单绑定的私有频道上广播该事件：

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取事件应当广播到的频道。
 */
public function broadcastOn(): Channel
{
    return new PrivateChannel('orders.'.$this->order->id);
}
```

如果你希望事件在多个频道上广播，可以返回一个 `array`：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取事件应当广播到的频道。
 *
 * @return array<int, \Illuminate\Broadcasting\Channel>
 */
public function broadcastOn(): array
{
    return [
        new PrivateChannel('orders.'.$this->order->id),
        // ……
    ];
}
```

<a name="example-application-authorizing-channels"></a>
#### 授权频道

请记住，用户必须经过授权才能监听私有频道。我们可以在应用的 `routes/channels.php` 文件中定义频道授权规则。在这个例子中，我们需要验证任何试图监听私有 `orders.1` 频道的用户确实就是该订单的创建者：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道的名称，以及一个返回 `true` 或 `false` 的回调，用于指示该用户是否被授权在该频道上监听。

所有授权回调都以当前已认证的用户作为第一个参数，并将任何其他通配符参数作为后续参数。在这个例子中，我们使用 `{orderId}` 占位符来表示频道名称中的"ID"部分是一个通配符。

<a name="listening-for-event-broadcasts"></a>
#### 监听事件广播

接下来，剩下的就是在我们 JavaScript 应用中监听该事件。我们可以使用 [Laravel Echo](#client-side-installation) 来做到这一点。Laravel Echo 内置的 React、Vue 与 Svelte hook 让入门变得很简单，并且默认情况下，事件的所有公开属性都会包含在广播事件中：

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

<a name="defining-broadcast-events"></a>
## 定义广播事件

要告知 Laravel 某个事件应当被广播，你必须在事件类上实现 `Illuminate\Contracts\Broadcasting\ShouldBroadcast` 接口。该接口已被框架生成的所有事件类导入，因此你可以轻松地将其添加到任意事件中。

`ShouldBroadcast` 接口要求你实现一个单一的方法：`broadcastOn`。`broadcastOn` 方法应当返回一个频道或一组频道，事件将在这些频道上广播。频道应当是 `Channel`、`PrivateChannel` 或 `PresenceChannel` 的实例。`Channel` 的实例表示任何用户都可以订阅的公开频道，而 `PrivateChannels` 与 `PresenceChannels` 则表示需要 [频道授权](#authorizing-channels) 的私有频道：

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
     * 创建一个新的事件实例。
     */
    public function __construct(
        public User $user,
    ) {}

    /**
     * 获取事件应当广播到的频道。
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

实现 `ShouldBroadcast` 接口之后，你只需像平常一样 [触发该事件](/docs/{{version}}/events)。事件被触发后，一个 [队列任务](/docs/{{version}}/queues) 会使用你指定的广播驱动自动广播该事件。

<a name="broadcast-name"></a>
### 广播名称

默认情况下，Laravel 会使用事件的类名来广播该事件。不过，你可以通过在事件上定义 `broadcastAs` 方法来自定义广播名称：

```php
/**
 * 事件的广播名称。
 */
public function broadcastAs(): string
{
    return 'server.created';
}
```

如果你使用 `broadcastAs` 方法自定义了广播名称，应确保使用开头的 `.` 字符来注册你的监听器。这会指示 Echo 不要将应用的命名空间前缀加到事件上：

```javascript
.listen('.server.created', function (e) {
    // ……
});
```

<a name="broadcast-data"></a>
### 广播数据

当事件被广播时，它的所有 `public` 属性都会自动被序列化并作为事件的负载广播出去，使你能从 JavaScript 应用中访问它的任何公开数据。因此，例如，如果你的事件有一个包含 Eloquent 模型的单一公开 `$user` 属性，那么该事件的广播负载将是：

```json
{
    "user": {
        "id": 1,
        "name": "Patrick Stewart"
        ...
    }
}
```

不过，如果你希望对广播负载有更精细的控制，可以向事件添加 `broadcastWith` 方法。该方法应当返回你希望作为事件负载广播的数据数组：

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

默认情况下，每个广播事件都会被放入你的 `queue.php` 配置文件中指定的默认队列连接的默认队列中。你可以使用事件类上的 `Connection` 与 `Queue` 属性来自定义广播器使用的队列连接与名称：

```php
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\Attributes\Queue;

#[Connection('redis')]
#[Queue('default')]
class ServerCreated implements ShouldBroadcast
{
    // ……
}
```

或者，你可以通过在事件上定义 `broadcastQueue` 方法来自定义队列名称：

```php
/**
 * 放置广播任务的队列名称。
 */
public function broadcastQueue(): string
{
    return 'default';
}
```

如果你想使用 `sync` 队列而不是默认队列驱动来广播你的事件，可以实现 `ShouldBroadcastNow` 接口来替代 `ShouldBroadcast`：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class OrderShipmentStatusUpdated implements ShouldBroadcastNow
{
    // ……
}
```

<a name="broadcast-conditions"></a>
### 广播条件

有时你希望仅在给定条件为真时才广播你的事件。你可以通过在事件类上添加 `broadcastWhen` 方法来定义这些条件：

```php
/**
 * 确定此事件是否应当广播。
 */
public function broadcastWhen(): bool
{
    return $this->order->value > 100;
}
```

<a name="broadcasting-and-database-transactions"></a>
#### 广播与数据库事务

当广播事件在数据库事务中被分发时，它们可能会在数据库事务提交之前就被队列处理。发生这种情况时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映到数据库中。此外，在事务中创建的任何模型或数据库记录可能还不存在于数据库中。如果你的事件依赖于这些模型，那么在广播该事件的任务被处理时就可能出现意外错误。

如果你的队列连接的 `after_commit` 配置选项被设置为 `false`，你仍然可以通过在事件类上实现 `ShouldDispatchAfterCommit` 接口，来指示某个特定的广播事件应当在所有打开的数据库事务都已提交之后才被分发：

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
> 要了解如何应对这些问题，请查阅关于 [队列任务与数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions) 的文档。

<a name="authorizing-channels"></a>
## 授权频道

私有频道要求你授权当前已认证的用户确实能够在该频道上监听。这是通过向你的 Laravel 应用发起一个 HTTP 请求（携带频道名称）并让你的应用决定该用户能否在该频道上监听来完成的。使用 [Laravel Echo](#client-side-installation) 时，用于授权私有频道订阅的 HTTP 请求会自动发出。

安装广播后，Laravel 会尝试自动注册 `/broadcasting/auth` 路由来处理授权请求。如果 Laravel 未能自动注册这些路由，你可以在应用的 `/bootstrap/app.php` 文件中手动注册它们：

```php
->withRouting(
    web: __DIR__.'/../routes/web.php',
    channels: __DIR__.'/../routes/channels.php',
    health: '/up',
)
```

<a name="defining-authorization-callbacks"></a>
### 定义授权回调

接下来，我们需要定义真正决定当前已认证用户能否监听某个给定频道的逻辑。这是在 `install:broadcasting` Artisan 命令创建的 `routes/channels.php` 文件中完成的。在该文件中，你可以使用 `Broadcast::channel` 方法来注册频道授权回调：

```php
use App\Models\User;

Broadcast::channel('orders.{orderId}', function (User $user, int $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道的名称，以及一个返回 `true` 或 `false` 的回调，用于指示该用户是否被授权在该频道上监听。

所有授权回调都以当前已认证的用户作为第一个参数，并将任何其他通配符参数作为后续参数。在这个例子中，我们使用 `{orderId}` 占位符来表示频道名称中的"ID"部分是一个通配符。

你可以使用 `channel:list` Artisan 命令查看应用的所有广播授权回调列表：

```shell
php artisan channel:list
```

<a name="authorization-callback-model-binding"></a>
#### 授权回调模型绑定

就像 HTTP 路由一样，频道路由也可以利用隐式与显式的 [路由模型绑定](/docs/{{version}}/routing#route-model-binding)。例如，你可以请求一个真正的 `Order` 模型实例，而不是接收一个字符串或数字订单 ID：

```php
use App\Models\Order;
use App\Models\User;

Broadcast::channel('orders.{order}', function (User $user, Order $order) {
    return $user->id === $order->user_id;
});
```

> [!WARNING]
> 与 HTTP 路由模型绑定不同，频道模型绑定不支持自动的 [隐式模型绑定作用域](/docs/{{version}}/routing#implicit-model-binding-scoping)。不过，这很少成为问题，因为大多数频道都可以基于单一模型的唯一主键进行作用域限定。

<a name="authorization-callback-authentication"></a>
#### 授权回调认证

私有频道与在线状态广播频道通过应用默认的认证 guard 来认证当前用户。如果用户未认证，频道授权会被自动拒绝，授权回调永远不会执行。不过，如果有必要，你可以分配多个自定义 guard 来认证传入的请求：

```php
Broadcast::channel('channel', function () {
    // ……
}, ['guards' => ['web', 'admin']]);
```

<a name="defining-channel-classes"></a>
### 定义频道类

如果你的应用使用了许多不同的频道，你的 `routes/channels.php` 文件可能会变得臃肿。因此，与其使用闭包来授权频道，不如使用频道类。要生成一个频道类，请使用 `make:channel` Artisan 命令。该命令会将一个新的频道类放在 `App/Broadcasting` 目录中。

```shell
php artisan make:channel OrderChannel
```

接下来，在你的 `routes/channels.php` 文件中注册你的频道：

```php
use App\Broadcasting\OrderChannel;

Broadcast::channel('orders.{order}', OrderChannel::class);
```

最后，你可以将频道的授权逻辑放在频道类的 `join` 方法中。这个 `join` 方法将包含你原本会放在频道授权闭包中的相同逻辑。你也可以利用频道模型绑定：

```php
<?php

namespace App\Broadcasting;

use App\Models\Order;
use App\Models\User;

class OrderChannel
{
    /**
     * 创建一个新的频道实例。
     */
    public function __construct() {}

    /**
     * 认证用户对频道的访问。
     */
    public function join(User $user, Order $order): array|bool
    {
        return $user->id === $order->user_id;
    }
}
```

> [!NOTE]
> 与 Laravel 中的许多其他类一样，频道类会由 [服务容器](/docs/{{version}}/container) 自动解析。因此，你可以在频道的构造函数中类型提示任何所需的依赖。

<a name="broadcasting-events"></a>
## 广播事件

一旦你定义了事件并用 `ShouldBroadcast` 接口标记了它，你只需使用事件的 dispatch 方法来触发该事件。事件分发器会注意到该事件被标记了 `ShouldBroadcast` 接口，并将事件加入广播队列：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="only-to-others"></a>
### 仅发送给其他人

在构建使用事件广播的应用时，你可能偶尔需要将事件广播给某个给定频道的所有订阅者，但排除当前用户。你可以使用 `broadcast` 辅助函数与 `toOthers` 方法来做到这一点：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->toOthers();
```

为了更好地理解何时需要使用 `toOthers` 方法，让我们设想一个任务列表应用，用户可以通过输入任务名称来创建一个新任务。为了创建任务，你的应用可能会向 `/task` URL 发起请求，该请求会广播任务的创建并返回一个表示新任务的 JSON。当你的 JavaScript 应用从端点接收到响应时，它可能会像这样直接将新任务插入到它的任务列表中：

```js
axios.post('/task', task)
    .then((response) => {
        this.tasks.push(response.data);
    });
```

然而，请记住我们也广播了任务的创建。如果你的 JavaScript 应用也在监听此事件以便将任务添加到任务列表，那么你的列表中就会出现重复的任务：一个来自端点，一个来自广播。你可以通过使用 `toOthers` 方法来指示广播器不要将事件广播给当前用户，从而解决这个问题。

> [!WARNING]
> 你的事件必须使用 `Illuminate\Broadcasting\InteractsWithSockets` trait 才能调用 `toOthers` 方法。

<a name="only-to-others-configuration"></a>
#### 配置

当你初始化一个 Laravel Echo 实例时，会为连接分配一个 socket ID。如果你使用全局的 [Axios](https://github.com/axios/axios) 实例从 JavaScript 应用发起 HTTP 请求，该 socket ID 会自动作为 `X-Socket-ID` 请求头附加到每一个发出的请求上。然后，当你调用 `toOthers` 方法时，Laravel 会从请求头中提取 socket ID，并指示广播器不要向任何具有该 socket ID 的连接广播。

如果你没有使用全局 Axios 实例，你将需要手动配置你的 JavaScript 应用，让它为所有发出的请求发送 `X-Socket-ID` 请求头。你可以使用 `Echo.socketId` 方法获取 socket ID：

```js
var socketId = Echo.socketId();
```

<a name="customizing-the-connection"></a>
### 自定义连接

如果你的应用与多个广播连接交互，并且你希望使用默认广播器以外的广播器来广播事件，你可以使用 `via` 方法指定要将事件推送到哪个连接：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->via('pusher');
```

或者，你可以通过在事件的构造函数中调用 `broadcastVia` 方法来指定事件的广播连接。不过，在这样做之前，你应该确保事件类使用了 `InteractsWithBroadcasting` trait：

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
     * 创建一个新的事件实例。
     */
    public function __construct()
    {
        $this->broadcastVia('pusher');
    }
}
```

<a name="anonymous-events"></a>
### 匿名事件

有时，你可能希望在不创建专用事件类的情况下，将简单事件广播到应用的客户端。为此，`Broadcast` facade 允许你广播"匿名事件"：

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

使用 `as` 与 `with` 方法，你可以自定义事件的名称与数据：

```php
Broadcast::on('orders.'.$order->id)
    ->as('OrderPlaced')
    ->with($order)
    ->send();
```

上面的示例将广播一个类似以下的事件：

```json
{
    "event": "OrderPlaced",
    "data": "{ id: 1, total: 100 }",
    "channel": "orders.1"
}
```

如果你希望在私有或在线状态频道上广播匿名事件，可以使用 `private` 与 `presence` 方法：

```php
Broadcast::private('orders.'.$order->id)->send();
Broadcast::presence('channels.'.$channel->id)->send();
```

使用 `send` 方法广播匿名事件会将事件分发到应用的 [队列](/docs/{{version}}/queues) 进行处理。不过，如果你希望立即广播该事件，可以使用 `sendNow` 方法：

```php
Broadcast::on('orders.'.$order->id)->sendNow();
```

要将事件广播给除当前已认证用户以外的所有频道订阅者，你可以调用 `toOthers` 方法：

```php
Broadcast::on('orders.'.$order->id)
    ->toOthers()
    ->send();
```

<a name="rescuing-broadcasts"></a>
### 抢救广播

当你的队列服务器不可用，或者 Laravel 在广播事件时遇到错误，会抛出一个异常，通常会导致最终用户看到应用错误。由于事件广播通常是应用核心功能的补充，你可以通过在事件上实现 `ShouldRescue` 接口，来防止这些异常干扰用户体验。

实现了 `ShouldRescue` 接口的事件会在广播尝试期间自动使用 Laravel 的 [rescue 辅助函数](/docs/{{version}}/helpers#method-rescue)。该辅助函数会捕获任何异常，将其报告给应用的异常处理器以进行日志记录，并允许应用在不中断用户工作流的情况下继续正常执行：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;

class ServerCreated implements ShouldBroadcast, ShouldRescue
{
    // ……
}
```

<a name="receiving-broadcasts"></a>
## 接收广播

<a name="listening-for-events"></a>
### 监听事件

一旦你 [已安装并实例化 Laravel Echo](#client-side-installation)，就可以开始监听由 Laravel 应用广播的事件。首先，使用 `channel` 方法获取一个频道实例，然后调用 `listen` 方法来监听指定的事件：

```js
Echo.channel(`orders.${this.order.id}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order.name);
    });
```

如果你希望在私有频道上监听事件，请改用 `private` 方法。你可以继续链式调用 `listen` 方法，以在单个频道上监听多个事件：

```js
Echo.private(`orders.${this.order.id}`)
    .listen(/* …… */)
    .listen(/* …… */)
    .listen(/* …… */);
```

<a name="stop-listening-for-events"></a>
#### 停止监听事件

如果你希望在 [离开频道](#leaving-a-channel) 之前停止监听某个给定事件，可以使用 `stopListening` 方法：

```js
Echo.private(`orders.${this.order.id}`)
    .stopListening('OrderShipmentStatusUpdated');
```

<a name="leaving-a-channel"></a>
### 离开频道

要离开一个频道，你可以调用 Echo 实例上的 `leaveChannel` 方法：

```js
Echo.leaveChannel(`orders.${this.order.id}`);
```

如果你希望离开一个频道以及与之关联的私有频道和在线状态频道，可以调用 `leave` 方法：

```js
Echo.leave(`orders.${this.order.id}`);
```

<a name="namespaces"></a>
### 命名空间

你可能已经在上面的例子中注意到，我们没有为事件类指定完整的 `App\Events` 命名空间。这是因为 Echo 会自动假设事件位于 `App\Events` 命名空间中。不过，你可以在实例化 Echo 时通过传入 `namespace` 配置项来配置根命名空间：

```js
window.Echo = new Echo({
    broadcaster: 'pusher',
    // ……
    namespace: 'App.Other.Namespace'
});
```

或者，你可以在使用 Echo 订阅事件时为事件类名加上 `.` 前缀。这样你就可以始终指定完全限定类名：

```js
Echo.channel('orders')
    .listen('.Namespace\\Event\\Class', (e) => {
        // ……
    });
```

<a name="using-react-or-vue"></a>
### 使用 React、Vue 或 Svelte

Laravel Echo 内置了 React、Vue 与 Svelte 的 hook，让监听事件变得轻而易举。首先调用 `useEcho` hook，它用于监听私有事件。`useEcho` hook 会在消费组件被卸载时自动离开频道：

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

你还可以指定广播事件负载数据的形态，从而提供更好的类型安全与编辑便利：

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

`useEcho` hook 会在消费组件被卸载时自动离开频道；不过，在必要时你可以使用它返回的函数，以编程方式手动停止 / 开始监听频道：

```js tab=React
import { useEcho } from "@laravel/echo-react";

const { leaveChannel, leave, stopListening, listen } = useEcho(
    `orders.${orderId}`,
    "OrderShipmentStatusUpdated",
    (e) => {
        console.log(e.order);
    },
);

// 停止监听而不离开频道……
stopListening();

// 重新开始监听……
listen();

// 离开频道……
leaveChannel();

// 离开频道以及与之关联的私有与在线状态频道……
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

// 停止监听而不离开频道……
stopListening();

// 重新开始监听……
listen();

// 离开频道……
leaveChannel();

// 离开频道以及与之关联的私有与在线状态频道……
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

// 停止监听而不离开频道……
stopListening();

// 重新开始监听……
listen();

// 离开频道……
leaveChannel();

// 离开频道以及与之关联的私有与在线状态频道……
leave();
</script>
```

<a name="react-vue-connecting-to-public-channels"></a>
#### 连接到公开频道

要连接到公开频道，你可以使用 `useEchoPublic` hook：

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

<a name="react-vue-connecting-to-presence-channels"></a>
#### 连接到在线状态频道

要连接到在线状态频道，你可以使用 `useEchoPresence` hook：

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

<a name="react-vue-connection-status"></a>
#### 连接状态

你可以使用 `useConnectionStatus` hook 获取当前的 WebSocket 连接状态，它提供响应式的状态，会在连接状态改变时自动更新：

```js tab=React
import { useConnectionStatus } from "@laravel/echo-react";

function ConnectionIndicator() {
    const status = useConnectionStatus();

    return <div>连接状态：{status}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useConnectionStatus } from "@laravel/echo-vue";

const status = useConnectionStatus();
</script>

<template>
    <div>连接状态：{{ status }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useConnectionStatus } from "@laravel/echo-svelte";

const status = useConnectionStatus();
</script>

<div>连接状态：{status()}</div>
```

可能的状态值有：

<div class="content-list" markdown="1">

- `connected` - 已成功连接到 WebSocket 服务器。
- `connecting` - 正在进行首次连接尝试。
- `reconnecting` - 在断开后尝试重新连接。
- `disconnected` - 未连接，且未尝试重新连接。
- `failed` - 连接失败，且不会重试。

</div>

<a name="react-vue-socket-id"></a>
#### Socket ID

你可以使用 `useSocketId` hook 获取当前的 WebSocket socket ID，它提供响应式的值，会在连接以新的 socket ID 重新连接时自动更新：

```js tab=React
import { useSocketId } from "@laravel/echo-react";

function SocketIndicator() {
    const socketId = useSocketId();

    return <div>Socket ID：{socketId}</div>;
}
```

```vue tab=Vue
<script setup lang="ts">
import { useSocketId } from "@laravel/echo-vue";

const socketId = useSocketId();
</script>

<template>
    <div>Socket ID：{{ socketId }}</div>
</template>
```

```svelte tab=Svelte
<script>
import { useSocketId } from "@laravel/echo-svelte";

const socketId = useSocketId();
</script>

<div>Socket ID：{socketId()}</div>
```

<a name="presence-channels"></a>
## 在线状态频道

在线状态频道在私有频道安全性的基础上，增加了"感知谁订阅了该频道"这一额外特性。这让构建强大、协作式的应用功能变得轻松，例如当用户正在查看同一页面时通知其他用户，或列出聊天室中的成员。

<a name="authorizing-presence-channels"></a>
### 授权在线状态频道

所有在线状态频道也都是私有频道；因此，用户必须 [被授权访问它们](#authorizing-channels)。不过，在为在线状态频道定义授权回调时，如果用户被授权加入该频道，你不会返回 `true`。相反，你应该返回一个关于该用户的数据数组。

授权回调返回的数据将对你的 JavaScript 应用中的在线状态频道事件监听器可用。如果用户未被授权加入在线状态频道，你应该返回 `false` 或 `null`：

```php
use App\Models\User;

Broadcast::channel('chat.{roomId}', function (User $user, int $roomId) {
    if ($user->canJoinRoom($roomId)) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
```

<a name="joining-presence-channels"></a>
### 加入在线状态频道

要加入一个在线状态频道，你可以使用 Echo 的 `join` 方法。`join` 方法会返回一个 `PresenceChannel` 实现，它在暴露 `listen` 方法的同时，还允许你订阅 `here`、`joining` 与 `leaving` 事件。

```js
Echo.join(`chat.${roomId}`)
    .here((users) => {
        // ……
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

`here` 回调会在频道成功加入后立即执行，并接收一个包含当前所有订阅该频道的其他用户信息的数组。`joining` 方法会在新用户加入频道时执行，而 `leaving` 方法会在用户离开频道时执行。`error` 方法会在认证端点返回非 200 的 HTTP 状态码，或者在解析返回的 JSON 时出错时执行。

<a name="broadcasting-to-presence-channels"></a>
### 向在线状态频道广播

在线状态频道可以像公开或私有频道一样接收事件。以聊天室为例，我们可能希望将 `NewMessage` 事件广播到该房间的在线状态频道。为此，我们将从事件的 `broadcastOn` 方法返回一个 `PresenceChannel` 实例：

```php
/**
 * 获取事件应当广播到的频道。
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

与其他事件一样，你可以使用 `broadcast` 辅助函数与 `toOthers` 方法来将当前用户排除在接收广播之外：

```php
broadcast(new NewMessage($message));

broadcast(new NewMessage($message))->toOthers();
```

与其他类型的事件一样，你可以使用 Echo 的 `listen` 方法来监听发送到在线状态频道的事件：

```js
Echo.join(`chat.${roomId}`)
    .here(/* …… */)
    .joining(/* …… */)
    .leaving(/* …… */)
    .listen('NewMessage', (e) => {
        // ……
    });
```

<a name="model-broadcasting"></a>
## 模型广播

> [!WARNING]
> 在阅读以下关于模型广播的文档之前，我们建议你先熟悉 Laravel 模型广播服务的一般概念，以及如何手动创建和监听广播事件。

当应用的 [Eloquent 模型](/docs/{{version}}/eloquent) 被创建、更新或删除时，广播事件是很常见的。当然，这可以通过手动 [为 Eloquent 模型状态变化定义自定义事件](/docs/{{version}}/eloquent#events) 并用 `ShouldBroadcast` 接口标记这些事件来轻松实现。

不过，如果你在应用中不为其他目的使用这些事件，仅仅为了广播而创建事件类会显得很繁琐。为解决这个问题，Laravel 允许你指示某个 Eloquent 模型应当自动广播其状态变化。

要开始使用，你的 Eloquent 模型应当使用 `Illuminate\Database\Eloquent\BroadcastsEvents` trait。此外，模型应当定义一个 `broadcastOn` 方法，该方法将返回一个数组，包含模型的事件应当广播到的频道：

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
     * 获取模型事件应当广播到的频道。
     *
     * @return array<int, \Illuminate\Broadcasting\Channel|\Illuminate\Database\Eloquent\Model>
     */
    public function broadcastOn(string $event): array
    {
        return [$this, $this->user];
    }
}
```

一旦你的模型包含了这个 trait 并定义了它的广播频道，它就会在模型实例被创建、更新、删除、软删除或恢复时开始自动广播事件。

此外，你可能已经注意到 `broadcastOn` 方法接收一个字符串 `$event` 参数。该参数包含模型上发生的事件类型，其值为 `created`、`updated`、`deleted`、`trashed` 或 `restored`。通过检查此变量的值，你可以确定模型应当为特定事件广播到哪些频道（如果有的话）：

```php
/**
 * 获取模型事件应当广播到的频道。
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
#### 自定义模型广播事件创建

有时，你可能希望自定义 Laravel 创建底层模型广播事件的方式。你可以通过在 Eloquent 模型上定义 `newBroadcastableEvent` 方法来实现。该方法应当返回一个 `Illuminate\Database\Eloquent\BroadcastableModelEventOccurred` 实例：

```php
use Illuminate\Database\Eloquent\BroadcastableModelEventOccurred;

/**
 * 为模型创建一个新的可广播模型事件。
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

你可能已经注意到，上面模型示例中的 `broadcastOn` 方法并没有返回 `Channel` 实例，而是直接返回了 Eloquent 模型。如果模型的 `broadcastOn` 方法返回了一个 Eloquent 模型实例（或者返回了一个包含在该方法返回的数组中的实例），Laravel 会使用模型的类名与主键标识符作为频道名称，自动为该模型实例化一个私有频道实例。

因此，一个 `id` 为 `1` 的 `App\Models\User` 模型会被转换为一个名称为 `App.Models.User.1` 的 `Illuminate\Broadcasting\PrivateChannel` 实例。当然，除了从模型的 `broadcastOn` 方法返回 Eloquent 模型实例之外，你也可以返回完整的 `Channel` 实例，以完全控制模型的频道名称：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取模型事件应当广播到的频道。
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

如果你打算从模型的 `broadcastOn` 方法显式返回一个频道实例，你可以将一个 Eloquent 模型实例传给该频道的构造函数。这样做时，Laravel 会使用上面讨论的模型频道约定，将 Eloquent 模型转换为频道名称字符串：

```php
return [new Channel($this->user)];
```

如果你需要确定某个模型的频道名称，可以在任何模型实例上调用 `broadcastChannel` 方法。例如，对于 `id` 为 `1` 的 `App\Models\User` 模型，该方法会返回字符串 `App.Models.User.1`：

```php
$user->broadcastChannel();
```

<a name="model-broadcasting-event-conventions"></a>
#### 事件约定

由于模型广播事件与应用 `App\Events` 目录中的"真实"事件没有关联，它们会基于约定被分配一个名称与负载。Laravel 的约定是使用模型的类名（不含命名空间）与触发广播的模型事件名称来广播该事件。

因此，例如，对 `App\Models\Post` 模型的更新会向你的客户端应用广播一个名为 `PostUpdated` 的事件，并附带以下负载：

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

对 `App\Models\User` 模型的删除会广播一个名为 `UserDeleted` 的事件。

如果你愿意，可以通过在模型上添加 `broadcastAs` 与 `broadcastWith` 方法来定义自定义的广播名称与负载。这些方法接收正在发生的模型事件 / 操作的名称，让你能够为每个模型操作自定义事件的名称与负载。如果从 `broadcastAs` 方法返回 `null`，Laravel 在广播事件时将使用上面讨论的模型广播事件名称约定：

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
 * 获取要为该模型广播的数据。
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

一旦你在模型上添加了 `BroadcastsEvents` trait 并定义了模型的 `broadcastOn` 方法，你就可以开始在客户端应用中监听广播的模型事件了。在开始之前，你可能希望查阅关于 [监听事件](#listening-for-events) 的完整文档。

首先，使用 `private` 方法获取一个频道实例，然后调用 `listen` 方法来监听指定的事件。通常，传给 `private` 方法的频道名称应当对应 Laravel 的 [模型广播约定](#model-broadcasting-conventions)。

一旦你获取了频道实例，就可以使用 `listen` 方法来监听特定事件。由于模型广播事件与应用 `App\Events` 目录中的"真实"事件没有关联，[事件名称](#model-broadcasting-event-conventions) 必须以 `.` 为前缀，以表明它不属于某个特定的命名空间。每个模型广播事件都有一个 `model` 属性，其中包含模型所有可广播的属性：

```js
Echo.private(`App.Models.User.${this.user.id}`)
    .listen('.UserUpdated', (e) => {
        console.log(e.model);
    });
```

<a name="model-broadcasts-with-react-or-vue"></a>
#### 使用 React、Vue 或 Svelte

如果你正在使用 React、Vue 或 Svelte，可以使用 Laravel Echo 内置的 `useEchoModel` hook 轻松监听模型广播：

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

你还可以指定模型事件负载数据的形态，从而提供更好的类型安全与编辑便利：

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
> 使用 [Pusher Channels](https://pusher.com/channels) 时，你必须在 [应用面板](https://dashboard.pusher.com/) 的"App Settings"部分启用"Client Events"选项，才能发送客户端事件。

有时你可能希望将事件广播给其他已连接的客户端，而完全不触及你的 Laravel 应用。这对于"正在输入"通知之类的事情特别有用，你想用它来提醒你的应用中的用户，另一个用户正在某个给定屏幕上输入消息。

要广播客户端事件，你可以使用 Echo 的 `whisper` 方法：

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

要监听客户端事件，你可以使用 `listenForWhisper` 方法：

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

<a name="notifications"></a>
## 通知

通过将事件广播与 [通知](/docs/{{version}}/notifications) 结合，你的 JavaScript 应用可以在通知发生时实时接收新通知，而无需刷新页面。在开始之前，请务必阅读关于使用 [广播通知频道](/docs/{{version}}/notifications#broadcast-notifications) 的文档。

一旦你配置好一个使用广播频道（broadcast channel）的通知，就可以使用 Echo 的 `notification` 方法监听广播事件。请记住，频道名称应当与接收通知的实体类名相匹配：

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

在这个例子中，所有通过 `broadcast` 频道发送给 `App\Models\User` 实例的通知都会被该回调接收。针对 `App.Models.User.{id}` 频道的频道授权回调已包含在你应用的 `routes/channels.php` 文件中。

<a name="stop-listening-for-notifications"></a>
#### 停止监听通知

如果你希望在 [离开频道](#leaving-a-channel) 之前停止监听通知，可以使用 `stopListeningForNotification` 方法：

```js
const callback = (notification) => {
    console.log(notification.type);
}

// 开始监听……
Echo.private(`App.Models.User.${userId}`)
    .notification(callback);

// 停止监听（回调必须相同）……
Echo.private(`App.Models.User.${userId}`)
    .stopListeningForNotification(callback);
```
