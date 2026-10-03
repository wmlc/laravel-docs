# 广播

- [简介](#introduction)
- [服务端安装](#server-side-installation)
    - [配置](#configuration)
    - [Pusher Channels](#pusher-channels)
    - [Ably](#ably)
    - [开源替代方案](#open-source-alternatives)
- [客户端安装](#client-side-installation)
    - [Pusher Channels](#client-pusher-channels)
    - [Ably](#client-ably)
- [概念概述](#concept-overview)
    - [使用示例应用](#using-example-application)
- [定义广播事件](#defining-broadcast-events)
    - [广播名称](#broadcast-name)
    - [广播数据](#broadcast-data)
    - [广播队列](#broadcast-queue)
    - [广播条件](#broadcast-conditions)
    - [广播与数据库事务](#broadcasting-and-database-transactions)
- [频道授权](#authorizing-channels)
    - [定义授权路由](#defining-authorization-routes)
    - [定义授权回调](#defining-authorization-callbacks)
    - [定义频道类](#defining-channel-classes)
- [广播事件](#broadcasting-events)
    - [仅广播给他人](#only-to-others)
    - [自定义连接](#customizing-the-connection)
- [接收广播](#receiving-broadcasts)
    - [监听事件](#listening-for-events)
    - [离开频道](#leaving-a-channel)
    - [命名空间](#namespaces)
- [Presence 频道](#presence-channels)
    - [授权 Presence 频道](#authorizing-presence-channels)
    - [加入 Presence 频道](#joining-presence-channels)
    - [向 Presence 频道广播](#broadcasting-to-presence-channels)
- [模型广播](#model-broadcasting)
    - [模型广播约定](#model-broadcasting-conventions)
    - [监听模型广播](#listening-for-model-broadcasts)
- [客户端事件](#client-events)
- [通知](#notifications)

<a name="introduction"></a>
## 简介

在许多现代 Web 应用中，WebSockets 被用于实现实时、实时更新的用户界面。当服务器上的某些数据被更新时，通常会通过 WebSocket 连接发送一条消息，由客户端进行处理。WebSockets 提供了一种更高效的替代方案，无需不断地轮询应用服务器来获取应反映到 UI 中的数据变更。

例如，假设你的应用能够将用户数据导出为 CSV 文件并通过邮件发送给他们。但是，创建此 CSV 文件需要几分钟时间，因此你选择在[队列任务](/docs/{{version}}/queues)中创建并发送 CSV。当 CSV 创建完成并通过邮件发送给用户后，我们可以使用事件广播来分发 `App\Events\UserDataExported` 事件，由应用的 JavaScript 接收。一旦接收到该事件，我们就可以向用户显示一条消息，告知 CSV 已通过邮件发送给他们，而他们无需刷新页面。

为了帮助你构建此类功能，Laravel 让你能轻松地通过 WebSocket 连接"广播"服务端的 Laravel [事件](/docs/{{version}}/events)。广播 Laravel 事件让你能在服务端 Laravel 应用和客户端 JavaScript 应用之间共享相同的事件名称和数据。

广播的核心概念很简单：客户端在前端连接到命名频道，而你的 Laravel 应用在后端向这些频道广播事件。这些事件可以包含你希望提供给前端的任何额外数据。

<a name="supported-drivers"></a>
#### 支持的驱动

默认情况下，Laravel 包含两个服务端广播驱动供你选择：[Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com)。不过，社区驱动的扩展包如 [laravel-websockets](https://beyondco.de/docs/laravel-websockets/getting-started/introduction) 和 [soketi](https://docs.soketi.app/) 提供了额外的广播驱动，无需商业广播服务提供商。

> **Note**  
> 在深入了解事件广播之前，请确保你已阅读 Laravel 关于[事件和监听器](/docs/{{version}}/events)的文档。

<a name="server-side-installation"></a>
## 服务端安装

要开始使用 Laravel 的事件广播，我们需要在 Laravel 应用中进行一些配置，并安装几个扩展包。

事件广播由服务端广播驱动完成，它将你的 Laravel 事件广播出去，以便 Laravel Echo（一个 JavaScript 库）能在浏览器客户端接收它们。别担心——我们会逐步讲解安装过程的每个部分。

<a name="configuration"></a>
### 配置

应用的所有事件广播配置都存储在 `config/broadcasting.php` 配置文件中。Laravel 开箱即支持多种广播驱动：[Pusher Channels](https://pusher.com/channels)、[Redis](/docs/{{version}}/redis) 以及用于本地开发和调试的 `log` 驱动。此外，还包含一个 `null` 驱动，允许你在测试期间完全禁用广播。`config/broadcasting.php` 配置文件中为这些驱动都提供了配置示例。

<a name="broadcast-service-provider"></a>
#### 广播服务提供者

在广播任何事件之前，你首先需要注册 `App\Providers\BroadcastServiceProvider`。在新的 Laravel 应用中，你只需在 `config/app.php` 配置文件的 `providers` 数组中取消注释该提供者即可。此 `BroadcastServiceProvider` 包含注册广播授权路由和回调所需的代码。

<a name="queue-configuration"></a>
#### 队列配置

你还需要配置并运行[队列工作者](/docs/{{version}}/queues)。所有事件广播都通过队列任务完成，这样应用的响应时间就不会因事件广播而受到严重影响。

<a name="pusher-channels"></a>
### Pusher Channels

如果你计划使用 [Pusher Channels](https://pusher.com/channels) 广播事件，应使用 Composer 包管理器安装 Pusher Channels PHP SDK：

```shell
composer require pusher/pusher-php-server
```

接下来，你应在 `config/broadcasting.php` 配置文件中配置 Pusher Channels 凭证。此文件中已包含 Pusher Channels 配置示例，让你能快速指定 key、secret 和应用 ID。通常，这些值应通过 `PUSHER_APP_KEY`、`PUSHER_APP_SECRET` 和 `PUSHER_APP_ID` [环境变量](/docs/{{version}}/configuration#environment-configuration)来设置：

```ini
PUSHER_APP_ID=your-pusher-app-id
PUSHER_APP_KEY=your-pusher-key
PUSHER_APP_SECRET=your-pusher-secret
PUSHER_APP_CLUSTER=mt1
```

`config/broadcasting.php` 文件的 `pusher` 配置还允许你指定 Channels 支持的额外 `options`，例如集群。

接下来，你需要在 `.env` 文件中将广播驱动改为 `pusher`：

```ini
BROADCAST_DRIVER=pusher
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation) 了，它将在客户端接收广播事件。

<a name="pusher-compatible-open-source-alternatives"></a>
#### 开源 Pusher 替代方案

[laravel-websockets](https://github.com/beyondcode/laravel-websockets) 和 [soketi](https://docs.soketi.app/) 扩展包为 Laravel 提供了 Pusher 兼容的 WebSocket 服务器。这些扩展包让你无需商业 WebSocket 服务提供商即可充分利用 Laravel 广播的强大功能。有关安装和使用这些扩展包的更多信息，请参阅我们关于[开源替代方案](#open-source-alternatives)的文档。

<a name="ably"></a>
### Ably

如果你计划使用 [Ably](https://ably.com) 广播事件，应使用 Composer 包管理器安装 Ably PHP SDK：

```shell
composer require ably/ably-php
```

接下来，你应在 `config/broadcasting.php` 配置文件中配置 Ably 凭证。此文件中已包含 Ably 配置示例，让你能快速指定 key。通常，此值应通过 `ABLY_KEY` [环境变量](/docs/{{version}}/configuration#environment-configuration)来设置：

```ini
ABLY_KEY=your-ably-key
```

接下来，你需要在 `.env` 文件中将广播驱动改为 `ably`：

```ini
BROADCAST_DRIVER=ably
```

最后，你就可以安装并配置 [Laravel Echo](#client-side-installation) 了，它将在客户端接收广播事件。

<a name="open-source-alternatives"></a>
### 开源替代方案

<a name="open-source-alternatives-php"></a>
#### PHP

[laravel-websockets](https://github.com/beyondcode/laravel-websockets) 扩展包是一个纯 PHP、Pusher 兼容的 Laravel WebSocket 扩展包。此扩展包让你无需商业 WebSocket 服务提供商即可充分利用 Laravel 广播的强大功能。有关安装和使用此扩展包的更多信息，请参阅其[官方文档](https://beyondco.de/docs/laravel-websockets)。

<a name="open-source-alternatives-node"></a>
#### Node

[Soketi](https://github.com/soketi/soketi) 是一个基于 Node、Pusher 兼容的 Laravel WebSocket 服务器。在底层，Soketi 利用 µWebSockets.js 实现极高的可扩展性和速度。此扩展包让你无需商业 WebSocket 服务提供商即可充分利用 Laravel 广播的强大功能。有关安装和使用此扩展包的更多信息，请参阅其[官方文档](https://docs.soketi.app/)。

<a name="client-side-installation"></a>
## 客户端安装

<a name="client-pusher-channels"></a>
### Pusher Channels

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让订阅频道和监听由服务端广播驱动广播的事件变得轻而易举。你可以通过 NPM 包管理器安装 Echo。在此示例中，我们还将安装 `pusher-js` 扩展包，因为我们将使用 Pusher Channels 广播器：

```shell
npm install --save-dev laravel-echo pusher-js
```

安装 Echo 后，你就可以在应用的 JavaScript 中创建一个全新的 Echo 实例。一个理想的位置是 Laravel 框架附带的 `resources/js/bootstrap.js` 文件底部。默认情况下，此文件中已包含 Echo 配置示例——你只需取消注释即可：

```js
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

根据你的需求取消注释并调整 Echo 配置后，你就可以编译应用的资源：

```shell
npm run dev
```

> **Note**  
> 要了解更多关于编译应用 JavaScript 资源的信息，请查阅 [Vite](/docs/{{version}}/vite) 的文档。

<a name="using-an-existing-client-instance"></a>
#### 使用现有客户端实例

如果你已经有一个预配置的 Pusher Channels 客户端实例并希望 Echo 使用它，可以通过 `client` 配置选项将其传递给 Echo：

```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const options = {
    broadcaster: 'pusher',
    key: 'your-pusher-channels-key'
}

window.Echo = new Echo({
    ...options,
    client: new Pusher(options.key, options)
});
```

<a name="client-ably"></a>
### Ably

[Laravel Echo](https://github.com/laravel/echo) 是一个 JavaScript 库，让订阅频道和监听由服务端广播驱动广播的事件变得轻而易举。你可以通过 NPM 包管理器安装 Echo。在此示例中，我们还将安装 `pusher-js` 扩展包。

你可能想知道为什么我们使用 Ably 广播事件却要安装 `pusher-js` JavaScript 库。幸好，Ably 包含 Pusher 兼容模式，让我们在客户端应用中监听事件时可以使用 Pusher 协议：

```shell
npm install --save-dev laravel-echo pusher-js
```

**在继续之前，你应在 Ably 应用设置中启用 Pusher 协议支持。你可以在 Ably 应用设置面板的 "Protocol Adapter Settings" 部分启用此功能。**

安装 Echo 后，你就可以在应用的 JavaScript 中创建一个全新的 Echo 实例。一个理想的位置是 Laravel 框架附带的 `resources/js/bootstrap.js` 文件底部。默认情况下，此文件中已包含 Echo 配置示例；不过，`bootstrap.js` 文件中的默认配置是为 Pusher 设计的。你可以复制以下配置将配置切换为 Ably：

```js
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

注意，我们的 Ably Echo 配置引用了 `VITE_ABLY_PUBLIC_KEY` 环境变量。此变量的值应为你的 Ably 公钥。公钥是 Ably key 中 `:` 字符之前的部分。

根据你的需求取消注释并调整 Echo 配置后，你就可以编译应用的资源：

```shell
npm run dev
```

> **Note**  
> 要了解更多关于编译应用 JavaScript 资源的信息，请查阅 [Vite](/docs/{{version}}/vite) 的文档。

<a name="concept-overview"></a>
## 概念概述

Laravel 的事件广播允许你使用基于驱动的方式通过 WebSockets 将服务端 Laravel 事件广播到客户端 JavaScript 应用。目前，Laravel 内置了 [Pusher Channels](https://pusher.com/channels) 和 [Ably](https://ably.com) 驱动。使用 [Laravel Echo](#client-side-installation) JavaScript 包可以在客户端轻松消费这些事件。

事件通过"频道"广播，频道可以指定为公共或私有。应用的任何访问者都可以订阅公共频道，无需任何认证或授权；但是，要订阅私有频道，用户必须经过认证并授权才能监听该频道。

> **Note**  
> 如果你想探索 Pusher 的开源替代方案，请查看[开源替代方案](#open-source-alternatives)。

<a name="using-example-application"></a>
### 使用示例应用

在深入了解事件广播的每个组件之前，让我们以一个电商商店为例进行高层概览。

在我们的应用中，假设有一个页面允许用户查看其订单的发货状态。还假设当应用处理发货状态更新时会触发 `OrderShipmentStatusUpdated` 事件：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="the-shouldbroadcast-interface"></a>
#### `ShouldBroadcast` 接口

当用户查看其某个订单时，我们不希望他们必须刷新页面才能查看状态更新。相反，我们希望在更新产生时将其广播给应用。因此，我们需要用 `ShouldBroadcast` 接口标记 `OrderShipmentStatusUpdated` 事件。这将指示 Laravel 在事件触发时广播该事件：

```php
<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class OrderShipmentStatusUpdated implements ShouldBroadcast
{
    /**
     * 订单实例。
     *
     * @var \App\Order
     */
    public $order;
}
```

`ShouldBroadcast` 接口要求我们的事件定义一个 `broadcastOn` 方法。此方法负责返回事件应广播到的频道。生成的事件类上已定义了此方法的空存根，因此我们只需填充其细节。我们只希望订单的创建者能查看状态更新，因此我们将在与订单绑定的私有频道上广播该事件：

```php
/**
 * 获取事件应广播到的频道。
 *
 * @return \Illuminate\Broadcasting\PrivateChannel
 */
public function broadcastOn()
{
    return new PrivateChannel('orders.'.$this->order->id);
}
```

<a name="example-application-authorizing-channels"></a>
#### 频道授权

请记住，用户必须经过授权才能监听私有频道。我们可以在应用的 `routes/channels.php` 文件中定义频道授权规则。在此示例中，我们需要验证任何尝试监听私有 `orders.1` 频道的用户是否确实是该订单的创建者：

```php
use App\Models\Order;

Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道名称和一个返回 `true` 或 `false` 的回调，指示用户是否被授权监听该频道。

所有授权回调都将当前认证用户作为第一个参数接收，任何额外的通配符参数作为后续参数。在此示例中，我们使用 `{orderId}` 占位符来表示频道名称的 "ID" 部分是一个通配符。

<a name="listening-for-event-broadcasts"></a>
#### 监听事件广播

接下来，剩下的就是在我们的 JavaScript 应用中监听该事件。我们可以使用 [Laravel Echo](#client-side-installation) 来完成。首先，我们使用 `private` 方法订阅私有频道。然后，我们可以使用 `listen` 方法监听 `OrderShipmentStatusUpdated` 事件。默认情况下，事件的所有公共属性都将包含在广播事件中：

```js
Echo.private(`orders.${orderId}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order);
    });
```

<a name="defining-broadcast-events"></a>
## 定义广播事件

要告知 Laravel 某个给定事件应被广播，你必须在事件类上实现 `Illuminate\Contracts\Broadcasting\ShouldBroadcast` 接口。此接口已导入到框架生成的所有事件类中，因此你可以轻松地将其添加到任何事件中。

`ShouldBroadcast` 接口要求你实现一个方法：`broadcastOn`。`broadcastOn` 方法应返回事件应广播到的频道或频道数组。频道应为 `Channel`、`PrivateChannel` 或 `PresenceChannel` 的实例。`Channel` 实例表示任何用户都可订阅的公共频道，而 `PrivateChannels` 和 `PresenceChannels` 表示需要[频道授权](#authorizing-channels)的私有频道：

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
     * 创建服务器的用户。
     *
     * @var \App\Models\User
     */
    public $user;

    /**
     * 创建新的事件实例。
     *
     * @param  \App\Models\User  $user
     * @return void
     */
    public function __construct(User $user)
    {
        $this->user = $user;
    }

    /**
     * 获取事件应广播到的频道。
     *
     * @return Channel|array
     */
    public function broadcastOn()
    {
        return new PrivateChannel('user.'.$this->user->id);
    }
}
```

实现 `ShouldBroadcast` 接口后，你只需像通常那样[触发事件](/docs/{{version}}/events)即可。一旦事件被触发，一个[队列任务](/docs/{{version}}/queues)将使用你指定的广播驱动自动广播该事件。

<a name="broadcast-name"></a>
### 广播名称

默认情况下，Laravel 将使用事件的类名广播事件。但是，你可以通过在事件上定义 `broadcastAs` 方法来自定义广播名称：

```php
/**
 * 事件的广播名称。
 *
 * @return string
 */
public function broadcastAs()
{
    return 'server.created';
}
```

如果你使用 `broadcastAs` 方法自定义了广播名称，应确保使用前导 `.` 字符注册监听器。这将指示 Echo 不要为事件添加应用命名空间前缀：

```js
.listen('.server.created', function (e) {
    ....
});
```

<a name="broadcast-data"></a>
### 广播数据

当事件被广播时，其所有 `public` 属性都会自动序列化并作为事件负载广播，让你能从 JavaScript 应用中访问其任何公共数据。因此，例如，如果你的事件有一个包含 Eloquent 模型的公共 `$user` 属性，则事件的广播负载将为：

```json
{
    "user": {
        "id": 1,
        "name": "Patrick Stewart"
        ...
    }
}
```

但是，如果你希望对广播负载进行更细粒度的控制，可以在事件中添加 `broadcastWith` 方法。此方法应返回你希望作为事件负载广播的数据数组：

```php
/**
 * 获取要广播的数据。
 *
 * @return array
 */
public function broadcastWith()
{
    return ['id' => $this->user->id];
}
```

<a name="broadcast-queue"></a>
### 广播队列

默认情况下，每个广播事件都会被放置在 `queue.php` 配置文件中指定的默认队列连接的默认队列上。你可以通过在事件类上定义 `connection` 和 `queue` 属性来自定义广播器使用的队列连接和名称：

```php
/**
 * 广播事件时使用的队列连接名称。
 *
 * @var string
 */
public $connection = 'redis';

/**
 * 放置广播任务的队列名称。
 *
 * @var string
 */
public $queue = 'default';
```

或者，你可以通过在事件上定义 `broadcastQueue` 方法来自定义队列名称：

```php
/**
 * 放置广播任务的队列名称。
 *
 * @return string
 */
public function broadcastQueue()
{
    return 'default';
}
```

如果你想使用 `sync` 队列而不是默认队列驱动来广播事件，可以实现 `ShouldBroadcastNow` 接口而不是 `ShouldBroadcast`：

```php
<?php

use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class OrderShipmentStatusUpdated implements ShouldBroadcastNow
{
    //
}
```

<a name="broadcast-conditions"></a>
### 广播条件

有时你只想在给定条件为真时才广播事件。你可以通过在事件类中添加 `broadcastWhen` 方法来定义这些条件：

```php
/**
 * 确定此事件是否应广播。
 *
 * @return bool
 */
public function broadcastWhen()
{
    return $this->order->value > 100;
}
```

<a name="broadcasting-and-database-transactions"></a>
#### 广播与数据库事务

当广播事件在数据库事务中分发时，它们可能在数据库事务提交之前就被队列处理。当这种情况发生时，你在数据库事务期间对模型或数据库记录所做的任何更新可能尚未反映到数据库中。此外，在事务内创建的任何模型或数据库记录可能尚不存在于数据库中。如果你的事件依赖于这些模型，当广播事件的任务被处理时可能会发生意外错误。

如果队列连接的 `after_commit` 配置选项设置为 `false`，你仍可以通过在事件类上定义 `$afterCommit` 属性来指示特定广播事件应在所有打开的数据库事务提交后才分发：

```php
<?php

namespace App\Events;

use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class ServerCreated implements ShouldBroadcast
{
    use SerializesModels;

    public $afterCommit = true;
}
```

> **Note**  
> 要了解更多关于解决这些问题的方法，请查阅关于[队列任务和数据库事务](/docs/{{version}}/queues#jobs-and-database-transactions)的文档。

<a name="authorizing-channels"></a>
## 频道授权

私有频道要求你授权当前认证用户确实可以监听该频道。这通过向你的 Laravel 应用发送包含频道名称的 HTTP 请求来完成，让你的应用确定用户是否可以监听该频道。使用 [Laravel Echo](#client-side-installation) 时，授权私有频道订阅的 HTTP 请求会自动发出；但是，你确实需要定义适当的路由来响应这些请求。

<a name="defining-authorization-routes"></a>
### 定义授权路由

幸好，Laravel 让定义响应频道授权请求的路由变得简单。在 Laravel 应用附带的 `App\Providers\BroadcastServiceProvider` 中，你会看到对 `Broadcast::routes` 方法的调用。此方法将注册 `/broadcasting/auth` 路由来处理授权请求：

```php
Broadcast::routes();
```

`Broadcast::routes` 方法会自动将其路由放在 `web` 中间件组中；但是，如果你想自定义分配的属性，可以向该方法传递一个路由属性数组：

```php
Broadcast::routes($attributes);
```

<a name="customizing-the-authorization-endpoint"></a>
#### 自定义授权端点

默认情况下，Echo 将使用 `/broadcasting/auth` 端点来授权频道访问。但是，你可以通过将 `authEndpoint` 配置选项传递给 Echo 实例来指定自己的授权端点：

```js
window.Echo = new Echo({
    broadcaster: 'pusher',
    // ...
    authEndpoint: '/custom/endpoint/auth'
});
```

<a name="customizing-the-authorization-request"></a>
#### 自定义授权请求

你可以通过在初始化 Echo 时提供自定义授权器来自定义 Laravel Echo 执行授权请求的方式：

```js
window.Echo = new Echo({
    // ...
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                axios.post('/api/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                })
                .then(response => {
                    callback(null, response.data);
                })
                .catch(error => {
                    callback(error);
                });
            }
        };
    },
})
```

<a name="defining-authorization-callbacks"></a>
### 定义授权回调

接下来，我们需要定义实际确定当前认证用户是否可以监听给定频道的逻辑。这在应用附带的 `routes/channels.php` 文件中完成。在此文件中，你可以使用 `Broadcast::channel` 方法注册频道授权回调：

```php
Broadcast::channel('orders.{orderId}', function ($user, $orderId) {
    return $user->id === Order::findOrNew($orderId)->user_id;
});
```

`channel` 方法接受两个参数：频道名称和一个返回 `true` 或 `false` 的回调，指示用户是否被授权监听该频道。

所有授权回调都将当前认证用户作为第一个参数接收，任何额外的通配符参数作为后续参数。在此示例中，我们使用 `{orderId}` 占位符来表示频道名称的 "ID" 部分是一个通配符。

<a name="authorization-callback-model-binding"></a>
#### 授权回调模型绑定

与 HTTP 路由一样，频道路由也可以利用隐式和显式的[路由模型绑定](/docs/{{version}}/routing#route-model-binding)。例如，你可以请求实际的 `Order` 模型实例，而不是接收字符串或数字订单 ID：

```php
use App\Models\Order;

Broadcast::channel('orders.{order}', function ($user, Order $order) {
    return $user->id === $order->user_id;
});
```

> **Warning**  
> 与 HTTP 路由模型绑定不同，频道模型绑定不支持自动[隐式模型绑定范围](/docs/{{version}}/routing#implicit-model-binding-scoping)。不过，这很少成为问题，因为大多数频道可以基于单个模型的唯一主键来确定范围。

<a name="authorization-callback-authentication"></a>
#### 授权回调认证

私有和 presence 广播频道通过应用的默认认证守卫来认证当前用户。如果用户未通过认证，频道授权将自动被拒绝，授权回调也不会执行。但是，你可以分配多个自定义守卫，以便在必要时认证传入请求：

```php
Broadcast::channel('channel', function () {
    // ...
}, ['guards' => ['web', 'admin']]);
```

<a name="defining-channel-classes"></a>
### 定义频道类

如果你的应用消费许多不同的频道，`routes/channels.php` 文件可能会变得臃肿。因此，除了使用闭包来授权频道外，你还可以使用频道类。要生成频道类，使用 `make:channel` Artisan 命令。此命令将在 `App/Broadcasting` 目录中放置一个新的频道类。

```shell
php artisan make:channel OrderChannel
```

接下来，在 `routes/channels.php` 文件中注册你的频道：

```php
use App\Broadcasting\OrderChannel;

Broadcast::channel('orders.{order}', OrderChannel::class);
```

最后，你可以将频道的授权逻辑放在频道类的 `join` 方法中。此 `join` 方法将包含你通常会放在频道授权闭包中的相同逻辑。你还可以利用频道模型绑定：

```php
<?php

namespace App\Broadcasting;

use App\Models\Order;
use App\Models\User;

class OrderChannel
{
    /**
     * 创建新的频道实例。
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    /**
     * 认证用户对频道的访问。
     *
     * @param  \App\Models\User  $user
     * @param  \App\Models\Order  $order
     * @return array|bool
     */
    public function join(User $user, Order $order)
    {
        return $user->id === $order->user_id;
    }
}
```

> **Note**  
> 与 Laravel 中的许多其他类一样，频道类将由[服务容器](/docs/{{version}}/container)自动解析。因此，你可以在频道的构造函数中类型提示所需的任何依赖。

<a name="broadcasting-events"></a>
## 广播事件

一旦你定义了事件并用 `ShouldBroadcast` 接口标记它，你只需使用事件的 dispatch 方法触发事件即可。事件分发器会注意到该事件被标记了 `ShouldBroadcast` 接口，并将事件排队等待广播：

```php
use App\Events\OrderShipmentStatusUpdated;

OrderShipmentStatusUpdated::dispatch($order);
```

<a name="only-to-others"></a>
### 仅广播给他人

在构建使用事件广播的应用时，你可能偶尔需要将事件广播给给定频道的所有订阅者，但当前用户除外。你可以使用 `broadcast` 助手和 `toOthers` 方法来实现：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->toOthers();
```

为了更好地理解何时可能需要使用 `toOthers` 方法，让我们想象一个任务列表应用，用户可以通过输入任务名称来创建新任务。要创建任务，你的应用可能会向 `/task` URL 发出请求，广播任务的创建并返回新任务的 JSON 表示。当你的 JavaScript 应用从端点收到响应时，它可能会直接将新任务插入到任务列表中，如下所示：

```js
axios.post('/task', task)
    .then((response) => {
        this.tasks.push(response.data);
    });
```

但是，请记住我们也会广播任务的创建。如果你的 JavaScript 应用也在监听此事件以便将任务添加到任务列表中，你的列表中将有重复的任务：一个来自端点，一个来自广播。你可以使用 `toOthers` 方法解决此问题，指示广播器不要将事件广播给当前用户。

> **Warning**  
> 你的事件必须使用 `Illuminate\Broadcasting\InteractsWithSockets` trait 才能调用 `toOthers` 方法。

<a name="only-to-others-configuration"></a>
#### 配置

当你初始化 Laravel Echo 实例时，会为连接分配一个 socket ID。如果你使用全局 [Axios](https://github.com/mzabriskie/axios) 实例从 JavaScript 应用发出 HTTP 请求，socket ID 将自动作为 `X-Socket-ID` 头附加到每个发出的请求上。然后，当你调用 `toOthers` 方法时，Laravel 会从头中提取 socket ID，并指示广播器不要广播到任何具有该 socket ID 的连接。

如果你不使用全局 Axios 实例，则需要手动配置 JavaScript 应用在所有发出的请求中发送 `X-Socket-ID` 头。你可以使用 `Echo.socketId` 方法获取 socket ID：

```js
var socketId = Echo.socketId();
```

<a name="customizing-the-connection"></a>
### 自定义连接

如果你的应用与多个广播连接交互，并且希望使用非默认的广播器广播事件，可以使用 `via` 方法指定将事件推送到哪个连接：

```php
use App\Events\OrderShipmentStatusUpdated;

broadcast(new OrderShipmentStatusUpdated($update))->via('pusher');
```

或者，你可以通过在事件构造函数中调用 `broadcastVia` 方法来指定事件的广播连接。但是，在这样做之前，应确保事件类使用了 `InteractsWithBroadcasting` trait：

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
     *
     * @return void
     */
    public function __construct()
    {
        $this->broadcastVia('pusher');
    }
}
```

<a name="receiving-broadcasts"></a>
## 接收广播

<a name="listening-for-events"></a>
### 监听事件

一旦你[安装并实例化了 Laravel Echo](#client-side-installation)，就可以开始监听从 Laravel 应用广播的事件了。首先，使用 `channel` 方法获取频道实例，然后调用 `listen` 方法监听指定事件：

```js
Echo.channel(`orders.${this.order.id}`)
    .listen('OrderShipmentStatusUpdated', (e) => {
        console.log(e.order.name);
    });
```

如果你想监听私有频道上的事件，请改用 `private` 方法。你可以继续链式调用 `listen` 方法来监听单个频道上的多个事件：

```js
Echo.private(`orders.${this.order.id}`)
    .listen(/* ... */)
    .listen(/* ... */)
    .listen(/* ... */);
```

<a name="stop-listening-for-events"></a>
#### 停止监听事件

如果你想停止监听给定事件但不[离开频道](#leaving-a-channel)，可以使用 `stopListening` 方法：

```js
Echo.private(`orders.${this.order.id}`)
    .stopListening('OrderShipmentStatusUpdated')
```

<a name="leaving-a-channel"></a>
### 离开频道

要离开频道，可以在 Echo 实例上调用 `leaveChannel` 方法：

```js
Echo.leaveChannel(`orders.${this.order.id}`);
```

如果你想离开频道及其关联的私有和 presence 频道，可以调用 `leave` 方法：

```js
Echo.leave(`orders.${this.order.id}`);
```
<a name="namespaces"></a>
### 命名空间

你可能已经注意到在上面的示例中，我们没有为事件类指定完整的 `App\Events` 命名空间。这是因为 Echo 会自动假设事件位于 `App\Events` 命名空间中。但是，你可以在实例化 Echo 时通过传递 `namespace` 配置选项来配置根命名空间：

```js
window.Echo = new Echo({
    broadcaster: 'pusher',
    // ...
    namespace: 'App.Other.Namespace'
});
```

或者，你可以在使用 Echo 订阅事件时用 `.` 前缀事件类。这将允许你始终指定完全限定的类名：

```js
Echo.channel('orders')
    .listen('.Namespace\\Event\\Class', (e) => {
        //
    });
```

<a name="presence-channels"></a>
## Presence 频道

Presence 频道建立在私有频道的安全性之上，同时暴露了感知谁订阅了该频道的额外功能。这使得构建强大的协作应用功能变得简单，例如当另一个用户正在查看同一页面时通知用户，或列出聊天室的成员。

<a name="authorizing-presence-channels"></a>
### 授权 Presence 频道

所有 presence 频道也都是私有频道；因此，用户必须[经过授权才能访问它们](#authorizing-channels)。但是，在为 presence 频道定义授权回调时，如果用户被授权加入频道，你不会返回 `true`。相反，你应该返回一个关于用户的数据数组。

授权回调返回的数据将提供给 JavaScript 应用中的 presence 频道事件监听器。如果用户未被授权加入 presence 频道，你应返回 `false` 或 `null`：

```php
Broadcast::channel('chat.{roomId}', function ($user, $roomId) {
    if ($user->canJoinRoom($roomId)) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
```

<a name="joining-presence-channels"></a>
### 加入 Presence 频道

要加入 presence 频道，可以使用 Echo 的 `join` 方法。`join` 方法将返回一个 `PresenceChannel` 实现，除了暴露 `listen` 方法外，还允许你订阅 `here`、`joining` 和 `leaving` 事件。

```js
Echo.join(`chat.${roomId}`)
    .here((users) => {
        //
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

`here` 回调将在成功加入频道后立即执行，并接收一个包含当前订阅该频道的所有其他用户信息的数组。`joining` 方法将在新用户加入频道时执行，而 `leaving` 方法将在用户离开频道时执行。`error` 方法将在认证端点返回非 200 的 HTTP 状态码或解析返回的 JSON 出现问题时执行。

<a name="broadcasting-to-presence-channels"></a>
### 向 Presence 频道广播

Presence 频道可以像公共或私有频道一样接收事件。以聊天室为例，我们可能希望将 `NewMessage` 事件广播到房间的 presence 频道。为此，我们将从事件的 `broadcastOn` 方法返回一个 `PresenceChannel` 实例：

```php
/**
 * 获取事件应广播到的频道。
 *
 * @return Channel|array
 */
public function broadcastOn()
{
    return new PresenceChannel('room.'.$this->message->room_id);
}
```

与其他事件一样，你可以使用 `broadcast` 助手和 `toOthers` 方法将当前用户排除在接收广播之外：

```php
broadcast(new NewMessage($message));

broadcast(new NewMessage($message))->toOthers();
```

与其他类型的事件一样，你可以使用 Echo 的 `listen` 方法监听发送到 presence 频道的事件：

```js
Echo.join(`chat.${roomId}`)
    .here(/* ... */)
    .joining(/* ... */)
    .leaving(/* ... */)
    .listen('NewMessage', (e) => {
        //
    });
```

<a name="model-broadcasting"></a>
## 模型广播

> **Warning**  
> 在阅读以下关于模型广播的文档之前，我们建议你先熟悉 Laravel 模型广播服务的一般概念，以及如何手动创建和监听广播事件。

当应用的 [Eloquent 模型](/docs/{{version}}/eloquent)被创建、更新或删除时，广播事件是很常见的。当然，这可以通过手动[为 Eloquent 模型状态变更定义自定义事件](/docs/{{version}}/eloquent#events)并用 `ShouldBroadcast` 接口标记这些事件来轻松实现。

但是，如果你没有将这些事件用于应用中的其他目的，仅为广播它们而创建事件类会很麻烦。为解决此问题，Laravel 允许你指示 Eloquent 模型自动广播其状态变更。

要开始使用，你的 Eloquent 模型应使用 `Illuminate\Database\Eloquent\BroadcastsEvents` trait。此外，模型应定义一个 `broadcastOn` 方法，该方法将返回模型事件应广播到的频道数组：

```php
<?php

namespace App\Models;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Database\Eloquent\BroadcastsEvents;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    use BroadcastsEvents, HasFactory;

    /**
     * 获取帖子所属的用户。
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 获取模型事件应广播到的频道。
     *
     * @param  string  $event
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn($event)
    {
        return [$this, $this->user];
    }
}
```

一旦你的模型包含此 trait 并定义了其广播频道，当模型实例被创建、更新、删除、软删除或恢复时，它将开始自动广播事件。

此外，你可能已经注意到 `broadcastOn` 方法接收一个字符串 `$event` 参数。此参数包含模型上发生的事件类型，其值将为 `created`、`updated`、`deleted`、`trashed` 或 `restored`。通过检查此变量的值，你可以确定模型应为特定事件广播到哪些频道（如果有）：

```php
/**
 * 获取模型事件应广播到的频道。
 *
 * @param  string  $event
 * @return \Illuminate\Broadcasting\Channel|array
 */
public function broadcastOn($event)
{
    return match ($event) {
        'deleted' => [],
        default => [$this, $this->user],
    };
}
```

<a name="customizing-model-broadcasting-event-creation"></a>
#### 自定义模型广播事件创建

有时，你可能希望自定义 Laravel 创建底层模型广播事件的方式。你可以通过在 Eloquent 模型上定义 `newBroadcastableEvent` 方法来实现。此方法应返回一个 `Illuminate\Database\Eloquent\BroadcastableModelEventOccurred` 实例：

```php
use Illuminate\Database\Eloquent\BroadcastableModelEventOccurred;

/**
 * 为模型创建新的可广播模型事件。
 *
 * @param  string  $event
 * @return \Illuminate\Database\Eloquent\BroadcastableModelEventOccurred
 */
protected function newBroadcastableEvent($event)
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

你可能已经注意到，上面模型示例中的 `broadcastOn` 方法没有返回 `Channel` 实例。相反，直接返回了 Eloquent 模型。如果模型的 `broadcastOn` 方法返回一个 Eloquent 模型实例（或包含在该方法返回的数组中），Laravel 将使用模型的类名和主键标识符作为频道名称，自动为模型实例化一个私有频道实例。

因此，`id` 为 `1` 的 `App\Models\User` 模型将被转换为名为 `App.Models.User.1` 的 `Illuminate\Broadcasting\PrivateChannel` 实例。当然，除了从模型的 `broadcastOn` 方法返回 Eloquent 模型实例外，你还可以返回完整的 `Channel` 实例，以便完全控制模型的频道名称：

```php
use Illuminate\Broadcasting\PrivateChannel;

/**
 * 获取模型事件应广播到的频道。
 *
 * @param  string  $event
 * @return \Illuminate\Broadcasting\Channel|array
 */
public function broadcastOn($event)
{
    return [new PrivateChannel('user.'.$this->id)];
}
```

如果你计划从模型的 `broadcastOn` 方法显式返回频道实例，可以将 Eloquent 模型实例传递给频道构造函数。这样做时，Laravel 将使用上面讨论的模型频道约定将 Eloquent 模型转换为频道名称字符串：

```php
return [new Channel($this->user)];
```

如果你需要确定模型的频道名称，可以在任何模型实例上调用 `broadcastChannel` 方法。例如，对于 `id` 为 `1` 的 `App\Models\User` 模型，此方法返回字符串 `App.Models.User.1`：

```php
$user->broadcastChannel()
```

<a name="model-broadcasting-event-conventions"></a>
#### 事件约定

由于模型广播事件不与应用 `App\Events` 目录中的"实际"事件关联，它们会根据约定被分配名称和负载。Laravel 的约定是使用模型的类名（不包含命名空间）和触发广播的模型事件名称来广播事件。

因此，例如，对 `App\Models\Post` 模型的更新将向客户端应用广播一个 `PostUpdated` 事件，其负载如下：

```json
{
    "model": {
        "id": 1,
        "title": "My first post"
        ...
    },
    ...
    "socket": "someSocketId",
}
```

`App\Models\User` 模型的删除将广播一个名为 `UserDeleted` 的事件。

如果你愿意，可以通过在模型中添加 `broadcastAs` 和 `broadcastWith` 方法来定义自定义广播名称和负载。这些方法接收正在发生的模型事件/操作名称，让你能为每个模型操作自定义事件的名称和负载。如果 `broadcastAs` 方法返回 `null`，Laravel 将在广播事件时使用上面讨论的模型广播事件名称约定：

```php
/**
 * 模型事件的广播名称。
 *
 * @param  string  $event
 * @return string|null
 */
public function broadcastAs($event)
{
    return match ($event) {
        'created' => 'post.created',
        default => null,
    };
}

/**
 * 获取要为模型广播的数据。
 *
 * @param  string  $event
 * @return array
 */
public function broadcastWith($event)
{
    return match ($event) {
        'created' => ['title' => $this->title],
        default => ['model' => $this],
    };
}
```

<a name="listening-for-model-broadcasts"></a>
### 监听模型广播

一旦你将 `BroadcastsEvents` trait 添加到模型并定义了模型的 `broadcastOn` 方法，就可以开始在客户端应用中监听广播的模型事件了。在开始之前，你可能希望查阅关于[监听事件](#listening-for-events)的完整文档。

首先，使用 `private` 方法获取频道实例，然后调用 `listen` 方法监听指定事件。通常，传递给 `private` 方法的频道名称应与 Laravel 的[模型广播约定](#model-broadcasting-conventions)对应。

获取频道实例后，你可以使用 `listen` 方法监听特定事件。由于模型广播事件不与应用 `App\Events` 目录中的"实际"事件关联，[事件名称](#model-broadcasting-event-conventions)必须以 `.` 前缀来指示它不属于特定命名空间。每个模型广播事件都有一个 `model` 属性，包含模型的所有可广播属性：

```js
Echo.private(`App.Models.User.${this.user.id}`)
    .listen('.PostUpdated', (e) => {
        console.log(e.model);
    });
```

<a name="client-events"></a>
## 客户端事件

> **Note**  
> 当使用 [Pusher Channels](https://pusher.com/channels) 时，你必须在[应用面板](https://dashboard.pusher.com/)的 "App Settings" 部分启用 "Client Events" 选项才能发送客户端事件。

有时你可能希望将事件广播给其他连接的客户端，而完全不经过 Laravel 应用。这对于"正在输入"通知等场景特别有用，你想提醒应用用户另一个用户正在给定屏幕上输入消息。

要广播客户端事件，可以使用 Echo 的 `whisper` 方法：

```js
Echo.private(`chat.${roomId}`)
    .whisper('typing', {
        name: this.user.name
    });
```

要监听客户端事件，可以使用 `listenForWhisper` 方法：

```js
Echo.private(`chat.${roomId}`)
    .listenForWhisper('typing', (e) => {
        console.log(e.name);
    });
```

<a name="notifications"></a>
## 通知

通过将事件广播与[通知](/docs/{{version}}/notifications)结合，你的 JavaScript 应用可以在新通知发生时接收它们，而无需刷新页面。在开始之前，请务必阅读关于使用[广播通知频道](/docs/{{version}}/notifications#broadcast-notifications)的文档。

一旦你配置了通知使用广播频道，就可以使用 Echo 的 `notification` 方法监听广播事件。请记住，频道名称应与接收通知的实体类名匹配：

```js
Echo.private(`App.Models.User.${userId}`)
    .notification((notification) => {
        console.log(notification.type);
    });
```

在此示例中，所有通过 `broadcast` 频道发送到 `App\Models\User` 实例的通知都将由回调接收。`App.Models.User.{id}` 频道的频道授权回调包含在 Laravel 框架附带的默认 `BroadcastServiceProvider` 中。
