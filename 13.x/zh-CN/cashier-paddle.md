# Laravel Cashier (Paddle)

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
    - [Paddle 沙盒](#paddle-sandbox)
- [配置](#configuration)
    - [可计费模型](#billable-model)
    - [API 密钥](#api-keys)
    - [Paddle JS](#paddle-js)
    - [货币配置](#currency-configuration)
    - [覆盖默认模型](#overriding-default-models)
- [快速入门](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [结账会话](#checkout-sessions)
    - [浮层结账](#overlay-checkout)
    - [内联结账](#inline-checkout)
    - [访客结账](#guest-checkouts)
- [价格预览](#price-previews)
    - [客户价格预览](#customer-price-previews)
    - [折扣](#price-discounts)
- [客户](#customers)
    - [客户默认值](#customer-defaults)
    - [检索客户](#retrieving-customers)
    - [创建客户](#creating-customers)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [订阅单次收费](#subscription-single-charges)
    - [更新支付信息](#updating-payment-information)
    - [更改套餐](#changing-plans)
    - [订阅数量](#subscription-quantity)
    - [包含多个产品的订阅](#subscriptions-with-multiple-products)
    - [多个订阅](#multiple-subscriptions)
    - [暂停订阅](#pausing-subscriptions)
    - [取消订阅](#canceling-subscriptions)
- [订阅试用](#subscription-trials)
    - [预先提供支付方式](#with-payment-method-up-front)
    - [不预先提供支付方式](#without-payment-method-up-front)
    - [延长或激活试用](#extend-or-activate-a-trial)
- [处理 Paddle Webhooks](#handling-paddle-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [为产品收费](#charging-for-products)
    - [退款交易](#refunding-transactions)
    - [贷记交易](#crediting-transactions)
- [交易](#transactions)
    - [已发生与即将到来的付款](#past-and-upcoming-payments)
- [测试](#testing)

<a name="introduction"></a>
## 简介

> [!WARNING]
> 本文档适用于 Cashier Paddle 2.x 与 Paddle Billing 的集成。如果你仍在使用 Paddle Classic，应当使用 [Cashier Paddle 1.x](https://github.com/laravel/cashier-paddle/tree/1.x)。

[Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle) 提供了一个富有表现力、流畅的接口来对接 [Paddle](https://paddle.com) 的订阅计费服务。它处理了几乎所有你正发愁的样板订阅计费代码。除了基本的订阅管理之外，Cashier 还能处理：交换订阅、订阅“数量”、订阅暂停、取消宽限期等更多功能。

在深入了解 Cashier Paddle 之前，我们建议你同时查阅 Paddle 的 [概念指南](https://developer.paddle.com/concepts/overview) 与 [API 文档](https://developer.paddle.com/api-reference/overview)。

<a name="upgrading-cashier"></a>
## 升级 Cashier

在升级到 Cashier 的新版本时，务必仔细查阅 [升级指南](https://github.com/laravel/cashier-paddle/blob/master/UPGRADE.md)。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装适用于 Paddle 的 Cashier 包：

```shell
composer require laravel/cashier-paddle
```

接下来，应当使用 `vendor:publish` Artisan 命令发布 Cashier 的数据库迁移文件：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，应当运行应用程序的数据库迁移。Cashier 的迁移会创建一个新 `customers` 表。此外，还会创建新的 `subscriptions` 和 `subscription_items` 表，用于存储你所有客户的订阅。最后，会创建一个新 `transactions` 表，用于存储与客户关联的所有 Paddle 交易：

```shell
php artisan migrate
```

> [!WARNING]
> 为确保 Cashier 能正确处理所有 Paddle 事件，请记得 [配置 Cashier 的 Webhook 处理](#handling-paddle-webhooks)。

<a name="paddle-sandbox"></a>
### Paddle 沙盒

在本地与预发布（staging）开发期间，你应当 [注册一个 Paddle 沙盒账户](https://sandbox-login.paddle.com/signup)。该账户会为你提供一个沙盒环境，以便在不产生真实付款的情况下测试与开发你的应用程序。你可以使用 Paddle 的 [测试卡号](https://developer.paddle.com/concepts/payment-methods/credit-debit-card#test-payment-method) 来模拟各种支付场景。

在使用 Paddle 沙盒环境时，应当设置应用程序 `.env` 文件中的 `PADDLE_SANDBOX` 环境变量为 `true`：

```ini
PADDLE_SANDBOX=true
```

在开发完应用程序后，你可以 [申请一个 Paddle 供应商账户](https://paddle.com)。在应用程序上线生产环境之前，Paddle 需要审核你应用程序的域名。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

在使用 Cashier 之前，必须在你的用户模型定义中添加 `Billable` trait。该 trait 提供了各种方法，让你可以执行常见的计费任务，例如创建订阅和更新支付方式信息：

```php
use Laravel\Paddle\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

如果你有非用户的计费实体，也可以将该 trait 添加到那些类中：

```php
use Illuminate\Database\Eloquent\Model;
use Laravel\Paddle\Billable;

class Team extends Model
{
    use Billable;
}
```

<a name="api-keys"></a>
### API 密钥

接下来，应当在应用程序的 `.env` 文件中配置你的 Paddle 密钥。你可以从 Paddle 控制面板获取你的 Paddle API 密钥：

```ini
PADDLE_CLIENT_SIDE_TOKEN=your-paddle-client-side-token
PADDLE_API_KEY=your-paddle-api-key
PADDLE_RETAIN_KEY=your-paddle-retain-key
PADDLE_WEBHOOK_SECRET="your-paddle-webhook-secret"
PADDLE_SANDBOX=true
```

在使用 [Paddle 的沙盒环境](#paddle-sandbox) 时，应将 `PADDLE_SANDBOX` 环境变量设置为 `true`。如果将应用程序部署到生产环境并使用 Paddle 的正式供应商环境，则应将 `PADDLE_SANDBOX` 变量设置为 `false`。

`PADDLE_RETAIN_KEY` 是可选的，仅在你将 Paddle 与 [Retain](https://developer.paddle.com/concepts/retain/overview) 一起使用时才需要设置。

<a name="paddle-js"></a>
### Paddle JS

Paddle 依赖其自带的 JavaScript 库来启动 Paddle 结账窗口。你可以通过在应用程序布局的闭合 `</head>` 标签之前放置 `@paddleJS` Blade 指令来加载该 JavaScript 库：

```blade
<head>
    ...

    @paddleJS
</head>
```

<a name="currency-configuration"></a>
### 货币配置

你可以指定一个区域设置（locale），用于在发票上显示金额时格式化货币值。Cashier 在内部使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php) 来设置货币区域：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 为了使用除 `en` 之外的区域设置，请确保服务器上已安装并配置了 `ext-intl` PHP 扩展。

<a name="overriding-default-models"></a>
### 覆盖默认模型

你可以自由地通过定义自己的模型并继承相应的 Cashier 模型，来扩展 Cashier 在内部使用的模型：

```php
use Laravel\Paddle\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义好模型后，可以通过 `Laravel\Paddle\Cashier` 类指示 Cashier 使用你的自定义模型。通常，应当在应用程序 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 你的自定义模型：

```php
use App\Models\Cashier\Subscription;
use App\Models\Cashier\Transaction;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Cashier::useSubscriptionModel(Subscription::class);
    Cashier::useTransactionModel(Transaction::class);
}
```

<a name="quickstart"></a>
## 快速入门

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Paddle Checkout 之前，你应当在 Paddle 控制面板中定义带有固定价格的产品。此外，你应当 [配置 Paddle 的 Webhook 处理](#handling-paddle-webhooks)。

通过应用程序提供产品和订阅计费可能令人望而生畏。不过，借助 Cashier 与 [Paddle 的浮层结账（Checkout Overlay）](https://developer.paddle.com/concepts/sell/overlay-checkout)，你可以轻松构建现代化、健壮的支付集成。

要向客户收取非周期性、单次收费产品的费用，我们将使用 Cashier 通过 Paddle 的浮层结账向客户收费，客户将在其中提供支付详情并确认购买。一旦通过浮层结账完成付款，客户将被重定向到应用程序中你指定的成功 URL：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout('pri_deluxe_album')
        ->returnTo(route('dashboard'));

    return view('buy', ['checkout' => $checkout]);
})->name('checkout');
```

如上方示例所示，我们将使用 Cashier 提供的 `checkout` 方法创建一个结账对象，以便针对给定的“价格标识符”向客户展示 Paddle 浮层结账。在使用 Paddle 时，“价格（prices）”指的是 [为特定产品定义的价格](https://developer.paddle.com/build/products/create-products-prices)。

如有必要，`checkout` 方法会自动在 Paddle 中创建一个客户，并将该 Paddle 客户记录关联到应用程序数据库中对应的用户。完成结账会话后，客户将被重定向到一个专门的成功页面，你可以在该页面上向客户显示提示信息。

在 `buy` 视图中，我们将包含一个用于显示浮层结账的按钮。Cashier Paddle 自带 `paddle-button` Blade 组件；不过，你也可以 [手动渲染浮层结账](#manually-rendering-an-overlay-checkout)：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy Product
</x-paddle-button>
```

<a name="providing-meta-data-to-paddle-checkout"></a>
#### 向 Paddle 结账提供元数据

在销售产品时，通常通过你自己应用程序定义的 `Cart` 和 `Order` 模型来追踪已完成的订单与已购买的产品是很常见的做法。当将客户重定向到 Paddle 的浮层结账以完成购买时，你可能需要提供一个已有的订单标识符，以便在客户被重定向回应用程序时，将完成的购买与对应的订单关联起来。

为此，你可以向 `checkout` 方法提供一个自定义数据数组。假设当用户开始结账流程时，应用程序中会创建一个待处理的 `Order`。请记住，此示例中的 `Cart` 和 `Order` 模型仅用于说明，并非由 Cashier 提供。你可以根据自己应用程序的需要自由实现这些概念：

```php
use App\Models\Cart;
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/cart/{cart}/checkout', function (Request $request, Cart $cart) {
    $order = Order::create([
        'cart_id' => $cart->id,
        'price_ids' => $cart->price_ids,
        'status' => 'incomplete',
    ]);

    $checkout = $request->user()->checkout($order->price_ids)
        ->customData(['order_id' => $order->id]);

    return view('billing', ['checkout' => $checkout]);
})->name('checkout');
```

如上方示例所示，当用户开始结账流程时，我们将向 `checkout` 方法提供购物车 / 订单关联的所有 Paddle 价格标识符。当然，你的应用程序负责在客户添加这些项目时将其与“购物车”或订单关联起来。我们还通过 `customData` 方法将订单的 ID 提供给 Paddle 浮层结账。

当然，你很可能希望在客户完成结账流程后将订单标记为“已完成”。为此，你可以监听由 Paddle 派发、并由 Cashier 通过事件触发的 Webhook，将订单信息存储到数据库中。

要开始，请监听 Cashier 派发的 `TransactionCompleted` 事件。通常，你应当在应用程序的 `AppServiceProvider` 的 `boot` 方法中注册事件监听器：

```php
use App\Listeners\CompleteOrder;
use Illuminate\Support\Facades\Event;
use Laravel\Paddle\Events\TransactionCompleted;

/**
 * 引导任何应用服务。
 */
public function boot(): void
{
    Event::listen(TransactionCompleted::class, CompleteOrder::class);
}
```

在此示例中，`CompleteOrder` 监听器可能如下所示：

```php
namespace App\Listeners;

use App\Models\Order;
use Laravel\Paddle\Cashier;
use Laravel\Paddle\Events\TransactionCompleted;

class CompleteOrder
{
    /**
     * 处理传入的 Cashier Webhook 事件。
     */
    public function handle(TransactionCompleted $event): void
    {
        $orderId = $event->payload['data']['custom_data']['order_id'] ?? null;

        $order = Order::findOrFail($orderId);

        $order->update(['status' => 'completed']);
    }
}
```

有关 `transaction.completed` 事件所包含数据的更多信息，请参阅 Paddle 的文档。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Paddle Checkout 之前，你应当在 Paddle 控制面板中定义带有固定价格的产品。此外，你应当 [配置 Paddle 的 Webhook 处理](#handling-paddle-webhooks)。

通过应用程序提供产品和订阅计费可能令人望而生畏。不过，借助 Cashier 与 [Paddle 的浮层结账（Checkout Overlay）](https://developer.paddle.com/concepts/sell/overlay-checkout)，你可以轻松构建现代化、健壮的支付集成。

要了解如何使用 Cashier 和 Paddle 的浮层结账销售订阅，让我们考虑一个简单的场景：一个订阅服务有一个基础的按月（`price_basic_monthly`）和按年（`price_basic_yearly`）套餐。这两个价格可以在我们的 Paddle 控制面板中归属于“基础（Basic）”产品（`pro_basic`）之下。此外，我们的订阅服务可能还提供“专家（Expert）”套餐作为 `pro_expert`。

首先，让我们了解客户如何订阅我们的服务。当然，你可以想象客户可能点击了我们应用程序定价页面上“基础”套餐的“订阅”按钮。该按钮将为他们所选择的套餐启动一个 Paddle 浮层结账。开始前，让我们通过 `checkout` 方法启动一个结账会话：

```php
use Illuminate\Http\Request;

Route::get('/subscribe', function (Request $request) {
    $checkout = $request->user()->checkout('price_basic_monthly')
        ->returnTo(route('dashboard'));

    return view('subscribe', ['checkout' => $checkout]);
})->name('subscribe');
```

在 `subscribe` 视图中，我们将包含一个用于显示浮层结账的按钮。Cashier Paddle 自带 `paddle-button` Blade 组件；不过，你也可以 [手动渲染浮层结账](#manually-rendering-an-overlay-checkout)：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

现在，当“订阅”按钮被点击时，客户将能够输入其支付详情并启动其订阅。要了解其订阅实际何时开始（因为某些支付方式需要几秒钟来处理），你还应当 [配置 Cashier 的 Webhook 处理](#handling-paddle-webhooks)。

既然客户可以开始订阅，我们需要限制应用程序的某些部分，以便只有已订阅的用户才能访问它们。当然，我们始终可以通过 Cashier 的 `Billable` trait 提供的 `subscribed` 方法来确定用户的当前订阅状态：

```blade
@if ($user->subscribed())
    <p>You are subscribed.</p>
@endif
```

我们甚至可以轻松确定一个用户是否订阅了特定产品或价格：

```blade
@if ($user->subscribedToProduct('pro_basic'))
    <p>You are subscribed to our Basic product.</p>
@endif

@if ($user->subscribedToPrice('price_basic_monthly'))
    <p>You are subscribed to our monthly Basic plan.</p>
@endif
```

<a name="quickstart-building-a-subscribed-middleware"></a>
#### 构建已订阅中间件

为方便起见，你可能希望创建一个 [中间件](/docs/{{version}}/middleware)，用于判断传入的请求是否来自已订阅的用户。一旦定义了该中间件，你就可以轻松地将其分配给某个路由，以防止未订阅的用户访问该路由：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Subscribed
{
    /**
     * 处理传入的请求。
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->subscribed()) {
            // 将用户重定向到账单页面并要求其订阅……
            return redirect('/subscribe');
        }

        return $next($request);
    }
}
```

一旦定义了中间件，你就可以将其分配给某个路由：

```php
use App\Http\Middleware\Subscribed;

Route::get('/dashboard', function () {
    // ...
})->middleware([Subscribed::class]);
```

<a name="quickstart-allowing-customers-to-manage-their-billing-plan"></a>
#### 允许客户管理其计费套餐

当然，客户可能希望将其订阅套餐更改为另一个产品或者“层级”。在上面的示例中，我们会希望允许客户将其套餐从按月订阅更改为按年订阅。为此，你需要实现类似一个按钮的东西，它指向如下路由：

```php
use Illuminate\Http\Request;

Route::put('/subscription/{price}/swap', function (Request $request, $price) {
    $user->subscription()->swap($price); // 在此示例中，“$price” 为 “price_basic_yearly”。

    return redirect()->route('dashboard');
})->name('subscription.swap');
```

除了交换套餐，你还需要允许客户取消其订阅。与交换套餐类似，提供一个指向以下路由的按钮：

```php
use Illuminate\Http\Request;

Route::put('/subscription/cancel', function (Request $request, $price) {
    $user->subscription()->cancel();

    return redirect()->route('dashboard');
})->name('subscription.cancel');
```

现在你的订阅将在其计费周期结束时被取消。

> [!NOTE]
> 只要你配置了 Cashier 的 Webhook 处理，Cashier 就会通过检查来自 Paddle 的传入 Webhook，自动使应用程序中与 Cashier 相关的数据库表保持同步。因此，例如，当你通过 Paddle 控制面板取消客户的订阅时，Cashier 将收到相应的 Webhook，并在应用程序的数据库中将该订阅标记为“已取消”。

<a name="checkout-sessions"></a>
## 结账会话

大多数向客户收费的操作都是使用 Paddle 的 [浮层结账窗口](https://developer.paddle.com/build/checkout/build-overlay-checkout) 或通过 [内联结账](https://developer.paddle.com/build/checkout/build-branded-inline-checkout) 来执行的。

在使用 Paddle 处理结账付款之前，你应当在 Paddle 结账设置控制面板中定义应用程序的 [默认支付链接](https://developer.paddle.com/build/transactions/default-payment-link#set-default-link)。

<a name="overlay-checkout"></a>
### 浮层结账

在显示浮层结账窗口之前，必须使用 Cashier 生成一个结账会话。结账会话会告知结账窗口应当执行哪个计费操作：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

Cashier 包含一个 `paddle-button` [Blade 组件](/docs/{{version}}/blade#components)。你可以将结账会话作为一个“prop”传递给该组件。然后，当该按钮被点击时，将显示 Paddle 的结账窗口：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

默认情况下，这将使用 Paddle 的默认样式显示窗口。你可以通过添加 [Paddle 支持的属性](https://developer.paddle.com/paddlejs/html-data-attributes)（例如 `data-theme='light'` 属性）来自定义窗口：

```html
<x-paddle-button :checkout="$checkout" class="px-8 py-4" data-theme="light">
    Subscribe
</x-paddle-button>
```

Paddle 结账窗口是异步的。一旦用户在窗口内创建了订阅，Paddle 就会向你的应用程序发送一个 Webhook，以便你在应用程序的数据库中正确更新订阅状态。因此，必须正确地 [设置 Webhook](#handling-paddle-webhooks) 以适应来自 Paddle 的状态变化，这很重要。

> [!WARNING]
> 在订阅状态变化后，接收相应 Webhook 的延迟通常很小，但你应当在应用程序中考虑到这一点，即用户的订阅在结账完成后可能不会立即可用。

<a name="manually-rendering-an-overlay-checkout"></a>
#### 手动渲染浮层结账

你也可以不使用 Laravel 内置的 Blade 组件来手动渲染浮层结账。开始前，[如前面的示例所示](#overlay-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 来初始化结账。在此示例中，我们将创建一个被赋予 `paddle_button` 类的链接。Paddle.js 会检测到该类，并在链接被点击时显示浮层结账：

```blade
<?php
$items = $checkout->getItems();
$customer = $checkout->getCustomer();
$custom = $checkout->getCustomData();
?>

<a
    href='#!'
    class='paddle_button'
    data-items='{!! json_encode($items) !!}'
    @if ($customer) data-customer-id='{{ $customer->paddle_id }}' @endif
    @if ($custom) data-custom-data='{{ json_encode($custom) }}' @endif
    @if ($returnUrl = $checkout->getReturnUrl()) data-success-url='{{ $returnUrl }}' @endif
>
    Buy Product
</a>
```

<a name="inline-checkout"></a>
### 内联结账

如果你不想使用 Paddle 的“浮层”风格结账窗口，Paddle 还提供将窗口内联显示的选项。虽然这种方式不允许你调整结账窗口的任何 HTML 字段，但它允许你将窗口嵌入到应用程序中。

为了让你可以轻松开始使用内联结账，Cashier 包含一个 `paddle-checkout` Blade 组件。开始前，你应当 [生成一个结账会话](#overlay-checkout)：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以将结账会话传递给组件的 `checkout` 属性：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" />
```

要调整内联结账组件的高度，你可以将 `height` 属性传递给 Blade 组件：

```blade
<x-paddle-checkout :checkout="$checkout" class="w-full" height="500" />
```

有关内联结账自定义选项的更多细节，请参阅 Paddle 的 [内联结账指南](https://developer.paddle.com/build/checkout/build-branded-inline-checkout) 与 [可用的结账设置](https://developer.paddle.com/build/checkout/set-up-checkout-default-settings)。

<a name="manually-rendering-an-inline-checkout"></a>
#### 手动渲染内联结账

你也可以不使用 Laravel 内置的 Blade 组件来手动渲染内联结账。开始前，[如前面的示例所示](#inline-checkout)生成结账会话：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $user->checkout('pri_34567')
        ->returnTo(route('dashboard'));

    return view('billing', ['checkout' => $checkout]);
});
```

接下来，你可以使用 Paddle.js 来初始化结账。在此示例中，我们使用 [Alpine.js](https://github.com/alpinejs/alpine) 来演示；不过，你可以根据自己的前端技术栈自由修改此示例：

```blade
<?php
$options = $checkout->options();

$options['settings']['frameTarget'] = 'paddle-checkout';
$options['settings']['frameInitialHeight'] = 366;
?>

<div class="paddle-checkout" x-data="{}" x-init="
    Paddle.Checkout.open(@json($options));
">
</div>
```

<a name="guest-checkouts"></a>
### 访客结账

有时，你可能需要为不需要在应用程序中拥有账户的用户创建结账会话。为此，你可以使用 `guest` 方法：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Checkout;

Route::get('/buy', function (Request $request) {
    $checkout = Checkout::guest(['pri_34567'])
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

然后，你可以将结账会话提供给 [Paddle 按钮](#overlay-checkout) 或 [内联结账](#inline-checkout) Blade 组件。

<a name="price-previews"></a>
## 价格预览

Paddle 允许你按货币自定义价格，本质上允许你为不同国家配置不同的价格。Cashier Paddle 允许你使用 `previewPrices` 方法检索所有这些价格。该方法接受你希望检索价格的那些价格 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456']);
```

货币将根据请求的 IP 地址来确定；不过，你可以选择性地提供一个特定的国家来检索价格：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456'], ['address' => [
    'country_code' => 'BE',
    'postal_code' => '1234',
]]);
```

检索到价格后，你可以按照自己的意愿显示它们：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->total() }}</li>
    @endforeach
</ul>
```

你也可以分别显示小计价格与税额：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->subtotal() }} (+ {{ $price->tax() }} tax)</li>
    @endforeach
</ul>
```

有关更多信息，请参阅 [Paddle 关于价格预览的 API 文档](https://developer.paddle.com/api-reference/pricing-preview/preview-prices)。

<a name="customer-price-previews"></a>
### 客户价格预览

如果用户已经是客户，并且你希望显示适用于该客户的价格，你可以直接从客户实例检索价格来实现：

```php
use App\Models\User;

$prices = User::find(1)->previewPrices(['pri_123', 'pri_456']);
```

在内部，Cashier 将使用该客户的客户 ID 来检索其货币下的价格。因此，例如，居住在美国的用户将看到美元价格，而居住在比利时的用户将看到欧元价格。如果找不到匹配的货币，则使用产品的默认货币。你可以在 Paddle 控制面板中自定义产品或订阅套餐的所有价格。

<a name="price-discounts"></a>
### 折扣

你也可以选择显示折扣后的价格。调用 `previewPrices` 方法时，通过 `discount_id` 选项提供折扣 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::previewPrices(['pri_123', 'pri_456'], [
    'discount_id' => 'dsc_123'
]);
```

然后，显示计算后的价格：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product['name'] }} - {{ $price->total() }}</li>
    @endforeach
</ul>
```

<a name="customers"></a>
## 客户

<a name="customer-defaults"></a>
### 客户默认值

Cashier 允许你在创建结账会话时为客户定义一些有用的默认值。设置这些默认值可以让你预填客户的电子邮件地址和姓名，以便他们可以立即进入结账窗口的付款部分。你可以通过覆盖可计费模型上的以下方法来实现这些默认值：

```php
/**
 * 获取要与 Paddle 关联的客户的名称。
 */
public function paddleName(): string|null
{
    return $this->name;
}

/**
 * 获取要与 Paddle 关联的客户的电子邮件地址。
 */
public function paddleEmail(): string|null
{
    return $this->email;
}
```

这些默认值将用于 Cashier 中生成 [结账会话](#checkout-sessions) 的每一个操作。

<a name="retrieving-customers"></a>
### 检索客户

你可以使用 `Cashier::findBillable` 方法，通过客户的 Paddle 客户 ID 检索客户。该方法将返回可计费模型的一个实例：

```php
use Laravel\Paddle\Cashier;

$user = Cashier::findBillable($customerId);
```

<a name="creating-customers"></a>
### 创建客户

有时，你可能希望在不开始订阅的情况下创建一个 Paddle 客户。你可以使用 `createAsCustomer` 方法来实现：

```php
$customer = $user->createAsCustomer();
```

返回的是 `Laravel\Paddle\Customer` 的一个实例。一旦在 Paddle 中创建了该客户，你可以在稍后日期开始订阅。你可以提供一个可选的 `$options` 数组，以传入 [Paddle API 支持的任何额外客户创建参数](https://developer.paddle.com/api-reference/customers/create-customer)：

```php
$customer = $user->createAsCustomer($options);
```

<a name="subscriptions"></a>
## 订阅

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先从数据库中检索可计费模型的一个实例，它通常是 `App\Models\User` 的一个实例。检索到模型实例后，可以使用 `subscribe` 方法创建该模型的结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($premium = 'pri_123', 'default')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

传递给 `subscribe` 方法的第一个参数是用户要订阅的特定价格。该值应与 Paddle 中价格的标识符相对应。`returnTo` 方法接受一个 URL，用户成功完成结账后将被重定向到该 URL。传递给 `subscribe` 方法的第二个参数应是订阅的内部“类型”。如果你的应用程序只提供单个订阅，你可以将其称为 `default` 或 `primary`。该订阅类型仅用于应用程序内部使用，并非要向用户展示。此外，它不应包含空格，并且在创建订阅后绝不应更改。

你也可以使用 `customData` 方法提供关于订阅的自定义元数据数组：

```php
$checkout = $request->user()->subscribe($premium = 'pri_123', 'default')
    ->customData(['key' => 'value'])
    ->returnTo(route('home'));
```

一旦创建了订阅结账会话，就可以将该结账会话提供给 Cashier Paddle 自带的 `paddle-button` [Blade 组件](#overlay-checkout)：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

用户完成结账后，Paddle 将派发一个 `subscription_created` Webhook。Cashier 将接收该 Webhook 并为你的客户设置订阅。为确保你的应用程序能正确接收并处理所有 Webhook，请确保你已正确 [设置 Webhook 处理](#handling-paddle-webhooks)。

<a name="checking-subscription-status"></a>
### 检查订阅状态

一旦用户订阅了你的应用程序，你就可以使用各种便捷的方法来检查其订阅状态。首先，如果用户拥有有效订阅，`subscribed` 方法将返回 `true`，即使该订阅当前处于试用期内：

```php
if ($user->subscribed()) {
    // ...
}
```

如果你的应用程序提供多个订阅，可以在调用 `subscribed` 方法时指定订阅：

```php
if ($user->subscribed('default')) {
    // ...
}
```

`subscribed` 方法也是 [路由中间件](/docs/{{version}}/middleware) 的一个绝佳候选，让你可以根据用户的订阅状态来过滤对路由和控制器的访问：

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsSubscribed
{
    /**
     * 处理传入的请求。
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->subscribed()) {
            // 该用户不是付费客户……
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

如果你想判断用户是否仍处于其试用期内，可以使用 `onTrial` 方法。该方法可用于判断你是否需要向用户显示警告，提示他们仍处于试用期内：

```php
if ($user->subscription()->onTrial()) {
    // ...
}
```

`subscribedToPrice` 方法可用于根据给定的 Paddle 价格 ID 判断用户是否订阅了某个套餐。在此示例中，我们将判断用户的 `default` 订阅是否正在活跃地订阅该按月价格：

```php
if ($user->subscribedToPrice($monthly = 'pri_123', 'default')) {
    // ...
}
```

`recurring` 方法可用于判断用户当前是否处于活跃订阅中，并且不再处于其试用期或宽限期内：

```php
if ($user->subscription()->recurring()) {
    // ...
}
```

<a name="canceled-subscription-status"></a>
#### 已取消的订阅状态

要判断用户曾经是活跃订阅者但已取消其订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription()->canceled()) {
    // ...
}
```

你也可以判断用户是否已取消其订阅，但仍处于“宽限期”直到订阅完全过期。例如，如果用户在 3 月 5 日取消了一个原定 3 月 10 日到期的订阅，那么在 3 月 10 日之前用户都处于“宽限期”。此外，在此期间 `subscribed` 方法仍将返回 `true`：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

<a name="past-due-status"></a>
#### 逾期状态

如果订阅的付款失败，它将被标记为 `past_due`。当你的订阅处于此状态时，在客户更新其支付信息之前，它将不会处于活跃状态。你可以使用订阅实例上的 `pastDue` 方法判断订阅是否逾期：

```php
if ($user->subscription()->pastDue()) {
    // ...
}
```

当订阅逾期时，你应当指示客户 [更新其支付信息](#updating-payment-information)。

如果你希望订阅在处于 `past_due` 状态时仍被视为有效，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 方法。通常，该方法应在你的 `AppServiceProvider` 的 `register` 方法中调用：

```php
use Laravel\Paddle\Cashier;

/**
 * 注册任何应用服务。
 */
public function register(): void
{
    Cashier::keepPastDueSubscriptionsActive();
}
```

> [!WARNING]
> 当订阅处于 `past_due` 状态时，在支付信息更新之前无法更改。因此，当订阅处于 `past_due` 状态时，`swap` 和 `updateQuantity` 方法将抛出异常。

<a name="subscription-scopes"></a>
#### 订阅作用域

大多数订阅状态也可以作为查询作用域使用，以便你可以轻松地查询数据库中处于给定状态的订阅：

```php
// 获取所有有效订阅……
$subscriptions = Subscription::query()->valid()->get();

// 获取某个用户的所有已取消订阅……
$subscriptions = $user->subscriptions()->canceled()->get();
```

下方提供了可用作用域的完整列表：

```php
Subscription::query()->valid();
Subscription::query()->onTrial();
Subscription::query()->expiredTrial();
Subscription::query()->notOnTrial();
Subscription::query()->active();
Subscription::query()->recurring();
Subscription::query()->pastDue();
Subscription::query()->paused();
Subscription::query()->notPaused();
Subscription::query()->onPausedGracePeriod();
Subscription::query()->notOnPausedGracePeriod();
Subscription::query()->canceled();
Subscription::query()->notCanceled();
Subscription::query()->onGracePeriod();
Subscription::query()->notOnGracePeriod();
```

<a name="subscription-single-charges"></a>
### 订阅单次收费

订阅单次收费允许你在客户的订阅之上，以一次性收费的方式向订阅者收费。调用 `charge` 方法时必须提供一个或多个价格 ID：

```php
// 收取单个价格……
$response = $user->subscription()->charge('pri_123');

// 一次性收取多个价格……
$response = $user->subscription()->charge(['pri_123', 'pri_456']);
```

`charge` 方法在实际向客户收费之前，会一直等到其订阅的下一个计费周期。如果你想立即向客户计费，可以改用 `chargeAndInvoice` 方法：

```php
$response = $user->subscription()->chargeAndInvoice('pri_123');
```

<a name="updating-payment-information"></a>
### 更新支付信息

Paddle 始终为每个订阅保存一种支付方式。如果你想更新某个订阅的默认支付方式，应当使用订阅模型上的 `redirectToUpdatePaymentMethod` 方法，将客户重定向到 Paddle 托管的支付方式更新页面：

```php
use Illuminate\Http\Request;

Route::get('/update-payment-method', function (Request $request) {
    $user = $request->user();

    return $user->subscription()->redirectToUpdatePaymentMethod();
});
```

当用户完成信息更新后，Paddle 将派发一个 `subscription_updated` Webhook，订阅详情将在你的应用程序数据库中更新。

<a name="changing-plans"></a>
### 更改套餐

用户订阅了你的应用程序后，偶尔可能想要更改为新的订阅套餐。要为用户更新订阅套餐，应当将 Paddle 价格的标识符传递给订阅的 `swap` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription()->swap($premium = 'pri_456');
```

如果你希望交换套餐后立即向客户开具发票，而不是等待其下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription()->swapAndInvoice($premium = 'pri_456');
```

<a name="prorations"></a>
#### 按比例计费

默认情况下，Paddle 在套餐之间交换时会按比例计费。可以使用 `noProrate` 方法在不按比例计费的情况下更新订阅：

```php
$user->subscription('default')->noProrate()->swap($premium = 'pri_456');
```

如果你希望禁用按比例计费并立即向客户开具发票，可以将 `swapAndInvoice` 方法与 `noProrate` 结合使用：

```php
$user->subscription('default')->noProrate()->swapAndInvoice($premium = 'pri_456');
```

或者，为了不对客户的订阅变更计费，可以使用 `doNotBill` 方法：

```php
$user->subscription('default')->doNotBill()->swap($premium = 'pri_456');
```

有关 Paddle 按比例计费策略的更多信息，请参阅 Paddle 的 [按比例计费文档](https://developer.paddle.com/concepts/subscriptions/proration)。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到“数量”的影响。例如，一个项目管理应用程序可能每月每个项目收费 10 美元。要轻松地增加或减少订阅的数量，可以使用 `incrementQuantity` 和 `decrementQuantity` 方法：

```php
$user = User::find(1);

$user->subscription()->incrementQuantity();

// 在当前订阅数量上增加 5……
$user->subscription()->incrementQuantity(5);

$user->subscription()->decrementQuantity();

// 从当前订阅数量中减去 5……
$user->subscription()->decrementQuantity(5);
```

或者，可以使用 `updateQuantity` 方法设置特定数量：

```php
$user->subscription()->updateQuantity(10);
```

可以使用 `noProrate` 方法在不按比例计费的情况下更新订阅的数量：

```php
$user->subscription()->noProrate()->updateQuantity(10);
```

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 包含多个产品的订阅的数量

如果你的订阅是一个 [包含多个产品的订阅](#subscriptions-with-multiple-products)，应当将要增加或减少数量的价格 ID 作为第二个参数传递给增加 / 减少方法：

```php
$user->subscription()->incrementQuantity(1, 'price_chat');
```

<a name="subscriptions-with-multiple-products"></a>
### 包含多个产品的订阅

[包含多个产品的订阅](https://developer.paddle.com/build/subscriptions/add-remove-products-prices-addons) 允许你将多个计费产品分配给单个订阅。例如，想象你正在构建一个客服“帮助台”应用程序，其基础订阅价格为每月 10 美元，但提供一项实时聊天附加产品，额外每月 15 美元。

在创建订阅结账会话时，可以通过将价格数组作为第一个参数传递给 `subscribe` 方法，来为给定订阅指定多个产品：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe([
        'price_monthly',
        'price_chat',
    ]);

    return view('billing', ['checkout' => $checkout]);
});
```

在上面的示例中，客户将有两个价格附加到其 `default` 订阅上。两个价格都将在各自的计费周期上收费。如有必要，你可以传递一个键值对关联数组，以指示每个价格的特定数量：

```php
$user = User::find(1);

$checkout = $user->subscribe('default', ['price_monthly', 'price_chat' => 5]);
```

如果你想向现有订阅添加另一个价格，必须使用订阅的 `swap` 方法。调用 `swap` 方法时，你还应当同时包含订阅当前的价格和数量：

```php
$user = User::find(1);

$user->subscription()->swap(['price_chat', 'price_original' => 2]);
```

上面的示例将添加新价格，但在客户的下一个计费周期之前不会对其计费。如果你想立即向客户计费，可以使用 `swapAndInvoice` 方法：

```php
$user->subscription()->swapAndInvoice(['price_chat', 'price_original' => 2]);
```

你可以使用 `swap` 方法删除订阅中的价格，并省略要删除的价格：

```php
$user->subscription()->swap(['price_original' => 2]);
```

> [!WARNING]
> 你不得移除订阅上的最后一个价格。相反，你应当直接取消该订阅。

<a name="multiple-subscriptions"></a>
### 多个订阅

Paddle 允许你的客户同时拥有多个订阅。例如，你可能经营一家健身房，提供游泳订阅和举重订阅，每个订阅可能有不同的定价。当然，客户应当能够订阅其中任一或两种套餐。

当你的应用程序创建订阅时，可以将订阅的类型作为第二个参数提供给 `subscribe` 方法。该类型可以是任何表示用户正在启动的订阅类型的字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $checkout = $request->user()->subscribe($swimmingMonthly = 'pri_123', 'swimming');

    return view('billing', ['checkout' => $checkout]);
});
```

在此示例中，我们为客户启动了一个按月游泳订阅。不过，他们可能希望在稍后时间交换为按年订阅。在调整客户的订阅时，我们可以简单地交换 `swimming` 订阅上的价格：

```php
$user->subscription('swimming')->swap($swimmingYearly = 'pri_456');
```

当然，你也可以完全取消该订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="pausing-subscriptions"></a>
### 暂停订阅

要暂停订阅，调用用户订阅上的 `pause` 方法：

```php
$user->subscription()->pause();
```

当订阅被暂停时，Cashier 会自动在你的数据库中设置 `paused_at` 列。该列用于确定 `paused` 方法何时应当开始返回 `true`。例如，如果客户在 3 月 1 日暂停了订阅，但订阅原定要到 3 月 5 日才续费，那么 `paused` 方法在 3 月 5 日之前将继续返回 `false`。这是因为用户通常可以使用应用程序直到其计费周期结束。

默认情况下，暂停发生在下一个计费周期，以便客户可以使用他们已付费周期的剩余部分。如果你想立即暂停订阅，可以使用 `pauseNow` 方法：

```php
$user->subscription()->pauseNow();
```

使用 `pauseUntil` 方法，你可以将订阅暂停到某个特定时刻：

```php
$user->subscription()->pauseUntil(now()->plus(months: 1));
```

或者，你可以使用 `pauseNowUntil` 方法将订阅立即暂停到给定时间点：

```php
$user->subscription()->pauseNowUntil(now()->plus(months: 1));
```

你可以使用 `onPausedGracePeriod` 方法判断用户是否已暂停其订阅但仍处于其“宽限期”：

```php
if ($user->subscription()->onPausedGracePeriod()) {
    // ...
}
```

要恢复已暂停的订阅，可以调用订阅上的 `resume` 方法：

```php
$user->subscription()->resume();
```

> [!WARNING]
> 订阅在暂停期间无法修改。如果你想交换到不同的套餐或更新数量，必须先恢复订阅。

<a name="canceling-subscriptions"></a>
### 取消订阅

要取消订阅，调用用户订阅上的 `cancel` 方法：

```php
$user->subscription()->cancel();
```

当订阅被取消时，Cashier 会自动在你的数据库中设置 `ends_at` 列。该列用于确定 `subscribed` 方法何时应当开始返回 `false`。例如，如果客户在 3 月 1 日取消了订阅，但订阅原定要到 3 月 5 日才结束，那么 `subscribed` 方法在 3 月 5 日之前将继续返回 `true`。这样做是因为用户通常可以使用应用程序直到其计费周期结束。

你可以使用 `onGracePeriod` 方法判断用户是否已取消其订阅但仍处于其“宽限期”：

```php
if ($user->subscription()->onGracePeriod()) {
    // ...
}
```

如果你希望立即取消订阅，可以调用订阅上的 `cancelNow` 方法：

```php
$user->subscription()->cancelNow();
```

要阻止处于宽限期的订阅被取消，可以调用 `stopCancelation` 方法：

```php
$user->subscription()->stopCancelation();
```

> [!WARNING]
> Paddle 的订阅在取消后无法恢复。如果你的客户希望恢复其订阅，他们将必须创建一个新订阅。

<a name="subscription-trials"></a>
## 订阅试用

<a name="with-payment-method-up-front"></a>
### 预先提供支付方式

如果你希望在仍预先收集支付方式信息的同时向客户提供试用期，应当在 Paddle 控制面板中为你的客户所订阅的价格设置一个试用时间。然后，像平常一样启动结账会话：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

当你的应用程序收到 `subscription_created` 事件时，Cashier 将在你的应用程序数据库中的订阅记录上设置试用结束日期，并指示 Paddle 在此日期之后才开始向客户计费。

> [!WARNING]
> 如果客户的订阅在试用结束日期之前没有被取消，试用一到期他们就会被收费，因此你应当确保通知用户其试用结束日期。

你可以使用用户实例的 `onTrial` 方法判断用户是否处于其试用期内：

```php
if ($user->onTrial()) {
    // ...
}
```

要判断已有的试用是否已过期，可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial()) {
    // ...
}
```

要判断用户是否针对特定订阅类型处于试用期，可以向 `onTrial` 或 `hasExpiredTrial` 方法提供该类型：

```php
if ($user->onTrial('default')) {
    // ...
}

if ($user->hasExpiredTrial('default')) {
    // ...
}
```

<a name="without-payment-method-up-front"></a>
### 不预先提供支付方式

如果你希望在预先不收集用户支付方式信息的情况下提供试用期，可以设置附加到用户的客户记录上的 `trial_ends_at` 列为你期望的试用结束日期。这通常在用户注册期间完成：

```php
use App\Models\User;

$user = User::create([
    // ...
]);

$user->createAsCustomer([
    'trial_ends_at' => now()->plus(days: 10)
]);
```

Cashier 将此类试用称为“通用试用（generic trial）”，因为它未附加到任何现有订阅。`User` 实例上的 `onTrial` 方法在当前日期未超过 `trial_ends_at` 的值时将返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于其试用期内……
}
```

一旦你准备好为用户创建实际订阅，可以像往常一样使用 `subscribe` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $checkout = $request->user()
        ->subscribe('pri_monthly')
        ->returnTo(route('home'));

    return view('billing', ['checkout' => $checkout]);
});
```

要检索用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户处于试用期内，该方法将返回一个 Carbon 日期实例，否则返回 `null`。如果你想获取默认订阅之外某个特定订阅的试用结束日期，也可以传递一个可选的订阅类型参数：

```php
if ($user->onTrial('default')) {
    $trialEndsAt = $user->trialEndsAt();
}
```

如果你希望确切知道用户处于其“通用”试用期内且尚未创建实际订阅，可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户处于其“通用”试用期内……
}
```

<a name="extend-or-activate-a-trial"></a>
### 延长或激活试用

你可以通过调用 `extendTrial` 方法并指定试用应当结束的时刻，来延长订阅上已有的试用期：

```php
$user->subscription()->extendTrial(now()->plus(days: 5));
```

或者，你可以通过调用订阅上的 `activate` 方法结束其试用，来立即激活订阅：

```php
$user->subscription()->activate();
```

<a name="handling-paddle-webhooks"></a>
## 处理 Paddle Webhooks

Paddle 可以通过 Webhook 通知你的应用程序各种事件。默认情况下，指向 Cashier 的 Webhook 控制器的路由由 Cashier 服务提供者注册。该控制器将处理所有传入的 Webhook 请求。

默认情况下，该控制器将自动处理取消具有过多失败扣款的订阅、订阅更新以及支付方式变更；不过，正如我们很快将看到的，你可以扩展该控制器来处理任何你喜欢的 Paddle Webhook 事件。

为确保你的应用程序能够处理 Paddle Webhook，请务必 [在 Paddle 控制面板中配置 Webhook URL](https://vendors.paddle.com/notifications-v2)。默认情况下，Cashier 的 Webhook 控制器响应 `/paddle/webhook` URL 路径。你应当在 Paddle 控制面板中启用的所有 Webhook 完整列表如下：

- Customer Updated
- Transaction Completed
- Transaction Updated
- Subscription Created
- Subscription Updated
- Subscription Paused
- Subscription Canceled

> [!WARNING]
> 请确保使用 Cashier 自带的 [Webhook 签名验证](/docs/{{version}}/cashier-paddle#verifying-webhook-signatures) 中间件来保护传入的请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 保护

由于 Paddle Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，你应当确保 Laravel 不会尝试验证传入的 Paddle Webhook 的 CSRF 令牌。为此，你应当在应用程序的 `bootstrap/app.php` 文件中将 `paddle/*` 排除在 CSRF 保护之外：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'paddle/*',
    ]);
})
```

<a name="webhooks-local-development"></a>
#### Webhook 与本地开发

为了让 Paddle 能够在本地开发期间向你的应用程序发送 Webhook，你需要通过站点共享服务（如 [Ngrok](https://ngrok.com/) 或 [Expose](https://expose.dev/docs/introduction)）将你的应用程序暴露出来。如果你正在使用 [Laravel Sail](/docs/{{version}}/sail) 在本地开发应用程序，可以使用 Sail 的 [站点共享命令](/docs/{{version}}/sail#sharing-your-site)。

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 会自动处理失败扣款时的订阅取消以及其他常见的 Paddle Webhook。不过，如果你有额外的 Webhook 事件需要处理，可以通过监听 Cashier 派发的以下事件来实现：

- `Laravel\Paddle\Events\WebhookReceived`
- `Laravel\Paddle\Events\WebhookHandled`

这两个事件都包含 Paddle Webhook 的完整负载。例如，如果你希望处理 `transaction.billed` Webhook，可以注册一个 [监听器](/docs/{{version}}/events#defining-listeners) 来处理该事件：

```php
<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;

class PaddleEventListener
{
    /**
     * 处理接收到的 Paddle Webhook。
     */
    public function handle(WebhookReceived $event): void
    {
        if ($event->payload['event_type'] === 'transaction.billed') {
            // 处理传入的事件……
        }
    }
}
```

Cashier 还会派发专用于所接收 Webhook 类型的事件。除了 Paddle 的完整负载之外，它们还包含用于处理该 Webhook 所用的相关模型，例如可计费模型、订阅或收据：

<div class="content-list" markdown="1">

- `Laravel\Paddle\Events\CustomerUpdated`
- `Laravel\Paddle\Events\TransactionCompleted`
- `Laravel\Paddle\Events\TransactionUpdated`
- `Laravel\Paddle\Events\SubscriptionCreated`
- `Laravel\Paddle\Events\SubscriptionUpdated`
- `Laravel\Paddle\Events\SubscriptionPaused`
- `Laravel\Paddle\Events\SubscriptionCanceled`

</div>

你还可以通过在应用程序的 `.env` 文件中定义 `CASHIER_WEBHOOK` 环境变量来覆盖默认的内置 Webhook 路由。该值应当是你的 Webhook 路由的完整 URL，并且需要与你在 Paddle 控制面板中设置的 URL 相匹配：

```ini
CASHIER_WEBHOOK=https://example.com/my-paddle-webhook-url
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为了保护你的 Webhook，可以使用 [Paddle 的 Webhook 签名](https://developer.paddle.com/webhooks/signature-verification)。为方便起见，Cashier 自动包含一个中间件，用于验证传入的 Paddle Webhook 请求是否有效。

要启用 Webhook 验证，请确保在应用程序的 `.env` 文件中定义了 `PADDLE_WEBHOOK_SECRET` 环境变量。该 Webhook 密钥可以从你的 Paddle 账户控制面板获取。

<a name="single-charges"></a>
## 单次收费

<a name="charging-for-products"></a>
### 为产品收费

如果你希望为客户发起产品购买，可以使用可计费模型实例上的 `checkout` 方法为购买生成结账会话。`checkout` 方法接受一个或多个价格 ID。如有必要，可以使用关联数组来提供所购买产品的数量：

```php
use Illuminate\Http\Request;

Route::get('/buy', function (Request $request) {
    $checkout = $request->user()->checkout(['pri_tshirt', 'pri_socks' => 5]);

    return view('buy', ['checkout' => $checkout]);
});
```

生成结账会话后，你可以使用 Cashier 提供的 `paddle-button` [Blade 组件](#overlay-checkout) 让客户查看 Paddle 结账窗口并完成购买：

```blade
<x-paddle-button :checkout="$checkout" class="px-8 py-4">
    Buy
</x-paddle-button>
```

结账会话具有一个 `customData` 方法，允许你将任何自定义数据传递给底层的交易创建。有关传递自定义数据时可用选项的更多信息，请参阅 [Paddle 文档](https://developer.paddle.com/build/transactions/custom-data)：

```php
$checkout = $user->checkout('pri_tshirt')
    ->customData([
        'custom_option' => $value,
    ]);
```

<a name="refunding-transactions"></a>
### 退款交易

退款交易会将退款金额退回到客户购买时使用的支付方式。如果你需要退款一笔 Paddle 购买，可以使用 `Cashier\Paddle\Transaction` 模型上的 `refund` 方法。该方法接受原因作为第一个参数，以及一个或多个要退款的价格 ID（带有可选金额的关联数组）。你可以使用 `transactions` 方法检索给定可计费模型的交易。

例如，假设我们要退款价格 `pri_123` 和 `pri_456` 的特定交易。我们希望全额退款 `pri_123`，但只对 `pri_456` 退款两美元：

```php
use App\Models\User;

$user = User::find(1);

$transaction = $user->transactions()->first();

$response = $transaction->refund('Accidental charge', [
    'pri_123', // 全额退款此价格……
    'pri_456' => 200, // 仅部分退款此价格……
]);
```

上面的示例退款了交易中的特定明细行。如果你想退款整个交易，只需提供原因：

```php
$response = $transaction->refund('Accidental charge');
```

有关退款的更多信息，请参阅 [Paddle 的退款文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 退款必须始终先经过 Paddle 批准，才能完全处理。

<a name="crediting-transactions"></a>
### 贷记交易

与退款一样，你也可以贷记交易。贷记交易会将资金添加到客户的余额，以便用于未来的购买。贷记交易只能针对手动收取的交易进行，而不能针对自动收取的交易（如订阅）进行，因为 Paddle 会自动处理订阅贷记：

```php
$transaction = $user->transactions()->first();

// 全额贷记某个具体的明细行……
$response = $transaction->credit('Compensation', 'pri_123');
```

有关更多信息，请参阅 [Paddle 关于贷记的文档](https://developer.paddle.com/build/transactions/create-transaction-adjustments)。

> [!WARNING]
> 贷记只能应用于手动收取的交易。自动收取的交易由 Paddle 自身贷记。

<a name="transactions"></a>
## 交易

你可以轻松地通过 `transactions` 属性检索可计费模型的交易数组：

```php
use App\Models\User;

$user = User::find(1);

$transactions = $user->transactions;
```

交易表示你的产品和购买的付款，并附带发票。只有已完成的交易才会存储在你的应用程序数据库中。

在列出客户的交易时，你可以使用交易实例的方法来显示相关的支付信息。例如，你可能希望在一个表格中列出每一笔交易，让用户可以轻松下载任何发票：

```html
<table>
    @foreach ($transactions as $transaction)
        <tr>
            <td>{{ $transaction->billed_at->toFormattedDateString() }}</td>
            <td>{{ $transaction->total() }}</td>
            <td>{{ $transaction->tax() }}</td>
            <td><a href="{{ route('download-invoice', $transaction->id) }}" target="_blank">Download</a></td>
        </tr>
    @endforeach
</table>
```

`download-invoice` 路由可能如下所示：

```php
use Illuminate\Http\Request;
use Laravel\Paddle\Transaction;

Route::get('/download-invoice/{transaction}', function (Request $request, Transaction $transaction) {
    return $transaction->redirectToInvoicePdf();
})->name('download-invoice');
```

<a name="past-and-upcoming-payments"></a>
### 已发生与即将到来的付款

你可以使用 `lastPayment` 和 `nextPayment` 方法来检索并显示客户周期性订阅的已发生或即将到来的付款：

```php
use App\Models\User;

$user = User::find(1);

$subscription = $user->subscription();

$lastPayment = $subscription->lastPayment();
$nextPayment = $subscription->nextPayment();
```

这两个方法都将返回 `Laravel\Paddle\Payment` 的一个实例；不过，当交易尚未被 Webhook 同步时，`lastPayment` 将返回 `null`，而当计费周期已结束（例如订阅已取消）时，`nextPayment` 将返回 `null`：

```blade
Next payment: {{ $nextPayment->amount() }} due on {{ $nextPayment->date()->format('d/m/Y') }}
```

<a name="testing"></a>
## 测试

在测试时，你应当手动测试你的计费流程，以确保你的集成按预期工作。

对于自动化测试，包括在 CI 环境中执行的测试，你可以使用 [Laravel 的 HTTP 客户端](/docs/{{version}}/http-client#testing) 来伪造对 Paddle 发起的 HTTP 调用。尽管这不会测试来自 Paddle 的实际响应，但它确实提供了一种在不实际调用 Paddle API 的情况下测试应用程序的方式。
