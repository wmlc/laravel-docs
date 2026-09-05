# Cashier (Stripe)

## 介绍

[Laravel Cashier Stripe](https://github.com/laravel/cashier-stripe) 为 [Stripe](https://stripe.com) 的订阅计费服务提供了一个富有表达力、流畅的接口。它几乎为你处理了所有让你头疼的样板订阅计费代码。除了基本的订阅管理外，Cashier 还可以帮助你处理优惠券、订阅切换、订阅"数量"、取消宽限期，甚至生成发票 PDF。

## 升级 Cashier

当升级到 Cashier 的新主版本时，重要的是仔细查看 [升级指南](https://github.com/laravel/cashier-stripe/blob/master/UPGRADE.md)。

## 安装

首先，使用 Composer 包管理器安装 Cashier for Stripe 包：

```shell
composer require laravel/cashier
```

安装完成后，使用 `vendor:publish` Artisan 命令发布 Cashier 的迁移文件：

```shell
php artisan vendor:publish --tag="cashier-migrations"
```

然后运行数据库迁移。该迁移会创建一个 `subscriptions` 表，用于保存你所有客户的订阅，同时为存储各种折扣和发票标识符创建几个附加表：

```shell
php artisan migrate
```

接下来，将 `Billable` trait 添加到你的可计费模型定义中。这个 trait 提供了多种方法，让你执行常见的计费任务，例如创建订阅、应用优惠券和更新支付方式信息：

```php
use Laravel\Cashier\Billable;

class User extends Authenticatable
{
    use Billable;
}
```

Cashier 默认使用你的模型上的 `stripe_id` 列作为 Stripe 客户 ID，你也可以通过覆盖模型上的 `getStripeAttribute` 方法来自定义该列。

最后，你还需要配置你的 Stripe API 密钥。你可以在 `config/services.php` 配置文件中设置这些：

```php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET'),
],
```

## 配置

### 可计费货币

要指定在生成发票时使用的货币，可以将 `cashier.currency` 配置选项设置为支持的货币之一。Cashier 默认使用美元（USD）：

```php
use Laravel\Cashier\Cashier;

// 在服务容器启动期间...
Cashier::useCurrency('eur');
```

除了配置 Cashier 的货币之外，你还可以在指定货币的费率上指定语言区域，从而自定义 Cashier 内部的格式化显示。例如，要将欧元配置为使用法语（`fr`）的语言环境，请按照以下方式调用 `useCurrencyAndLocale` 方法：

```php
Cashier::useCurrencyAndLocale('eur', 'fr');
```

### 税务配置

感谢 [Stripe Tax](https://stripe.com/docs/tax)，你可以在 [Stripe 仪表板](https://dashboard.stripe.com/tax-rates) 内自动计算和收取所有客户的税费。Cashier 提供了一个 `taxRates` 方法，让你可以在 [同步税率](#同步税率) 时手动指定税率。

> [!WARNING]
> 当你使用 [单次收费](#单次收费) 或 [单次 Checkout](#单次-charge-checkouts) 时，你仍然需要在 Cashier 之外手动设置税率。

#### 使用 Stripe Tax

启用 Stripe Tax 后，Cashier 会在新建订阅、单次发票或单次 Checkout 时自动计算税率。要启用 Stripe Tax，请 [在你的 Stripe 仪表板中将其打开](https://dashboard.stripe.com/tax)。

当在应用程序的 `App\Providers\AppServiceProvider` 类的 `boot` 方法中调用 `calculateTaxes` 方法时，新订阅和单次发票将自动开始计算税费：

```php
use Laravel\Cashier\Cashier;

/**
 * 引导任何应用程序服务。
 */
public function boot(): void
{
    Cashier::calculateTaxes();
}
```

> [!WARNING]
> 当在 [Cashier 的数据填充脚本](#填充数据) 中创建订阅时，由于不会触发 Cashier 的事件，因此需要手动调用 `Customer::create` 来附加税务信息。

#### 指定税率

如果你需要手动指定 Stripe 外部创建的订阅所对应的税务税率，可以在你的可计费模型上实现 `taxRates` 方法，并返回一个包含 Stripe 税率 ID 的数组：

```php
/**
 * 应适用于客户订阅的税率。
 *
 * @return array<int, string>
 */
public function taxRates(): array
{
    return ['txr_id'];
}
```

如果你为不同的产品提供不同的税率，那么可以在你的可计费模型上实现 `priceTaxRates` 方法，以返回每个价格 ID 的税率数组：

```php
/**

 * 应适用于客户订阅的税率。
 *
 * @return array<string, array<int, string>>
 */
public function priceTaxRates(): array
{
    return [
        'price_monthly' => ['txr_id'],
    ];
}
```

> [!WARNING]
> `taxRates` 方法仅适用于订阅费用。如果你使用 Cashier 进行单次收费，你需要手动指定税率。

#### 同步税率

当更改 `taxRates` 方法返回的硬编码税率 ID 时，现有订阅上的税率设置将保持不变。如果你想使用新的 `taxRates` 值更新现有订阅的税率值，你应该调用用户订阅实例上的 `syncTaxRates` 方法：

```php
$user->subscription('default')->syncTaxRates();
```

这也会同步多产品订阅的任何项目税率。如果你的应用程序提供多产品订阅，你应该确保你的可计费模型实现了上面 [讨论](#订阅税务) 的 `priceTaxRates` 方法。

### 使用 Stripe Checkout 与 Cashier

当通过 Stripe Checkout 创建订阅时，Cashier 始终会通过 [使用 Stripe Tax](#使用-stripe-tax) 启用自动税务计算。

要了解如何在 Checkout 会话中手动指定税率，请 [查阅 Stripe 文档](https://stripe.com/docs/payments/checkout/taxes)。

### Webhook

Cashier 在本地开发期间可以使用 `stripe listen` 命令转发 Webhook。在生产环境中，你应该让 Stripe 指向一个可公开访问的 URL。

为确保 Cashier 能够正确处理所有 Stripe 事件，请确保在 Stripe 仪表板中配置以下 Webhook：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`
- `customer.deleted`
- `payment_method.automatically_updated`
- `invoice.payment_action_required`
- `invoice.payment_succeeded`

> [!WARNING]
> 使用 `customer.subscription.deleted` 事件确保 Cashier 在 Stripe 中取消订阅时停止接收订阅。

为方便起见，Cashier 包含一个 `cashier:webhook` Artisan 命令。这个命令将在 Stripe 中创建一个 Webhook，监听 Cashier 所需的所有事件：

```shell
php artisan cashier:webhook
```

默认情况下，创建的 Webhook 将指向由 `APP_URL` 环境变量和 Cashier 附带的 `cashier.webhook` 路由定义的 URL。如果你想使用不同的 URL，可以在调用命令时提供 `--url` 选项：

```shell
php artisan cashier:webhook --url "https://example.com/stripe/webhook"
```

创建的 Webhook 将使用你的 Cashier 版本兼容的 Stripe API 版本。如果你想使用不同的 Stripe 版本，可以提供 `--api-version` 选项：

```shell
php artisan cashier:webhook --api-version="2019-12-03"
```

创建后，Webhook 将立即处于活动状态。如果你希望创建 Webhook 但将其禁用直到你准备好，可以在调用命令时提供 `--disabled` 选项：

```shell
php artisan cashier:webhook --disabled
```

确保用 Cashier 包含的 [Webhook 签名验证](#验证-webhook-签名) 中间件保护传入的 Stripe Webhook 请求。

#### 验证 Webhook 签名

要保护你的 Webhook，你可以使用 [Stripe 的 Webhook 签名](https://stripe.com/docs/webhooks/signatures)。Cashier 自动包含一个中间件，用于验证传入的 Stripe Webhook 请求是否有效。

要启用 Webhook 验证，请确保在你的应用程序的 `.env` 文件中设置了 `STRIPE_WEBHOOK_SECRET` 环境变量。Webhook 的 `secret` 可以从你的 Stripe 账户仪表板中获取。

#### 定义 Webhook 事件处理程序

Cashier 自动处理失败的订阅取消和其他常见的 Stripe Webhook 事件。但是，如果你有其他需要处理的 Webhook 事件，你可以通过监听 Cashier 调度的以下事件来执行此操作：

- `Laravel\Cashier\Events\WebhookReceived`
- `Laravel\Cashier\Events\WebhookHandled`

这两个事件都包含 Stripe Webhook 的完整负载。例如，如果你希望处理 `invoice.payment_succeeded` Webhook，你可以注册一个 [监听器](/docs/{{version}}/events#defining-listeners) 来处理该事件：

```php
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
            // 处理传入的事件...
        }
    }
}
```

Cashier 在本地开发期间自动将 Webhook 事件调度为 [队列任务](/docs/{{version}}/queues)。如果你想在本地开发中禁用此行为，请将 `CASHIER_WEBHOOK_DISABLE_QUEUE` 环境变量设置为 `true`。在你的生产环境中，你应该 [配置你的队列](/docs/{{version}}/queues#configuration)。

## 可计费模型

### 查询客户

你可以使用 `Cashier::findBillable` 方法通过其 Stripe ID 检索可计费模型实例。此方法接受 Stripe 客户 ID，并返回相应的可计费模型实例：

```php
use Laravel\Cashier\Cashier;

$user = Cashier::findBillable($stripeId);
```

### 创建客户

有时，你可能希望在不开始订阅的情况下创建 Stripe 客户。`createAsStripeCustomer` 方法完成此操作：

```php
$stripeCustomer = $user->createAsStripeCustomer();
```

在 Europe 创建客户时，你需要传入 `createAsStripeCustomer` 方法的 `address` 参数。你还可以传递 Stripe API [支持的任何其他客户创建选项](https://stripe.com/docs/api/customers/create)：

```php
$stripeCustomer = $user->createAsStripeCustomer($options);
```

如果你已经拥有 Stripe 客户对象，并且希望将其与可计费模型关联，可以将客户 ID 分配给可计费模型上的 `stripe_id` 列：

```php
$user->stripe_id = $stripeCustomer->id;
$user->save();
```

### 更新客户

有时，你可能希望直接使用附加信息更新 Stripe 客户。你可以使用 `updateStripeCustomer` 方法完成此操作。此方法接受 Stripe API [支持的客户更新选项](https://stripe.com/docs/api/customers/update) 的数组：

```php
$stripeCustomer = $user->updateStripeCustomer($options);
```

### 余额

Stripe 允许你为客户的"余额"进行贷记或借记。稍后，该余额将在新发票上进行贷记或借记。要检查客户的总余额，可以使用可计费模型上的 `balance` 方法。`balance` 方法将返回以客户货币表示的余额的格式化字符串：

```php
$balance = $user->balance();
```

要为客户的余额进行贷记，可以向 `creditBalance` 方法提供一个值。如果需要，你还可以提供描述：

```php
$user->creditBalance(500, 'Premium customer top-up.');
```

为 `debitBalance` 方法提供一个值将借记客户的余额：

```php
$user->debitBalance(300, 'Bad usage penalty.');
```

`applyBalance` 方法将为客户创建新的客户余额交易。你可以使用 `balanceTransactions` 方法检索这些交易记录，这对于提供客户审查的贷记和借记日志可能有用：

```php
// 检索所有交易...
$transactions = $user->balanceTransactions();

foreach ($transactions as $transaction) {
    // 交易金额...
    $amount = $transaction->amount(); // $2.31

    // 在可用时检索相关发票...
    $invoice = $transaction->invoice();
}
```

### 税号

Cashier 提供了一种简单的方法来管理客户的税号。例如，`taxIds` 方法可用于检索分配给客户的所有 [税号](https://stripe.com/docs/api/customer_tax_ids/object) 作为集合：

```php
$taxIds = $user->taxIds();
```

你还可以通过其标识符检索客户的特定税号：

```php
$taxId = $user->findTaxId('txi_belgium');
```

你可以通过向 `createTaxId` 方法提供有效的 [类型](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-type) 和值来创建新的税号：

```php
$taxId = $user->createTaxId('eu_vat', 'BE0123456789');
```

`createTaxId` 方法将立即将 VAT 税号添加到客户的账户。[VAT 税号的验证也由 Stripe 完成](https://stripe.com/docs/invoicing/customer/tax-ids#validation)；但是，这是一个异步过程。你可以通过订阅 `customer.tax_id.updated` Webhook 事件并检查 [VAT 税号的 `verification` 参数](https://stripe.com/docs/api/customer_tax_ids/object#tax_id_object-verification) 来获得验证更新的通知。有关处理 Webhook 的更多信息，请查阅 [定义 Webhook 处理程序](#处理-stripe-webhook) 的文档。

你可以使用 `deleteTaxId` 方法删除税号：

```php
$user->deleteTaxId('txi_belgium');
```

### 同步客户数据与 Stripe

通常，当你的应用程序的用户更新其姓名、电子邮件地址或其他也由 Stripe 存储的信息时，你应该通知 Stripe 这些更新。这样做后，Stripe 中存储的信息副本将与你的应用程序保持同步。

要自动执行此操作，你可以在可计费模型上定义一个事件监听器，用于响应模型的 `updated` 事件。然后，在你的事件监听器中，你可以调用模型上的 `syncStripeCustomerDetails` 方法：

```php
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
```

现在，每次更新你的客户模型时，其信息将与 Stripe 同步。为方便起见，Cashier 在客户初始创建时自动将你的客户信息与 Stripe 同步。

你可以通过覆盖 Cashier 提供的各种方法来定制用于将客户信息同步到 Stripe 的列。例如，你可以覆盖 `stripeName` 方法以自定义当 Cashier 将客户信息同步到 Stripe 时应被视为客户的"name"的属性：

```php
/**
 * 获取应同步到 Stripe 的客户名称。
 */
public function stripeName(): string|null
{
    return $this->company_name;
}
```

类似地，你可以覆盖 `stripeEmail`、`stripePhone`（最多 20 个字符）、`stripeAddress` 和 `stripePreferredLocales` 方法。这些方法将在 [更新 Stripe 客户对象](https://stripe.com/docs/api/customers/update) 时将信息同步到其对应的客户参数。如果你想完全控制客户信息同步过程，你可以覆盖 `syncStripeCustomerDetails` 方法。

### 计费门户

Stripe 提供了一种 [简单的方式来设置计费门户](https://stripe.com/docs/billing/subscriptions/customer-portal)，以便你的客户可以管理他们的订阅、支付方式，并查看他们的账单历史记录。你可以通过从控制器或路由调用可计费模型上的 `redirectToBillingPortal` 方法来将用户重定向到计费门户：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal();
});
```

默认情况下，当用户完成管理他们的订阅时，他们将能够通过 Stripe 计费门户内的链接返回到应用程序的 `home` 路由。你可以提供一个 URL 作为参数传递给 `redirectToBillingPortal` 方法，以指定用户应返回到的自定义 URL：

```php
use Illuminate\Http\Request;

Route::get('/billing-portal', function (Request $request) {
    return $request->user()->redirectToBillingPortal(route('billing'));
});
```

如果你想在不生成 HTTP 重定向响应的情况下生成计费门户的 URL，可以调用 `billingPortalUrl` 方法：

```php
$url = $request->user()->billingPortalUrl(route('billing'));
```

## 支付方式

### 存储支付方式

为了创建订阅或使用 Stripe 执行"单次"收费，你的应用程序需要安全地从客户那里收集支付详细信息。用于完成此操作的方法根据你是计划存储支付方式以供将来订阅使用还是立即处理单次收费而有所不同，因此我们将在下面检查这两种情况。

Stripe 的 [Payment Element](https://stripe.com/docs/payments/payment-element) 可用于支持多种支付方式，例如卡、Apple Pay、Google Pay 和 iDEAL。

#### 订阅的 Payment Element

首先，创建一个 Setup Intent 并将其传递给你的视图：

```php
return view('subscribe', [
    'intent' => $user->createSetupIntent()
]);
```

使用 Setup Intent 的 `client_secret` 挂载 Payment Element：

```html
<div id="payment-element"></div>
<button id="submit">Subscribe</button>

<script src="https://js.stripe.com/v3/"></script>
<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements({
        clientSecret: '{{ $intent->client_secret }}'
    });

    const paymentElement = elements.create('payment');

    paymentElement.mount('#payment-element');

    document.getElementById('submit').addEventListener('click', async () => {
        const { error } = await stripe.confirmSetup({
            elements,
            confirmParams: {
                return_url: '{{ route("subscription.complete") }}',
            },
        });

        if (error) {
            // 向用户显示 "error.message"...
        }
    });
</script>
```

在 Stripe 重定向到你的 `return_url` 之后，`setup_intent` ID 将作为查询字符串参数可用。你可以使用此值来检索支付方式并创建订阅：

```php
use Illuminate\Http\Request;

Route::get('/subscription/complete', function (Request $request) {
    $setupIntent = $request->user()->findSetupIntent(
        $request->setup_intent
    );

    $paymentMethod = $setupIntent->payment_method;

    $request->user()
        ->newSubscription('default', 'price_xxx')
        ->create($paymentMethod);

    return redirect('/dashboard');
})->name('subscription.complete');
```

如果你使用 Payment Element 来更新客户的默认支付方式而不是创建订阅，则可以将支付方式标识符传递给 [`updateDefaultPaymentMethod`](#更新默认支付方式) 方法。

#### 单次收费的 Payment Element

对于一次性付款，使用 Cashier 的 `pay` 方法创建 Payment Intent。通常，你应该将 Payment Intent ID 存储在应用程序的相应订单上，以便在 Stripe 将客户重定向回你的应用程序后可以检索该订单。以下示例假定你的应用程序有一个包含 `user_id`、`amount`、`status` 和 `stripe_payment_intent_id` 列的 `Order` 模型：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $amount = 1000;

    $payment = $request->user()->pay($amount);

    $order = Order::create([
        'user_id' => $request->user()->id,
        'amount' => $amount,
        'status' => 'pending',
        'stripe_payment_intent_id' => $payment->id,
    ]);

    return view('checkout', [
        'clientSecret' => $payment->client_secret,
        'order' => $order,
    ]);
});
```

然后，挂载 Payment Element 并确认付款：

```html
<div id="payment-element"></div>
<button id="submit">Pay Now</button>

<script src="https://js.stripe.com/v3/"></script>
<script>
    const stripe = Stripe('stripe-public-key');

    const elements = stripe.elements({
        clientSecret: '{{ $clientSecret }}'
    });

    const paymentElement = elements.create('payment');

    paymentElement.mount('#payment-element');

    document.getElementById('submit').addEventListener('click', async () => {
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: '{{ route("payment.complete") }}',
            },
        });

        if (error) {
            // 向用户显示 "error.message"...
        }
    });
</script>
```

重定向后，你可以使用 `payment_intent` 查询字符串参数检索相应的订单和 Payment Intent。在履行订单之前，你应该验证订单属于经过身份验证的客户，并且 Payment Intent 属于经过身份验证的客户且已成功：

```php
use App\Models\Order;
use Illuminate\Http\Request;

Route::get('/payment/complete', function (Request $request) {
    $order = Order::where('user_id', $request->user()->id)
        ->where('stripe_payment_intent_id', $request->payment_intent)
        ->firstOrFail();

    $paymentIntent = $request->user()
        ->stripe()
        ->paymentIntents
        ->retrieve($request->payment_intent);

    if ($paymentIntent->customer === $request->user()->stripe_id &&
        $paymentIntent->status === 'succeeded') {
        $order->update(['status' => 'paid']);

        // 履行订单...
    }

    return redirect('/dashboard');
})->name('payment.complete');
```

### 检索支付方式

可计费模型实例上的 `paymentMethods` 方法返回 `Laravel\Cashier\PaymentMethod` 实例的集合：

```php
$paymentMethods = $user->paymentMethods();
```

默认情况下，此方法将返回每种类型的支付方式。要检索特定类型的支付方式，可以将 `type` 作为参数传递给该方法：

```php
$paymentMethods = $user->paymentMethods('sepa_debit');
```

要检索客户的默认支付方式，可以使用 `defaultPaymentMethod` 方法：

```php
$paymentMethod = $user->defaultPaymentMethod();
```

你可以使用 `findPaymentMethod` 方法检索附加到可计费模型的特定支付方式：

```php
$paymentMethod = $user->findPaymentMethod($paymentMethodId);
```

### 支付方式存在性

要确定可计费模型是否在其账户上附加了默认支付方式，请调用 `hasDefaultPaymentMethod` 方法：

```php
if ($user->hasDefaultPaymentMethod()) {
    // ...
}
```

你可以使用 `hasPaymentMethod` 方法来确定可计费模型是否在其账户上附加了至少一种支付方式：

```php
if ($user->hasPaymentMethod()) {
    // ...
}
```

此方法将确定可计费模型是否具有任何支付方式。要确定模型是否存在特定类型的支付方式，可以将 `type` 作为参数传递给该方法：

```php
if ($user->hasPaymentMethod('sepa_debit')) {
    // ...
}
```

### 更新默认支付方式

`updateDefaultPaymentMethod` 方法可用于更新客户的默认支付方式信息。此方法接受 Stripe 支付方式标识符，并将新的支付方式分配为默认的计费支付方式：

```php
$user->updateDefaultPaymentMethod($paymentMethod);
```

要将你的默认支付方式信息与 Stripe 中的客户默认支付方式信息同步，你可以使用 `updateDefaultPaymentMethodFromStripe` 方法：

```php
$user->updateDefaultPaymentMethodFromStripe();
```

> [!WARNING]
> 客户的默认支付方式只能用于开具发票和创建新订阅。由于 Stripe 施加的限制，它不能用于单次收费。

### 添加支付方式

要添加新的支付方式，可以在可计费模型上调用 `addPaymentMethod` 方法，传入支付方式标识符：

```php
$user->addPaymentMethod($paymentMethod);
```

> [!NOTE]
> 要了解如何检索支付方式标识符，请查看 [支付方式存储文档](#存储支付方式)。

### 删除支付方式

要删除支付方式，可以在你希望删除的 `Laravel\Cashier\PaymentMethod` 实例上调用 `delete` 方法：

```php
$paymentMethod->delete();
```

`deletePaymentMethod` 方法将从可计费模型中删除特定的支付方式：

```php
$user->deletePaymentMethod('pm_visa');
```

`deletePaymentMethods` 方法将删除可计费模型的所有支付方式信息：

```php
$user->deletePaymentMethods();
```

默认情况下，此方法将删除每种类型的支付方式。要删除特定类型的支付方式，可以将 `type` 作为参数传递给该方法：

```php
$user->deletePaymentMethods('sepa_debit');
```

> [!WARNING]
> 如果用户有有效的订阅，你的应用程序不应允许他们删除其默认支付方式。

## 订阅

订阅提供了一种为你的客户设置定期付款的方式。由 Cashier 管理的 Stripe 订阅支持多个订阅价格、订阅数量、试用期等。

### 创建订阅

要创建订阅，首先检索可计费模型的实例，通常为 `App\Models\User` 的实例。检索到模型实例后，你可以使用 `newSubscription` 方法创建模型的订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription(
        'default', 'price_monthly'
    )->create($request->paymentMethodId);

    // ...
});
```

传递给 `newSubscription` 方法的第一个参数应该是订阅的内部类型。如果你的应用程序只提供单个订阅，你可以将其称为 `default` 或 `primary`。此订阅类型仅用于内部应用程序使用，并非旨在向用户显示。此外，它不应包含空格，并且在创建订阅后永远不应更改。第二个参数是用户订阅的具体价格。此值应对应于 Stripe 中的价格标识符。

接受 [Stripe 支付方式标识符](#存储支付方式) 或 Stripe `PaymentMethod` 对象的 `create` 方法将开始订阅，并使用可计费模型的 Stripe 客户 ID 和其他相关计费信息更新你的数据库。

> [!WARNING]
> 直接将支付方式标识符传递给 `create` 订阅方法也会自动将其添加到用户的存储支付方式中。

#### 通过发票电子邮件收集定期付款

你可以指示 Stripe 在每次客户的定期付款到期时通过电子邮件向客户发送发票，而不是自动收集客户的定期付款。然后，客户可以在收到发票后手动支付发票。通过发票收集定期付款时，客户无需提前提供支付方式：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice();
```

客户在订阅被取消之前支付发票的时间由 `days_until_due` 选项决定。默认情况下，这是 30 天；但是，如果需要，你可以为此选项提供特定值：

```php
$user->newSubscription('default', 'price_monthly')->createAndSendInvoice([], [
    'days_until_due' => 30
]);
```

#### 数量

如果你想在创建订阅时为价格设置特定的 [数量](https://stripe.com/docs/billing/subscriptions/quantities)，你应该在创建订阅之前在订阅构建器上调用 `quantity` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->quantity(5)
    ->create($paymentMethod);
```

#### 其他详细信息

如果你想指定 Stripe 支持的其他 [客户](https://stripe.com/docs/api/customers/create) 或 [订阅](https://stripe.com/docs/api/subscriptions/create) 选项，可以通过将它们作为第二个和第三个参数传递给 `create` 方法来完成：

```php
$user->newSubscription('default', 'price_monthly')->create($paymentMethod, [
    'email' => $email,
], [
    'metadata' => ['note' => 'Some extra information.'],
]);
```

#### 优惠券

如果你想在创建订阅时应用优惠券，可以使用 `withCoupon` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withCoupon('code')
    ->create($paymentMethod);
```

或者，如果你想应用 [Stripe 促销码](https://stripe.com/docs/billing/subscriptions/discounts/codes)，可以使用 `withPromotionCode` 方法：

```php
$user->newSubscription('default', 'price_monthly')
    ->withPromotionCode('promo_code_id')
    ->create($paymentMethod);
```

给定的促销码 ID 应该是分配给促销码的 Stripe API ID，而不是面向客户的促销码。如果你需要根据给定的面向客户的促销码找到促销码 ID，则可以使用 `findPromotionCode` 方法：

```php
// 通过面向客户的代码查找促销码 ID...
$promotionCode = $user->findPromotionCode('SUMMERSALE');

// 通过面向客户的代码查找有效的促销码 ID...
$promotionCode = $user->findActivePromotionCode('SUMMERSALE');
```

在上面的示例中，返回的 `$promotionCode` 对象是 `Laravel\Cashier\PromotionCode` 的实例。此类装饰底层的 `Stripe\PromotionCode` 对象。你可以通过调用 `coupon` 方法检索与促销码相关的优惠券：

```php
$coupon = $user->findPromotionCode('SUMMERSALE')->coupon();
```

优惠券实例允许你确定折扣金额以及优惠券是表示固定折扣还是基于百分比的折扣：

```php
if ($coupon->isPercentage()) {
    return $coupon->percentOff().'%'; // 21.5%
} else {
    return $coupon->amountOff(); // $5.99
}
```

你还可以检索当前应用于客户或订阅的折扣：

```php
$discount = $billable->discount();

$discount = $subscription->discount();
```

返回的 `Laravel\Cashier\Discount` 实例装饰底层的 `Stripe\Discount` 对象实例。你可以通过调用 `coupon` 方法检索与此折扣相关的优惠券：

```php
$coupon = $subscription->discount()->coupon();
```

如果你想将新的优惠券或促销码应用于客户或订阅，可以通过 `applyCoupon` 或 `applyPromotionCode` 方法执行此操作：

```php
$billable->applyCoupon('coupon_id');
$billable->applyPromotionCode('promotion_code_id');

$subscription->applyCoupon('coupon_id');
$subscription->applyPromotionCode('promotion_code_id');
```

请记住，你应该使用分配给促销码的 Stripe API ID，而不是面向客户的促销码。一次只能将一个优惠券或促销码应用于给定时间点的客户或订阅。

有关此主题的更多信息，请查阅有关 [优惠券](https://stripe.com/docs/billing/subscriptions/coupons) 和 [促销码](https://stripe.com/docs/billing/subscriptions/coupons/codes) 的 Stripe 文档。

#### 添加订阅

如果你想向已具有默认支付方式的客户添加订阅，可以在订阅构建器上调用 `add` 方法：

```php
use App\Models\User;

$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->add();
```

#### 从 Stripe 仪表板创建订阅

你还可以从 Stripe 仪表板本身创建订阅。这样做时，Cashier 将同步新添加的订阅，并将 `default` 类型分配给他们。要自定义分配给仪表板创建的订阅的订阅类型，请 [定义 Webhook 事件处理程序](#定义-webhook-事件处理程序)。

此外，你只能通过 Stripe 仪表板创建一种类型的订阅。如果你的应用程序提供使用不同类型的多个订阅，则只能通过 Stripe 仪表板添加一种类型的订阅。

最后，你应该始终确保只为应用程序提供的每种订阅类型添加一个有效订阅。如果客户有两个 `default` 订阅，则 Cashier 将仅使用最近添加的订阅，即使两者都将与应用程序的数据库同步。

### 检查订阅状态

客户订阅你的应用程序后，你可以使用多种便捷方法轻松检查他们的订阅状态。首先，如果客户具有有效订阅，则 `subscribed` 方法返回 `true`，即使订阅当前在其试用期内。`subscribed` 方法将订阅类型作为其第一个参数：

```php
if ($user->subscribed('default')) {
    // ...
}
```

`subscribed` 方法也是 [路由中间件](/docs/{{version}}/middleware) 的理想选择，允许你根据用户的订阅状态过滤对路由和控制器的访问：

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
        if ($request->user() && ! $request->user()->subscribed('default')) {
            // 此用户不是付费客户...
            return redirect('/billing');
        }

        return $next($request);
    }
}
```

如果你想确定用户是否仍处于试用期内，可以使用 `onTrial` 方法。此方法对于确定是否应向用户显示他们仍处于试用期的警告非常有用：

```php
if ($user->subscription('default')->onTrial()) {
    // ...
}
```

`subscribedToProduct` 方法可用于根据给定的 Stripe 产品标识符确定用户是否订阅了给定的产品。在 Stripe 中，产品是价格的集合。在此示例中，我们将确定用户的 `default` 订阅是否有效地订阅了应用程序的"premium"产品。给定的 Stripe 产品标识符应对应于 Stripe 仪表板中你产品的一个标识符：

```php
if ($user->subscribedToProduct('prod_premium', 'default')) {
    // ...
}
```

通过将数组传递给 `subscribedToProduct` 方法，你可以确定用户的 `default` 订阅是否有效地订阅了应用程序的"basic"或"premium"产品：

```php
if ($user->subscribedToProduct(['prod_basic', 'prod_premium'], 'default')) {
    // ...
}
```

`subscribedToPrice` 方法可用于确定客户的订阅是否对应于给定的价格 ID：

```php
if ($user->subscribedToPrice('price_basic_monthly', 'default')) {
    // ...
}
```

`recurring` 方法可用于确定用户当前是否已订阅并且不再处于试用期内：

```php
if ($user->subscription('default')->recurring()) {
    // ...
}
```

> [!WARNING]
> 如果用户具有相同类型的两个订阅，则 `subscription` 方法将始终返回最近的订阅。例如，用户可能具有类型为 `default` 的两个订阅记录；但是，其中一个订阅可能是旧的、已过期的订阅，而另一个是当前的、有效的订阅。最近的订阅将始终返回，而旧的订阅将保存在数据库中以供历史审查。

#### 取消的订阅状态

要确定用户曾经是有效订阅者但已取消订阅，可以使用 `canceled` 方法：

```php
if ($user->subscription('default')->canceled()) {
    // ...
}
```

你还可以确定用户是否已取消订阅但仍处于其"宽限期"直到订阅完全过期。例如，如果用户在 3 月 5 日取消了原本计划于 3 月 10 日到期的订阅，则用户将处于其"宽限期"直到 3 月 10 日。请注意，在此期间 `subscribed` 方法仍返回 `true`：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

要确定用户是否已取消订阅并且不再处于其"宽限期"，可以使用 `ended` 方法：

```php
if ($user->subscription('default')->ended()) {
    // ...
}
```

#### 未完成和逾期状态

如果订阅在创建后需要辅助付款操作，则订阅将被标记为 `incomplete`。订阅状态存储在 Cashier 的 `subscriptions` 数据库表的 `stripe_status` 列中。

类似地，如果在交换价格时需要辅助付款操作，则订阅将被标记为 `past_due`。当你的订阅处于这些状态中的任何一种时，在客户确认其付款之前它将不会处于活动状态。可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法确定订阅是否有未完成的付款：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

当订阅有未完成的付款时，你应该将用户引导至 Cashier 的付款确认页面，并传递 `latestPayment` 标识符。你可以使用订阅实例上可用的 `latestPayment` 方法来检索此标识符：

```html
<a href="{{ route('cashier.payment', $subscription->latestPayment()->id) }}">
    Please confirm your payment.
</a>
```

如果你希望在订阅处于 `past_due` 或 `incomplete` 状态时仍将其视为有效，可以使用 Cashier 提供的 `keepPastDueSubscriptionsActive` 和 `keepIncompleteSubscriptionsActive` 方法。通常，应在 `App\Providers\AppServiceProvider` 的 `register` 方法中调用这些方法：

```php
use Laravel\Cashier\Cashier;

/**
 * 注册任何应用程序服务。
 */
public function register(): void
{
    Cashier::keepPastDueSubscriptionsActive();
    Cashier::keepIncompleteSubscriptionsActive();
}
```

> [!WARNING]
> 当订阅处于 `incomplete` 状态时，在确认付款之前无法更改。因此，当订阅处于 `incomplete` 状态时，`swap` 和 `updateQuantity` 方法将引发异常。

#### 订阅作用域

大多数订阅状态也可用作查询作用域，以便你可以轻松地查询数据库中处于给定状态的订阅：

```php
// 获取所有有效订阅...
$subscriptions = Subscription::query()->active()->get();

// 获取用户的所有已取消订阅...
$subscriptions = $user->subscriptions()->canceled()->get();
```

可用作用域的完整列表如下：

```php
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
```

### 更改价格

客户订阅你的应用程序后，他们可能偶尔希望更改为新的订阅价格。要将客户交换到新价格，请将 Stripe 价格的标识符传递给 `swap` 方法。交换价格时，假定用户希望重新激活其订阅（如果之前已取消）。给定的价格标识符应对应于 Stripe 仪表板中可用的 Stripe 价格标识符：

```php
use App\Models\User;

$user = App\Models\User::find(1);

$user->subscription('default')->swap('price_yearly');
```

如果客户处于试用期，则试用期将被维持。此外，如果订阅存在"数量"，则该数量也将被维持。

如果你想交换价格并取消客户当前正在进行的任何试用期，可以调用 `skipTrial` 方法：

```php
$user->subscription('default')
    ->skipTrial()
    ->swap('price_yearly');
```

如果你想交换价格并立即向客户开具发票，而不是等待他们的下一个计费周期，可以使用 `swapAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->swapAndInvoice('price_yearly');
```

#### 按比例分摊

默认情况下，Stripe 在交换价格时会按比例分摊费用。`noProrate` 方法可用于在不按比例分摊费用的情况下更新订阅的价格：

```php
$user->subscription('default')->noProrate()->swap('price_yearly');
```

有关订阅按比例分摊的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/billing/subscriptions/prorations)。

> [!WARNING]
> 在 `swapAndInvoice` 方法之前执行 `noProrate` 方法将对按比例分摊没有影响。始终会发出发票。

### 订阅数量

有时订阅受"数量"影响。例如，项目管理应用程序可能对每个项目每月收取 10 美元。你可以使用 `incrementQuantity` 和 `decrementQuantity` 方法轻松地增加或减少订阅数量：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->incrementQuantity();

// 将 5 添加到订阅的当前数量...
$user->subscription('default')->incrementQuantity(5);

$user->subscription('default')->decrementQuantity();

// 从订阅的当前数量中减去 5...
$user->subscription('default')->decrementQuantity(5);
```

或者，你可以使用 `updateQuantity` 方法设置特定的数量：

```php
$user->subscription('default')->updateQuantity(10);
```

`noProrate` 方法可用于在不按比例分摊费用的情况下更新订阅的数量：

```php
$user->subscription('default')->noProrate()->updateQuantity(10);
```

有关订阅数量的更多信息，请查阅 [Stripe 文档](https://stripe.com/docs/subscriptions/quantities)。

#### 多产品订阅的数量

如果你的订阅是 [多产品订阅](#多产品订阅)，则应将你希望增加或减少数量的价格的 ID 作为第二个参数传递给 increment / decrement 方法：

```php
$user->subscription('default')->incrementQuantity(1, 'price_chat');
```

### 多产品订阅

[多产品订阅](https://stripe.com/docs/billing/subscriptions/multiple-products) 允许你将多个计费产品分配给单个订阅。例如，假设你正在构建一个客户服务"helpdesk"应用程序，其基本订阅价格为每月 10 美元，但提供每月额外 15 美元的实时聊天附加产品。多产品订阅的信息存储在 Cashier 的 `subscription_items` 数据库表中。

你可以通过将价格数组作为第二个参数传递给 `newSubscription` 方法来为给定订阅指定多个产品：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', [
        'price_monthly',
        'price_chat',
    ])->create($request->paymentMethodId);

    // ...
});
```

在上面的示例中，客户将在其 `default` 订阅上附加两个价格。两个价格都将在其各自的计费间隔内收费。如果需要，你可以使用 `quantity` 方法为每个价格指示特定的数量：

```php
$user = User::find(1);

$user->newSubscription('default', ['price_monthly', 'price_chat'])
    ->quantity(5, 'price_chat')
    ->create($paymentMethod);
```

如果你想向现有订阅添加另一个价格，可以调用订阅的 `addPrice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat');
```

上面的示例将添加新价格，客户将在其下一个计费周期中为其计费。如果你想立即向客户计费，可以使用 `addPriceAndInvoice` 方法：

```php
$user->subscription('default')->addPriceAndInvoice('price_chat');
```

如果你想添加具有特定数量的价格，可以将数量作为第二个参数传递给 `addPrice` 或 `addPriceAndInvoice` 方法：

```php
$user = User::find(1);

$user->subscription('default')->addPrice('price_chat', 5);
```

你可以使用 `removePrice` 方法从订阅中删除价格：

```php
$user->subscription('default')->removePrice('price_chat');
```

> [!WARNING]
> 你不能删除订阅上的最后一个价格。相反，你应该简单地取消订阅。

#### 交换价格

你还可以更改附加到具有多个产品的订阅的价格。例如，假设客户具有 `price_basic` 订阅和 `price_chat` 附加产品，并且你希望将客户从 `price_basic` 升级到 `price_pro` 价格：

```php
use App\Models\User;

$user = User::find(1);

$user->subscription('default')->swap(['price_pro', 'price_chat']);
```

执行上面的示例时，将删除具有 `price_basic` 的底层订阅项目，并保留具有 `price_chat` 的项目。此外，将为 `price_pro` 创建一个新的订阅项目。

你还可以通过将键/值对数组传递给 `swap` 方法来指定订阅项目选项。例如，你可能需要指定订阅价格数量：

```php
$user = User::find(1);

$user->subscription('default')->swap([
    'price_pro' => ['quantity' => 5],
    'price_chat'
]);
```

如果要交换订阅上的单个价格，可以对订阅项目本身使用 `swap` 方法。如果你希望保留订阅其他价格上的所有现有元数据，则此方法特别有用：

```php
$user = User::find(1);

$user->subscription('default')
    ->findItemOrFail('price_basic')
    ->swap('price_pro');
```

#### 按比例分摊

默认情况下，Stripe 在添加或删除多产品订阅中的价格时会按比例分摊费用。如果你想在没有按比例分摊的情况下进行价格调整，则应将 `noProrate` 方法链接到你的价格操作上：

```php
$user->subscription('default')->noProrate()->removePrice('price_chat');
```

#### 数量

如果你想更新各个订阅价格上的数量，可以通过使用 [现有数量方法](#订阅数量) 并将价格的 ID 作为附加参数传递给该方法来完成此操作：

```php
$user = User::find(1);

$user->subscription('default')->incrementQuantity(5, 'price_chat');

$user->subscription('default')->decrementQuantity(3, 'price_chat');

$user->subscription('default')->updateQuantity(10, 'price_chat');
```

> [!WARNING]
> 当订阅具有多个价格时，`Subscription` 模型上的 `stripe_price` 和 `quantity` 属性将为 `null`。要访问各个价格属性，应使用 `Subscription` 模型上可用的 `items` 关系。

#### 订阅项目

当订阅具有多个价格时，它将在数据库的 `subscription_items` 表中存储多个订阅"项目"。你可以通过订阅上的 `items` 关系访问它们：

```php
use App\Models\User;

$user = User::find(1);

$subscriptionItem = $user->subscription('default')->items->first();

// 检索特定项目的 Stripe 价格和数量...
$stripePrice = $subscriptionItem->stripe_price;
$quantity = $subscriptionItem->quantity;
```

你还可以使用 `findItemOrFail` 方法检索特定价格：

```php
$user = User::find(1);

$subscriptionItem = $user->subscription('default')->findItemOrFail('price_chat');
```

### 多个订阅

Stripe 允许你的客户同时拥有多个订阅。例如，你可以经营一个提供游泳订阅和举重订阅的健身房，每个订阅可能有不同的定价。当然，客户应该能够订阅任一或两个计划。

当你的应用程序创建订阅时，你可以将订阅类型提供给 `newSubscription` 方法。该类型可以是表示用户正在启动的订阅类型的任何字符串：

```php
use Illuminate\Http\Request;

Route::post('/swimming/subscribe', function (Request $request) {
    $request->user()->newSubscription('swimming')
        ->price('price_swimming_monthly')
        ->create($request->paymentMethodId);

    // ...
});
```

在此示例中，我们为客户启动了每月游泳订阅。但是，他们可能希望稍后更改为年度订阅。调整客户的订阅时，我们可以简单地交换 `swimming` 订阅上的价格：

```php
$user->subscription('swimming')->swap('price_swimming_yearly');
```

当然，你也可以完全取消订阅：

```php
$user->subscription('swimming')->cancel();
```

### 基于使用量的计费

[基于使用量的计费](https://stripe.com/docs/billing/subscriptions/metered-billing) 允许你根据客户在计费周期内的产品使用量向他们收费。例如，你可以根据客户每月发送的短信或电子邮件数量向他们收费。

要开始使用使用量计费，你首先需要在 Stripe 仪表板中使用 [基于使用量的计费模型](https://docs.stripe.com/billing/subscriptions/usage-based/implementation-guide) 和 [计量器](https://docs.stripe.com/billing/subscriptions/usage-based/recording-usage#configure-meter) 创建一个新产品。创建计量器后，存储相关的事件名称和计量器 ID，你将需要这些来报告和检索使用情况。然后，使用 `meteredPrice` 方法将计量价格 ID 添加到客户订阅：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default')
        ->meteredPrice('price_metered')
        ->create($request->paymentMethodId);

    // ...
});
```

你还可以通过 [Stripe Checkout](#checkout) 启动计量订阅：

```php
$checkout = Auth::user()
    ->newSubscription('default', [])
    ->meteredPrice('price_metered')
    ->checkout();

return view('your-checkout-view', [
    'checkout' => $checkout,
]);
```

#### 报告使用量

当你的客户使用你的应用程序时，你将向 Stripe 报告他们的使用情况，以便他们可以准确地计费。要报告计量事件的使用情况，你可以使用 `Billable` 模型上的 `reportMeterEvent` 方法：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent');
```

默认情况下，将"使用量数量"为 1 添加到计费周期。或者，你可以传递要在计费周期内添加到客户使用量的特定"使用量"：

```php
$user = User::find(1);

$user->reportMeterEvent('emails-sent', quantity: 15);
```

要检索客户的计量事件摘要，你可以使用 `Billable` 实例的 `meterEventSummaries` 方法：

```php
$user = User::find(1);

$meterUsage = $user->meterEventSummaries($meterId);

$meterUsage->first()->aggregated_value // 10
```

有关计量事件摘要的更多信息，请参阅 Stripe 的 [计量事件摘要对象文档](https://docs.stripe.com/api/billing/meter-event_summary/object)。

要 [列出所有计量器](https://docs.stripe.com/api/billing/meter/list)，你可以使用 `Billable` 实例的 `meters` 方法：

```php
$user = User::find(1);

$user->meters();
```

### 订阅税务

> [!WARNING]
> 你可以 [使用 Stripe Tax 自动计算税款](#税务配置)，而不是手动计算税率。

要指定用户在订阅上支付的税率，你应该在可计费模型上实现 `taxRates` 方法，并返回一个包含 Stripe 税率 ID 的数组。你可以在 [你的 Stripe 仪表板](https://dashboard.stripe.com/test/tax-rates) 中定义这些税率：

```php
/**
 * 应适用于客户订阅的税率。
 *
 * @return array<int, string>
 */
public function taxRates(): array
{
    return ['txr_id'];
}
```

`taxRates` 方法使你能够按客户逐个应用税率，这对于跨多个国家和税率的用户群可能有所帮助。

如果你提供多产品订阅，则可以通过在可计费模型上实现 `priceTaxRates` 方法为每个价格定义不同的税率：

```php
/**
 * 应适用于客户订阅的税率。
 *
 * @return array<string, array<int, string>>
 */
public function priceTaxRates(): array
{
    return [
        'price_monthly' => ['txr_id'],
    ];
}
```

> [!WARNING]
> `taxRates` 方法仅适用于订阅费用。如果你使用 Cashier 进行"单次"收费，则需要在那个时候手动指定税率。

#### 同步税率

当更改 `taxRates` 方法返回的硬编码税率 ID 时，用户任何现有订阅的税率设置将保持不变。如果你希望使用新的 `taxRates` 值更新现有订阅的税率值，则应调用用户订阅实例上的 `syncTaxRates` 方法：

```php
$user->subscription('default')->syncTaxRates();
```

这也会同步多产品订阅的任何项目税率。如果你的应用程序提供多产品订阅，你应该确保你的可计费模型实现了 [上面讨论](#订阅税务) 的 `priceTaxRates` 方法。

#### 免税

Cashier 还提供 `isNotTaxExempt`、`isTaxExempt` 和 `reverseChargeApplies` 方法来确定客户是否免税。这些方法将调用 Stripe API 来确定客户的免税状态：

```php
use App\Models\User;

$user = User::find(1);

$user->isTaxExempt();
$user->isNotTaxExempt();
$user->reverseChargeApplies();
```

> [!WARNING]
> 这些方法在任何 `Laravel\Cashier\Invoice` 对象上也可用。但是，在 `Invoice` 对象上调用时，这些方法将确定创建发票时的免税状态。

### 订阅锚定日期

默认情况下，计费周期锚定日期是创建订阅的日期，或者如果使用试用期，则为试用期结束的日期。如果你想修改计费锚定日期，可以使用 `anchorBillingCycleOn` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $anchor = Carbon::parse('first day of next month');

    $request->user()->newSubscription('default', 'price_monthly')
        ->anchorBillingCycleOn($anchor->startOfDay())
        ->create($request->paymentMethodId);

    // ...
});
```

有关管理订阅计费周期的更多信息，请查阅 [Stripe 计费周期文档](https://stripe.com/docs/billing/subscriptions/billing-cycle)。

### 取消订阅

要取消订阅，请在用户的订阅上调用 `cancel` 方法：

```php
$user->subscription('default')->cancel();
```

当订阅被取消时，Cashier 将自动设置 `subscriptions` 数据库表中的 `ends_at` 列。此列用于知道 `subscribed` 方法何时应开始返回 `false`。

例如，如果客户在 3 月 1 日取消了订阅，但订阅计划直到 3 月 5 日才结束，则 `subscribed` 方法将继续返回 `true` 直到 3 月 5 日。之所以这样做，是因为用户通常被允许继续使用应用程序直到其计费周期结束。

你可以使用 `onGracePeriod` 方法确定用户是否已取消订阅但仍处于其"宽限期"：

```php
if ($user->subscription('default')->onGracePeriod()) {
    // ...
}
```

如果你希望立即取消订阅，请在用户的订阅上调用 `cancelNow` 方法：

```php
$user->subscription('default')->cancelNow();
```

如果你希望立即取消订阅并为任何剩余的未计费计量使用或新的/待处理的按比例分摊发票项目开具发票，请在用户的订阅上调用 `cancelNowAndInvoice` 方法：

```php
$user->subscription('default')->cancelNowAndInvoice();
```

你还可以选择按特定时间点取消订阅：

```php
$user->subscription('default')->cancelAt(
    now()->plus(days: 10)
);
```

最后，你应该始终在删除关联的用户模型之前取消用户订阅：

```php
$user->subscription('default')->cancelNow();

$user->delete();
```

### 恢复订阅

如果客户已取消订阅，并且你希望恢复它，则可以在订阅上调用 `resume` 方法。客户必须仍处于其"宽限期"内才能恢复订阅：

```php
$user->subscription('default')->resume();
```

如果客户取消订阅，然后在订阅完全过期之前恢复该订阅，则不会立即向客户收费。相反，他们的订阅将被重新激活，并将按原始计费周期计费。

## 订阅试用期

### 提前收集支付方式

如果你想在向客户提供试用期的同时仍然提前收集支付方式信息，则应在创建订阅时使用 `trialDays` 方法：

```php
use Illuminate\Http\Request;

Route::post('/user/subscribe', function (Request $request) {
    $request->user()->newSubscription('default', 'price_monthly')
        ->trialDays(10)
        ->create($request->paymentMethodId);

    // ...
});
```

此方法将在数据库内的订阅记录上设置试用期结束日期，并指示 Stripe 在此日期之前不开始向客户计费。使用 `trialDays` 方法时，Cashier 将覆盖为 Stripe 中的价格配置的任何默认试用期。

> [!WARNING]
> 如果客户的订阅在试用期结束日期之前未被取消，他们将在试用期到期后立即被扣款，因此你应确保通知用户其试用期结束日期。

`trialUntil` 方法允许你提供指定试用期应何时结束的 `DateTime` 实例：

```php
use Illuminate\Support\Carbon;

$user->newSubscription('default', 'price_monthly')
    ->trialUntil(Carbon::now()->plus(days: 10))
    ->create($paymentMethod);
```

你可以使用用户实例的 `onTrial` 方法或订阅实例的 `onTrial` 方法确定用户是否处于试用期内。下面的两个示例是等效的：

```php
if ($user->onTrial('default')) {
    // ...
}

if ($user->subscription('default')->onTrial()) {
    // ...
}
```

你可以使用 `endTrial` 方法立即结束订阅试用期：

```php
$user->subscription('default')->endTrial();
```

要确定现有试用期是否已过期，你可以使用 `hasExpiredTrial` 方法：

```php
if ($user->hasExpiredTrial('default')) {
    // ...
}

if ($user->subscription('default')->hasExpiredTrial()) {
    // ...
}
```

#### 在 Stripe / Cashier 中定义试用天数

你可以选择在 Stripe 仪表板中定义价格应接收的试用天数，或者始终使用 Cashier 显式传递它们。如果你选择在 Stripe 中定义价格的试用天数，则应注意，新的订阅（包括过去订阅过订阅的客户的订阅）将始终收到试用期，除非你显式调用 `skipTrial()` 方法。

### 不提前收集支付方式

如果你想在不提前收集用户的支付方式信息的情况下提供试用期，则可以将用户记录上的 `trial_ends_at` 列设置为你希望的试用期结束日期。这通常在用户注册期间完成：

```php
use App\Models\User;

$user = User::create([
    // ...
    'trial_ends_at' => now()->plus(days: 10),
]);
```

> [!WARNING]
> 确保在可计费模型的类定义中为 `trial_ends_at` 属性添加 [日期转换](/docs/{{version}}/eloquent-mutators#date-casting)。

Cashier 将此类试用称为"通用试用"，因为它未附加到任何现有订阅。如果当前日期未超过 `trial_ends_at` 的值，则可计费模型实例上的 `onTrial` 方法将返回 `true`：

```php
if ($user->onTrial()) {
    // 用户处于试用期内...
}
```

一旦准备好为用户创建实际订阅，你可以像往常一样使用 `newSubscription` 方法：

```php
$user = User::find(1);

$user->newSubscription('default', 'price_monthly')->create($paymentMethod);
```

要检索用户的试用期结束日期，你可以使用 `trialEndsAt` 方法。如果用户正在试用，此方法将返回 Carbon 日期实例；如果没有，则返回 `null`。如果你希望获取特定订阅（而非默认订阅）的试用期结束日期，则还可以传递可选的订阅类型参数：

```php
if ($user->onTrial()) {
    $trialEndsAt = $user->trialEndsAt('main');
}
```

如果你希望明确知道用户处于其"通用"试用期内并且尚未创建实际订阅，则还可以使用 `onGenericTrial` 方法：

```php
if ($user->onGenericTrial()) {
    // 用户处于其"通用"试用期内...
}
```

### 延长试用期

`extendTrial` 方法允许你在创建订阅后延长订阅的试用期。如果试用期已过期并且客户已为订阅付费，你仍然可以向他们提供延长试用期。在试用期内花费的时间将从客户的下一张发票中扣除：

```php
use App\Models\User;

$subscription = User::find(1)->subscription('default');

// 从现在起 7 天结束试用期...
$subscription->extendTrial(
    now()->plus(days: 7)
);

// 为试用期再添加 5 天...
$subscription->extendTrial(
    $subscription->trial_ends_at->plus(days: 5)
);
```

## 处理 Stripe Webhook

> [!NOTE]
> 你可以使用 [Stripe CLI](https://stripe.com/docs/stripe-cli) 在本地开发期间帮助测试 Webhook。

Stripe 可以通过 Webhook 通知你的应用程序发生的各种事件。默认情况下，指向 Cashier 的 Webhook 控制器的路由由 Cashier 服务提供者自动注册。此控制器将处理所有传入的 Webhook 请求。

默认情况下，Cashier Webhook 控制器将自动处理取消具有太多失败扣款的订阅（由你的 Stripe 设置定义）、客户更新、客户删除、订阅更新和支付方式更改；但是，正如我们很快将发现的，你可以扩展此控制器以处理你喜欢的任何 Stripe Webhook 事件。

为确保你的应用程序能够处理 Stripe Webhook，请确保在 Stripe 控制面板中配置 Webhook URL。默认情况下，Cashier 的 Webhook 控制器响应 `/stripe/webhook` URL 路径。你应在 Stripe 控制面板中启用的所有 Webhook 的完整列表为：

- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.updated`
- `customer.deleted`
- `payment_method.automatically_updated`
- `invoice.payment_action_required`
- `invoice.payment_succeeded`

为方便起见，Cashier 包含一个 `cashier:webhook` Artisan 命令。此命令将在 Stripe 中创建一个 Webhook，监听 Cashier 所需的所有事件：

```shell
php artisan cashier:webhook
```

默认情况下，创建的 Webhook 将指向由 `APP_URL` 环境变量和 Cashier 附带的 `cashier.webhook` 路由定义的 URL。如果你想使用不同的 URL，可以在调用命令时提供 `--url` 选项：

```shell
php artisan cashier:webhook --url "https://example.com/stripe/webhook"
```

创建的 Webhook 将使用你的 Cashier 版本兼容的 Stripe API 版本。如果你想使用不同的 Stripe 版本，可以提供 `--api-version` 选项：

```shell
php artisan cashier:webhook --api-version="2019-12-03"
```

创建后，Webhook 将立即处于活动状态。如果你希望创建 Webhook 但将其禁用直到你准备好，可以在调用命令时提供 `--disabled` 选项：

```shell
php artisan cashier:webhook --disabled
```

> [!WARNING]
> 确保用 Cashier 包含的 [Webhook 签名验证](#验证-webhook-签名) 中间件保护传入的 Stripe Webhook 请求。

#### Webhook 和 CSRF 保护

由于 Stripe Webhook 需要绕过 Laravel 的 [CSRF 保护](/docs/{{version}}/csrf)，因此应确保 Laravel 不会尝试验证传入的 Stripe Webhook 的 CSRF 令牌。为此，你应在应用程序的 `bootstrap/app.php` 文件中将 `stripe/*` 从 CSRF 保护中排除：

```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->preventRequestForgery(except: [
        'stripe/*',
    ]);
})
```

### 定义 Webhook 事件处理程序

Cashier 自动处理失败的订阅取消和其他常见的 Stripe Webhook 事件。但是，如果你有其他需要处理的 Webhook 事件，你可以通过监听 Cashier 调度的以下事件来执行此操作：

- `Laravel\Cashier\Events\WebhookReceived`
- `Laravel\Cashier\Events\WebhookHandled`

这两个事件都包含 Stripe Webhook 的完整负载。例如，如果你希望处理 `invoice.payment_succeeded` Webhook，你可以注册一个 [监听器](/docs/{{version}}/events#defining-listeners) 来处理该事件：

```php
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
            // 处理传入的事件...
        }
    }
}
```

### 验证 Webhook 签名

要保护你的 Webhook，你可以使用 [Stripe 的 Webhook 签名](https://stripe.com/docs/webhooks/signatures)。为方便起见，Cashier 自动包含一个中间件，用于验证传入的 Stripe Webhook 请求是否有效。

要启用 Webhook 验证，请确保在你的应用程序的 `.env` 文件中设置了 `STRIPE_WEBHOOK_SECRET` 环境变量。Webhook 的 `secret` 可以从你的 Stripe 账户仪表板中获取。

## 单次收费

### 简单收费

如果你想使用支付方式标识符对客户进行一次性扣款，可以使用可计费模型实例上的 `charge` 方法。如果你需要在处理一次性扣款之前从客户那里收集支付详细信息，请参阅 [单次收费的 Payment Element](#单次收费的-payment-element) 文档：

```php
use Illuminate\Http\Request;

Route::post('/purchase', function (Request $request) {
    $payment = $request->user()->charge(
        100, $request->paymentMethodId
    );

    // ...
});
```

`charge` 方法接受一个数组作为其第三个参数，允许你将任何你希望的选项传递给底层 Stripe Payment Intent 创建。有关创建 Payment Intent 时可用选项的更多信息，请参阅 [Stripe 文档](https://stripe.com/docs/api/payment_intents/create)：

```php
$user->charge(100, $paymentMethod, [
    'custom_option' => $value,
]);
```

你还可以在没有底层客户或用户的情况下使用 `charge` 方法。为此，在应用程序的可计费模型的新实例上调用 `charge` 方法：

```php
use App\Models\User;

$payment = (new User)->charge(100, $paymentMethod);
```

如果扣款失败，`charge` 方法将引发异常。如果扣款成功，将从该方法返回一个 `Laravel\Cashier\Payment` 实例：

```php
try {
    $payment = $user->charge(100, $paymentMethod);
} catch (Exception $e) {
    // ...
}
```

> [!WARNING]
> `charge` 方法以你的应用程序使用的货币的最小计量单位接受付款金额。例如，如果客户以美元付款，则应以美分指定金额。

### 带发票的收费

有时你可能需要进行一次性扣款并向客户提供 PDF 发票。`invoicePrice` 方法可以让你执行此操作。例如，让我们向客户开具 5 件新衬衫的发票：

```php
$user->invoicePrice('price_tshirt', 5);
```

发票将立即从用户的默认支付方式扣款。`invoicePrice` 方法还接受一个数组作为其第三个参数。此数组包含发票项目的计费选项。该方法接受的第四个参数也是一个数组，应包含发票本身的计费选项：

```php
$user->invoicePrice('price_tshirt', 5, [
    'discounts' => [
        ['coupon' => 'SUMMER21SALE']
    ],
], [
    'default_tax_rates' => ['txr_id'],
]);
```

与 `invoicePrice` 类似，你可以使用 `tabPrice` 方法通过将多个项目（每个发票最多 250 个项目）添加到客户的"tab"中，然后向客户开具发票，来创建一次性扣款。例如，我们可以向客户开具 5 件衬衫和 2 个马克杯的发票：

```php
$user->tabPrice('price_tshirt', 5);
$user->tabPrice('price_mug', 2);
$user->invoice();
```

或者，你可以使用 `invoiceFor` 方法对客户的默认支付方式进行"单次"扣款：

```php
$user->invoiceFor('One Time Fee', 500);
```

虽然 `invoiceFor` 方法可供你使用，但建议你在预定义价格中使用 `invoicePrice` 和 `tabPrice` 方法。这样做将使你能够访问 Stripe 仪表板中有关按产品分类的销售的更好分析和数据。

> [!WARNING]
> `invoice`、`invoicePrice` 和 `invoiceFor` 方法将创建一个 Stripe 发票，该发票将重试失败的计费尝试。如果你希望发票不重试失败的扣款，则需要在第一次失败扣款后使用 Stripe API 关闭它们。

### 创建 Payment Intent

你可以通过在可计费模型实例上调用 `pay` 方法来创建新的 Stripe Payment Intent。调用此方法将创建一个包装在 `Laravel\Cashier\Payment` 实例中的 Payment Intent：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->pay(
        $request->get('amount')
    );

    return $payment->client_secret;
});
```

创建 Payment Intent 后，你可以将 client secret 返回到应用程序的前端，以便用户可以在其浏览器中完成付款。要详细了解如何使用 Stripe Payment Intent 构建整个付款流程，请查阅 [Stripe 文档](https://stripe.com/docs/payments/accept-a-payment?platform=web)。

使用 `pay` 方法时，Stripe 仪表板中启用的默认支付方式将可供客户使用。或者，如果你只希望允许使用某些特定的支付方式，则可以使用 `payWith` 方法：

```php
use Illuminate\Http\Request;

Route::post('/pay', function (Request $request) {
    $payment = $request->user()->payWith(
        $request->get('amount'), ['card', 'bancontact']
    );

    return $payment->client_secret;
});
```

> [!WARNING]
> `pay` 和 `payWith` 方法以你的应用程序使用的货币的最小计量单位接受付款金额。例如，如果客户以美元付款，则应以美分指定金额。

### 退还扣款

如果你需要退还 Stripe 付款，可以使用 `refund` 方法。此方法接受 Stripe Payment Intent ID 作为其第一个参数：

```php
$payment = $user->charge(100, $paymentMethodId);

$user->refund($payment->id);
```

## 发票

### 检索发票

你可以使用 `invoices` 方法轻松检索可计费模型的发票数组。`invoices` 方法返回 `Laravel\Cashier\Invoice` 实例的集合：

```php
$invoices = $user->invoices();
```

如果你希望在结果中包括待处理的发票，可以使用 `invoicesIncludingPending` 方法：

```php
$invoices = $user->invoicesIncludingPending();
```

你可以使用 `findInvoice` 方法通过其 ID 检索特定发票：

```php
$invoice = $user->findInvoice($invoiceId);
```

#### 显示发票信息

列出客户的发票时，你可以使用发票的方法显示相关的发票信息。例如，你可能希望在表格中列出每个发票，允许用户轻松下载其中的任何一个：

```blade
<table>
    @foreach ($invoices as $invoice)
        <tr>
            <td>{{ $invoice->date()->toFormattedDateString() }}</td>
            <td>{{ $invoice->total() }}</td>
            <td><a href="/user/invoice/{{ $invoice->id }}">Download</a></td>
        </tr>
    @endforeach
</table>
```

### 即将到来的发票

要检索客户的即将到来的发票，可以使用 `upcomingInvoice` 方法：

```php
$invoice = $user->upcomingInvoice();
```

类似地，如果客户有多个订阅，你还可以检索特定订阅的即将到来的发票：

```php
$invoice = $user->subscription('default')->upcomingInvoice();
```

### 预览订阅发票

使用 `previewInvoice` 方法，你可以在进行价格更改之前预览发票。这将允许你确定在进行给定价格更改时客户的发票将是什么样子：

```php
$invoice = $user->subscription('default')->previewInvoice('price_yearly');
```

你还可以将价格数组传递给 `previewInvoice` 方法，以便预览具有多个新价格的发票：

```php
$invoice = $user->subscription('default')->previewInvoice(['price_yearly', 'price_metered']);
```

### 生成发票 PDF

在生成发票 PDF 之前，你应使用 Composer 安装 Dompdf 库，这是 Cashier 的默认发票渲染器：

```shell
composer require dompdf/dompdf
```

从路由或控制器内部，你可以使用 `downloadInvoice` 方法生成给定发票的 PDF 下载。此方法将自动生成下载发票所需的正确 HTTP 响应：

```php
use Illuminate\Http\Request;

Route::get('/user/invoice/{invoice}', function (Request $request, string $invoiceId) {
    return $request->user()->downloadInvoice($invoiceId);
});
```

默认情况下，发票上的所有数据均派生自 Stripe 中存储的客户和发票数据。文件名基于你的 `app.name` 配置值。但是，你可以通过将数组作为第二个参数提供给 `downloadInvoice` 方法来自定义其中一些数据。此数组允许你自定义你的公司和产品详细信息等信息：

```php
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
```

`downloadInvoice` 方法还允许通过其第三个参数使用自定义文件名。此文件名将自动以 `.pdf` 为后缀：

```php
return $request->user()->downloadInvoice($invoiceId, [], 'my-invoice');
```

#### 自定义发票渲染器

Cashier 还允许使用自定义发票渲染器。默认情况下，Cashier 使用 `DompdfInvoiceRenderer` 实现，该实现利用 [dompdf](https://github.com/dompdf/dompdf) PHP 库生成 Cashier 的发票。但是，你可以通过实现 `Laravel\Cashier\Contracts\InvoiceRenderer` 接口来使用你希望的任何渲染器。例如，你可能希望使用对第三方 PDF 渲染服务的 API 调用来渲染发票 PDF：

```php
use Illuminate\Support\Facades\Http;
use Laravel\Cashier\Contracts\InvoiceRenderer;
use Laravel\Cashier\Invoice;

class ApiInvoiceRenderer implements InvoiceRenderer
{
    /**
     * 渲染给定的发票并返回原始 PDF 字节。
     */
    public function render(Invoice $invoice, array $data = [], array $options = []): string
    {
        $html = $invoice->view($data)->render();

        return Http::get('https://example.com/html-to-pdf', ['html' => $html])->get()->body();
    }
}
```

实现发票渲染器契约后，你应在应用程序的 `config/cashier.php` 配置文件中更新 `cashier.invoices.renderer` 配置值。此配置值应设置为自定义渲染器实现的类名。

## Checkout

Cashier Stripe 还支持 [Stripe Checkout](https://stripe.com/payments/checkout)。Stripe Checkout 通过提供预构建的托管付款页面，让你免去实现自定义付款页面的麻烦。

以下文档包含有关如何开始使用 Stripe Checkout 与 Cashier 的信息。要详细了解 Stripe Checkout，你还应考虑查看 [Stripe 自己的 Checkout 文档](https://stripe.com/docs/payments/checkout)。

### 产品 Checkout

你可以使用可计费模型上的 `checkout` 方法对在 Stripe 仪表板中创建的现有产品执行 Checkout。`checkout` 方法将启动一个新的 Stripe Checkout 会话。默认情况下，你需要传递 Stripe 价格 ID：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout('price_tshirt');
});
```

如果需要，你还可以指定产品数量：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 15]);
});
```

当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面。默认情况下，当用户成功完成或取消购买时，他们将被重定向到你的 `home` 路由位置，但你可以使用 `success_url` 和 `cancel_url` 选项指定自定义回调 URL：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()->checkout(['price_tshirt' => 1], [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

定义你的 `success_url` Checkout 选项时，你可以指示 Stripe 在调用你的 URL 时将 Checkout 会话 ID 添加为查询字符串参数。为此，将字面字符串 `{CHECKOUT_SESSION_ID}` 添加到你的 `success_url` 查询字符串中。Stripe 将使用实际的 Checkout 会话 ID 替换此占位符：

```php
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
```

#### 促销码

默认情况下，Stripe Checkout 不允许 [用户兑换促销码](https://stripe.com/docs/billing/subscriptions/discounts/codes)。幸运的是，有一种简单的方法可以为你的 Checkout 页面启用这些功能。为此，你可以调用 `allowPromotionCodes` 方法：

```php
use Illuminate\Http\Request;

Route::get('/product-checkout', function (Request $request) {
    return $request->user()
        ->allowPromotionCodes()
        ->checkout('price_tshirt');
});
```

### 单次 Checkout

你还可以针对未在你的 Stripe 仪表板中创建的临时产品执行简单扣款。为此，你可以使用可计费模型上的 `checkoutCharge` 方法，并将其传递给可扣款金额、产品名称和可选数量。当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/charge-checkout', function (Request $request) {
    return $request->user()->checkoutCharge(1200, 'T-Shirt', 5);
});
```

> [!WARNING]
> 使用 `checkoutCharge` 方法时，Stripe 将始终在你的 Stripe 仪表板中创建一个新产品和价格。因此，我们建议你预先在 Stripe 仪表板中创建产品并改用 `checkout` 方法。

### 订阅 Checkout

> [!WARNING]
> 使用 Stripe Checkout 进行订阅需要你在 Stripe 仪表板中启用 `customer.subscription.created` Webhook。此 Webhook 将在你的数据库中创建订阅记录并存储所有相关的订阅项目。

你还可以使用 Stripe Checkout 启动订阅。使用 Cashier 的订阅构建器方法定义订阅后，你可以调用 `checkout` 方法。当客户访问此路由时，他们将被重定向到 Stripe 的 Checkout 页面：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout();
});
```

与产品 Checkout 一样，你可以自定义成功和取消 URL：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->checkout([
            'success_url' => route('your-success-route'),
            'cancel_url' => route('your-cancel-route'),
        ]);
});
```

当然，你还可以为订阅 Checkout 启用促销码：

```php
use Illuminate\Http\Request;

Route::get('/subscription-checkout', function (Request $request) {
    return $request->user()
        ->newSubscription('default', 'price_monthly')
        ->allowPromotionCodes()
        ->checkout();
});
```

> [!WARNING]
> 不幸的是，Stripe Checkout 在启动订阅时不支持所有订阅计费选项。在订阅构建器上使用 `anchorBillingCycleOn` 方法、设置按比例分摊行为或设置付款行为将在 Stripe Checkout 会话期间没有任何效果。请查阅 [Stripe Checkout Session API 文档](https://stripe.com/docs/api/checkout/sessions/create) 以查看哪些参数可用。

#### Stripe Checkout 和试用期

当然，你可以在使用 Stripe Checkout 完成的订阅构建中定义试用期：

```php
$checkout = Auth::user()->newSubscription('default', 'price_monthly')
    ->trialDays(3)
    ->checkout();
```

但是，试用期必须至少为 48 小时，这是 Stripe Checkout 支持的最短试用期。

#### 订阅和 Webhook

请记住，Stripe 和 Cashier 通过 Webhook 更新订阅状态，因此当客户输入其付款信息并返回应用程序时，订阅可能尚未有效。要处理这种情况，你可能希望显示一条消息，通知用户他们的付款或订阅正在等待中。

### 收集税号

Checkout 还支持收集客户的税号。要在 Checkout 会话上启用此功能，请在创建会话时调用 `collectTaxIds` 方法：

```php
$checkout = $user->collectTaxIds()->checkout('price_tshirt');
```

调用此方法后，将向客户提供一个新的复选框，使他们能够指明他们是否以公司身份购买。如果是这样，他们将有机会提供其税号。

> [!WARNING]
> 如果你已在应用程序的服务提供者中配置了 [自动税款收集](#税务配置)，则此功能将自动启用，无需调用 `collectTaxIds` 方法。

### 访客 Checkout

使用 `Checkout::guest` 方法，你可以为没有"账户"的应用程序访客启动 Checkout 会话：

```php
use Illuminate\Http\Request;
use Laravel\Cashier\Checkout;

Route::get('/product-checkout', function (Request $request) {
    return Checkout::guest()->create('price_tshirt', [
        'success_url' => route('your-success-route'),
        'cancel_url' => route('your-cancel-route'),
    ]);
});
```

与为现有用户创建 Checkout 会话时类似，你可以利用 `Laravel\Cashier\CheckoutBuilder` 实例上可用的其他方法来自定义访客 Checkout 会话：

```php
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
```

在访客 Checkout 完成后，Stripe 可以调度 `checkout.session.completed` Webhook 事件，因此请确保 [配置你的 Stripe Webhook](https://dashboard.stripe.com/webhooks) 以实际将此事件发送到你的应用程序。在 Stripe 仪表板中启用 Webhook 后，你可以 [使用 Cashier 处理 Webhook](#处理-stripe-webhook)。Webhook 有效负载中包含的对象将是 [Checkout 对象](https://stripe.com/docs/api/checkout/sessions/object)，你可以检查该对象以履行客户的订单。

## 处理失败的支付

有时，订阅或单次扣款的付款可能会失败。发生这种情况时，Cashier 将引发 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，告知你已发生此情况。捕获此异常后，你有两种选择可以继续。

首先，你可以将客户重定向到 Cashier 附带的专用付款确认页面。此页面已具有通过 Cashier 的服务提供者注册的关联命名路由。因此，你可以捕获 `IncompletePayment` 异常并将用户重定向到付款确认页面：

```php
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
```

在付款确认页面上，将提示客户再次输入其信用卡信息并执行 Stripe 所需的任何其他操作，例如"3D Secure"确认。确认付款后，用户将被重定向到上面 `redirect` 参数提供的 URL。重定向后，`message`（字符串）和 `success`（整数）查询字符串变量将添加到 URL。付款页面当前支持以下付款方式类型：

<div class="content-list" markdown="1">

- 信用卡
- Alipay
- Bancontact
- BECS Direct Debit
- EPS
- Giropay
- iDEAL
- SEPA Direct Debit

</div>

或者，你可以让 Stripe 为你处理付款确认。在这种情况下，你可以 [在你的 Stripe 仪表板中设置 Stripe 的自动计费电子邮件](https://dashboard.stripe.com/account/billing/automatic)，而不是重定向到付款确认页面。但是，如果捕获到 `IncompletePayment` 异常，你仍应通知用户他们将收到一封包含进一步付款确认说明的电子邮件。

对于以下方法可能会引发付款异常：使用 `Billable` trait 的模型上的 `charge`、`invoiceFor` 和 `invoice`。当与订阅交互时，`SubscriptionBuilder` 上的 `create` 方法，以及 `Subscription` 和 `SubscriptionItem` 模型上的 `incrementAndInvoice` 和 `swapAndInvoice` 方法可能会引发未完成付款异常。

可以使用可计费模型或订阅实例上的 `hasIncompletePayment` 方法确定现有订阅是否有未完成的付款：

```php
if ($user->hasIncompletePayment('default')) {
    // ...
}

if ($user->subscription('default')->hasIncompletePayment()) {
    // ...
}
```

你可以通过检查异常实例上的 `payment` 属性来得出未完成付款的特定状态：

```php
use Laravel\Cashier\Exceptions\IncompletePayment;

try {
    $user->charge(1000, 'pm_card_threeDSecure2Required');
} catch (IncompletePayment $exception) {
    // 获取 Payment Intent 状态...
    $exception->payment->status;

    // 检查特定条件...
    if ($exception->payment->requiresPaymentMethod()) {
        // ...
    } elseif ($exception->payment->requiresConfirmation()) {
        // ...
    }
}
```

### 确认付款

某些付款方式需要其他数据才能确认付款。例如，SEPA 付款方式在付款过程中需要其他"授权"数据。你可以使用 `withPaymentConfirmationOptions` 方法将此数据提供给 Cashier：

```php
$subscription->withPaymentConfirmationOptions([
    'mandate_data' => '...',
])->swap('price_xxx');
```

你可以查阅 [Stripe API 文档](https://stripe.com/docs/api/payment_intents/confirm) 以查看确认付款时接受的所有选项。

## 强客户身份验证

如果你的企业或你的客户之一位于欧洲，则你需要遵守欧盟的强客户身份验证（SCA）法规。这些法规由欧盟于 2019 年 9 月实施，以防止付款欺诈。幸运的是，Stripe 和 Cashier 已准备好构建符合 SCA 的应用程序。

> [!WARNING]
> 在开始之前，请查看 [Stripe 有关 PSD2 和 SCA 的指南](https://stripe.com/guides/strong-customer-authentication) 以及 [它们有关新 SCA API 的文档](https://stripe.com/docs/strong-customer-authentication)。

### 需要额外确认的付款

SCA 法规通常需要额外验证才能确认和处理付款。发生这种情况时，Cashier 将引发 `Laravel\Cashier\Exceptions\IncompletePayment` 异常，告知你需要额外验证。有关如何处理这些异常的更多信息，请参阅 [处理失败的付款](#处理失败的支付) 文档。

Stripe 或 Cashier 提供的付款确认屏幕可能针对特定银行或发卡机构的付款流程量身定制，可能包括额外的卡确认、临时小额扣款、独立设备身份验证或其他形式的验证。

#### 未完成和逾期状态

当付款需要额外确认时，订阅将保持 `incomplete` 或 `past_due` 状态，如其 `stripe_status` 数据库列所指示。Cashier 将在付款确认完成且你的应用程序通过 Webhook 收到完成通知后立即激活客户的订阅。

有关 `incomplete` 和 `past_due` 状态的更多信息，请参阅 [有关这些状态的其他文档](#未完成和逾期状态)。

### 非会话付款通知

由于 SCA 法规要求客户偶尔验证其付款详细信息，即使他们的订阅处于活动状态，Cashier 也可以在需要非会话付款确认时向客户发送通知。例如，这可能在订阅续订时发生。可以通过将 `CASHIER_PAYMENT_NOTIFICATION` 环境变量设置为通知类来启用 Cashier 的付款通知。默认情况下，此通知处于禁用状态。当然，Cashier 包含一个你可以用于此目的的通知类，但如果需要，你可以自由提供自己的通知类：

```ini
CASHIER_PAYMENT_NOTIFICATION=Laravel\Cashier\Notifications\ConfirmPayment
```

为确保非会话付款确认通知已传递，请验证是否已为你的应用程序配置 [Stripe Webhook](#处理-stripe-webhook)，并在 Stripe 仪表板中启用了 `invoice.payment_action_required` Webhook。此外，你的 `Billable` 模型还应使用 Laravel 的 `Illuminate\Notifications\Notifiable` trait。

> [!WARNING]
> 即使客户手动进行需要额外确认的付款，也会发送通知。不幸的是，Stripe 无法知道付款是手动进行还是"非会话"进行的。但是，如果客户在已经确认其付款后访问付款页面，他们将只会看到"付款成功"消息。客户不会被允许意外地再次确认同一笔付款并导致意外的二次扣款。

## Stripe SDK

许多 Cashier 对象都是 Stripe SDK 对象的包装器。如果你想直接与 Stripe 对象交互，则可以使用 `asStripe` 方法方便地检索它们：

```php
$stripeSubscription = $subscription->asStripeSubscription();

$stripeSubscription->application_fee_percent = 5;

$stripeSubscription->save();
```

你还可以使用 `updateStripeSubscription` 方法直接更新 Stripe 订阅：

```php
$subscription->updateStripeSubscription(['application_fee_percent' => 5]);
```

如果你希望直接使用 `Stripe\StripeClient` 客户端，可以在 `Cashier` 类上调用 `stripe` 方法。例如，你可以使用此方法访问 `StripeClient` 实例并从你的 Stripe 账户中检索价格列表：

```php
use Laravel\Cashier\Cashier;

$prices = Cashier::stripe()->prices->all();
```

## 测试

在测试使用 Cashier 的应用程序时，你可以模拟对 Stripe API 的实际 HTTP 请求；但是，这要求你部分重新实现 Cashier 自己的行为。因此，我们建议允许你的测试访问实际的 Stripe API。虽然这会更慢，但它提供了更多的信心，确保你的应用程序按预期工作，并且任何缓慢的测试都可以放在它们自己的 Pest / PHPUnit 测试组中。

测试时，请记住 Cashier 本身已经有一个很好的测试套件，因此你应该只关注测试你自己应用程序的订阅和付款流程，而不是每个底层的 Cashier 行为。

要开始使用，请将 Stripe 密钥的**测试**版本添加到你的 `phpunit.xml` 文件中：

```xml
<env name="STRIPE_SECRET" value="sk_test_<your-key>"/>
```

现在，每当你在测试期间与 Cashier 交互时，它将向你的 Stripe 测试环境发送实际的 API 请求。为方便起见，你应该预先使用你可以在测试期间使用的订阅/价格填充你的 Stripe 测试账户。

> [!NOTE]
> 为了测试各种计费方案，例如信用卡拒付和失败，你可以使用 Stripe 提供的各种 [测试卡号和令牌](https://stripe.com/docs/testing)。
