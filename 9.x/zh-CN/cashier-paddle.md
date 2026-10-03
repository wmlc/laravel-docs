# Laravel Cashier (Paddle)

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
    - [Paddle 沙箱](#paddle-sandbox)
    - [数据库迁移](#database-migrations)
- [配置](#configuration)
    - [可计费模型](#billable-model)
    - [API 密钥](#api-keys)
    - [Paddle JS](#paddle-js)
    - [货币配置](#currency-configuration)
    - [覆盖默认模型](#overriding-default-models)
- [核心概念](#core-concepts)
    - [支付链接](#pay-links)
    - [内嵌结账](#inline-checkout)
    - [用户识别](#user-identification)
- [价格](#prices)
- [客户](#customers)
    - [客户默认值](#customer-defaults)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [订阅单次收费](#subscription-single-charges)
    - [更新支付信息](#updating-payment-information)
    - [更改方案](#changing-plans)
    - [订阅数量](#subscription-quantity)
    - [订阅修饰符](#subscription-modifiers)
    - [多个订阅](#multiple-subscriptions)
    - [暂停订阅](#pausing-subscriptions)
    - [取消订阅](#cancelling-subscriptions)
- [订阅试用期](#subscription-trials)
    - [预先提供支付方式](#with-payment-method-up-front)
    - [不预先提供支付方式](#without-payment-method-up-front)
- [处理 Paddle Webhook](#handling-paddle-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [验证 Webhook 签名](#verifying-webhook-signatures)
- [单次收费](#single-charges)
    - [简单收费](#simple-charge)
    - [收费产品](#charging-products)
    - [退款订单](#refunding-orders)
- [收据](#receipts)
    - [过去与未来付款](#past-and-upcoming-payments)
- [处理失败付款](#handling-failed-payments)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Cashier Paddle](https://github.com/laravel/cashier-paddle) 为 [Paddle](https://paddle.com) 的订阅计费服务提供了表达性强、流畅的接口。它处理了几乎所有令人头疼的样板订阅计费代码。除了基本的订阅管理外，Cashier 还能处理：优惠券、切换订阅、订阅"数量"、取消宽限期等。

使用 Cashier 时，建议同时查阅 Paddle 的[用户指南](https://developer.paddle.com/guides)和 [API 文档](https://developer.paddle.com/api-reference)。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本的 Cashier 时，请务必仔细查阅[升级指南](https://github.com/laravel/cashier-paddle/blob/master/UPGRADE.md)。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器安装 Paddle 的 Cashier 包：

```shell
composer require laravel/cashier-paddle
```

> **Warning**  
> 为确保 Cashier 正确处理所有 Paddle 事件，请记住[设置 Cashier 的 Webhook 处理](#handling-paddle-webhooks)。

<a name="paddle-sandbox"></a>
### Paddle 沙箱

在本地和预发环境开发时，应[注册 Paddle 沙箱账户](https://developer.paddle.com/getting-started/sandbox)。此账户提供沙箱环境，用于测试和开发应用而无需实际付款。可以使用 Paddle 的[测试卡号](https://developer.paddle.com/getting-started/sandbox#test-cards)来模拟各种支付场景。

使用 Paddle 沙箱环境时，应在应用 `.env` 文件中将 `PADDLE_SANDBOX` 环境变量设置为 `true`：

```ini
PADDLE_SANDBOX=true
```

完成应用开发后，可以[申请 Paddle 商户账户](https://paddle.com)。在应用投入生产之前，Paddle 需要批准应用的域名。

<a name="database-migrations"></a>
### 数据库迁移

Cashier 服务提供者注册了自己的数据库迁移目录，因此安装包后请记得迁移数据库。Cashier 迁移将创建一个新的 `customers` 表。此外，还将创建一个新的 `subscriptions` 表用于存储所有客户的订阅。最后，还将创建一个新的 `receipts` 表用于存储应用的所有收据信息：

```shell
php artisan migrate
```

如果需要覆盖 Cashier 包含的迁移，可以使用 `vendor:publish` Artisan 命令发布它们：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

如果希望完全阻止 Cashier 的迁移运行，可以使用 Cashier 提供的 `ignoreMigrations`。通常，应在 `AppServiceProvider` 的 `register` 方法中调用此方法：

```php
use Laravel\Paddle\Cashier;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function register()
{
    Cashier::ignoreMigrations();
}
```

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

使用 Cashier 之前，必须将 `Billable` Trait 添加到用户模型定义中。此 Trait 提供了各种方法，用于执行常见的计费任务，如创建订阅、应用优惠券和更新支付方式信息：

```php
use Laravel\Paddle\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

如果有非用户的可计费实体，也可以将此 Trait 添加到这些类中：

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

接下来，应在应用 `.env` 文件中配置 Paddle 密钥。可以从 Paddle 控制面板获取 Paddle API 密钥：

```ini
PADDLE_VENDOR_ID=your-paddle-vendor-id
PADDLE_VENDOR_AUTH_CODE=your-paddle-vendor-auth-code
PADDLE_PUBLIC_KEY="your-paddle-public-key"
PADDLE_SANDBOX=true
```

使用 [Paddle 沙箱环境](#paddle-sandbox)时，`PADDLE_SANDBOX` 环境变量应设置为 `true`。如果将应用部署到生产环境并使用 Paddle 的正式商户环境，`PADDLE_SANDBOX` 变量应设置为 `false`。

<a name="paddle-js"></a>
### Paddle JS

Paddle 依赖其自己的 JavaScript 库来启动 Paddle 结账小部件。可以通过在应用布局的 `</head>` 结束标签之前放置 `@paddleJS` Blade 指令来加载 JavaScript 库：

```blade
<head>
    ...

    @paddleJS
</head>
```

<a name="currency-configuration"></a>
### 货币配置

Cashier 的默认货币为美元（USD）。可以通过在应用 `.env` 文件中定义 `CASHIER_CURRENCY` 环境变量来更改默认货币：

```ini
CASHIER_CURRENCY=EUR
```

除了配置 Cashier 的货币外，还可以指定用于在发票上显示格式化金额的区域设置。Cashier 内部使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php)来设置货币区域设置：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> **Warning**  
> 要使用 `en` 以外的区域设置，请确保服务器上已安装并配置了 `ext-intl` PHP 扩展。

<a name="overriding-default-models"></a>
### 覆盖默认模型

可以通过定义自己的模型并扩展相应的 Cashier 模型来自由扩展 Cashier 内部使用的模型：

```php
use Laravel\Paddle\Subscription as CashierSubscription;

class Subscription extends CashierSubscription
{
    // ...
}
```

定义模型后，可以通过 `Laravel\Paddle\Cashier` 类指示 Cashier 使用自定义模型。通常，应在应用 `App\Providers\AppServiceProvider` 类的 `boot` 方法中告知 Cashier 使用自定义模型：

```php
use App\Models\Cashier\Receipt;
use App\Models\Cashier\Subscription;

/**
 * 引导任何应用服务。
 *
 * @return void
 */
public function boot()
{
    Cashier::useReceiptModel(Receipt::class);
    Cashier::useSubscriptionModel(Subscription::class);
}
```

<a name="core-concepts"></a>
## 核心概念

<a name="pay-links"></a>
### 支付链接

Paddle 缺乏用于执行订阅状态更改的完整 CRUD API。因此，与 Paddle 的大多数交互通过其[结账小部件](https://developer.paddle.com/guides/how-tos/checkout/paddle-checkout)完成。在显示结账小部件之前，必须使用 Cashier 生成"支付链接"。"支付链接"将告知结账小部件我们希望执行的计费操作：

```php
use App\Models\User;
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $payLink = $request->user()->newSubscription('default', $premium = 34567)
        ->returnTo(route('home'))
        ->create();

    return view('billing', ['payLink' => $payLink]);
});
```

Cashier 包含一个 `paddle-button` [Blade 组件](/docs/{{version}}/blade#components)。可以将支付链接 URL 作为"prop"传递给此组件。点击此按钮时，将显示 Paddle 的结账小部件：

```blade
<x-paddle-button :url="$payLink" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

默认情况下，这将显示一个带有标准 Paddle 样式的按钮。可以通过在组件上添加 `data-theme="none"` 属性来移除所有 Paddle 样式：

```blade
<x-paddle-button :url="$payLink" class="px-8 py-4" data-theme="none">
    Subscribe
</x-paddle-button>
```

Paddle 结账小部件是异步的。用户在小部件中创建或更新订阅后，Paddle 将向应用发送 Webhook，以便在自有数据库中正确更新订阅状态。因此，正确[设置 Webhook](#handling-paddle-webhooks)以处理来自 Paddle 的状态更改非常重要。

有关支付链接的更多信息，可以查阅 [Paddle 关于支付链接生成的 API 文档](https://developer.paddle.com/api-reference/product-api/pay-links/createpaylink)。

> **Warning**  
> 订阅状态更改后，接收相应 Webhook 的延迟通常很短，但应在应用中考虑到用户在完成结账后可能无法立即获得订阅更新。

<a name="manually-rendering-pay-links"></a>
#### 手动渲染支付链接

也可以不使用 Laravel 内置的 Blade 组件手动渲染支付链接。首先，按之前示例所示生成支付链接 URL：

```php
$payLink = $request->user()->newSubscription('default', $premium = 34567)
    ->returnTo(route('home'))
    ->create();
```

接下来，将支付链接 URL 附加到 HTML 中的 `a` 元素：

```blade
<a href="#!" class="ml-4 paddle_button" data-override="{{ $payLink }}">
    Paddle Checkout
</a>
```

<a name="payments-requiring-additional-confirmation"></a>
#### 需要额外确认的付款

有时需要额外验证才能确认和处理付款。此时，Paddle 将显示付款确认页面。Paddle 或 Cashier 显示的付款确认页面可能针对特定银行或发卡机构的付款流程，可能包含额外的卡片确认、临时小额扣款、单独的设备认证或其他形式的验证。

<a name="inline-checkout"></a>
### 内嵌结账

如果不想使用 Paddle 的"覆盖"式结账小部件，Paddle 还提供了内嵌显示小部件的选项。虽然此方式不允许调整结账的任何 HTML 字段，但允许将小部件嵌入应用中。

为方便使用内嵌结账，Cashier 包含一个 `paddle-checkout` Blade 组件。首先，应[生成支付链接](#pay-links)并将支付链接传递给组件的 `override` 属性：

```blade
<x-paddle-checkout :override="$payLink" class="w-full" />
```

要调整内嵌结账组件的高度，可以将 `height` 属性传递给 Blade 组件：

```blade
<x-paddle-checkout :override="$payLink" class="w-full" height="500" />
```

<a name="inline-checkout-without-pay-links"></a>
#### 不使用支付链接的内嵌结账

或者，可以使用自定义选项自定义小部件，而非使用支付链接：

```blade
@php
$options = [
    'product' => $productId,
    'title' => 'Product Title',
];
@endphp

<x-paddle-checkout :options="$options" class="w-full" />
```

请查阅 Paddle 的[内嵌结账指南](https://developer.paddle.com/guides/how-tos/checkout/inline-checkout)及其[参数参考](https://developer.paddle.com/reference/paddle-js/parameters)以获取有关内嵌结账可用选项的更多详细信息。

> **Warning**  
> 如果在指定自定义选项时还希望使用 `passthrough` 选项，应提供键 / 值数组作为其值。Cashier 会自动处理将数组转换为 JSON 字符串。此外，`customer_id` passthrough 选项保留供 Cashier 内部使用。

<a name="manually-rendering-an-inline-checkout"></a>
#### 手动渲染内嵌结账

也可以不使用 Laravel 内置的 Blade 组件手动渲染内嵌结账。首先，[按之前示例所示](#pay-links)生成支付链接 URL。

接下来，可以使用 Paddle.js 初始化结账。为保持此示例简单，将使用 [Alpine.js](https://github.com/alpinejs/alpine) 演示；但可以自由将此示例转换为自己的前端技术栈：

```alpine
<div class="paddle-checkout" x-data="{}" x-init="
    Paddle.Checkout.open({
        override: {{ $payLink }},
        method: 'inline',
        frameTarget: 'paddle-checkout',
        frameInitialHeight: 366,
        frameStyle: 'width: 100%; background-color: transparent; border: none;'
    });
">
</div>
```

<a name="user-identification"></a>
### 用户识别

与 Stripe 不同，Paddle 用户在所有 Paddle 中是唯一的，而非每个 Paddle 账户唯一。因此，Paddle 的 API 目前不提供更新用户详细信息（如邮箱地址）的方法。生成支付链接时，Paddle 使用 `customer_email` 参数识别用户。创建订阅时，Paddle 将尝试将提供的邮箱与现有 Paddle 用户匹配。

鉴于此行为，使用 Cashier 和 Paddle 时需注意一些重要事项。首先，应了解即使 Cashier 中的订阅绑定到同一应用用户，**它们也可能绑定到 Paddle 内部系统中的不同用户**。其次，每个订阅都有自己的关联支付方式信息，且在 Paddle 内部系统中可能有不同的邮箱地址（取决于创建订阅时分配给用户的邮箱）。

因此，显示订阅时应始终按订阅逐个告知用户哪个邮箱地址或支付方式信息与订阅关联。可以使用 `Laravel\Paddle\Subscription` 模型提供的以下方法检索此信息：

```php
$subscription = $user->subscription('default');

$subscription->paddleEmail();
$subscription->paymentMethod();
$subscription->cardBrand();
$subscription->cardLastFour();
$subscription->cardExpirationDate();
```

目前无法通过 Paddle API 修改用户的邮箱地址。当用户希望更新其在 Paddle 中的邮箱地址时，唯一的方式是联系 Paddle 客户支持。与 Paddle 沟通时，需要提供订阅的 `paddleEmail` 值以协助 Paddle 更新正确的用户。

<a name="prices"></a>
## 价格

Paddle 允许按货币自定义价格，实质上允许为不同国家配置不同价格。Cashier Paddle 允许使用 `productPrices` 方法检索给定产品的所有价格。此方法接受希望检索价格的产品的产品 ID：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::productPrices([123, 456]);
```

货币将根据请求的 IP 地址确定；但也可以选择提供特定国家来检索价格：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::productPrices([123, 456], ['customer_country' => 'BE']);
```

检索价格后，可以按需显示：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product_title }} - {{ $price->price()->gross() }}</li>
    @endforeach
</ul>
```

也可以显示净价（不含税）并单独显示税额：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product_title }} - {{ $price->price()->net() }} (+ {{ $price->price()->tax() }} tax)</li>
    @endforeach
</ul>
```

如果检索的是订阅方案的价格，可以分别显示初始价格和周期价格：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product_title }} - Initial: {{ $price->initialPrice()->gross() }} - Recurring: {{ $price->recurringPrice()->gross() }}</li>
    @endforeach
</ul>
```

更多信息请查阅 [Paddle 关于价格的 API 文档](https://developer.paddle.com/api-reference/checkout-api/prices/getprices)。

<a name="prices-customers"></a>
#### 客户

如果用户已是客户且希望显示适用于该客户的价格，可以直接从客户实例检索价格：

```php
use App\Models\User;

$prices = User::find(1)->productPrices([123, 456]);
```

Cashier 内部将使用用户的 [`paddleCountry` 方法](#customer-defaults)以其货币检索价格。例如，居住在美国的用户将看到美元价格，而比利时用户将看到欧元价格。如果找不到匹配的货币，将使用产品的默认货币。可以在 Paddle 控制面板中自定义产品或订阅方案的所有价格。

<a name="prices-coupons"></a>
#### 优惠券

也可以选择在优惠券减免后显示价格。调用 `productPrices` 方法时，优惠券可以以逗号分隔的字符串传递：

```php
use Laravel\Paddle\Cashier;

$prices = Cashier::productPrices([123, 456], [
    'coupons' => 'SUMMERSALE,20PERCENTOFF'
]);
```

然后，使用 `price` 方法显示计算后的价格：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product_title }} - {{ $price->price()->gross() }}</li>
    @endforeach
</ul>
```

可以使用 `listPrice` 方法显示原始标价（不含优惠券折扣）：

```blade
<ul>
    @foreach ($prices as $price)
        <li>{{ $price->product_title }} - {{ $price->listPrice()->gross() }}</li>
    @endforeach
</ul>
```

> **Warning**  
> 使用价格 API 时，Paddle 仅允许将优惠券应用于一次性购买产品，而非订阅方案。

<a name="customers"></a>
## 客户

<a name="customer-defaults"></a>
### 客户默认值

Cashier 允许在创建支付链接时为客户定义一些有用的默认值。设置这些默认值可以预填客户的邮箱地址、国家和邮政编码，使其可以直接进入结账小部件的付款部分。可以通过在可计费模型上覆盖以下方法来设置这些默认值：

```php
/**
 * 获取与 Paddle 关联的客户邮箱地址。
 *
 * @return string|null
 */
public function paddleEmail()
{
    return $this->email;
}

/**
 * 获取与 Paddle 关联的客户国家。
 *
 * 这需要是 2 字母代码。支持的国家请参见以下链接。
 *
 * @return string|null
 * @link https://developer.paddle.com/reference/platform-parameters/supported-countries
 */
public function paddleCountry()
{
    //
}

/**
 * 获取与 Paddle 关联的客户邮政编码。
 *
 * 需要此信息的国家请参见以下链接。
 *
 * @return string|null
 * @link https://developer.paddle.com/reference/platform-parameters/supported-countries#countries-requiring-postcode
 */
public function paddlePostcode()
{
    //
}
```

这些默认值将用于 Cashier 中生成[支付链接](#pay-links)的每个操作。

<a name="subscriptions"></a>
## 订阅

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先从数据库检索可计费模型实例，通常是 `App\Models\User` 的实例。检索到模型实例后，可以使用 `newSubscription` 方法创建模型的订阅支付链接：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $payLink = $request->user()->newSubscription('default', $premium = 12345)
        ->returnTo(route('home'))
        ->create();

    return view('billing', ['payLink' => $payLink]);
});
```

传递给 `newSubscription` 方法的第一个参数应为订阅的内部名称。如果应用仅提供单一订阅，可以将其命名为 `default` 或 `primary`。此订阅名称仅供应用内部使用，不应向用户显示。此外，它不应包含空格，且在创建订阅后不应更改。传递给 `newSubscription` 方法的第二个参数是用户订阅的特定方案。此值应对应 Paddle 中方案的标识符。`returnTo` 方法接受用户成功完成结账后重定向到的 URL。

`create` 方法将创建一个支付链接，可用于生成付款按钮。付款按钮可以使用 Cashier Paddle 包含的 `paddle-button` [Blade 组件](/docs/{{version}}/blade#components)生成：

```blade
<x-paddle-button :url="$payLink" class="px-8 py-4">
    Subscribe
</x-paddle-button>
```

用户完成结账后，Paddle 将分发 `subscription_created` Webhook。Cashier 将接收此 Webhook 并为客户设置订阅。为确保应用正确接收和处理所有 Webhook，请确保已正确[设置 Webhook 处理](#handling-paddle-webhooks)。

<a name="additional-details"></a>
#### 额外详情

如果希望指定额外的客户或订阅详情，可以将它们作为键 / 值对数组传递给 `create` 方法。要了解 Paddle 支持的额外字段，请查阅 Paddle 关于[生成支付链接](https://developer.paddle.com/api-reference/product-api/pay-links/createpaylink)的文档：

```php
$payLink = $user->newSubscription('default', $monthly = 12345)
    ->returnTo(route('home'))
    ->create([
        'vat_number' => $vatNumber,
    ]);
```

<a name="subscriptions-coupons"></a>
#### 优惠券

如果希望在创建订阅时应用优惠券，可以使用 `withCoupon` 方法：

```php
$payLink = $user->newSubscription('default', $monthly = 12345)
    ->returnTo(route('home'))
    ->withCoupon('code')
    ->create();
```

<a name="metadata"></a>
#### 元数据

也可以使用 `withMetadata` 方法传递元数据数组：

```php
$payLink = $user->newSubscription('default', $monthly = 12345)
    ->returnTo(route('home'))
    ->withMetadata(['key' => 'value'])
    ->create();
```

> **Warning**  
> 提供元数据时，请避免使用 `subscription_name` 作为元数据键。此键保留供 Cashier 内部使用。

<a name="checking-subscription-status"></a>
### 检查订阅状态

用户订阅应用后，可以使用多种便捷方法检查其订阅状态。首先，如果用户有活跃订阅，`subscribed` 方法返回 `true`，即使订阅当前处于试用期内也是如此：

```php
if ($user->subscribed('default')) {
    //
}
```

`subscribed` 方法也适合作为[路由中间件](/docs/{{version}}/middleware)，允许根据用户的订阅状态过滤对路由和控制器的访问：

```php
<?php

namespace App\Http\Middleware;

use Closure;

class EnsureUserIsSubscribed
{
    /**
     * 处理传入请求。
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        if ($request->user() && ! $request->user()->subscribed('default')) {
            // 此用户不是付费客户...
            return redirect('billing');
        }

        return $next($request);
    }
}
```

如果希望确定用户是否仍处于试用期内，可以使用 `onTrial` 方法。此方法可用于确定是否应向用户显示仍在试用期内的警告：

```php
if ($user->subscription('default')->onTrial()) {
    //
}
```

可以使用 `subscribedToPlan` 方法根据给定的 Paddle 方案 ID 确定用户是否订阅了给定方案。在此示例中，将确定用户的 `default` 订阅是否活跃订阅了月度方案：

```php
if ($user->subscribedToPlan($monthly = 12345, 'default')) {
    //
}
```

通过向 `subscribedToPlan` 方法传递数组，可以确定用户的 `default` 订阅是否活跃订阅了月度或年度方案：

```php
if ($user->subscribedToPlan([$monthly = 12345, $yearly = 54321], 'default')) {
    //
}
```

可以使用 `recurring` 方法确定用户当前是否已订阅且不再处于试用期内：

```php
if ($user->subscription('default')->recurring()) {
    //
}
```

<a name="cancelled-subscription-status"></a>
#### 已取消订阅状态

要确定用户曾是活跃订阅者但已取消订阅，可以使用 `cancelled` 方法：

```php
if ($user->subscription('default')->cancelled()) {
    //
}
```

也可以确定用户是否已取消订阅但仍处于"宽限期"内直到订阅完全过期。例如，如果用户在 3 月 5 日取消了原定于 3 月 10 日过期的订阅，则用户在 3 月 10 日之前都处于"宽限期"。注意，在此期间 `subscribed` 方法仍返回 `true`：

```php
if ($user->subscription('default')->onGracePeriod()) {
    //
}
```

要确定用户是否已取消订阅且不再处于"宽限期"内，可以使用 `ended` 方法：

```php
if ($user->subscription('default')->ended()) {
    //
}
```

<a name="past-due-status"></a>
#### 逾期状态

如果订阅付款失败，将被标记为 `past_due`。当订阅处于此状态时，在客户更新支付信息之前它将不会活跃。可以使用订阅实例上的 `pastDue` 方法确定订阅是否逾期：

```php
if ($user->subscription('default')->pastDue()) {
    //
}
```

当订阅逾期时，应指示用户[更新其支付信息](#updating-payment-information)。可以在 [Paddle 订阅设置](https://vendors.paddle.com/subscription-settings)中配置如何处理逾期订阅。

如果希望订阅在 `past_due` 状态时仍被视为活跃，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 方法。通常，应在 `AppServiceProvider` 的 `register` 方法中调用此方法：

```php
use Laravel\Paddle\Cashier;

/**
 * 注册任何应用服务。
 *
 * @return void
 */
public function register()
{
    Cashier::keepPastDueSubscriptionsActive();
}
```

> **Warning**  
> 当订阅处于 `past_due` 状态时，在支付信息更新之前无法更改。因此，`swap` 和 `updateQuantity` 方法在订阅处于 `past_due` 状态时会抛出异常。

<a name="subscription-scopes"></a>
#### 订阅作用域

大多数订阅状态也可作为查询作用域使用，以便轻松查询数据库中处于给定状态的订阅：

```php
// 获取所有活跃订阅...
$subscriptions = Subscription::query()->active()->get();

// 获取用户的所有已取消订阅...
$subscriptions = $user->subscriptions()->cancelled()->get();
```

可用作用域的完整列表如下：

```php
Subscription::query()->active();
Subscription::query()->onTrial();
Subscription::query()->notOnTrial();
Subscription::query()->pastDue();
Subscription::query()->recurring();
Subscription::query()->ended();
Subscription::query()->paused();
Subscription::query()->notPaused();
Subscription::query()->onPausedGracePeriod();
Subscription::query()->notOnPausedGracePeriod();
Subscription::query()->cancelled();
Subscription::query()->notCancelled();
Subscription::query()->onGracePeriod();
Subscription::query()->notOnGracePeriod();
```

<a name="subscription-single-charges"></a>
### 订阅单次收费

订阅单次收费允许在订阅基础上向订阅者收取一次性费用：

```php
$response = $user->subscription('default')->charge(12.99, 'Support Add-on');
```

与[单次收费](#single-charges)不同，此方法将立即向客户存储的订阅支付方式收费。收费金额应始终以订阅的货币定义。

<a name="updating-payment-information"></a>
### 更新支付信息

Paddle 始终为每个订阅保存一种支付方式。如果希望更新订阅的默认支付方式，应首先使用订阅模型上的 `updateUrl` 方法生成订阅"更新 URL"：

```php
use App\Models\User;

$user = User::find(1);

$updateUrl = $user->subscription('default')->updateUrl();
```

然后，可以使用生成的 URL 结合 Cashier 提供的 `paddle-button` Blade 组件，允许用户启动 Paddle 小部件并更新其支付信息：

```blade
<x-paddle-button :url="$updateUrl" class="px-8 py-4">
    Update Card
</x-paddle-button>
```

用户完成信息更新后，Paddle 将分发 `subscription_updated` Webhook，订阅详情将在应用数据库中更新。

<a name="changing-plans"></a>
### 更改方案

用户订阅应用后，可能偶尔希望更改到新的订阅方案。要更新用户的订阅方案，应将 Paddle 方案的标识符传递给订阅的 `swap` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->swap($premium = 34567);
```

如果希望切换方案并立即向用户开具发票而非等待下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->swapAndInvoice($premium = 34567);
```

> **Warning**  
> 试用期内无法切换方案。有关此限制的更多信息，请参见 [Paddle 文档](https://developer.paddle.com/api-reference/subscription-api/users/updateuser#usage-notes)。

<a name="prorations"></a>
#### 按比例计算

默认情况下，Paddle 在方案之间切换时按比例计算费用。可以使用 `noProrate` 方法更新订阅而不按比例计算费用：

```php
$user->subscription('default')->noProrate()->swap($premium = 34567);
```

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅受"数量"影响。例如，项目管理应用可能每月每个项目收费 10 美元。要轻松增减订阅数量，使用 `incrementQuantity` 和 `decrementQuantity` 方法：

```php
$user = User::find(1);

$user->subscription('default')->incrementQuantity();

// 将订阅当前数量加 5...
$user->subscription('default')->incrementQuantity(5);

$user->subscription('default')->decrementQuantity();

// 将订阅当前数量减 5...
$user->subscription('default')->decrementQuantity(5);
```

或者，可以使用 `updateQuantity` 方法设置特定数量：

```php
$user->subscription('default')->updateQuantity(10);
```

可以使用 `noProrate` 方法更新订阅数量而不按比例计算费用：

```php
$user->subscription('default')->noProrate()->updateQuantity(10);
```

<a name="subscription-modifiers"></a>
### 订阅修饰符

订阅修饰符允许实现[计量计费](https://developer.paddle.com/guides/how-tos/subscriptions/metered-billing#using-subscription-price-modifiers)或通过附加项扩展订阅。

例如，可能希望提供标准订阅的"高级支持"附加项。可以这样创建此修饰符：

```php
$modifier = $user->subscription('default')->newModifier(12.99)->create();
```

以上示例将在订阅上添加 12.99 美元的附加项。默认情况下，此费用将在为订阅配置的每个间隔周期性收取。如果需要，可以使用修饰符的 `description` 方法为修饰符添加可读描述：

```php
$modifier = $user->subscription('default')->newModifier(12.99)
    ->description('Premium Support')
    ->create();
```

为说明如何使用修饰符实现计量计费，假设应用按用户发送的每条短信收费。首先，应在 Paddle 控制面板中创建一个 0 美元的方案。用户订阅此方案后，可以将代表每次单独收费的修饰符添加到订阅：

```php
$modifier = $user->subscription('default')->newModifier(0.99)
    ->description('New text message')
    ->oneTime()
    ->create();
```

如上所示，创建此修饰符时调用了 `oneTime` 方法。此方法将确保修饰符仅收费一次，不会每个计费间隔周期性收取。

<a name="retrieving-modifiers"></a>
#### 检索修饰符

可以通过 `modifiers` 方法检索订阅的所有修饰符列表：

```php
$modifiers = $user->subscription('default')->modifiers();

foreach ($modifiers as $modifier) {
    $modifier->amount(); // $0.99
    $modifier->description; // New text message.
}
```

<a name="deleting-modifiers"></a>
#### 删除修饰符

可以通过在 `Laravel\Paddle\Modifier` 实例上调用 `delete` 方法来删除修饰符：

```php
$modifier->delete();
```

<a name="multiple-subscriptions"></a>
### 多个订阅

Paddle 允许客户同时拥有多个订阅。例如，可能经营一家提供游泳订阅和举重订阅的健身房，每个订阅可能有不同的定价。当然，客户应该能够订阅其中一个或两个方案。

当应用创建订阅时，可以将订阅名称传递给 `newSubscription` 方法。名称可以是表示用户发起的订阅类型的任意字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $request->user()
        ->newSubscription('swimming', $swimmingMonthly = 12345)
        ->create($request->paymentMethodId);

    // ...
});
```

在此示例中，为客户发起了月度游泳订阅。但他们可能希望稍后切换到年度订阅。调整客户订阅时，可以简单地在 `swimming` 订阅上切换价格：

```php
$user->subscription('swimming')->swap($swimmingYearly = 34567);
```

当然，也可以完全取消订阅：

```php
$user->subscription('swimming')->cancel();
```

<a name="pausing-subscriptions"></a>
### 暂停订阅

要暂停订阅，在用户订阅上调用 `pause` 方法：

```php
$user->subscription('default')->pause();
```

当订阅暂停时，Cashier 会自动在数据库中设置 `paused_from` 列。此列用于确定 `paused` 方法应何时开始返回 `true`。例如，如果客户在 3 月 1 日暂停订阅，但订阅原定于 3 月 5 日才续订，则 `paused` 方法将持续返回 `false` 直到 3 月 5 日。这是因为通常允许用户继续使用应用直到当前计费周期结束。

可以使用 `onPausedGracePeriod` 方法确定用户是否已暂停订阅但仍处于"宽限期"：

```php
if ($user->subscription('default')->onPausedGracePeriod()) {
    //
}
```

要恢复暂停的订阅，可以在用户订阅上调用 `unpause` 方法：

```php
$user->subscription('default')->unpause();
```

> **Warning**  
> 订阅暂停期间无法修改。如果要切换到不同方案或更新数量，必须先恢复订阅。

<a name="cancelling-subscriptions"></a>
### 取消订阅

要取消订阅，在用户订阅上调用 `cancel` 方法：

```php
$user->subscription('default')->cancel();
```

当订阅取消时，Cashier 会自动在数据库中设置 `ends_at` 列。此列用于确定 `subscribed` 方法应何时开始返回 `false`。例如，如果客户在 3 月 1 日取消订阅，但订阅原定于 3 月 5 日才结束，则 `subscribed` 方法将持续返回 `true` 直到 3 月 5 日。这是因为通常允许用户继续使用应用直到当前计费周期结束。

可以使用 `onGracePeriod` 方法确定用户是否已取消订阅但仍处于"宽限期"：

```php
if ($user->subscription('default')->onGracePeriod()) {
    //
}
```

如果希望立即取消订阅，可以在用户订阅上调用 `cancelNow` 方法：

```php
$user->subscription('default')->cancelNow();
```

> **Warning**  
> Paddle 的订阅取消后无法恢复。如果客户希望恢复订阅，必须重新订阅新订阅。

<a name="subscription-trials"></a>
## 订阅试用期

<a name="with-payment-method-up-front"></a>
### 预先提供支付方式

> **Warning**  
> 在试用期并预先收集支付方式详情时，Paddle 阻止任何订阅更改，如切换方案或更新数量。如果希望允许客户在试用期内切换方案，必须取消并重新创建订阅。

如果希望在为客户提供试用期的同时预先收集支付方式信息，应在创建订阅支付链接时使用 `trialDays` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $payLink = $request->user()->newSubscription('default', $monthly = 12345)
                ->returnTo(route('home'))
                ->trialDays(10)
                ->create();

    return view('billing', ['payLink' => $payLink]);
});
```

此方法将在应用数据库中的订阅记录上设置试用期结束日期，并指示 Paddle 在此日期之后才开始向客户计费。

> **Warning**  
> 如果客户的订阅在试用期结束日期前未取消，试用期一过即会被收费，因此应确保通知用户其试用期结束日期。

可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法确定用户是否处于试用期内。以下两个示例是等效的：

```php
if ($user->onTrial('default')) {
    //
}

if ($user->subscription('default')->onTrial()) {
    //
}
```

要确定现有试用是否已过期，可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial('default')) {
    //
}

if ($user->subscription('default')->hasExpiredTrial()) {
    //
}
```

<a name="defining-trial-days-in-paddle-cashier"></a>
#### 在 Paddle / Cashier 中定义试用天数

可以选择在 Paddle 控制面板中定义方案接收的试用天数，或始终使用 Cashier 显式传递。如果选择在 Paddle 中定义方案的试用天数，应注意新订阅（包括过去曾有订阅的客户的新订阅）将始终获得试用期，除非显式调用 `trialDays(0)` 方法。

<a name="without-payment-method-up-front"></a>
### 不预先提供支付方式

如果希望在不预先收集用户支付方式信息的情况下提供试用期，可以将附加到用户的客户记录上的 `trial_ends_at` 列设置为所需的试用结束日期。这通常在用户注册期间完成：

```php
use App\Models\User;

$user = User::create([
    // ...
]);

$user->createAsCustomer([
    'trial_ends_at' => now()->addDays(10)
]);
```

Cashier 将此类试用称为"通用试用"，因为它不附加到任何现有订阅。如果当前日期未超过 `trial_ends_at` 的值，`User` 实例上的 `onTrial` 方法将返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于试用期内...
}
```

准备好为用户创建实际订阅后，可以像往常一样使用 `newSubscription` 方法：

```php
use Illuminate\Http\Request;

Route::get('/user/subscribe', function (Request $request) {
    $payLink = $user->newSubscription('default', $monthly = 12345)
        ->returnTo(route('home'))
        ->create();

    return view('billing', ['payLink' => $payLink]);
});
```

要检索用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户处于试用期，此方法将返回 Carbon 日期实例，否则返回 `null`。如果希望获取默认订阅以外特定订阅的试用结束日期，也可以传递可选的订阅名称参数：

```php
if ($user->onTrial()) {
    $trialEndsAt = $user->trialEndsAt('main');
}
```

如果希望明确知道用户处于"通用"试用期内且尚未创建实际订阅，可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户处于"通用"试用期内...
}
```

> **Warning**  
> Paddle 订阅创建后无法延长或修改试用期。

<a name="handling-paddle-webhooks"></a>
## 处理 Paddle Webhook

Paddle 可以通过 Webhook 通知应用各种事件。默认情况下，指向 Cashier Webhook 控制器的路由由 Cashier 服务提供者注册。此控制器将处理所有传入的 Webhook 请求。

默认情况下，此控制器将自动处理因过多失败收费而取消的订阅（[由 Paddle 催款设置定义](https://vendors.paddle.com/recover-settings#dunning-form-id)）、订阅更新和支付方式更改；但正如即将介绍的，可以扩展此控制器以处理任何喜欢的 Paddle Webhook 事件。

为确保应用能处理 Paddle Webhook，请务必[在 Paddle 控制面板中配置 Webhook URL](https://vendors.paddle.com/alerts-webhooks)。默认情况下，Cashier 的 Webhook 控制器响应 `/paddle/webhook` URL 路径。应在 Paddle 控制面板中启用的所有 Webhook 的完整列表为：

- Subscription Created
- Subscription Updated
- Subscription Cancelled
- Payment Succeeded
- Subscription Payment Succeeded

> **Warning**  
> 确保使用 Cashier 包含的 [Webhook 签名验证](/docs/{{version}}/cashier-paddle#verifying-webhook-signatures)中间件保护传入请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 保护

由于 Paddle Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，请务必在 `App\Http\Middleware\VerifyCsrfToken` 中间件中将此 URI 列为例外，或将路由列在 `web` 中间件组之外：

```php
protected $except = [
    'paddle/*',
];
```

<a name="webhooks-local-development"></a>
#### Webhook 与本地开发

要在本地开发期间让 Paddle 能够向应用发送 Webhook，需要通过 [Ngrok](https://ngrok.com/) 或 [Expose](https://expose.dev/docs/introduction) 等站点共享服务暴露应用。如果使用 [Laravel Sail](/docs/{{version}}/sail) 在本地开发应用，可以使用 Sail 的[站点共享命令](/docs/{{version}}/sail#sharing-your-site)。

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 自动处理失败收费导致的订阅取消和其他常见 Paddle Webhook。但如果有其他希望处理的 Webhook 事件，可以通过监听 Cashier 分发的以下事件来实现：

- `Laravel\Paddle\Events\WebhookReceived`
- `Laravel\Paddle\Events\WebhookHandled`

两个事件都包含 Paddle Webhook 的完整负载。例如，如果希望处理 `invoice.payment_succeeded` Webhook，可以注册一个将处理该事件的[监听器](/docs/{{version}}/events#defining-listeners)：

```php
<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;

class PaddleEventListener
{
    /**
     * 处理接收到的 Paddle Webhook。
     *
     * @param  \Laravel\Paddle\Events\WebhookReceived  $event
     * @return void
     */
    public function handle(WebhookReceived $event)
    {
        if ($event->payload['alert_name'] === 'payment_succeeded') {
            // 处理传入事件...
        }
    }
}
```

定义监听器后，可以在应用的 `EventServiceProvider` 中注册：

```php
<?php

namespace App\Providers;

use App\Listeners\PaddleEventListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Laravel\Paddle\Events\WebhookReceived;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        WebhookReceived::class => [
            PaddleEventListener::class,
        ],
    ];
}
```

Cashier 还会发出专用于接收到的 Webhook 类型的事件。除了来自 Paddle 的完整负载外，它们还包含用于处理 Webhook 的相关模型，如可计费模型、订阅或收据：

- `Laravel\Paddle\Events\PaymentSucceeded`
- `Laravel\Paddle\Events\SubscriptionPaymentSucceeded`
- `Laravel\Paddle\Events\SubscriptionCreated`
- `Laravel\Paddle\Events\SubscriptionUpdated`
- `Laravel\Paddle\Events\SubscriptionCancelled`

也可以通过在应用 `.env` 文件中定义 `CASHIER_WEBHOOK` 环境变量来覆盖默认的内置 Webhook 路由。此值应为 Webhook 路由的完整 URL，且需要与 Paddle 控制面板中设置的 URL 匹配：

```ini
CASHIER_WEBHOOK=https://example.com/my-paddle-webhook-url
```

<a name="verifying-webhook-signatures"></a>
### 验证 Webhook 签名

为确保 Webhook 安全，可以使用 [Paddle 的 Webhook 签名](https://developer.paddle.com/webhook-reference/verifying-webhooks)。为方便起见，Cashier 自动包含一个中间件，用于验证传入的 Paddle Webhook 请求是否有效。

要启用 Webhook 验证，请确保在应用 `.env` 文件中定义了 `PADDLE_PUBLIC_KEY` 环境变量。公钥可从 Paddle 账户控制面板获取。

<a name="single-charges"></a>
## 单次收费

<a name="simple-charge"></a>
### 简单收费

如果希望对客户进行一次性收费，可以使用可计费模型实例上的 `charge` 方法生成收费的支付链接。`charge` 方法接受收费金额（浮点数）作为第一个参数，收费描述作为第二个参数：

```php
use Illuminate\Http\Request;

Route::get('/store', function (Request $request) {
    return view('store', [
        'payLink' => $user->charge(12.99, 'Action Figure')
    ]);
});
```

生成支付链接后，可以使用 Cashier 提供的 `paddle-button` Blade 组件允许用户启动 Paddle 小部件并完成收费：

```blade
<x-paddle-button :url="$payLink" class="px-8 py-4">
    Buy
</x-paddle-button>
```

`charge` 方法接受数组作为第三个参数，允许将任何希望的选项传递给底层 Paddle 支付链接创建。请查阅 [Paddle 文档](https://developer.paddle.com/api-reference/product-api/pay-links/createpaylink)以了解创建收费时可用的选项：

```php
$payLink = $user->charge(12.99, 'Action Figure', [
    'custom_option' => $value,
]);
```

收费以 `cashier.currency` 配置选项中指定的货币进行。默认情况下，此设置为 USD。可以通过在应用 `.env` 文件中定义 `CASHIER_CURRENCY` 环境变量来覆盖默认货币：

```ini
CASHIER_CURRENCY=EUR
```

也可以使用 Paddle 的动态定价匹配系统[按货币覆盖价格](https://developer.paddle.com/api-reference/product-api/pay-links/createpaylink#price-overrides)。为此，传递价格数组而非固定金额：

```php
$payLink = $user->charge([
    'USD:19.99',
    'EUR:15.99',
], 'Action Figure');
```

<a name="charging-products"></a>
### 收费产品

如果希望对 Paddle 中配置的特定产品进行一次性收费，可以使用可计费模型实例上的 `chargeProduct` 方法生成支付链接：

```php
use Illuminate\Http\Request;

Route::get('/store', function (Request $request) {
    return view('store', [
        'payLink' => $request->user()->chargeProduct($productId = 123)
    ]);
});
```

然后，可以将支付链接提供给 `paddle-button` 组件以允许用户初始化 Paddle 小部件：

```blade
<x-paddle-button :url="$payLink" class="px-8 py-4">
    Buy
</x-paddle-button>
```

`chargeProduct` 方法接受数组作为第二个参数，允许将任何希望的选项传递给底层 Paddle 支付链接创建。请查阅 [Paddle 文档](https://developer.paddle.com/api-reference/product-api/pay-links/createpaylink)以了解创建收费时可用的选项：

```php
$payLink = $user->chargeProduct($productId, [
    'custom_option' => $value,
]);
```

<a name="refunding-orders"></a>
### 退款订单

如果需要退款 Paddle 订单，可以使用 `refund` 方法。此方法接受 Paddle 订单 ID 作为第一个参数。可以使用 `receipts` 方法检索给定可计费模型的收据：

```php
use App\Models\User;

$user = User::find(1);

$receipt = $user->receipts()->first();

$refundRequestId = $user->refund($receipt->order_id);
```

也可以选择指定退款金额和退款原因：

```php
$receipt = $user->receipts()->first();

$refundRequestId = $user->refund(
    $receipt->order_id, 5.00, 'Unused product time'
);
```

> **Note**  
> 联系 Paddle 支持时，可以使用 `$refundRequestId` 作为退款参考。

<a name="receipts"></a>
## 收据

可以通过 `receipts` 属性轻松检索可计费模型的收据数组：

```php
use App\Models\User;

$user = User::find(1);

$receipts = $user->receipts;
```

列出客户的收据时，可以使用收据实例的方法显示相关收据信息。例如，可能希望在表格中列出每个收据，允许用户轻松下载任何收据：

```blade
<table>
    @foreach ($receipts as $receipt)
        <tr>
            <td>{{ $receipt->paid_at->toFormattedDateString() }}</td>
            <td>{{ $receipt->amount() }}</td>
            <td><a href="{{ $receipt->receipt_url }}" target="_blank">Download</a></td>
        </tr>
    @endforeach
</table>
```

<a name="past-and-upcoming-payments"></a>
### 过去与未来付款

可以使用 `lastPayment` 和 `nextPayment` 方法检索和显示客户周期订阅的过去或未来付款：

```php
use App\Models\User;

$user = User::find(1);

$subscription = $user->subscription('default');

$lastPayment = $subscription->lastPayment();
$nextPayment = $subscription->nextPayment();
```

这两个方法都将返回 `Laravel\Paddle\Payment` 实例；但当计费周期已结束（如订阅已取消）时，`nextPayment` 将返回 `null`：

```blade
Next payment: {{ $nextPayment->amount() }} due on {{ $nextPayment->date()->format('d/m/Y') }}
```

<a name="handling-failed-payments"></a>
## 处理失败付款

订阅付款因各种原因失败，如卡片过期或余额不足。此时，建议让 Paddle 处理付款失败。具体来说，可以在 Paddle 控制面板中[设置 Paddle 的自动计费邮件](https://vendors.paddle.com/subscription-settings)。

或者，可以通过[监听](/docs/{{version}}/events) Cashier 分发的 `WebhookReceived` 事件中的 `subscription_payment_failed` Paddle 事件来执行更精确的自定义。还应确保在 Paddle 控制面板的 Webhook 设置中启用"Subscription Payment Failed"选项：

```php
<?php

namespace App\Listeners;

use Laravel\Paddle\Events\WebhookReceived;

class PaddleEventListener
{
    /**
     * 处理接收到的 Paddle Webhook。
     *
     * @param  \Laravel\Paddle\Events\WebhookReceived  $event
     * @return void
     */
    public function handle(WebhookReceived $event)
    {
        if ($event->payload['alert_name'] === 'subscription_payment_failed') {
            // 处理失败的订阅付款...
        }
    }
}
```

定义监听器后，应在应用的 `EventServiceProvider` 中注册：

```php
<?php

namespace App\Providers;

use App\Listeners\PaddleEventListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Laravel\Paddle\Events\WebhookReceived;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        WebhookReceived::class => [
            PaddleEventListener::class,
        ],
    ];
}
```

<a name="testing"></a>
## 测试

测试时，应手动测试计费流程以确保集成按预期工作。

对于自动化测试（包括在 CI 环境中执行的测试），可以使用 [Laravel HTTP 客户端](/docs/{{version}}/http-client#testing)来伪造对 Paddle 的 HTTP 调用。虽然这不会测试 Paddle 的实际响应，但提供了一种无需实际调用 Paddle API 即可测试应用的方式。
