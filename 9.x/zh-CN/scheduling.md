# 任务调度

- [简介](#introduction)
- [定义调度](#defining-schedules)
    - [调度 Artisan 命令](#scheduling-artisan-commands)
    - [调度队列任务](#scheduling-queued-jobs)
    - [调度 Shell 命令](#scheduling-shell-commands)
    - [调度频率选项](#schedule-frequency-options)
    - [时区](#timezones)
    - [防止任务重叠](#preventing-task-overlaps)
    - [在单台服务器上运行任务](#running-tasks-on-one-server)
    - [后台任务](#background-tasks)
    - [维护模式](#maintenance-mode)
- [运行调度器](#running-the-scheduler)
    - [本地运行调度器](#running-the-scheduler-locally)
- [任务输出](#task-output)
- [任务钩子](#task-hooks)
- [事件](#events)

<a name="introduction"></a>
## 简介

过去，你可能需要为服务器上每个需要调度的任务编写一个 cron 配置条目。然而，这很快就会变得令人头疼，因为你的任务调度不再受源代码控制，而且你必须 SSH 到服务器来查看现有的 cron 条目或添加额外条目。

Laravel 的命令调度器提供了一种全新的方式来管理服务器上的调度任务。调度器允许你在 Laravel 应用内部流畅且富有表现力地定义命令调度。使用调度器时，服务器上只需一个 cron 条目。你的任务调度定义在 `app/Console/Kernel.php` 文件的 `schedule` 方法中。为了帮助你上手，该方法中已定义了一个简单示例。

<a name="defining-schedules"></a>
## 定义调度

你可以在应用的 `App\Console\Kernel` 类的 `schedule` 方法中定义所有调度任务。让我们先看一个示例。在此示例中，我们将调度一个闭包在每天午夜调用。在闭包中，我们将执行一个数据库查询来清空一个表：

```php
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\DB;

class Kernel extends ConsoleKernel
{
    /**
     * 定义应用的命令调度。
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->call(function () {
            DB::table('recent_users')->delete();
        })->daily();
    }
}
```

除了使用闭包调度外，你还可以调度[可调用对象](https://secure.php.net/manual/en/language.oop5.magic.php#object.invoke)。可调用对象是包含 `__invoke` 方法的简单 PHP 类：

```php
$schedule->call(new DeleteRecentUsers)->daily();
```

如果你想查看调度任务的概览及其下次计划运行的时间，可以使用 `schedule:list` Artisan 命令：

```bash
php artisan schedule:list
```

<a name="scheduling-artisan-commands"></a>
### 调度 Artisan 命令

除了调度闭包外，你还可以调度 [Artisan 命令](/docs/{{version}}/artisan)和系统命令。例如，你可以使用 `command` 方法通过命令名称或类来调度 Artisan 命令。

使用命令类名调度 Artisan 命令时，你可以传递一个额外的命令行参数数组，这些参数应在命令调用时提供：

```php
use App\Console\Commands\SendEmailsCommand;

$schedule->command('emails:send Taylor --force')->daily();

$schedule->command(SendEmailsCommand::class, ['Taylor', '--force'])->daily();
```

<a name="scheduling-queued-jobs"></a>
### 调度队列任务

`job` 方法可用于调度[队列任务](/docs/{{version}}/queues)。此方法提供了一种便捷的方式来调度队列任务，无需使用 `call` 方法定义闭包来将任务加入队列：

```php
use App\Jobs\Heartbeat;

$schedule->job(new Heartbeat)->everyFiveMinutes();
```

可以向 `job` 方法提供可选的第二和第三个参数，分别指定用于将任务加入队列的队列名称和队列连接：

```php
use App\Jobs\Heartbeat;

// 将任务分发到 "sqs" 连接的 "heartbeats" 队列...
$schedule->job(new Heartbeat, 'heartbeats', 'sqs')->everyFiveMinutes();
```

<a name="scheduling-shell-commands"></a>
### 调度 Shell 命令

`exec` 方法可用于向操作系统发出命令：

```php
$schedule->exec('node /home/forge/script.js')->daily();
```

<a name="schedule-frequency-options"></a>
### 调度频率选项

我们已经看到了几个如何配置任务在指定间隔运行的示例。然而，还有许多更多的任务调度频率可以分配给任务：

方法  | 描述
------------- | -------------
`->cron('* * * * *');`  |  按自定义 cron 调度运行任务
`->everyMinute();`  |  每分钟运行任务
`->everyTwoMinutes();`  |  每两分钟运行任务
`->everyThreeMinutes();`  |  每三分钟运行任务
`->everyFourMinutes();`  |  每四分钟运行任务
`->everyFiveMinutes();`  |  每五分钟运行任务
`->everyTenMinutes();`  |  每十分钟运行任务
`->everyFifteenMinutes();`  |  每十五分钟运行任务
`->everyThirtyMinutes();`  |  每三十分钟运行任务
`->hourly();`  |  每小时运行任务
`->hourlyAt(17);`  |  每小时在第 17 分钟运行任务
`->everyOddHour();`  |  每奇数小时运行任务
`->everyTwoHours();`  |  每两小时运行任务
`->everyThreeHours();`  |  每三小时运行任务
`->everyFourHours();`  |  每四小时运行任务
`->everySixHours();`  |  每六小时运行任务
`->daily();`  |  每天午夜运行任务
`->dailyAt('13:00');`  |  每天 13:00 运行任务
`->twiceDaily(1, 13);`  |  每天 1:00 和 13:00 运行任务
`->twiceDailyAt(1, 13, 15);`  |  每天 1:15 和 13:15 运行任务
`->weekly();`  |  每周日 00:00 运行任务
`->weeklyOn(1, '8:00');`  |  每周一 8:00 运行任务
`->monthly();`  |  每月第一天 00:00 运行任务
`->monthlyOn(4, '15:00');`  |  每月 4 号 15:00 运行任务
`->twiceMonthly(1, 16, '13:00');`  |  每月 1 号和 16 号 13:00 运行任务
`->lastDayOfMonth('15:00');` | 每月最后一天 15:00 运行任务
`->quarterly();` |  每季度第一天 00:00 运行任务
`->quarterlyOn(4, '14:00');` |  每季度 4 号 14:00 运行任务
`->yearly();`  |  每年第一天 00:00 运行任务
`->yearlyOn(6, 1, '17:00');`  |  每年 6 月 1 日 17:00 运行任务
`->timezone('America/New_York');` | 为任务设置时区

这些方法可以与额外的约束条件组合，创建更精细的调度，仅在每周特定日期运行。例如，你可以调度一个命令在每周一运行：

```php
// 每周一下午 1 点运行一次...
$schedule->call(function () {
    //
})->weekly()->mondays()->at('13:00');

// 工作日 8 AM 到 5 PM 之间每小时运行...
$schedule->command('foo')
          ->weekdays()
          ->hourly()
          ->timezone('America/Chicago')
          ->between('8:00', '17:00');
```

下面是额外调度约束条件的列表：

方法  | 描述
------------- | -------------
`->weekdays();`  |  将任务限制在工作日
`->weekends();`  |  将任务限制在周末
`->sundays();`  |  将任务限制在周日
`->mondays();`  |  将任务限制在周一
`->tuesdays();`  |  将任务限制在周二
`->wednesdays();`  |  将任务限制在周三
`->thursdays();`  |  将任务限制在周四
`->fridays();`  |  将任务限制在周五
`->saturdays();`  |  将任务限制在周六
`->days(array\|mixed);`  |  将任务限制在特定日期
`->between($startTime, $endTime);`  |  将任务限制在开始和结束时间之间运行
`->unlessBetween($startTime, $endTime);`  |  将任务限制在开始和结束时间之间不运行
`->when(Closure);`  |  基于真值测试限制任务
`->environments($env);`  |  将任务限制在特定环境

<a name="day-constraints"></a>
#### 日期约束

`days` 方法可用于将任务的执行限制在每周特定日期。例如，你可以调度一个命令在周日和周三每小时运行：

```php
$schedule->command('emails:send')
                ->hourly()
                ->days([0, 3]);
```

或者，你可以使用 `Illuminate\Console\Scheduling\Schedule` 类上可用的常量来定义任务应运行的日期：

```php
use Illuminate\Console\Scheduling\Schedule;

$schedule->command('emails:send')
                ->hourly()
                ->days([Schedule::SUNDAY, Schedule::WEDNESDAY]);
```

<a name="between-time-constraints"></a>
#### 时间区间约束

`between` 方法可用于根据一天中的时间来限制任务的执行：

```php
$schedule->command('emails:send')
                    ->hourly()
                    ->between('7:00', '22:00');
```

类似地，`unlessBetween` 方法可用于在一段时间内排除任务的执行：

```php
$schedule->command('emails:send')
                    ->hourly()
                    ->unlessBetween('23:00', '4:00');
```

<a name="truth-test-constraints"></a>
#### 真值测试约束

`when` 方法可用于根据给定真值测试的结果来限制任务的执行。换句话说，如果给定闭包返回 `true`，只要没有其他约束条件阻止任务运行，任务就会执行：

```php
$schedule->command('emails:send')->daily()->when(function () {
    return true;
});
```

`skip` 方法可视为 `when` 的逆操作。如果 `skip` 方法返回 `true`，调度任务将不会执行：

```php
$schedule->command('emails:send')->daily()->skip(function () {
    return true;
});
```

使用链式 `when` 方法时，只有所有 `when` 条件都返回 `true`，调度命令才会执行。

<a name="environment-constraints"></a>
#### 环境约束

`environments` 方法可用于仅在给定环境（由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#environment-configuration)定义）上执行任务：

```php
$schedule->command('emails:send')
            ->daily()
            ->environments(['staging', 'production']);
```

<a name="timezones"></a>
### 时区

使用 `timezone` 方法，你可以指定调度任务的时间应在给定时区内解释：

```php
$schedule->command('report:generate')
         ->timezone('America/New_York')
         ->at('2:00')
```

如果你反复为所有调度任务分配相同的时区，可能希望在 `App\Console\Kernel` 类中定义一个 `scheduleTimezone` 方法。此方法应返回应分配给所有调度任务的默认时区：

```php
/**
 * 获取调度事件默认使用的时区。
 *
 * @return \DateTimeZone|string|null
 */
protected function scheduleTimezone()
{
    return 'America/Chicago';
}
```

> **Warning**  
> 请记住，某些时区使用夏令时。当夏令时变化发生时，你的调度任务可能运行两次甚至完全不运行。因此，我们建议尽可能避免时区调度。

<a name="preventing-task-overlaps"></a>
### 防止任务重叠

默认情况下，即使任务的前一个实例仍在运行，调度任务也会运行。要防止这种情况，可以使用 `withoutOverlapping` 方法：

```php
$schedule->command('emails:send')->withoutOverlapping();
```

在此示例中，`emails:send` [Artisan 命令](/docs/{{version}}/artisan)如果尚未运行，将每分钟运行一次。`withoutOverlapping` 方法在任务执行时间差异很大、无法准确预测给定任务所需时间的情况下特别有用。

如果需要，你可以指定「不重叠」锁过期前必须经过的分钟数。默认情况下，锁将在 24 小时后过期：

```php
$schedule->command('emails:send')->withoutOverlapping(10);
```

在幕后，`withoutOverlapping` 方法利用应用的[缓存](/docs/{{version}}/cache)来获取锁。如有必要，你可以使用 `schedule:clear-cache` Artisan 命令清除这些缓存锁。这通常仅在任务因意外服务器问题而卡住时才需要。

<a name="running-tasks-on-one-server"></a>
### 在单台服务器上运行任务

> **Warning**  
> 要使用此功能，你的应用必须使用 `database`、`memcached`、`dynamodb` 或 `redis` 缓存驱动作为默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

如果你的应用调度器在多台服务器上运行，可以将调度任务限制为仅在单台服务器上执行。例如，假设你有一个每周五晚上生成新报告的调度任务。如果任务调度器在三台工作服务器上运行，调度任务将在所有三台服务器上运行并生成三次报告。这可不好！

要指示任务应仅在一台服务器上运行，在定义调度任务时使用 `onOneServer` 方法。第一个获取任务的服务器将在任务上获取一个原子锁，以防止其他服务器同时运行同一任务：

```php
$schedule->command('report:generate')
                ->fridays()
                ->at('17:00')
                ->onOneServer();
```

<a name="naming-unique-jobs"></a>
#### 命名单服务器任务

有时你可能需要调度同一任务以不同参数分发，同时仍指示 Laravel 在单台服务器上运行任务的每种排列。为此，你可以通过 `name` 方法为每个调度定义分配一个唯一名称：

```php
$schedule->job(new CheckUptime('https://laravel.com'))
            ->name('check_uptime:laravel.com')
            ->everyFiveMinutes()
            ->onOneServer();

$schedule->job(new CheckUptime('https://vapor.laravel.com'))
            ->name('check_uptime:vapor.laravel.com')
            ->everyFiveMinutes()
            ->onOneServer();
```

类似地，如果调度闭包打算在单台服务器上运行，也必须为其分配名称：

```php
$schedule->call(fn () => User::resetApiRequestCount())
    ->name('reset-api-request-count')
    ->daily()
    ->onOneServer();
```


<a name="background-tasks"></a>
### 后台任务

默认情况下，同一时间调度的多个任务将根据它们在 `schedule` 方法中定义的顺序依次执行。如果你有长时间运行的任务，这可能导致后续任务比预期晚得多才开始。如果你想在后台运行任务以便它们可以同时运行，可以使用 `runInBackground` 方法：

```php
$schedule->command('analytics:report')
         ->daily()
         ->runInBackground();
```

> **Warning**  
> `runInBackground` 方法仅在使用 `command` 和 `exec` 方法调度任务时可用。

<a name="maintenance-mode"></a>
### 维护模式

当应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，应用的调度任务不会运行，因为我们不希望任务干扰你可能正在服务器上执行的任何未完成维护。但是，如果你想强制任务即使在维护模式下也运行，可以在定义任务时调用 `evenInMaintenanceMode` 方法：

```php
$schedule->command('emails:send')->evenInMaintenanceMode();
```

<a name="running-the-scheduler"></a>
## 运行调度器

现在我们已经学会了如何定义调度任务，让我们讨论如何在服务器上实际运行它们。`schedule:run` Artisan 命令将评估所有调度任务并根据服务器当前时间确定是否需要运行。

因此，使用 Laravel 的调度器时，我们只需在服务器上添加一个每分钟运行 `schedule:run` 命令的 cron 配置条目。如果你不知道如何向服务器添加 cron 条目，可以考虑使用 [Laravel Forge](https://forge.laravel.com) 等服务来为你管理 cron 条目：

```shell
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

<a name="running-the-scheduler-locally"></a>
## 本地运行调度器

通常，你不会在本地开发机器上添加调度器 cron 条目。相反，你可以使用 `schedule:work` Artisan 命令。此命令将在前台运行并每分钟调用一次调度器，直到你终止命令：

```shell
php artisan schedule:work
```

<a name="task-output"></a>
## 任务输出

Laravel 调度器提供了几种便捷的方法来处理调度任务生成的输出。首先，使用 `sendOutputTo` 方法，你可以将输出发送到文件以供稍后检查：

```php
$schedule->command('emails:send')
         ->daily()
         ->sendOutputTo($filePath);
```

如果想将输出追加到给定文件，可以使用 `appendOutputTo` 方法：

```php
$schedule->command('emails:send')
         ->daily()
         ->appendOutputTo($filePath);
```

使用 `emailOutputTo` 方法，你可以将输出通过邮件发送到你选择的邮箱地址。在通过邮件发送任务输出之前，你应该配置 Laravel 的[邮件服务](/docs/{{version}}/mail)：

```php
$schedule->command('report:generate')
         ->daily()
         ->sendOutputTo($filePath)
         ->emailOutputTo('taylor@example.com');
```

如果你只想在调度 Artisan 或系统命令以非零退出码终止时通过邮件发送输出，使用 `emailOutputOnFailure` 方法：

```php
$schedule->command('report:generate')
         ->daily()
         ->emailOutputOnFailure('taylor@example.com');
```

> **Warning**  
> `emailOutputTo`、`emailOutputOnFailure`、`sendOutputTo` 和 `appendOutputTo` 方法是 `command` 和 `exec` 方法专有的。

<a name="task-hooks"></a>
## 任务钩子

使用 `before` 和 `after` 方法，你可以指定在调度任务执行之前和之后执行的代码：

```php
$schedule->command('emails:send')
         ->daily()
         ->before(function () {
             // 任务即将执行...
         })
         ->after(function () {
             // 任务已执行...
         });
```

`onSuccess` 和 `onFailure` 方法允许你指定在调度任务成功或失败时执行的代码。失败表示调度的 Artisan 或系统命令以非零退出码终止：

```php
$schedule->command('emails:send')
         ->daily()
         ->onSuccess(function () {
             // 任务成功...
         })
         ->onFailure(function () {
             // 任务失败...
         });
```

如果命令有可用输出，你可以通过在钩子闭包定义中将 `Illuminate\Support\Stringable` 实例类型提示为 `$output` 参数，在 `after`、`onSuccess` 或 `onFailure` 钩子中访问它：

```php
use Illuminate\Support\Stringable;

$schedule->command('emails:send')
         ->daily()
         ->onSuccess(function (Stringable $output) {
             // 任务成功...
         })
         ->onFailure(function (Stringable $output) {
             // 任务失败...
         });
```

<a name="pinging-urls"></a>
#### Ping URL

使用 `pingBefore` 和 `thenPing` 方法，调度器可以在任务执行之前或之后自动 ping 给定 URL。此方法适用于通知外部服务（如 [Envoyer](https://envoyer.io)）你的调度任务正在开始或已完成执行：

```php
$schedule->command('emails:send')
         ->daily()
         ->pingBefore($url)
         ->thenPing($url);
```

`pingBeforeIf` 和 `thenPingIf` 方法可用于仅在给定条件为 `true` 时 ping 给定 URL：

```php
$schedule->command('emails:send')
         ->daily()
         ->pingBeforeIf($condition, $url)
         ->thenPingIf($condition, $url);
```

`pingOnSuccess` 和 `pingOnFailure` 方法可用于仅在任务成功或失败时 ping 给定 URL。失败表示调度的 Artisan 或系统命令以非零退出码终止：

```php
$schedule->command('emails:send')
         ->daily()
         ->pingOnSuccess($successUrl)
         ->pingOnFailure($failureUrl);
```

所有 ping 方法都需要 Guzzle HTTP 库。Guzzle 通常默认安装在所有新 Laravel 项目中，但如果它被意外移除，你可以使用 Composer 包管理器手动将 Guzzle 安装到项目中：

```shell
composer require guzzlehttp/guzzle
```

<a name="events"></a>
## 事件

如果需要，你可以监听调度器派发的[事件](/docs/{{version}}/events)。通常，事件监听器映射将在应用的 `App\Providers\EventServiceProvider` 类中定义：

```php
/**
 * 应用的事件监听器映射。
 *
 * @var array
 */
protected $listen = [
    'Illuminate\Console\Events\ScheduledTaskStarting' => [
        'App\Listeners\LogScheduledTaskStarting',
    ],

    'Illuminate\Console\Events\ScheduledTaskFinished' => [
        'App\Listeners\LogScheduledTaskFinished',
    ],

    'Illuminate\Console\Events\ScheduledBackgroundTaskFinished' => [
        'App\Listeners\LogScheduledBackgroundTaskFinished',
    ],

    'Illuminate\Console\Events\ScheduledTaskSkipped' => [
        'App\Listeners\LogScheduledTaskSkipped',
    ],

    'Illuminate\Console\Events\ScheduledTaskFailed' => [
        'App\Listeners\LogScheduledTaskFailed',
    ],
];
```