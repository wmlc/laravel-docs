# Laravel Cashier（Stripe）

- [简介](#introduction)
- [升级 Cashier](#upgrading-cashier)
- [安装](#installation)
- [配置](#configuration)
    - [可计费模型](#billable-model)
    - [API 密钥](#api-keys)
    - [货币配置](#currency-configuration)
    - [税务配置](#tax-configuration)
    - [日志](#logging)
    - [使用自定义模型](#using-custom-models)
- [快速上手](#quickstart)
    - [销售产品](#quickstart-selling-products)
    - [销售订阅](#quickstart-selling-subscriptions)
- [客户](#customers)
    - [获取客户](#retrieving-customers)
    - [创建客户](#creating-customers)
    - [更新客户](#updating-customers)
    - [余额](#balances)
    - [税务 ID](#tax-ids)
    - [与 Stripe 同步客户数据](#syncing-customer-data-with-stripe)
    - [账单门户](#billing-portal)
- [支付方式](#payment-methods)
    - [存储支付方式](#storing-payment-methods)
    - [获取支付方式](#retrieving-payment-methods)
    - [支付方式是否存在](#payment-method-presence)
    - [更新默认支付方式](#updating-the-default-payment-method)
    - [添加支付方式](#adding-payment-methods)
    - [删除支付方式](#deleting-payment-methods)
- [订阅](#subscriptions)
    - [创建订阅](#creating-subscriptions)
    - [检查订阅状态](#checking-subscription-status)
    - [更改价格](#changing-prices)
    - [订阅数量](#subscription-quantity)
    - [包含多个产品的订阅](#subscriptions-with-multiple-products)
    - [多个订阅](#multiple-subscriptions)
    - [基于用量的计费](#usage-based-billing)
    - [订阅税](#subscription-taxes)
    - [订阅锚定日期](#subscription-anchor-date)
    - [取消订阅](#cancelling-subscriptions)
    - [恢复订阅](#resuming-subscriptions)
- [订阅试用](#subscription-trials)
    - [预先提供支付方式](#with-payment-method-up-front)
    - [不预先提供支付方式](#without-payment-method-up-front)
    - [延长试用](#extending-trials)
- [处理 Stripe Webhook](#handling-stripe-webhooks)
    - [定义 Webhook 事件处理器](#defining-webhook-event-handlers)
    - [校验 Webhook 签名](#verifying-webhook-signatures)
- [单次扣款](#single-charges)
    - [简单扣款](#simple-charge)
    - [带发票的扣款](#charge-with-invoice)
    - [创建支付意图](#creating-payment-intents)
    - [退还扣款](#refunding-charges)
- [Checkout](#checkout)
    - [产品 Checkout](#product-checkouts)
    - [单次扣款 Checkout](#single-charge-checkouts)
    - [订阅 Checkout](#subscription-checkouts)
    - [收集税务 ID](#collecting-tax-ids)
    - [访客 Checkout](#guest-checkouts)
- [发票](#invoices)
    - [获取发票](#retrieving-invoices)
    - [即将到来的发票](#upcoming-invoices)
    - [预览订阅发票](#previewing-subscription-invoices)
    - [生成发票 PDF](#generating-invoice-pdfs)
- [处理失败的支付](#handling-failed-payments)
    - [确认支付](#confirming-payments)
- [强客户认证（SCA）](#strong-customer-authentication)
    - [需要额外确认的支付](#payments-requiring-additional-confirmation)
    - [非会话内支付通知](#off-session-payment-notifications)
- [Stripe SDK](#stripe-sdk)
- [测试](#testing)

<a name="introduction"></a>
## 简介

[Laravel Cashier Stripe](https://github.com/laravel/cashier-stripe) 为 [Stripe](https://stripe.com) 的订阅计费服务提供了一套表达力强、流畅的接口。它处理了你一直不愿编写的大量订阅计费样板代码。除了基本的订阅管理之外，Cashier 还能处理优惠券、切换订阅、订阅「数量」、取消宽限期，甚至生成发票 PDF。

<a name="upgrading-cashier"></a>
## 升级 Cashier

升级到新版本的 Cashier 时，务必仔细阅读[升级指南](https://github.com/laravel/cashier-stripe/blob/master/UPGRADE.md)。

> [!WARNING]
> 为避免破坏性变更，Cashier 使用固定的 Stripe API 版本。Cashier 15 使用 Stripe API 版本 `2023-10-16`。Stripe API 版本会在次要版本更新中升级，以利用新的 Stripe 特性和改进。

<a name="installation"></a>
## 安装

首先，使用 Composer 包管理器为 Stripe 安装 Cashier 包：

```shell
composer require laravel/cashier
```

安装包之后，使用 `vendor:publish` Artisan 命令发布 Cashier 的数据库迁移：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后，迁移你的数据库：

```shell
php artisan migrate
```

Cashier 的数据库迁移会向你的 `users` 表添加若干列。它们还会创建一个新的 `subscriptions` 表来存放你所有客户的订阅，以及一个用于包含多个价格的订阅的 `subscription_items` 表。

如有需要，你也可以使用 `vendor:publish` Artisan 命令发布 Cashier 的配置文件：

```shell
php artisan vendor:publish --tag="cashier-config"
```

最后，为确保 Cashier 正确处理所有 Stripe 事件，请记得[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

> [!WARNING]
> Stripe 建议任何用于存储 Stripe 标识符的列都应区分大小写。因此，使用 MySQL 时，你应当确保 `stripe_id` 列的排序规则设置为 `utf8_bin`。更多信息请查阅 [Stripe 文档](https://stripe.com/docs/upgrades#what-changes-does-stripe-consider-to-be-backwards-compatible)。

<a name="configuration"></a>
## 配置

<a name="billable-model"></a>
### 可计费模型

在使用 Cashier 之前，请把 `Billable` Trait 添加到你的可计费模型定义中。通常这会是 `App\Models\User` 模型。该 Trait 提供了多种方法，让你能够执行常见的计费任务，例如创建订阅、使用优惠券和更新支付方式信息：

    use Laravel\Cashier\Billable;

    class User extends Authenticatable
    {
        use Billable;
    }

Cashier 假定你的可计费模型是 Laravel 自带的 `App\Models\User` 类。如果你想更改这一点，可以通过 `useCustomerModel` 方法指定其他模型。该方法通常应当在你 `AppServiceProvider` 类的 `boot` 方法中调用：

    use App\Models\Cashier\User;
    use Laravel\Cashier\Cashier;

    /**
     * 引导应用的所有服务。
     */
    public function boot(): void
    {
        Cashier::useCustomerModel(User::class);
    }

> [!WARNING]
> 如果你使用的不是 Laravel 自带的 `App\Models\User` 模型，就需要发布并修改[Cashier 的数据库迁移](#installation)，使其与你所用模型的表名相匹配。

<a name="api-keys"></a>
### API 密钥

接下来，你应当在应用的 `.env` 文件中配置 Stripe API 密钥。你可以从 Stripe 控制面板获取 Stripe API 密钥：

```ini
STRIPE_KEY=your-stripe-key
STRIPE_SECRET=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

> [!WARNING]
> 你应当确保在应用的 `.env` 文件中定义了 `STRIPE_WEBHOOK_SECRET` 环境变量，因为该变量用于确保传入的 Webhook 确实来自 Stripe。

<a name="currency-configuration"></a>
### 货币配置

Cashier 的默认货币是美元（USD）。你可以通过在应用的 `.env` 文件中设置 `CASHIER_CURRENCY` 环境变量来更改默认货币：

```ini
CASHIER_CURRENCY=eur
```

除了配置 Cashier 的货币之外，你还可以指定一个区域设置（locale），用于在发票上显示金额时格式化货币值。在内部，Cashier 使用 [PHP 的 `NumberFormatter` 类](https://www.php.net/manual/en/class.numberformatter.php)来设置货币区域设置：

```ini
CASHIER_CURRENCY_LOCALE=nl_BE
```

> [!WARNING]
> 要使用 `en` 之外的区域设置，请确保服务器上已安装并配置 `ext-intl` PHP 扩展。

<a name="tax-configuration"></a>
### 税务配置

得益于 [Stripe Tax](https://stripe.com/tax)，你可以自动计算 Stripe 生成的所有发票的税额。要启用自动税额计算，可以在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `calculateTaxes` 方法：

    use Laravel\Cashier\Cashier;

    /**
     * 引导应用的所有服务。
     */
    public function boot(): void
    {
        Cashier::calculateTaxes();
    }

启用税额计算之后，任何新订阅和任何生成的一次性发票都将自动获得税额计算。

要让该功能正常工作，你客户的账单信息（例如客户名称、地址和税务 ID）需要同步到 Stripe。你可以使用 Cashier 提供的[客户数据同步](#syncing-customer-data-with-stripe)和[税务 ID](#tax-ids)方法来完成这一点。

<a name="logging"></a>
### 日志

Cashier 允许你指定在记录 Stripe 致命错误时使用的日志通道。你可以在应用的 `.env` 文件中定义 `CASHIER_LOGGER` 环境变量来指定日志通道：

```ini
CASHIER_LOGGER=stack
```

由对 Stripe 的 API 调用所产生的异常将通过你应用的默认日志通道记录。

<a name="using-custom-models"></a>
### 使用自定义模型

你可以通过定义自己的模型并继承相应的 Cashier 模型，来自由扩展 Cashier 内部使用的模型：

    use Laravel\Cashier\Subscription as CashierSubscription;

    class Subscription extends CashierSubscription
    {
        // ...
    }

定义好你的模型之后，你可以通过 `Laravel\Cashier\Cashier` 类指示 Cashier 使用你的自定义模型。通常，你应当在应用的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中把自定义模型告知 Cashier：

    use App\Models\Cashier\Subscription;
    use App\Models\Cashier\SubscriptionItem;

    /**
     * 引导应用的所有服务。
     */
    public function boot(): void
    {
        Cashier::useSubscriptionModel(Subscription::class);
        Cashier::useSubscriptionItemModel(SubscriptionItem::class);
    }

<a name="quickstart"></a>
## 快速上手

<a name="quickstart-selling-products"></a>
### 销售产品

> [!NOTE]
> 在使用 Stripe Checkout 之前，你应当在 Stripe 控制面板中定义带有固定价格的产品。此外，你应当[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

通过你的应用提供产品和订阅计费可能让人望而生畏。不过，多亏了 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代、稳健的支付集成。

要为非循环的一次性产品向客户收费，我们会利用 Cashier 把客户引导到 Stripe Checkout，客户将在那里提供支付信息并确认购买。一旦通过 Checkout 完成支付，客户就会被重定向到你应用中由你指定的一个成功 URL：

    use Illuminate\Http\Request;

    Route::get('/checkout', function (Request $request) {
        $stripePriceId = 'price_deluxe_album';

        $quantity = 1;

        return $request->user()->checkout([$stripePriceId => $quantity], [
            'success_url' => route('checkout-success'),
            'cancel_url' => route('checkout-cancel'),
        ]);
    })->name('checkout');

    Route::view('/checkout/success', 'checkout.success')->name('checkout-success');
    Route::view('/checkout/cancel', 'checkout.cancel')->name('checkout-cancel');

如上例所示，我们会使用 Cashier 提供的 `checkout` 方法，把客户重定向到某个「价格标识」的 Stripe Checkout。在使用 Stripe 时，「价格」是指[为特定产品定义的价格](https://stripe.com/docs/products-prices/how-products-and-prices-work)。

如有需要，`checkout` 方法会自动在 Stripe 中创建一个客户，并把该 Stripe 客户记录与你应用数据库中对应的用户关联起来。完成结账会话后，客户会被重定向到一个专门的成功或取消页面，你可以在那里向客户展示一条提示信息。

<a name="providing-meta-data-to-stripe-checkout"></a>
#### 向 Stripe Checkout 提供元数据

在销售产品时，通常会通过你自己应用定义的 `Cart` 和 `Order` 模型来跟踪已完成的订单和已购买的产品。在把客户重定向到 Stripe Checkout 以完成购买时，你可能需要提供一个已有的订单标识，以便在客户被重定向回你的应用时，把已完成的购买与对应的订单关联起来。

为此，你可以向 `checkout` 方法提供一组 `metadata`。假设用户开始结账流程时，我们会在应用中创建一条待处理的 `Order`。请记住，本例中的 `Cart` 和 `Order` 模型仅作说明用途，并非由 Cashier 提供。你可以完全根据自己应用的需求来实现这些概念：

    use App\Models\Cart;
    use App\Models\Order;
    use Illuminate\Http\Request;

    Route::get('/cart/{cart}/checkout', function (Request $request, Cart $cart) {
        $order = Order::create([
            'cart_id' => $cart->id,
            'price_ids' => $cart->price_ids,
            'status' => 'incomplete',
        ]);

        return $request->user()->checkout($order->price_ids, [
            'success_url' => route('checkout-success').'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('checkout-cancel'),
            'metadata' => ['order_id' => $order->id],
        ]);
    })->name('checkout');

如上例所示，当用户开始结账流程时，我们会把购物车 / 订单关联的所有 Stripe 价格标识提供给 `checkout` 方法。当然，当客户把这些项目加入时，你的应用负责把它们与「购物车」或订单关联起来。我们还通过 `metadata` 数组把订单 ID 提供给 Stripe Checkout 会话。最后，我们把 `CHECKOUT_SESSION_ID` 模板变量加入了 Checkout 成功路由。当 Stripe 把客户重定向回你的应用时，该模板变量会自动填入 Checkout 会话 ID。

接下来，让我们构建结账成功路由。这是用户通过 Stripe Checkout 完成购买后被重定向到的路由。在这个路由中，我们可以获取 Stripe Checkout 会话 ID 以及关联的 Stripe Checkout 实例，从而访问我们提供的元数据并相应地更新客户的订单：

    use App\Models\Order;
    use Illuminate\Http\Request;
    use Laravel\Cashier\Cashier;

    Route::get('/checkout/success', function (Request $request) {
        $sessionId = $request->get('session_id');

        if ($sessionId === null) {
            return;
        }

        $session = Cashier::stripe()->checkout->sessions->retrieve($sessionId);

        if ($session->payment_status !== 'paid') {
            return;
        }

        $orderId = $session['metadata']['order_id'] ?? null;

        $order = Order::findOrFail($orderId);

        $order->update(['status' => 'completed']);

        return view('checkout-success', ['order' => $order]);
    })->name('checkout-success');

有关 Checkout 会话对象所包含[数据的更多信息](https://stripe.com/docs/api/checkout/sessions/object)，请参阅 Stripe 文档。

<a name="quickstart-selling-subscriptions"></a>
### 销售订阅

> [!NOTE]
> 在使用 Stripe Checkout 之前，你应当在 Stripe 控制面板中定义带有固定价格的产品。此外，你应当[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

通过你的应用提供产品和订阅计费可能让人望而生畏。不过，多亏了 Cashier 和 [Stripe Checkout](https://stripe.com/payments/checkout)，你可以轻松构建现代、稳健的支付集成。

要了解如何使用 Cashier 和 Stripe Checkout 销售订阅，让我们考虑一个订阅服务的简单场景：提供基础的月度（`price_basic_monthly`）和年度（`price_basic_yearly`）套餐。这两个价格可以在我们的 Stripe 控制面板中归到名为「Basic」的产品（`pro_basic`）下。此外，我们的订阅服务还可以把 Expert 套餐作为 `pro_expert` 提供。

首先，让我们看看客户如何订阅我们的服务。当然，你可以想象客户可能会点击我们应用定价页上 Basic 套餐的「订阅」按钮。该按钮或链接应当把用户引导到一个 Laravel 路由，该路由为其选择的套餐创建 Stripe Checkout 会话：

    use Illuminate\Http\Request;

    Route::get('/subscription-checkout', function (Request $request) {
        return $request->user()
            ->newSubscription('default', 'price_basic_monthly')
            ->trialDays(5)
            ->allowPromotionCodes()
            ->checkout([
                'success_url' => route('your-success-route'),
                'cancel_url' => route('your-cancel-route'),
            ]);
    });

如上例所示，我们会把客户重定向到一个 Stripe Checkout 会话，让他们能够订阅我们的 Basic 套餐。在成功结账或取消之后，客户会被重定向回我们提供给 `checkout` 方法的 URL。为了知道他们的订阅究竟何时开始（因为某些支付方式需要几秒钟处理），我们还需要[配置 Cashier 的 Webhook 处理](#handling-stripe-webhooks)。

现在客户可以开始订阅，我们需要限制应用的某些部分，使只有已订阅的用户才能访问。当然，我们始终可以通过 Cashier 的 `Billable` Trait 提供的 `subscribed` 方法来判断用户当前的订阅状态：

```blade
@if ($user->subscribed())
    <p>You are subscribed.</p>
@endif
```

我们甚至可以轻松判断用户是否订阅了特定的产品或价格：

```blade
@if ($user->subscribedToProduct('pro_basic'))
    <p>You are subscribed to our Basic product.</p>
@endif

@if ($user->subscribedToPrice('price_basic_monthly'))
    <p>You are subscribed to our monthly Basic plan.</p>
@endif
```

<a name="quickstart-building-a-subscribed-middleware"></a>
#### 构建订阅中间件

为方便起见，你可能希望创建一个用于判断传入请求是否来自已订阅用户的[中间件](/docs/{{version}}/middleware)。该中间件定义之后，你就可以轻松把它赋给某个路由，从而阻止未订阅的用户访问该路由：

    <?php

    namespace App\Http\Middleware;

    use Closure;
    use Illuminate\Http\Request;
    use Symfony\Component\HttpFoundation\Response;

    class Subscribed
    {
        /**
         * 处理传入请求。
         */
        public function handle(Request $request, Closure $next): Response
        {
            if (! $request->user()?->subscribed()) {
                // 把用户重定向到账单页面，并要求他们订阅……
                return redirect('/billing');
            }

            return $next($request);
        }
    }

该中间件定义之后，你就可以把它赋给某个路由：

    use App\Http\Middleware\Subscribed;

    Route::get('/dashboard', function () {
        // ...
    })->middleware([Subscribed::class]);

<a name="quickstart-allowing-customers-to-manage-their-billing-plan"></a>
#### 允许客户管理他们的计费方案

当然，客户可能希望把他们的订阅套餐改成另一个产品或「层级」。允许这样操作最简单的方式，是把客户引导到 Stripe 的[客户账单门户](https://stripe.com/docs/no-code/customer-portal)，该门户提供了一个托管的用户界面，让客户可以下载发票、更新支付方式和更改订阅套餐。

首先，在你的应用中定义一个链接或按钮，把用户引导到一个 Laravel 路由，我们将用该路由来启动账单门户会话：

```blade
<a href="{{ route('billing') }}">
    Billing
</a>
```

接下来，让我们定义用于启动 Stripe 客户账单门户会话并把用户重定向到该门户的路由。`redirectToBillingPortal` 方法接受用户退出门户后应当被送回的 URL：

    use Illuminate\Http\Request;

    Route::get('/billing', function (Request $request) {
        return $request->user()->redirectToBillingPortal(route('dashboard'));
    })->middleware(['auth'])->name('billing');

> [!NOTE]
> 只要你已经配置了 Cashier 的 Webhook 处理，Cashier 就会通过检查来自 Stripe 的传入 Webhook，自动让你应用中与 Cashier 相关的数据库表保持同步。因此，例如，当用户通过 Stripe 的客户账单门户取消订阅时，Cashier 会收到相应的 Webhook，并在你的应用数据库中把该订阅标记为「已取消」。

<a name="customers"></a>
## 客户

<a name="retrieving-customers"></a>
### 获取客户

你可以使用 `Cashier::findBillable` 方法按 Stripe ID 获取某个客户。该方法会返回可计费模型的一个实例：

    use Laravel\Cashier\Cashier;

    $user = Cashier::findBillable($stripeId);

<a name="creating-customers"></a>
### 创建客户

偶尔你可能希望在不开始订阅的情况下创建一个 Stripe 客户。你可以使用 `createAsStripeCustomer` 方法来实现：

    $stripeCustomer = $user->createAsStripeCustomer();

客户在 Stripe 中创建之后，你可以在稍后开始订阅。你可以提供一个可选的 `$options` 数组，用于传入任何额外的[Stripe API 所支持的客户创建参数](https://stripe.com/docs/api/customers/create)：

    $stripeCustomer = $user->createAsStripeCustomer($options);

如果你想返回某个可计费模型的 Stripe 客户对象，可以使用 `asStripeCustomer` 方法：

    $stripeCustomer = $user->asStripeCustomer();

如果你想获取给定可计费模型的 Stripe 客户对象，但不确定该可计费模型是否已经是 Stripe 中的客户，可以使用 `createOrGetStripeCustomer` 方法。如果客户尚不存在，该方法会在 Stripe 中创建一个新客户：

    $stripeCustomer = $user->createOrGetStripeCustomer();

<a name="updating-customers"></a>
### 更新客户

偶尔你可能希望直接用额外信息更新 Stripe 客户。你可以使用 `updateStripeCustomer` 方法来实现。该方法接受一组 [Stripe API 所支持的客户更新选项](https://stripe.com/docs/api/customers/update)：

    $stripeCustomer = $user->updateStripeCustomer($options);

<a name="balances"></a>
### 余额

Stripe 允许你为某个客户的「余额」充值或扣款。之后，该余额会在新发票上被充值或扣款。要查看客户的总余额，你可以使用可计费模型上提供的 `balance` 方法。`balance` 方法会返回一个格式化后的字符串，表示以客户货币计价的余额：

    $balance = $user->balance();

要为某个客户的余额充值，你可以向 `creditBalance` 方法提供一个值。如有需要，你还可以提供一段描述：

    $user->creditBalance(500, 'Premium customer top-up.');

向 `debitBalance` 方法提供一个值，则会扣除客户的余额：

    $user->debitBalance(300, 'Bad usage penalty.');

`applyBalance` 方法会为该客户创建新的客户余额交易记录。你可以使用 `balanceTransactions` 方法获取这些交易记录，这有助于为客户提供一份充值和扣款日志供其查看：

    // 获取所有交易……
    $transactions = $user->balanceTransactions();

    foreach ($transactions as $transaction) {
        // 交易金额……
        $amount = $transaction->amount(); // $2.31

        // 在可用时获取关联发票……
        $invoice = $transaction->invoice();
    }

<a name="tax-ids"></a>
### 税务 ID

Cashier 提供了一种管理客户税务 ID 的简便方式。例如，可以使用 `taxIds` 方法把分配给某个客户的所有[税务 ID](https://stripe.com/docs/api/customer_tax_ids/object)作为一个集合获取：

    $taxIds = $user->taxIds();

你也可以按标识符获取某个客户特定的税务 ID：

    $taxId = $user->findTaxId('txi_belgium');

你可以向 `createTaxId` 方法提供有效的[类型](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-type)和值，以创建新的税务 ID：

    $taxId = $user->createTaxId('eu_vat', 'BE0123456789');

`createTaxId` 方法会立即把该 VAT ID 添加到客户账户中。[VAT ID 的验证也由 Stripe 完成](https://stripe.com/docs/invoicing/customer/tax-ids#validation)；不过，这是一个异步过程。你可以订阅 `customer.tax_id.updated` Webhook 事件并检查[VAT ID 的 `verification` 参数](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-verification)来获知验证更新。有关处理 Webhook 的更多信息，请查阅[定义 Webhook 处理器的文档](#handling-stripe-webhooks)。

你可以使用 `deleteTaxId` 方法删除某个税务 ID：

    $user->deleteTaxId('txi_belgium');

<a name="syncing-customer-data-with-stripe"></a>
### 与 Stripe 同步客户数据

通常，当你应用的用户更新其姓名、邮箱地址或其他同样由 Stripe 存储的信息时，你应当把这些更新告知 Stripe。这样一来，Stripe 保存的信息副本就与你应用中的信息保持同步。

要实现自动化，你可以在可计费模型上定义一个事件监听器来响应模型的 `updated` 事件。然后，在事件监听器中，你可以调用模型上的 `syncStripeCustomerDetails` 方法：

    use App\Models\User;
    use function Illuminate\Events\queueable;

    /**
     * 模型的 "booted" 方法。
     */
    protected static function booted(): void
    {
        static::updated(queueable(function (User $customer) {
            if ($customer->hasStripeId()) {
                $customer->syncStripeCustomerDetails();
            }
        }));
    }

现在，每当你的客户模型被更新时，其信息都会与 Stripe 同步。为方便起见，在首次创建客户时，Cashier 会自动把你的客户信息与 Stripe 同步。

你可以通过覆盖 Cashier 提供的多种方法，来自定义用于把客户信息同步到 Stripe 的列。例如，你可以覆盖 `stripeName` 方法来自定义在 Cashier 把客户信息同步到 Stripe 时应当被视为客户「名称」的属性：

    /**
     * 获取应当同步到 Stripe 的客户名称。
     */
    public function stripeName(): string|null
    {
        return $this->company_name;
    }

同样地，你也可以覆盖 `stripeEmail`、`stripePhone`、`stripeAddress` 和 `stripePreferredLocales` 方法。在[更新 Stripe 客户对象](https://stripe.com/docs/api/customers/update)时，这些方法会把信息同步到对应的客户参数。如果你希望完全掌控客户信息的同步过程，可以覆盖 `syncStripeCustomerDetails` 方法。

<a name="billing-portal"></a>
### 账单门户

Stripe 提供了[一种简易的账单门户搭建方式](https://stripe.com/docs/billing/subscriptions/customer-portal)，让客户能够管理自己的订阅、支付方式并查看账单历史。你可以在控制器或路由中调用可计费模型上的 `redirectToBillingPortal` 方法，把用户重定向到账单门户：

    use Illuminate\Http\Request;

    Route::get('/billing-portal', function (Request $request) {
        return $request->user()->redirectToBillingPortal();
    });

默认情况下，当用户完成订阅管理后，他们可以通过 Stripe 账单门户中的链接返回你应用的 `home` 路由。你也可以把用户应当返回的 URL 作为参数传给 `redirectToBillingPortal` 方法，以提供一个自定义 URL：

    use Illuminate\Http\Request;

    Route::get('/billing-portal', function (Request $request) {
        return $request->user()->redirectToBillingPortal(route('billing'));
    });

如果你想生成账单门户 URL 而不生成 HTTP 重定向响应，可以调用 `billingPortalUrl` 方法：

    $url = $request->user()->billingPortalUrl(route('billing'));

<a name="payment-methods"></a>
## 支付方式

<a name="storing-payment-methods"></a>
### 存储支付方式

为了用 Stripe 创建订阅或执行「一次性」扣款，你需要存储一个支付方式，并从 Stripe 获取其标识符。实现这一点的方式取决于你打算把该支付方式用于订阅还是单次扣款，因此下面我们分别介绍这两种情况。

<a name="payment-methods-for-subscriptions"></a>
#### 用于订阅的支付方式

当为订阅存储客户的信用卡信息以供日后使用时，必须使用 Stripe 的「Setup Intents」API 来安全地收集客户的支付方式信息。「Setup Intent」向 Stripe 表示打算向某个客户的支付方式扣款的意图。Cashier 的 `Billable` Trait 包含 `createSetupIntent` 方法，可轻松创建一个新的 Setup Intent。你应当从渲染用于收集客户支付方式信息的表单的路由或控制器中调用该方法：

    return view('update-payment-method', [
        'intent' => $user->createSetupIntent()
    ]);

创建 Setup Intent 并把它传给视图之后，你应当把它的密钥附加到用于收集支付方式的元素上。例如，假设有这样一个「更新支付方式」表单：

```html
<input id="card-holder-name" type="text">

<!-- Stripe Elements 占位符 -->
<div id="card-element"></div>

<button id="card-button" data-secret="{{ $intent->client_secret }}">
    Update Payment Method
</button>
```

接下来，可以使用 Stripe.js 库把一个 [Stripe Element](https://stripe.com/docs/stripe-js)附加到表单上，以安全地收集客户的支付信息：

```html
<script src="https://js.stripe.com/v3/"></script>

<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements();
    const cardElement = elements.create('card');

    cardElement.mount('#card-element');
</script>
```

接下来，可以验证该卡，并使用 [Stripe 的 `confirmCardSetup` 方法](https://stripe.com/docs/js/setup_intents/confirm_card_setup)从 Stripe 获取一个安全的「支付方式标识符」：

```js
const cardHolderName = document.getElementById('card-holder-name');
const cardButton = document.getElementById('card-button');
const clientSecret = cardButton.dataset.secret;

cardButton.addEventListener('click', async (e) => {
    const { setupIntent, error } = await stripe.confirmCardSetup(
        clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: { name: cardHolderName.value }
            }
        }
    );

    if (error) {
        // 向用户显示 "error.message"……
    } else {
        // 该卡已成功验证……
    }
});
```

该卡被 Stripe 验证之后，你可以把得到的 `setupIntent.payment_method` 标识符传给 Laravel 应用，在那里把它附加到客户上。该支付方式既可以[添加为新的支付方式](#adding-payment-methods)，也可以[用于更新默认支付方式](#updating-the-default-payment-method)。你还可以立即使用该支付方式标识符来[创建新的订阅](#creating-subscriptions)。

> [!NOTE]
> 如果你想了解有关 Setup Intent 和收集客户支付信息的更多信息，请[查看 Stripe 提供的这份概览](https://stripe.com/docs/payments/save-and-reuse#php)。

<a name="payment-methods-for-single-charges"></a>
#### 用于单次扣款的支付方式

当然，对某个客户的支付方式执行单次扣款时，我们只需要使用一次支付方式标识符。由于 Stripe 的限制，你不能把客户存储的默认支付方式用于单次扣款。你必须允许客户使用 Stripe.js 库输入其支付方式信息。例如，假设有如下表单：

```html
<input id="card-holder-name" type="text">

<!-- Stripe Elements 占位符 -->
<div id="card-element"></div>

<button id="card-button">
    Process Payment
</button>
```

定义这样一个表单之后，可以使用 Stripe.js 库把一个 [Stripe Element](https://stripe.com/docs/stripe-js)附加到表单上，以安全地收集客户的支付信息：

```html
<script src="https://js.stripe.com/v3/"></script>

<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements();
    const cardElement = elements.create('card');

    cardElement.mount('#card-element');
</script>
```

接下来，可以验证该卡，并使用 [Stripe 的 `createPaymentMethod` 方法](https://stripe.com/docs/stripe-js/reference#stripe-create-payment-method)从 Stripe 获取一个安全的「支付方式标识符」：

```js
const cardHolderName = document.getElementById('card-holder-name');
const cardButton = document.getElementById('card-button');

cardButton.addEventListener('click', async (e) => {
    const { paymentMethod, error } = await stripe.createPaymentMethod(
        'card', cardElement, {
            billing_details: { name: cardHolderName.value }
        }
    );

    if (error) {
        // 向用户显示 "error.message"……
    } else {
        // 该卡已成功验证……
    }
});
```

如果该卡验证成功，你可以把 `paymentMethod.id` 传给 Laravel 应用并处理一笔[单次扣款](#simple-charge)。

<a name="retrieving-payment-methods"></a>
### 获取支付方式

可计费模型实例上的 `paymentMethods` 方法会返回一组 `Laravel\Cashier\PaymentMethod` 实例：

    $paymentMethods = $user->paymentMethods();

默认情况下，该方法会返回所有类型的支付方式。要获取特定类型的支付方式，你可以把 `type` 作为参数传给该方法：

    $paymentMethods = $user->paymentMethods('sepa_debit');

要获取客户的默认支付方式，可以使用 `defaultPaymentMethod` 方法：

    $paymentMethod = $user->defaultPaymentMethod();

你可以使用 `findPaymentMethod` 方法获取附加到该可计费模型上的某个特定支付方式：

    $paymentMethod = $user->findPaymentMethod($paymentMethodId);

<a name="payment-method-presence"></a>
### 支付方式是否存在

要判断某个可计费模型的账户上是否附加了默认支付方式，可以调用 `hasDefaultPaymentMethod` 方法：

    if ($user->hasDefaultPaymentMethod()) {
        // ...
    }

你可以使用 `hasPaymentMethod` 方法判断某个可计费模型的账户上是否至少附加了一个支付方式：

    if ($user->hasPaymentMethod()) {
        // ...
    }

该方法会判断该可计费模型是否拥有任何支付方式。要判断该模型是否存在某个特定类型的支付方式，你可以把 `type` 作为参数传给该方法：

    if ($user->hasPaymentMethod('sepa_debit')) {
        // ...
    }

<a name="updating-the-default-payment-method"></a>
### 更新默认支付方式

`updateDefaultPaymentMethod` 方法可用于更新客户的默认支付方式信息。该方法接受一个 Stripe 支付方式标识符，并会把新的支付方式设为默认的账单支付方式：

    $user->updateDefaultPaymentMethod($paymentMethod);

要把你的默认支付方式信息与 Stripe 中客户的默认支付方式信息进行同步，可以使用 `updateDefaultPaymentMethodFromStripe` 方法：

    $user->updateDefaultPaymentMethodFromStripe();

> [!WARNING]
> 客户上的默认支付方式只能用于开票和创建新订阅。由于 Stripe 施加的限制，它不能用于单次扣款。

<a name="adding-payment-methods"></a>
### 添加支付方式

要添加一个新的支付方式，你可以在可计费模型上调用 `addPaymentMethod` 方法，并传入该支付方式的标识符：

    $user->addPaymentMethod($paymentMethod);

> [!NOTE]
> 要了解如何获取支付方式标识符，请阅读[支付方式存储文档](#storing-payment-methods)。

<a name="deleting-payment-methods"></a>
### 删除支付方式

要删除某个支付方式，你可以在希望删除的 `Laravel\Cashier\PaymentMethod` 实例上调用 `delete` 方法：

    $paymentMethod->delete();

`deletePaymentMethod` 方法会从可计费模型上删除某个特定的支付方式：

    $user->deletePaymentMethod('pm_visa');

`deletePaymentMethods` 方法会删除该可计费模型上的所有支付方式信息：

    $user->deletePaymentMethods();

默认情况下，该方法会删除所有类型的支付方式。要删除某个特定类型的支付方式，你可以把 `type` 作为参数传给该方法：

    $user->deletePaymentMethods('sepa_debit');

> [!WARNING]
> 如果某个用户有生效中的订阅，你的应用不应允许他们删除其默认支付方式。

<a name="subscriptions"></a>
## 订阅

订阅提供了一种为你的客户设置循环付款的方式。由 Cashier 管理的 Stripe 订阅支持多个订阅价格、订阅数量、试用等更多功能。

<a name="creating-subscriptions"></a>
### 创建订阅

要创建订阅，首先要获取可计费模型的一个实例，它通常是 `App\Models\User` 的实例。获取到该模型实例之后，你可以使用 `newSubscription` 方法创建该模型的订阅：

    use Illuminate\Http\Request;

    Route::post('/user/subscribe', function (Request $request) {
        $request->user()->newSubscription(
            'default', 'price_monthly'
        )->create($request->paymentMethodId);

        // ...
    });

传给 `newSubscription` 方法的第一个参数应当是订阅的内部类型。如果你的应用只提供一种订阅，你可能会把它命名为 `default` 或 `primary`。该订阅类型仅供应用内部使用，不打算展示给用户。此外，它不应包含空格，并且在创建订阅之后绝不应当更改。第二个参数是用户所订阅的具体价格。该值应当对应 Stripe 中该价格的标识符。

`create` 方法接受[一个 Stripe 支付方式标识符](#storing-payment-methods)或 Stripe `PaymentMethod` 对象，它会启动订阅，同时用该可计费模型的 Stripe 客户 ID 和其他相关账单信息更新你的数据库。

> [!WARNING]
> 把支付方式标识符直接传给 `create` 订阅方法，也会自动把它添加到该用户已存储的支付方式中。

<a name="collecting-recurring-payments-via-invoice-emails"></a>
#### 通过发票邮件收取循环付款

你可以指示 Stripe 在每次循环付款到期时给客户发送一封发票邮件，而不是自动收取客户的循环付款。这样，客户收到发票后就可以手动支付。通过发票收取循环付款时，客户无需预先提供支付方式：

    $user->newSubscription('default', 'price_monthly')->createAndSendInvoice();

客户在订阅被取消之前有多长时间来支付发票，取决于 `days_until_due` 选项。默认情况下，这是 30 天；不过，如有需要，你可以为该选项提供一个具体值：

    $user->newSubscription('default', 'price_monthly')->createAndSendInvoice([], [
        'days_until_due' => 30
    ]);

<a name="subscription-quantities"></a>
#### 数量

如果你想在创建订阅时为该价格设置一个具体的[数量](https://stripe.com/docs/billing/subscriptions/quantities)，应当在创建订阅之前于订阅构建器上调用 `quantity` 方法：

    $user->newSubscription('default', 'price_monthly')
        ->quantity(5)
        ->create($paymentMethod);

<a name="additional-details"></a>
#### 附加详情

如果你想指定 Stripe 所支持的额外[客户](https://stripe.com/docs/api/customers/create)或[订阅](https://stripe.com/docs/api/subscriptions/create)选项，可以把它们作为 `create` 方法的第二和第三个参数传入：

    $user->newSubscription('default', 'price_monthly')->create($paymentMethod, [
        'email' => $email,
    ], [
        'metadata' => ['note' => 'Some extra information.'],
    ]);

<a name="coupons"></a>
#### 优惠券

如果你想在创建订阅时使用优惠券，可以使用 `withCoupon` 方法：

    $user->newSubscription('default', 'price_monthly')
        ->withCoupon('code')
        ->create($paymentMethod);

或者，如果你想使用 [Stripe 优惠码](https://stripe.com/docs/billing/subscriptions/discounts/codes)，可以使用 `withPromotionCode` 方法：

    $user->newSubscription('default', 'price_monthly')
        ->withPromotionCode('promo_code_id')
        ->create($paymentMethod);

给定的优惠码 ID 应当是 Stripe 分配给该优惠码的 Stripe API ID，而不是面向客户的优惠码。如果你需要根据给定的面向客户的优惠码查找优惠码 ID，可以使用 `findPromotionCode` 方法：

    // 根据面向客户的优惠码查找优惠码 ID……
    $promotionCode = $user->findPromotionCode('SUMMERSALE');

    // 根据面向客户的优惠码查找生效中的优惠码 ID……
    $promotionCode = $user->findActivePromotionCode('SUMMERSALE');

在上例中，返回的 `$promotionCode` 对象是 `Laravel\Cashier\PromotionCode` 的一个实例。该类包装了一个底层的 `Stripe\PromotionCode` 对象。你可以通过调用 `coupon` 方法获取与该优惠码相关的优惠券：

    $coupon = $user->findPromotionCode('SUMMERSALE')->coupon();

该优惠券实例让你能够判断折扣金额，以及该优惠券代表的是固定折扣还是基于百分比的折扣：

    if ($coupon->isPercentage()) {
        return $coupon->percentOff().'%'; // 21.5%
    } else {
        return $coupon->amountOff(); // $5.99
    }

你还可以获取当前应用于某个客户或订阅的折扣：

    $discount = $billable->discount();

    $discount = $subscription->discount();

返回的 `Laravel\Cashier\Discount` 实例包装了一个底层的 `Stripe\Discount` 对象实例。你可以通过调用 `coupon` 方法获取与该折扣相关的优惠券：

    $coupon = $subscription->discount()->coupon();

如果你想把新的优惠券或优惠码应用到某个客户或订阅，可以通过 `applyCoupon` 或 `applyPromotionCode` 方法来实现：

    $billable->applyCoupon('coupon_id');
    $billable->applyPromotionCode('promotion_code_id');

    $subscription->applyCoupon('coupon_id');
    $subscription->applyPromotionCode('promotion_code_id');

请记住，你应当使用 Stripe 分配给该优惠码的 Stripe API ID，而不是面向客户的优惠码。在任意时刻，一个客户或订阅只能应用一个优惠券或优惠码。

有关该主题的更多信息，请查阅 Stripe 关于[优惠券](https://stripe.com/docs/billing/subscriptions/coupons)和[优惠码](https://stripe.com/docs/billing/subscriptions/coupons/codes)的文档。

<a name="adding-subscriptions"></a>
#### 添加订阅

如果你想为一个已有默认支付方式的客户添加订阅，可以在订阅构建器上调用 `add` 方法：

    use App\Models\User;

    $user = User::find(1);

    $user->newSubscription('default', 'price_monthly')->add();

<a name="creating-subscriptions-from-the-stripe-dashboard"></a>
#### 从 Stripe 控制面板创建订阅

你也可以直接从 Stripe 控制面板创建订阅。这样做时，Cashier 会同步新添加的订阅，并为其分配 `default` 类型。若要自定义分配给控制面板所创建订阅的订阅类型，请[定义 Webhook 事件处理器](#defining-webhook-event-handlers)。

此外，你只能通过 Stripe 控制面板创建一种类型的订阅。如果你的应用提供多种使用不同类型的订阅，那么只有一种类型的订阅可以通过 Stripe 控制面板添加。

最后，你始终应当确保每种应用提供的订阅类型只添加一个生效中的订阅。如果某个客户有两个 `default` 订阅，即使两者都会与你的应用数据库同步，Cashier 也只会使用最近添加的那个订阅。

<a name="checking-subscription-status"></a>
### 检查订阅状态

一旦客户订阅了你的应用，你就可以使用多种便捷方法轻松检查其订阅状态。首先，`subscribed` 方法在客户拥有生效中的订阅时返回 `true`，即使该订阅目前处于试用期内。`subscribed` 方法的第一个参数接受订阅的类型：

    if ($user->subscribed('default')) {
        // ...
    }

`subscribed` 方法也非常适合用作[路由中间件](/docs/{{version}}/middleware)，让你能够根据用户的订阅状态筛选对路由和控制器的访问：

    <?php

    namespace App\Http\Middleware;

    use Closure;
    use Illuminate\Http\Request;
    use Symfony\Component\HttpFoundation\Response;

    class EnsureUserIsSubscribed
    {
        /**
         * 处理传入请求。
         *
         * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
         */
        public function handle(Request $request, Closure $next): Response
        {
            if ($request->user() && ! $request->user()->subscribed('default')) {
                // 该用户不是付费客户……
                return redirect('/billing');
            }

            return $next($request);
        }
    }

如果你想判断某个用户是否仍处于试用期内，可以使用 `onTrial` 方法。该方法有助于判断你是否应当向该用户显示一条提示其仍处于试用期的警告：

    if ($user->subscription('default')->onTrial()) {
        // ...
    }

`subscribedToProduct` 方法可用于根据给定的 Stripe 产品标识符判断该用户是否订阅了某个给定产品。在 Stripe 中，产品是价格的集合。在这个例子中，我们会判断用户的 `default` 订阅是否正在订阅应用的「premium」产品。给定的 Stripe 产品标识符应当对应 Stripe 控制面板中你的某个产品标识符：

    if ($user->subscribedToProduct('prod_premium', 'default')) {
        // ...
    }

通过向 `subscribedToProduct` 方法传入一个数组，你可以判断用户的 `default` 订阅是否正在订阅应用的「basic」或「premium」产品：

    if ($user->subscribedToProduct(['prod_basic', 'prod_premium'], 'default')) {
        // ...
    }

`subscribedToPrice` 方法可用于判断某个客户的订阅是否对应给定的价格 ID：

    if ($user->subscribedToPrice('price_basic_monthly', 'default')) {
        // ...
    }

`recurring` 方法可用于判断该用户当前是否已订阅且不再处于试用期内：

    if ($user->subscription('default')->recurring()) {
        // ...
    }

> [!WARNING]
> 如果某个用户有两个类型相同的订阅，`subscription` 方法始终会返回最近的那个订阅。例如，一个用户可能有两条类型为 `default` 的订阅记录；不过，其中一个可能是已过期的旧订阅，另一个才是当前生效的订阅。较旧的订阅会保留在数据库中以供历史查阅，而返回的始终是最近的订阅。

<a name="cancelled-subscription-status"></a>
#### 已取消的订阅状态

要判断某个用户是否曾经是生效中的订阅者但已取消其订阅，可以使用 `canceled` 方法：

    if ($user->subscription('default')->canceled()) {
        // ...
    }

你也可以判断某个用户是否已取消订阅但仍处于「宽限期」内，直至订阅完全到期。例如，如果某个用户在 3 月 5 日取消了一个原定于 3 月 10 日到期的订阅，那么该用户将处于「宽限期」直至 3 月 10 日。请注意，在此期间 `subscribed` 方法仍会返回 `true`：

    if ($user->subscription('default')->onGracePeriod()) {
        // ...
    }

要判断某个用户是否已取消订阅且不再处于「宽限期」内，可以使用 `ended` 方法：

    if ($user->subscription('default')->ended()) {
        // ...
    }

<a name="incomplete-and-past-due-status"></a>
#### 未完成与逾期状态

如果某个订阅在创建后需要进行二次支付操作，该订阅会被标记为 `incomplete`。订阅状态保存在 Cashier 的 `subscriptions` 数据库表的 `stripe_status` 列中。

同样地，如果在切换价格时需要进行二次支付操作，该订阅会被标记为 `past_due`。当你的订阅处于上述任一状态时，它都不会生效，直到客户确认其支付为止。要判断某个订阅是否存在未完成的支付，可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法：

    if ($user->hasIncompletePayment('default')) {
        // ...
    }

    if ($user->subscription('default')->hasIncompletePayment()) {
        // ...
    }

当某个订阅存在未完成的支付时，你应当把用户引导到 Cashier 的支付确认页面，并传入 `latestPayment` 标识符。你可以使用订阅实例上提供的 `latestPayment` 方法来获取该标识符：

```html
<a href="{{ route('cashier.payment', $subscription->latestPayment()->id) }}">
    Please confirm your payment.
</a>
```

如果你希望在订阅处于 `past_due` 或 `incomplete` 状态时仍把它视为生效状态，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 和 `keepIncompleteSubscriptionsActive` 方法。通常，这些方法应当在你 `App\Providers\AppServiceProvider` 的 `register` 方法中调用：

    use Laravel\Cashier\Cashier;

    /**
     * 注册应用的服务。
     */
    public function register(): void
    {
        Cashier::keepPastDueSubscriptionsActive();
        Cashier::keepIncompleteSubscriptionsActive();
    }

> [!WARNING]
> 当订阅处于 `incomplete` 状态时，在支付得到确认之前无法对其进行更改。因此，当订阅处于 `incomplete` 状态时，`swap` 和 `updateQuantity` 方法会抛出异常。

<a name="subscription-scopes"></a>
#### 订阅查询作用域

大多数订阅状态也可以作为查询作用域使用，让你能够轻松地查询数据库中处于给定状态的订阅：

    // 获取所有生效中的订阅……
    $subscriptions = Subscription::query()->active()->get();

    // 获取某个用户的所有已取消订阅……
    $subscriptions = $user->subscriptions()->canceled()->get();

可用作用域的完整列表如下：

    Subscription::query()->active();
    Subscription::query()->canceled();
    Subscription::query()->ended();
    Subscription::query()->incomplete();
    Subscription::query()->notCanceled();
    Subscription::query()->notOnGracePeriod();
    Subscription::query()->notOnTrial();
    Subscription::query()->onGracePeriod();
    Subscription::query()->onTrial();
    Subscription::query()->pastDue();
    Subscription::query()->recurring();

<a name="changing-prices"></a>
### 更改价格

客户订阅你的应用之后，偶尔可能希望切换到新的订阅价格。要把客户切换到新价格，请把该 Stripe 价格的标识符传给 `swap` 方法。在切换价格时，默认认为用户希望在其订阅此前已被取消的情况下重新激活它。给定的价格标识符应当对应 Stripe 控制台中可用的某个 Stripe 价格标识符：

    use App\Models\User;

    $user = App\Models\User::find(1);

    $user->subscription('default')->swap('price_yearly');

如果客户正处于试用期内，试用期会被保留。此外，如果该订阅存在「数量」，该数量也会被保留。

如果你想在切换价格的同时取消客户当前所处的试用期，可以调用 `skipTrial` 方法：

    $user->subscription('default')
        ->skipTrial()
        ->swap('price_yearly');

如果你想在切换价格的同时立即为客户开票，而不是等待他们的下一个计费周期，可以使用 `swapAndInvoice` 方法：

    $user = User::find(1);

    $user->subscription('default')->swapAndInvoice('price_yearly');

<a name="prorations"></a>
#### 按比例分摊

默认情况下，Stripe 在切换价格时会按比例分摊费用。可以使用 `noProrate` 方法更新订阅价格而不按比例分摊费用：

    $user->subscription('default')->noProrate()->swap('price_yearly');

有关订阅按比例分摊的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/billing/subscriptions/prorations)。

> [!WARNING]
> 在 `swapAndInvoice` 方法之前执行 `noProrate` 方法对按比例分摊不会产生任何影响。发票始终会被开具。

<a name="subscription-quantity"></a>
### 订阅数量

有时订阅会受到「数量」的影响。例如，一个项目管理应用可能每个项目每月收费 10 美元。你可以使用 `incrementQuantity` 和 `decrementQuantity` 方法轻松增加或减少你的订阅数量：

    use App\Models\User;

    $user = User::find(1);

    $user->subscription('default')->incrementQuantity();

    // 给该订阅当前的数量加五……
    $user->subscription('default')->incrementQuantity(5);

    $user->subscription('default')->decrementQuantity();

    // 从该订阅当前的数量中减五……
    $user->subscription('default')->decrementQuantity(5);

或者，你可以使用 `updateQuantity` 方法设置一个具体的数量：

    $user->subscription('default')->updateQuantity(10);

可以使用 `noProrate` 方法更新订阅的数量而不按比例分摊费用：

    $user->subscription('default')->noProrate()->updateQuantity(10);

有关订阅数量的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/subscriptions/quantities)。

<a name="quantities-for-subscription-with-multiple-products"></a>
#### 包含多个产品的订阅的数量

如果你的订阅是一个[包含多个产品的订阅](#subscriptions-with-multiple-products)，你应当把希望增加或减少数量的价格 ID 作为增减方法的第二个参数传入：

    $user->subscription('default')->incrementQuantity(1, 'price_chat');

<a name="subscriptions-with-multiple-products"></a>
### 包含多个产品的订阅

[包含多个产品的订阅](https://stripe.com/docs/billing/subscriptions/multiple-products)让你能够把多个计费产品分配给一个订阅。例如，假设你正在构建一个客户服务「helpdesk」应用，它的基础订阅价格为每月 10 美元，但提供每月额外 15 美元的在线聊天附加产品。包含多个产品的订阅信息保存在 Cashier 的 `subscription_items` 数据库表中。

你可以通过把一组价格作为 `newSubscription` 方法的第二个参数传入，为某个订阅指定多个产品：

    use Illuminate\Http\Request;

    Route::post('/user/subscribe', function (Request $request) {
        $request->user()->newSubscription('default', [
            'price_monthly',
            'price_chat',
        ])->create($request->paymentMethodId);

        // ...
    });

在上例中，客户的 `default` 订阅上会附加两个价格。两个价格都会在各自的计费周期内收费。如有必要，你可以使用 `quantity` 方法为每个价格指定一个具体的数量：

    $user = User::find(1);

    $user->newSubscription('default', ['price_monthly', 'price_chat'])
        ->quantity(5, 'price_chat')
        ->create($paymentMethod);

如果你想为一个已有订阅添加另一个价格，可以调用该订阅的 `addPrice` 方法：

    $user = User::find(1);

    $user->subscription('default')->addPrice('price_chat');

上例会添加新价格，客户会在其下一个计费周期内为该价格付费。如果你想立即为客户开票，可以使用 `addPriceAndInvoice` 方法：

    $user->subscription('default')->addPriceAndInvoice('price_chat');

如果你想添加带有具体数量的价格，可以把数量作为 `addPrice` 或 `addPriceAndInvoice` 方法的第二个参数传入：

    $user = User::find(1);

    $user->subscription('default')->addPrice('price_chat', 5);

你可以使用 `removePrice` 方法从订阅中移除价格：

    $user->subscription('default')->removePrice('price_chat');

> [!WARNING]
> 你不能移除订阅上的最后一个价格。相反，你应当直接取消该订阅。

<a name="swapping-prices"></a>
#### 切换价格

你也可以更改一个包含多个产品的订阅上所附加的价格。例如，假设某个客户拥有一个带 `price_chat` 附加产品的 `price_basic` 订阅，而你希望把该客户从 `price_basic` 升级到 `price_pro` 价格：

    use App\Models\User;

    $user = User::find(1);

    $user->subscription('default')->swap(['price_pro', 'price_chat']);

执行上例时，带 `price_basic` 的底层订阅项会被删除，而带 `price_chat` 的那个会被保留。此外，还会为 `price_pro` 创建一个新的订阅项。

你也可以通过把一组键 / 值对传给 `swap` 方法来指定订阅项选项。例如，你可能需要指定订阅价格数量：

    $user = User::find(1);

    $user->subscription('default')->swap([
        'price_pro' => ['quantity' => 5],
        'price_chat'
    ]);

如果你想切换订阅上的单个价格，可以使用该订阅项自身的 `swap` 方法来实现。如果你希望保留该订阅其他价格上的所有现有元数据，这种方式尤其有用：

    $user = User::find(1);

    $user->subscription('default')
        ->findItemOrFail('price_basic')
        ->swap('price_pro');

<a name="proration"></a>
#### 按比例分摊

默认情况下，Stripe 在为包含多个产品的订阅添加或移除价格时会按比例分摊费用。如果你想在不按比例分摊的情况下调整价格，应当把 `noProrate` 方法链式地接在你的价格操作之后：

    $user->subscription('default')->noProrate()->removePrice('price_chat');

<a name="swapping-quantities"></a>
#### 数量

如果你想更新各个订阅价格上的数量，可以使用[现有的数量方法](#subscription-quantity)，只需把价格 ID 作为额外参数传给该方法：

    $user = User::find(1);

    $user->subscription('default')->incrementQuantity(5, 'price_chat');

    $user->subscription('default')->decrementQuantity(3, 'price_chat');

    $user->subscription('default')->updateQuantity(10, 'price_chat');

> [!WARNING]
> 当一个订阅包含多个价格时，`Subscription` 模型上的 `stripe_price` 和 `quantity` 属性将为 `null`。要访问各个独立的 price 属性，你应当使用 `Subscription` 模型上提供的 `items` 关联。

<a name="subscription-items"></a>
#### 订阅项

当一个订阅包含多个价格时，它会有多个订阅「项」存储在你数据库的 `subscription_items` 表中。你可以通过订阅上的 `items` 关联访问它们：

    use App\Models\User;

    $user = User::find(1);

    $subscriptionItem = $user->subscription('default')->items->first();

    // 获取某个特定项的 Stripe 价格和数量……
    $stripePrice = $subscriptionItem->stripe_price;
    $quantity = $subscriptionItem->quantity;

你也可以使用 `findItemOrFail` 方法获取某个特定价格：

    $user = User::find(1);

    $subscriptionItem = $user->subscription('default')->findItemOrFail('price_chat');

<a name="multiple-subscriptions"></a>
### 多个订阅

Stripe 允许你的客户同时拥有多个订阅。例如，你可能经营一家健身房，提供游泳订阅和举重订阅，而每个订阅的价格可以不同。当然，客户应当能够订阅其中任意一个或两个套餐。

当你的应用创建订阅时，你可以向 `newSubscription` 方法提供订阅的类型。该类型可以是任何代表用户正在发起的订阅类型的字符串：

    use Illuminate\Http\Request;

    Route::post('/swimming/subscribe', function (Request $request) {
        $request->user()->newSubscription('swimming')
            ->price('price_swimming_monthly')
            ->create($request->paymentMethodId);

        // ...
    });

在这个例子中，我们为客户发起了一个月度游泳订阅。不过，他们可能希望在之后切换到年度订阅。在调整客户的订阅时，我们可以简单地切换 `swimming` 订阅上的价格：

    $user->subscription('swimming')->swap('price_swimming_yearly');

当然，你也可以完全取消该订阅：

    $user->subscription('swimming')->cancel();

<a name="usage-based-billing"></a>
### 基于用量的计费

[基于用量的计费](https://stripe.com/docs/billing/subscriptions/metered-billing)让你能够根据客户在一个计费周期内的产品使用量向其收费。例如，你可以根据客户每月发送的短信或邮件数量来收费。

要开始使用基于用量的计费，你首先需要在 Stripe 控制面板中创建一个带有[基于用量的计费模型](https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide)和[用量计量器](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage#configure-meter)的新产品。创建计量器之后，存储相关的事件名称和计量器 ID，你将需要它们来上报和获取用量。然后，使用 `meteredPrice` 方法把该计量价格 ID 添加到客户订阅中：

    use Illuminate\Http\Request;

    Route::post('/user/subscribe', function (Request $request) {
        $request->user()->newSubscription('default')
            ->meteredPrice('price_metered')
            ->create($request->paymentMethodId);

        // ...
    });

你也可以通过 [Stripe Checkout](#checkout)启动一个计量订阅：

    $checkout = Auth::user()
        ->newSubscription('default', [])
        ->meteredPrice('price_metered')
        ->checkout();

    return view('your-checkout-view', [
        'checkout' => $checkout,
    ]);

<a name="reporting-usage"></a>
#### 上报用量

随着你的客户使用你的应用，你需要把他们的用量上报给 Stripe，以便准确地向其收费。要上报某个计量事件的用量，你可以使用 `Billable` 模型上的 `reportMeterEvent` 方法：

    $user = User::find(1);

    $user->reportMeterEvent('emails-sent');

默认情况下，会向该计费周期添加 1 的「用量数量」。或者，你可以传入一个具体的「用量」值，把它添加到客户在该计费周期内的用量中：

    $user = User::find(1);

    $user->reportMeterEvent('emails-sent', quantity: 15);

要获取某个客户针对某个计量器的事件汇总，可以使用 `Billable` 实例的 `meterEventSummaries` 方法：

    $user = User::find(1);

    $meterUsage = $user->meterEventSummaries($meterId);

    $meterUsage->first()->aggregated_value // 10

有关计量事件汇总的更多信息，请参阅 Stripe 的[计量事件汇总对象文档](https://docs.stripe.com/api/billing/meter-event-summary/object)。

要[列出所有计量器](https://docs.stripe.com/api/billing/meter/list)，你可以使用 `Billable` 实例的 `meters` 方法：

    $user = User::find(1);

    $user->meters();

<a name="subscription-taxes"></a>
### 订阅税

> [!WARNING]
> 与手动计算税率相比，你可以[使用 Stripe Tax 自动计算税额](#tax-configuration)

要指定用户在订阅上支付的税率，你应当在可计费模型上实现 `taxRates` 方法，并返回一个包含 Stripe 税率 ID 的数组。你可以在[你的 Stripe 控制面板](https://dashboard.stripe.com/test/tax-rates)中定义这些税率：

    /**
     * 应当适用于该客户订阅的税率。
     *
     * @return array<int, string>
     */
    public function taxRates(): array
    {
        return ['txr_id'];
    }

`taxRates` 方法让你能够按客户逐一应用税率，这对于横跨多个国家和税率的用户群体很有帮助。

如果你提供包含多个产品的订阅，可以通过在可计费模型上实现 `priceTaxRates` 方法为每个价格定义不同的税率：

    /**
     * 应当适用于该客户订阅的税率。
     *
     * @return array<string, array<int, string>>
     */
    public function priceTaxRates(): array
    {
        return [
            'price_monthly' => ['txr_id'],
        ];
    }

> [!WARNING]
> `taxRates` 方法仅适用于订阅扣款。如果你使用 Cashier 进行「一次性」扣款，则需要在该时手动指定税率。

<a name="syncing-tax-rates"></a>
#### 同步税率

更改 `taxRates` 方法返回的硬编码税率 ID 时，该用户已有订阅的税务设置会保持不变。如果你希望用新的 `taxRates` 值更新已有订阅的税率，应当在该用户的订阅实例上调用 `syncTaxRates` 方法：

    $user->subscription('default')->syncTaxRates();

这也会同步包含多个产品的订阅的各项税率。如果你的应用提供包含多个产品的订阅，应当确保你的可计费模型实现了[上文讨论的](#subscription-taxes) `priceTaxRates` 方法。

<a name="tax-exemption"></a>
#### 免税

Cashier 还提供 `isNotTaxExempt`、`isTaxExempt` 和 `reverseChargeApplies` 方法，用于判断客户是否免税。这些方法会调用 Stripe API 来确定客户的免税状态：

    use App\Models\User;

    $user = User::find(1);

    $user->isTaxExempt();
    $user->isNotTaxExempt();
    $user->reverseChargeApplies();

> [!WARNING]
> 这些方法在任何 `Laravel\Cashier\Invoice` 对象上也可使用。不过，在 `Invoice` 对象上调用时，这些方法会判断发票创建时的免税状态。

<a name="subscription-anchor-date"></a>
### 订阅锚定日期

默认情况下，计费周期锚定日期是订阅创建的日期，或者在使用试用期时为试用结束的日期。如果你想修改计费锚定日期，可以使用 `anchorBillingCycleOn` 方法：

    use Illuminate\Http\Request;

    Route::post('/user/subscribe', function (Request $request) {
        $anchor = Carbon::parse('first day of next month');

        $request->user()->newSubscription('default', 'price_monthly')
            ->anchorBillingCycleOn($anchor->startOfDay())
            ->create($request->paymentMethodId);

        // ...
    });

有关管理订阅计费周期的更多信息，请查阅 [Stripe 计费周期文档](https://stripe.com/docs/billing/subscriptions/billing-cycle)

<a name="cancelling-subscriptions"></a>
### 取消订阅

要取消订阅，请在用户的订阅上调用 `cancel` 方法：

    $user->subscription('default')->cancel();

订阅被取消时，Cashier 会自动设置你 `subscriptions` 数据库表中的 `ends_at` 列。该列用于确定 `subscribed` 方法应从何时开始返回 `false`。

例如，如果某个客户在 3 月 1 日取消了订阅，但该订阅原定于 3 月 5 日结束，那么 `subscribed` 方法会持续返回 `true` 直到 3 月 5 日。这样做是因为通常允许用户继续使用应用直到其计费周期结束。

你可以使用 `onGracePeriod` 方法判断某个用户是否已取消订阅但仍处于「宽限期」内：

    if ($user->subscription('default')->onGracePeriod()) {
        // ...
    }

如果你想立即取消订阅，请在用户的订阅上调用 `cancelNow` 方法：

    $user->subscription('default')->cancelNow();

如果你想立即取消订阅，并为任何剩余的未开票计量用量或新的 / 待处理的按比例分摊发票项开票，请在用户的订阅上调用 `cancelNowAndInvoice` 方法：

    $user->subscription('default')->cancelNowAndInvoice();

你也可以选择在某个特定时间点取消该订阅：

    $user->subscription('default')->cancelAt(
        now()->addDays(10)
    );

最后，你始终应当在删除关联的用户模型之前取消该用户的订阅：

    $user->subscription('default')->cancelNow();

    $user->delete();

<a name="resuming-subscriptions"></a>
### 恢复订阅

如果某个客户已取消其订阅而你希望恢复它，可以在订阅上调用 `resume` 方法。客户必须仍处于「宽限期」内才能恢复订阅：

    $user->subscription('default')->resume();

如果客户取消了订阅，随后在该订阅完全到期之前又恢复了它，那么客户不会被立即收费。相反，他们的订阅会被重新激活，并按原本的计费周期计费。

<a name="subscription-trials"></a>
## 订阅试用

<a name="with-payment-method-up-front"></a>
### 预先提供支付方式

如果你想在向客户提供试用期，同时仍预先收集其支付方式信息，可以在创建订阅时使用 `trialDays` 方法：

    use Illuminate\Http\Request;

    Route::post('/user/subscribe', function (Request $request) {
        $request->user()->newSubscription('default', 'price_monthly')
            ->trialDays(10)
            ->create($request->paymentMethodId);

        // ...
    });

该方法会在数据库中的订阅记录上设置试用结束日期，并指示 Stripe 在该日期之前不要开始向客户收费。使用 `trialDays` 方法时，Cashier 会覆盖 Stripe 中为该价格配置的任何默认试用期。

> [!WARNING]
> 如果客户的订阅在试用结束日期之前未被取消，那么试用一结束就会被扣费，因此你务必告知用户其试用结束日期。

`trialUntil` 方法允许你提供一个 `DateTime` 实例，用于指定试用期应何时结束：

    use Carbon\Carbon;

    $user->newSubscription('default', 'price_monthly')
        ->trialUntil(Carbon::now()->addDays(10))
        ->create($paymentMethod);

你可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法来判断某个用户是否处于试用期内。下面两个例子是等价的：

    if ($user->onTrial('default')) {
        // ...
    }

    if ($user->subscription('default')->onTrial()) {
        // ...
    }

你可以使用 `endTrial` 方法立即结束订阅试用：

    $user->subscription('default')->endTrial();

要判断已有的试用是否已过期，可以使用 `hasExpiredTrial` 方法：

    if ($user->hasExpiredTrial('default')) {
        // ...
    }

    if ($user->subscription('default')->hasExpiredTrial()) {
        // ...
    }

<a name="defining-trial-days-in-stripe-cashier"></a>
#### 在 Stripe / Cashier 中定义试用天数

你可以选择在 Stripe 控制面板中定义各个价格获得多少试用天数，也可以始终使用 Cashier 显式传入它们。如果你选择在 Stripe 中定义价格的试用天数，应当注意新订阅——包括过去曾有订阅的客户的全新订阅——都会获得试用期，除非你显式调用 `skipTrial()` 方法。

<a name="without-payment-method-up-front"></a>
### 不预先提供支付方式

如果你想提供试用期但不预先收集用户的支付方式信息，可以把用户记录上的 `trial_ends_at` 列设置为你期望的试用结束日期。这通常在用户注册时完成：

    use App\Models\User;

    $user = User::create([
        // ...
        'trial_ends_at' => now()->addDays(10),
    ]);

> [!WARNING]
> 务必在你可计费模型的类定义中为 `trial_ends_at` 属性添加一个[日期类型转换](/docs/{{version}}/eloquent-mutators#date-casting)。

Cashier 把这种类型的试用称为「通用试用」，因为它并未附加到任何已有订阅上。如果当前日期尚未超过 `trial_ends_at` 的值，可计费模型实例上的 `onTrial` 方法会返回 `true`：

    if ($user->onTrial()) {
        // 用户处于其试用期内……
    }

当你准备为该用户创建一个真正的订阅时，可以照常使用 `newSubscription` 方法：

    $user = User::find(1);

    $user->newSubscription('default', 'price_monthly')->create($paymentMethod);

要获取该用户的试用结束日期，可以使用 `trialEndsAt` 方法。如果用户正处于试用中，该方法会返回一个 Carbon 日期实例，否则返回 `null`。如果你希望获取默认订阅之外某个特定订阅的试用结束日期，也可以传入一个可选的订阅类型参数：

    if ($user->onTrial()) {
        $trialEndsAt = $user->trialEndsAt('main');
    }

如果你想确切知道该用户是否处于其「通用」试用期内且尚未创建真正的订阅，也可以使用 `onGenericTrial` 方法：

    if ($user->onGenericTrial()) {
        // 用户处于其「通用」试用期内……
    }

<a name="extending-trials"></a>
### 延长试用

`extendTrial` 方法允许你在订阅创建之后延长其试用期。如果试用已经过期且客户已经在为该订阅付费，你仍然可以向他们提供一段延长后的试用。试用期内花费的时间会从客户的下一张发票中扣除：

    use App\Models\User;

    $subscription = User::find(1)->subscription('default');

    // 从现在起 7 天后结束试用……
    $subscription->extendTrial(
        now()->addDays(7)
    );

    // 为试用额外增加 5 天……
    $subscription->extendTrial(
        $subscription->trial_ends_at->addDays(5)
    );

<a name="handling-stripe-webhooks"></a>
## 处理 Stripe Webhook

> [!NOTE]
> 你可以使用 [Stripe CLI](https://stripe.com/docs/stripe-cli) 来帮助在本地开发期间测试 Webhook。

Stripe 可以通过 Webhook 通知你的应用各种事件。默认情况下，Cashier 服务提供者会自动注册一个指向 Cashier Webhook 控制器的路由。该控制器会处理所有传入的 Webhook 请求。

默认情况下，Cashier Webhook 控制器会自动处理失败扣款次数过多（由你的 Stripe 设置定义）的订阅取消、客户更新、客户删除、订阅更新和支付方式变更；不过，正如我们接下来会看到的，你可以扩展该控制器以处理任何你喜欢的 Stripe Webhook 事件。

为确保你的应用能够处理 Stripe Webhook，请在 Stripe 控制面板中配置 Webhook URL。默认情况下，Cashier 的 Webhook 控制器响应 `/stripe/webhook` 这个 URL 路径。你应当在 Stripe 控制面板中启用的全部 Webhook 列表如下：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`
- `customer.deleted`
- `payment_method.automatically_updated`
- `invoice.payment_action_required`
- `invoice.payment_succeeded`

为方便起见，Cashier 包含一个 `cashier:webhook` Artisan 命令。该命令会在 Stripe 中创建一个 Webhook，监听 Cashier 所需的全部事件：

```shell
php artisan cashier:webhook
```

默认情况下，创建的 Webhook 会指向由 `APP_URL` 环境变量所定义的 URL，以及 Cashier 自带的 `cashier.webhook` 路由。如果你想使用其他 URL，可以在调用该命令时提供 `--url` 选项：

```shell
php artisan cashier:webhook --url "https://example.com/stripe/webhook"
```

所创建的 Webhook 会使用与你所用 Cashier 版本相兼容的 Stripe API 版本。如果你想使用其他 Stripe 版本，可以提供 `--api-version` 选项：

```shell
php artisan cashier:webhook --api-version="2019-12-03"
```

创建之后，该 Webhook 会立即生效。如果你想创建该 Webhook 但先保持禁用状态直到准备就绪，可以在调用该命令时提供 `--disabled` 选项：

```shell
php artisan cashier:webhook --disabled
```

> [!WARNING]
> 请务必使用 Cashier 自带的 [Webhook 签名校验](#verifying-webhook-signatures)中间件来保护传入的 Stripe Webhook 请求。

<a name="webhooks-csrf-protection"></a>
#### Webhook 与 CSRF 保护

由于 Stripe Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，你应当确保 Laravel 不会尝试为传入的 Stripe Webhook 校验 CSRF 令牌。为此，你应当在应用的 `bootstrap/app.php` 文件中把 `stripe/*` 排除在 CSRF 保护之外：

    ->withMiddleware(function (Middleware $middleware) {
        $middleware->validateCsrfTokens(except: [
            'stripe/*',
        ]);
    })

<a name="defining-webhook-event-handlers"></a>
### 定义 Webhook 事件处理器

Cashier 会自动处理失败扣款导致的订阅取消，以及其他常见的 Stripe Webhook 事件。不过，如果你还想处理其他 Webhook 事件，可以监听 Cashier 派发的以下事件来实现：

- `Laravel\Cashier\Events\WebhookReceived`
- `Laravel\Cashier\Events\WebhookHandled`

这两个事件都包含 Stripe Webhook 的完整负载。例如，如果你想处理 `invoice.payment_succeeded` Webhook，可以注册一个[监听器](/docs/{{version}}/events#defining-listeners)来处理该事件：

    <?php

    namespace App\Listeners;

    use Laravel\Cashier\Events\WebhookReceived;

    class StripeEventListener
    {
        /**
         * 处理收到的 Stripe Webhook。
         */
        public function handle(WebhookReceived $event): void
        {
            if ($event->payload['type'] === 'invoice.payment_succeeded') {
                // 处理传入的事件……
            }
        }
    }

<a name="verifying-webhook-signatures"></a>
### 校验 Webhook 签名

为保护你的 Webhook，你可以使用 [Stripe 的 Webhook 签名](https://stripe.com/docs/webhooks/signatures)。为方便起见，Cashier 自动包含一个用于校验传入 Stripe Webhook 请求是否有效的中间件。

要启用 Webhook 校验，请确保在应用的 `.env` 文件中设置了 `STRIPE_WEBHOOK_SECRET` 环境变量。该 Webhook 的 `secret` 可以从你的 Stripe 账户面板中获取。

<a name="single-charges"></a>
## 单次扣款

<a name="simple-charge"></a>
### 简单扣款

如果你想对某个客户进行一次性扣款，可以在可计费模型实例上使用 `charge` 方法。你需要把[支付方式标识符](#payment-methods-for-single-charges)作为 `charge` 方法的第二个参数提供：

    use Illuminate\Http\Request;

    Route::post('/purchase', function (Request $request) {
        $stripeCharge = $request->user()->charge(
            100, $request->paymentMethodId
        );

        // ...
    });

`charge` 方法的第三个参数接受一个数组，让你能够把任意选项传给底层的 Stripe 扣款创建。关于创建扣款时可用的选项的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/api/charges/create)：

    $user->charge(100, $paymentMethod, [
        'custom_option' => $value,
    ]);

你也可以在没有底层客户或用户的情况下使用 `charge` 方法。为此，请在你应用可计费模型的一个新实例上调用 `charge` 方法：

    use App\Models\User;

    $stripeCharge = (new User)->charge(100, $paymentMethod);

如果扣款失败，`charge` 方法会抛出一个异常。如果扣款成功，该方法会返回一个 `Laravel\Cashier\Payment` 实例：

    try {
        $payment = $user->charge(100, $paymentMethod);
    } catch (Exception $e) {
        // ...
    }

> [!WARNING]
> `charge` 方法接受的支付金额以你应用所用货币的最小单位计。例如，如果客户以美元支付，金额应当以「分」为单位指定。

<a name="charge-with-invoice"></a>
### 带发票的扣款

有时你可能需要进行一次性扣款，并向客户提供一份 PDF 发票。`invoicePrice` 方法正好能让你做到这一点。例如，让我们为某客户开具 5 件新衬衫的发票：

    $user->invoicePrice('price_tshirt', 5);

该发票会立即从该用户的默认支付方式中扣款。`invoicePrice` 方法的第三个参数也接受一个数组，该数组包含发票项的账单选项。该方法接受的第四个参数同样是一个数组，应当包含发票本身的账单选项：

    $user->invoicePrice('price_tshirt', 5, [
        'discounts' => [
            ['coupon' => 'SUMMER21SALE']
        ],
    ], [
        'default_tax_rates' => ['txr_id'],
    ]);

与 `invoicePrice` 类似，你可以使用 `tabPrice` 方法为多个项目（每张发票最多 250 个）创建一次性扣款，方法是把它们加入客户的「tab」然后为该客户开票。例如，我们可以为某客户开具 5 件衬衫和 2 个马克杯的发票：

    $user->tabPrice('price_tshirt', 5);
    $user->tabPrice('price_mug', 2);
    $user->invoice();

或者，你可以使用 `invoiceFor` 方法从客户的默认支付方式进行一次「一次性」扣款：

    $user->invoiceFor('One Time Fee', 500);

虽然 `invoiceFor` 方法可供你使用，但建议你使用带有预定义价格的 `invoicePrice` 和 `tabPrice` 方法。这样一来，你就能在 Stripe 控制面板中按产品获得更好的分析数据。

> [!WARNING]
> `invoice`、`invoicePrice` 和 `invoiceFor` 方法会创建一张 Stripe 发票，它会重试失败的扣款。如果你不希望发票重试失败扣款，就需要在首次扣款失败后通过 Stripe API 关闭它们。

<a name="creating-payment-intents"></a>
### 创建支付意图

你可以在可计费模型实例上调用 `pay` 方法来创建新的 Stripe 支付意图。调用该方法会创建一个被包装在 `Laravel\Cashier\Payment` 实例中的支付意图：

    use Illuminate\Http\Request;

    Route::post('/pay', function (Request $request) {
        $payment = $request->user()->pay(
            $request->get('amount')
        );

        return $payment->client_secret;
    });

创建支付意图之后，你可以把客户端密钥返回给你应用的前端，让用户在其浏览器中完成支付。若想了解更多关于使用 Stripe 支付意图构建完整支付流程的信息，请查阅 [Stripe 文档](https://stripe.com/docs/payments/accept-a-payment?platform=web)。

使用 `pay` 方法时，你 Stripe 控制面板中启用的默认支付方式将可供客户使用。或者，如果你只想允许使用某些特定支付方式，可以使用 `payWith` 方法：

    use Illuminate\Http\Request;

    Route::post('/pay', function (Request $request) {
        $payment = $request->user()->payWith(
            $request->get('amount'), ['card', 'bancontact']
        );

        return $payment->client_secret;
    });

> [!WARNING]
> `pay` 和 `payWith` 方法接受的支付金额以你应用所用货币的最小单位计。例如，如果客户以美元支付，金额应当以「分」为单位指定。

<a name="refunding-charges"></a>
### 退还扣款

如果你需要退还一笔 Stripe 扣款，可以使用 `refund` 方法。该方法的第一个参数接受 Stripe 的[支付意图 ID](#payment-methods-for-single-charges)：

    $payment = $user->charge(100, $paymentMethodId);

    $user->refund($payment->id);

<a name="invoices"></a>
## 发票

<a name="retrieving-invoices"></a>
### 获取发票

你可以轻松地使用 `invoices` 方法获取某个可计费模型的发票数组。`invoices` 方法会返回一组 `Laravel\Cashier\Invoice` 实例：

    $invoices = $user->invoices();

如果你想在结果中包含待处理发票，可以使用 `invoicesIncludingPending` 方法：

    $invoices = $user->invoicesIncludingPending();

你可以使用 `findInvoice` 方法按 ID 获取某张特定发票：

    $invoice = $user->findInvoice($invoiceId);

<a name="displaying-invoice-information"></a>
#### 展示发票信息

在列出客户的发票时，你可以使用发票上的方法来展示相关信息。例如，你可能希望把所有发票列成一张表格，让用户可以轻松下载其中任意一张：

    <table>
        @foreach ($invoices as $invoice)
            <tr>
                <td>{{ $invoice->date()->toFormattedDateString() }}</td>
                <td>{{ $invoice->total() }}</td>
                <td><a href="/user/invoice/{{ $invoice->id }}">Download</a></td>
            </tr>
        @endforeach
    </table>

<a name="upcoming-invoices"></a>
### 即将到来的发票

要获取某个客户即将到来的发票，可以使用 `upcomingInvoice` 方法：

    $invoice = $user->upcomingInvoice();

同样地，如果该客户有多个订阅，你也可以获取某个特定订阅即将到来的发票：

    $invoice = $user->subscription('default')->upcomingInvoice();

<a name="previewing-subscription-invoices"></a>
### 预览订阅发票

使用 `previewInvoice` 方法，你可以在更改价格之前预览发票。这能让你确定进行某项价格更改后客户的发票会是什么样子：

    $invoice = $user->subscription('default')->previewInvoice('price_yearly');

你可以向 `previewInvoice` 方法传入一组价格，以预览包含多个新价格的发票：

    $invoice = $user->subscription('default')->previewInvoice(['price_yearly', 'price_metered']);

<a name="generating-invoice-pdfs"></a>
### 生成发票 PDF

在生成发票 PDF 之前，你应当使用 Composer 安装 Dompdf 库，它是 Cashier 默认的发票渲染器：

```shell
composer require dompdf/dompdf
```

在路由或控制器中，你可以使用 `downloadInvoice` 方法为给定的发票生成 PDF 下载。该方法会自动生成下载该发票所需的恰当 HTTP 响应：

    use Illuminate\Http\Request;

    Route::get('/user/invoice/{invoice}', function (Request $request, string $invoiceId) {
        return $request->user()->downloadInvoice($invoiceId);
    });

默认情况下，发票上的所有数据都来自 Stripe 中存储的客户和发票数据。文件名基于你的 `app.name` 配置值。不过，你可以通过把一个数组作为 `downloadInvoice` 方法的第二个参数提供来自定义其中部分数据。该数组让你能够自定义诸如公司和产品详情等信息：

    return $request->user()->downloadInvoice($invoiceId, [
        'vendor' => 'Your Company',
        'product' => 'Your Product',
        'street' => 'Main Str. 1',
        'location' => '2000 Antwerp, Belgium',
        'phone' => '+32 499 00 00 00',
        'email' => 'info@example.com',
        'url' => 'https://example.com',
        'vendorVat' => 'BE123456789',
    ]);

`downloadInvoice` 方法还允许通过其第三个参数指定自定义文件名。该文件名会自动加上 `.pdf` 后缀：

    return $request->user()->downloadInvoice($invoiceId, [], 'my-invoice');

<a name="custom-invoice-render"></a>
#### 自定义发票渲染器

Cashier 还允许你使用自定义的发票渲染器。默认情况下，Cashier 使用 `DompdfInvoiceRenderer` 实现，它利用 [dompdf](https://github.com/dompdf/dompdf) PHP 库生成 Cashier 的发票。不过，你可以通过实现 `Laravel\Cashier\Contracts\InvoiceRenderer` 接口来使用任何你想要的渲染器。例如，你可能希望通过对第三方 PDF 渲染服务的 API 调用来渲染发票 PDF：

    use Illuminate\Support\Facades\Http;
    use Laravel\Cashier\Contracts\InvoiceRenderer;
    use Laravel\Cashier\Invoice;

    class ApiInvoiceRenderer implements InvoiceRenderer
    {
        /**
         * 渲染给定发票并返回原始的 PDF 字节。
         */
        public function render(Invoice $invoice, array $data = [], array $options = []): string
        {
            $html = $invoice->view($data)->render();

            return Http::get('https://example.com/html-to-pdf', ['html' => $html])->get()->body();
        }
    }

实现发票渲染器契约之后，你应当更新应用 `config/cashier.php` 配置文件中的 `cashier.invoices.renderer` 配置值。该配置值应当设置为你自定义渲染器实现的类名。

<a name="checkout"></a>
## Checkout

Cashier Stripe 还支持 [Stripe Checkout](https://stripe.com/payments/checkout)。Stripe Checkout 通过提供一个预构建的托管支付页面，免去了实现自定义支付页面来接受支付的麻烦。

以下文档介绍了如何开始使用 Cashier 搭配 Stripe Checkout。要进一步了解 Stripe Checkout，你还应当查阅 [Stripe 关于 Checkout 的官方文档](https://stripe.com/docs/payments/checkout)。

<a name="product-checkouts"></a>
### 产品 Checkout

对于已在你 Stripe 控制面板中创建的产品，你可以使用可计费模型上的 `checkout` 方法为其执行结账。`checkout` 方法会启动一个新的 Stripe Checkout 会话。默认情况下，你需要传入一个 Stripe 价格 ID：

    use Illuminate\Http\Request;

    Route::get('/product-checkout', function (Request $request) {
        return $request->user()->checkout('price_tshirt');
    });

如有需要，你还可以指定产品数量：

    use Illuminate\Http\Request;

    Route::get('/product-checkout', function (Request $request) {
        return $request->user()->checkout(['price_tshirt' => 15]);
    });

当客户访问此路由时，他们会被重定向到 Stripe 的 Checkout 页面。默认情况下，当用户成功完成或取消一次购买时，他们会被重定向到你 `home` 路由的位置；不过，你可以使用 `success_url` 和 `cancel_url` 选项指定自定义回调 URL：

    use Illuminate\Http\Request;

    Route::get('/product-checkout', function (Request $request) {
        return $request->user()->checkout(['price_tshirt' => 1], [
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
    });

在定义 `success_url` 结账选项时，你可以指示 Stripe 在调用你的 URL 时把 Checkout 会话 ID 作为查询字符串参数添加进去。为此，请把字面字符串 `{CHECKOUT_SESSION_ID}` 添加到你的 `success_url` 查询字符串中。Stripe 会用实际的 Checkout 会话 ID 替换该占位符：

    use Illuminate\Http\Request;
    use Stripe\Checkout\Session;
    use Stripe\Customer;

    Route::get('/product-checkout', function (Request $request) {
        return $request->user()->checkout(['price_tshirt' => 1], [
            'success_url' => route('checkout-success').'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('checkout-cancel'),
        ]);
    });

    Route::get('/checkout-success', function (Request $request) {
        $checkoutSession = $request->user()->stripe()->checkout->sessions->retrieve($request->get('session_id'));

        return view('checkout.success', ['checkoutSession' => $checkoutSession]);
    })->name('checkout-success');

<a name="checkout-promotion-codes"></a>
#### 优惠码

默认情况下，Stripe Checkout 不允许使用[用户可兑换的优惠码](https://stripe.com/docs/billing/subscriptions/discounts/codes)。所幸，有一种简单的方法可以为自己的 Checkout 页面启用它们。为此，你可以调用 `allowPromotionCodes` 方法：

    use Illuminate\Http\Request;

    Route::get('/product-checkout', function (Request $request) {
        return $request->user()
            ->allowPromotionCodes()
            ->checkout('price_tshirt');
    });

<a name="single-charge-checkouts"></a>
### 单次扣款 Checkout

你也可以为尚未在 Stripe 控制面板中创建的临时产品执行一次简单扣款。为此，你可以在可计费模型上使用 `checkoutCharge` 方法，并向其传入一个可扣款金额、一个产品名称和一个可选的数量。当客户访问此路由时，他们会被重定向到 Stripe 的 Checkout 页面：

    use Illuminate\Http\Request;

    Route::get('/charge-checkout', function (Request $request) {
        return $request->user()->checkoutCharge(1200, 'T-Shirt', 5);
    });

> [!WARNING]
> 使用 `checkoutCharge` 方法时，Stripe 始终会在你的 Stripe 控制面板中创建一个新产品和价格。因此，我们建议你提前在 Stripe 控制面板中创建好产品，并改用 `checkout` 方法。

<a name="subscription-checkouts"></a>
### 订阅 Checkout

> [!WARNING]
> 对订阅使用 Stripe Checkout 需要你在 Stripe 控制面板中启用 `customer.subscription.created` Webhook。该 Webhook 会在你的数据库中创建订阅记录，并存储所有相关的订阅项。

你也可以使用 Stripe Checkout 来发起订阅。在用 Cashier 的订阅构建器方法定义好订阅之后，可以调用 `checkout` 方法。当客户访问此路由时，他们会被重定向到 Stripe 的 Checkout 页面：

    use Illuminate\Http\Request;

    Route::get('/subscription-checkout', function (Request $request) {
        return $request->user()
            ->newSubscription('default', 'price_monthly')
            ->checkout();
    });

与产品 Checkout 一样，你也可以自定义成功和取消 URL：

    use Illuminate\Http\Request;

    Route::get('/subscription-checkout', function (Request $request) {
        return $request->user()
            ->newSubscription('default', 'price_monthly')
            ->checkout([
                'success_url' => route('your-success-route'),
                'cancel_url' => route('your-cancel-route'),
            ]);
    });

当然，你也可以为订阅 Checkout 启用优惠码：

    use Illuminate\Http\Request;

    Route::get('/subscription-checkout', function (Request $request) {
        return $request->user()
            ->newSubscription('default', 'price_monthly')
            ->allowPromotionCodes()
            ->checkout();
    });

> [!WARNING]
> 遗憾的是，在开始订阅时，Stripe Checkout 并不支持所有订阅计费选项。在订阅构建器上使用 `anchorBillingCycleOn` 方法、设置按比例分摊行为或设置支付行为，在 Stripe Checkout 会话期间都不会产生任何效果。请查阅 [Stripe Checkout Session API 文档](https://stripe.com/docs/api/checkout/sessions/create)，了解有哪些可用参数。

<a name="stripe-checkout-trial-periods"></a>
#### Stripe Checkout 与试用期

当然，在构建将使用 Stripe Checkout 完成的订阅时，你可以定义一个试用期：

    $checkout = Auth::user()->newSubscription('default', 'price_monthly')
        ->trialDays(3)
        ->checkout();

不过，试用期必须至少为 48 小时，这是 Stripe Checkout 所支持的最短试用时长。

<a name="stripe-checkout-subscriptions-and-webhooks"></a>
#### 订阅与 Webhook

请记住，Stripe 和 Cashier 通过 Webhook 更新订阅状态，因此客户在输入支付信息后返回应用时，订阅有可能尚未生效。为处理这种情况，你不妨显示一条消息，告知用户其支付或订阅正在处理中。

<a name="collecting-tax-ids"></a>
### 收集税务 ID

Checkout 也支持收集客户的税务 ID。要在结账会话中启用该功能，请在创建会话时调用 `collectTaxIds` 方法：

    $checkout = $user->collectTaxIds()->checkout('price_tshirt');

调用该方法后，客户将看到一个新复选框，用于表明其是否以公司身份购买。如果选择是，他们就可以填写自己的税务 ID 号码。

> [!WARNING]
> 如果你已经在应用的服务提供者中配置了[自动税款收取](#tax-configuration)，那么该功能会自动启用，无需调用 `collectTaxIds` 方法。

<a name="guest-checkouts"></a>
### 访客 Checkout

使用 `Checkout::guest` 方法，你可以为没有「账户」的应用访客发起结账会话：

    use Illuminate\Http\Request;
    use Laravel\Cashier\Checkout;

    Route::get('/product-checkout', function (Request $request) {
        return Checkout::guest()->create('price_tshirt', [
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
    });

与为已有用户创建结账会话时一样，你可以利用 `Laravel\Cashier\CheckoutBuilder` 实例上提供的其他方法来自定义访客结账会话：

    use Illuminate\Http\Request;
    use Laravel\Cashier\Checkout;

    Route::get('/product-checkout', function (Request $request) {
        return Checkout::guest()
            ->withPromotionCode('promo-code')
            ->create('price_tshirt', [
                'success_url' => route('your-success-route'),
                'cancel_url' => route('your-cancel-route'),
            ]);
    });

访客结账完成后，Stripe 可以派发 `checkout.session.completed` Webhook 事件，因此请务必[配置你的 Stripe Webhook](https://dashboard.stripe.com/webhooks)，让它真正把该事件发送到你的应用。在 Stripe 控制面板中启用该 Webhook 之后，你可以[用 Cashier 处理该 Webhook](#handling-stripe-webhooks)。Webhook 负载中包含的对象将是一个 [`checkout` 对象](https://stripe.com/docs/api/checkout/sessions/object)，你可以检查它以履行客户的订单。

<a name="handling-failed-payments"></a>
## 处理失败的支付

有时，订阅或单次扣款的支付可能会失败。这种情况下，Cashier 会抛出一个 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，以告知你发生了此事。捕获该异常后，你有两个选择来决定如何继续。

首先，你可以把客户重定向到 Cashier 自带的专用支付确认页面。该页面已经有一个通过 Cashier 服务提供者注册的具名路由。因此，你可以捕获 `IncompletePayment` 异常并把用户重定向到支付确认页面：

    use Laravel\Cashier\Exceptions\IncompletePayment;

    try {
        $subscription = $user->newSubscription('default', 'price_monthly')
            ->create($paymentMethod);
    } catch (IncompletePayment $exception) {
        return redirect()->route(
            'cashier.payment',
            [$exception->payment->id, 'redirect' => route('home')]
        );
    }

在支付确认页面上，客户会被提示重新输入其信用卡信息，并执行 Stripe 所要求的任何额外操作，例如「3D Secure」确认。确认支付之后，用户会被重定向到上面 `redirect` 参数所指定的 URL。重定向时，URL 上会附加 `message`（字符串）和 `success`（整数）查询字符串变量。该支付页面目前支持以下支付方式类型：

<div class="content-list" markdown="1">

- 信用卡
- Alipay
- Bancontact
- BECS 直接借记
- EPS
- Giropay
- iDEAL
- SEPA 直接借记

</div>

或者，你也可以让 Stripe 为你处理支付确认。在这种情况下，你不必重定向到支付确认页面，而可以在 Stripe 控制面板中[设置 Stripe 的自动账单邮件](https://dashboard.stripe.com/account/billing/automatic)。不过，如果捕获到 `IncompletePayment` 异常，你仍应告知用户他们将收到一封包含进一步支付确认说明的邮件。

以下方法可能会抛出支付异常：使用 `Billable` Trait 的模型上的 `charge`、`invoiceFor` 和 `invoice` 方法。在与订阅交互时，`SubscriptionBuilder` 上的 `create` 方法，以及 `Subscription` 和 `SubscriptionItem` 模型上的 `incrementAndInvoice` 和 `swapAndInvoice` 方法，都可能抛出未完成支付异常。

要判断某个已有订阅是否存在未完成的支付，可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法：

    if ($user->hasIncompletePayment('default')) {
        // ...
    }

    if ($user->subscription('default')->hasIncompletePayment()) {
        // ...
    }

你可以通过检查异常实例上的 `payment` 属性来判断未完成支付的具体状态：

    use Laravel\Cashier\Exceptions\IncompletePayment;

    try {
        $user->charge(1000, 'pm_card_threeDSecure2Required');
    } catch (IncompletePayment $exception) {
        // 获取支付意图状态……
        $exception->payment->status;

        // 检查特定条件……
        if ($exception->payment->requiresPaymentMethod()) {
            // ...
        } elseif ($exception->payment->requiresConfirmation()) {
            // ...
        }
    }

<a name="confirming-payments"></a>
### 确认支付

某些支付方式需要额外数据才能确认支付。例如，SEPA 支付方式在支付过程中需要额外的「授权（mandate）」数据。你可以使用 `withPaymentConfirmationOptions` 方法把这些数据提供给 Cashier：

    $subscription->withPaymentConfirmationOptions([
        'mandate_data' => '...',
    ])->swap('price_xxx');

你可以查阅 [Stripe API 文档](https://stripe.com/docs/api/payment_intents/confirm)，了解确认支付时接受的所有选项。

<a name="strong-customer-authentication"></a>
## 强客户认证

如果你的业务或你的某个客户位于欧洲，你就必须遵守欧盟的强客户认证（SCA）规定。这些规定由欧盟于 2019 年 9 月推出，以防止支付欺诈。所幸，Stripe 和 Cashier 已为构建符合 SCA 的应用做好了准备。

> [!WARNING]
> 在开始之前，请阅读 [Stripe 关于 PSD2 与 SCA 的指南](https://stripe.com/guides/strong-customer-authentication)，以及他们关于[新 SCA API 的文档](https://stripe.com/docs/strong-customer-authentication)。

<a name="payments-requiring-additional-confirmation"></a>
### 需要额外确认的支付

SCA 规定经常要求进行额外验证，以确认并处理支付。这种情况下，Cashier 会抛出一个 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，以告知你需要额外验证。有关如何处理这些异常的更多信息，请查阅[处理失败支付的文档](#handling-failed-payments)。

由 Stripe 或 Cashier 呈现的支付确认屏幕可能针对某个特定银行或发卡机构的支付流程进行定制，并且可能包含额外的卡片确认、小额临时扣款、独立的设备认证或其他形式的验证。

<a name="incomplete-and-past-due-state"></a>
#### 未完成与逾期状态

当某笔支付需要额外确认时，该订阅会保持 `incomplete` 或 `past_due` 状态，这由其 `stripe_status` 数据库列指示。一旦支付确认完成、并且 Stripe 通过 Webhook 通知你的应用支付已完成，Cashier 就会自动激活该客户的订阅。

有关 `incomplete` 和 `past_due` 状态的更多信息，请参阅[我们关于这些状态的补充文档](#incomplete-and-past-due-status)。

<a name="off-session-payment-notifications"></a>
### 非会话内支付通知

由于 SCA 规定要求客户即使在订阅生效期间也要偶尔验证其支付信息，因此当需要非会话内支付确认时，Cashier 可以向客户发送通知。例如，这可能在订阅续订时发生。把 `CASHIER_PAYMENT_NOTIFICATION` 环境变量设置为一个通知类即可启用 Cashier 的支付通知。默认情况下，该通知处于禁用状态。当然，Cashier 自带一个可用于此目的的通知类，但你也可以自由提供自己的通知类：

```ini
CASHIER_PAYMENT_NOTIFICATION=Laravel\Cashier\Notifications\ConfirmPayment
```

为确保非会话内支付确认通知能够送达，请验证已为你的应用[配置 Stripe Webhook](#handling-stripe-webhooks)，并且在 Stripe 控制面板中启用了 `invoice.payment_action_required` Webhook。此外，你的 `Billable` 模型还应当使用 Laravel 的 `Illuminate\Notifications\Notifiable` Trait。

> [!WARNING]
> 即使客户是在手动完成一笔需要额外确认的支付，通知也会被发送。遗憾的是，Stripe 无法知道该支付是手动完成的还是「非会话内」的。不过，如果客户在已确认支付之后访问支付页面，只会看到一条「Payment Successful」消息。客户不会意外地两次确认同一笔支付，从而造成意外的第二次扣款。

<a name="stripe-sdk"></a>
## Stripe SDK

Cashier 的许多对象都是对 Stripe SDK 对象的包装。如果你想直接与 Stripe 对象交互，可以通过 `asStripe` 方法便捷地获取它们：

    $stripeSubscription = $subscription->asStripeSubscription();

    $stripeSubscription->application_fee_percent = 5;

    $stripeSubscription->save();

你也可以使用 `updateStripeSubscription` 方法直接更新 Stripe 订阅：

    $subscription->updateStripeSubscription(['application_fee_percent' => 5]);

如果你想直接使用 `Stripe\StripeClient` 客户端，可以在 `Cashier` 类上调用 `stripe` 方法。例如，你可以用该方法访问 `StripeClient` 实例，并获取你 Stripe 账户中的一份价格列表：

    use Laravel\Cashier\Cashier;

    $prices = Cashier::stripe()->prices->all();

<a name="testing"></a>
## 测试

在测试使用 Cashier 的应用时，你可以模拟对 Stripe API 的实际 HTTP 请求；不过，这要求你部分重新实现 Cashier 自身的行为。因此，我们建议允许你的测试实际访问 Stripe API。虽然这样更慢，但能让你更有把握认为应用按预期工作，而且任何较慢的测试都可以放入它们自己的 Pest / PHPUnit 测试分组中。

测试时请记住，Cashier 本身已经有一套完善的测试套件，因此你应当只专注于测试自己应用的订阅与支付流程，而不必测试 Cashier 底层的每一种行为。

要开始使用，请把你的 Stripe 密钥的**测试**版本添加到 `phpunit.xml` 文件中：

    <env name="STRIPE_SECRET" value="sk_test_<your-key>"/>

现在，每当你在测试中与 Cashier 交互时，它都会向你的 Stripe 测试环境发送真实的 API 请求。为方便起见，你应当预先在你的 Stripe 测试账户中填充好测试期间可能用到的订阅 / 价格。

> [!NOTE]
> 为了测试各种计费场景（例如信用卡被拒和扣款失败），你可以使用 Stripe 提供的各种[测试卡号和令牌](https://stripe.com/docs/testing)。
