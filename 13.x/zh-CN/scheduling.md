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
    - [暂停计划任务](#pausing-scheduled-tasks)
    - [调度组](#schedule-groups)
- [运行调度器](#running-the-scheduler)
    - [秒级计划任务](#sub-minute-scheduled-tasks)
    - [在本地运行调度器](#running-the-scheduler-locally)
- [任务输出](#task-output)
- [任务钩子](#task-hooks)
- [事件](#events)

<a name="introduction"></a>
## 简介

在过去，你可能已经为服务器上需要调度的每个任务编写了一个 cron 配置条目。然而，这很快就会变成一种负担，因为你的任务调度不再受源代码控制，而且你必须通过 SSH 登录服务器才能查看现有的 cron 条目或添加额外的条目。

Laravel 的命令调度器为管理服务器上的计划任务提供了一种全新的方法。调度器允许你在 Laravel 应用内部流畅且富有表现力地定义命令调度。使用调度器时，你的服务器上只需要一个 cron 条目。你的任务调度通常定义在应用的 `routes/console.php` 文件中。

<a name="defining-schedules"></a>
## 定义调度

你可以在应用 `routes/console.php` 文件中定义所有计划任务。要开始，让我们看一个示例。在此示例中，我们将调度一个闭包在每天午夜调用。在闭包中，我们将执行一个数据库查询来清空一张表：

```php
<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->daily();
```

除了使用闭包进行调度之外，你还可以调度[可调用对象](https://secure.php.net/manual/en/language.oop5.magic.php#object.invoke)。可调用对象是包含 `__invoke` 方法的简单 PHP 类：

```php
Schedule::call(new DeleteRecentUsers)->daily();
```

如果你更愿意将 `routes/console.php` 文件仅用于命令定义，可以在应用 `bootstrap/app.php` 文件中使用 `withSchedule` 方法定义计划任务。此方法接受一个接收调度器实例的闭包：

```php
use Illuminate\Console\Scheduling\Schedule;

->withSchedule(function (Schedule $schedule) {
    $schedule->call(new DeleteRecentUsers)->daily();
})
```

如果你想查看计划任务的概览及其下次计划运行的时间，可以使用 `schedule:list` Artisan 命令：

```shell
php artisan schedule:list
```

<a name="scheduling-artisan-commands"></a>
### 调度 Artisan 命令

除了调度闭包之外，你还可以调度 [Artisan 命令](/docs/{{version}}/artisan)和系统命令。例如，你可以使用 `command` 方法，通过命令的名称或类来调度 Artisan 命令。

使用命令的类名调度 Artisan 命令时，你可以传递一个额外的命令行参数数组，这些参数将在命令被调用时提供给命令：

```php
use App\Console\Commands\SendEmailsCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send Taylor --force')->daily();

Schedule::command(SendEmailsCommand::class, ['Taylor', '--force'])->daily();
```

<a name="scheduling-artisan-closure-commands"></a>
#### 调度 Artisan 闭包命令

如果你想调度由闭包定义的 Artisan 命令，可以在命令定义之后链式调用调度相关的方法：

```php
Artisan::command('delete:recent-users', function () {
    DB::table('recent_users')->delete();
})->purpose('Delete recent users')->daily();
```

如果你需要向闭包命令传递参数，可以将它们提供给 `schedule` 方法：

```php
Artisan::command('emails:send {user} {--force}', function ($user) {
    // ...
})->purpose('Send emails to the specified user')->schedule(['Taylor', '--force'])->daily();
```

<a name="scheduling-queued-jobs"></a>
### 调度队列任务

`job` 方法可用于调度[队列任务](/docs/{{version}}/queues)。此方法提供了一种便捷的方式调度队列任务，而无需使用 `call` 方法定义闭包来将任务入队：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new Heartbeat)->everyFiveMinutes();
```

可以向 `job` 方法提供可选的第二和第三个参数，用于指定应将任务入队的队列名称和队列连接：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

// Dispatch the job to the "heartbeats" queue on the "sqs" connection...
Schedule::job(new Heartbeat, 'heartbeats', 'sqs')->everyFiveMinutes();
```

<a name="scheduling-shell-commands"></a>
### 调度 Shell 命令

`exec` 方法可用于向操作系统发出命令：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::exec('node /home/forge/script.js')->daily();
```

<a name="schedule-frequency-options"></a>
### 调度频率选项

我们已经看到了几个如何将任务配置为在指定时间间隔运行的示例。但是，还有更多的任务调度频率可以分配给任务：

| 方法                             | 描述                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `->cron('* * * * *');`             | 按自定义 cron 调度运行任务。                  |
| `->everySecond();`                 | 每秒运行一次任务。                               |
| `->everyTwoSeconds();`             | 每两秒运行一次任务。                          |
| `->everyFiveSeconds();`            | 每五秒运行一次任务。                         |
| `->everyTenSeconds();`             | 每十秒运行一次任务。                         |
| `->everyFifteenSeconds();`         | 每十五秒运行一次任务。                      |
| `->everyTwentySeconds();`          | 每二十秒运行一次任务。                       |
| `->everyThirtySeconds();`          | 每三十秒运行一次任务。                       |
| `->everyMinute();`                 | 每分钟运行一次任务。                               |
| `->everyTwoMinutes();`             | 每两分钟运行一次任务。                          |
| `->everyThreeMinutes();`           | 每三分钟运行一次任务。                        |
| `->everyFourMinutes();`            | 每四分钟运行一次任务。                         |
| `->everyFiveMinutes();`            | 每五分钟运行一次任务。                         |
| `->everyTenMinutes();`             | 每十分钟运行一次任务。                         |
| `->everyFifteenMinutes();`         | 每十五分钟运行一次任务。                      |
| `->everyThirtyMinutes();`          | 每三十分钟运行一次任务。                       |
| `->hourly();`                      | 每小时运行一次任务。                                 |
| `->hourlyAt(17);`                  | 每小时过 17 分钟时运行任务。     |
| `->everyOddHour($minutes = 0);`    | 每隔一小时运行任务。                             |
| `->everyTwoHours($minutes = 0);`   | 每两小时运行任务。                            |
| `->everyThreeHours($minutes = 0);` | 每三小时运行任务。                          |
| `->everyFourHours($minutes = 0);`  | 每四小时运行任务。                           |
| `->everySixHours($minutes = 0);`   | 每六小时运行任务。                            |
| `->daily();`                       | 每天午夜运行任务。                      |
| `->dailyAt('13:00');`              | 每天 13:00 运行任务。                         |
| `->twiceDaily(1, 13);`             | 每天 1:00 和 13:00 运行任务。                      |
| `->twiceDailyAt(1, 13, 15);`       | 每天 1:15 和 13:15 运行任务。                      |
| `->daysOfMonth([1, 10, 20]);`      | 在每月的特定日期运行任务。              |
| `->weekly();`                      | 每周日 00:00 运行任务。                      |
| `->weeklyOn(1, '8:00');`           | 每周一 8:00 运行任务。               |
| `->monthly();`                     | 每月第一天 00:00 运行任务。   |
| `->monthlyOn(4, '15:00');`         | 每月 4 日 15:00 运行任务。            |
| `->twiceMonthly(1, 16, '13:00');`  | 每月 1 日和 16 日 13:00 运行任务。       |
| `->lastDayOfMonth('15:00');`       | 每月最后一天 15:00 运行任务。      |
| `->quarterly();`                   | 每季度第一天 00:00 运行任务。 |
| `->quarterlyOn(4, '14:00');`       | 每季度第 4 天 14:00 运行任务。          |
| `->yearly();`                      | 每年第一天 00:00 运行任务。    |
| `->yearlyOn(6, 1, '17:00');`       | 每年 6 月 1 日 17:00 运行任务。            |
| `->timezone('America/New_York');`  | 为任务设置时区。                           |

这些方法可以与额外的约束组合，以创建仅在每周特定日期运行的、更精细调整的调度。例如，你可以调度一个命令在每周一运行：

```php
use Illuminate\Support\Facades\Schedule;

// Run once per week on Monday at 1 PM...
Schedule::call(function () {
    // ...
})->weekly()->mondays()->at('13:00');

// Run hourly from 8 AM to 5 PM on weekdays...
Schedule::command('foo')
    ->weekdays()
    ->hourly()
    ->timezone('America/Chicago')
    ->between('8:00', '17:00');
```

可以在下面找到额外的调度约束列表：

| 方法                                   | 描述                                            |
| ---------------------------------------- | ------------------------------------------------------ |
| `->weekdays();`                          | 将任务限制在工作日。                            |
| `->weekends();`                          | 将任务限制在周末。                            |
| `->sundays();`                           | 将任务限制在周日。                              |
| `->mondays();`                           | 将任务限制在周一。                              |
| `->tuesdays();`                          | 将任务限制在周二。                             |
| `->wednesdays();`                        | 将任务限制在周三。                           |
| `->thursdays();`                         | 将任务限制在周四。                            |
| `->fridays();`                           | 将任务限制在周五。                              |
| `->saturdays();`                         | 将任务限制在周六。                            |
| `->days(array\|mixed);`                  | 将任务限制在特定日期。                       |
| `->between($startTime, $endTime);`       | 将任务限制在开始和结束时间之间运行。     |
| `->unlessBetween($startTime, $endTime);` | 将任务限制为不在开始和结束时间之间运行。 |
| `->when(Closure);`                       | 基于真值测试限制任务。                  |
| `->environments($env);`                  | 将任务限制在特定环境。               |

<a name="day-constraints"></a>
#### 日期约束

`days` 方法可用于将任务的执行限制在每周的特定日期。例如，你可以调度一个命令在周日和周三每小时运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->hourly()
    ->days([0, 3]);
```

或者，在定义任务应运行的日期时，你可以使用 `Illuminate\Console\Scheduling\Schedule` 类上可用的常量：

```php
use Illuminate\Support\Facades;
use Illuminate\Console\Scheduling\Schedule;

Facades\Schedule::command('emails:send')
    ->hourly()
    ->days([Schedule::SUNDAY, Schedule::WEDNESDAY]);
```

<a name="between-time-constraints"></a>
#### 时间区间约束

`between` 方法可用于根据一天中的时间限制任务的执行：

```php
Schedule::command('emails:send')
    ->hourly()
    ->between('7:00', '22:00');
```

类似地，`unlessBetween` 方法可用于在某个时间段内排除任务的执行：

```php
Schedule::command('emails:send')
    ->hourly()
    ->unlessBetween('23:00', '4:00');
```

<a name="truth-test-constraints"></a>
#### 真值测试约束

`when` 方法可用于根据给定真值测试的结果限制任务的执行。换句话说，如果给定的闭包返回 `true`，只要没有其他约束条件阻止任务运行，任务就会执行：

```php
Schedule::command('emails:send')->daily()->when(function () {
    return true;
});
```

`skip` 方法可以看作是 `when` 的逆操作。如果 `skip` 方法返回 `true`，计划任务将不会被执行：

```php
Schedule::command('emails:send')->daily()->skip(function () {
    return true;
});
```

当使用链式的 `when` 方法时，只有当所有 `when` 条件都返回 `true` 时，计划命令才会执行。

<a name="environment-constraints"></a>
#### 环境约束

`environments` 方法可用于仅在给定环境中执行任务（由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#environment-configuration)定义）：

```php
Schedule::command('emails:send')
    ->daily()
    ->environments(['staging', 'production']);
```

<a name="timezones"></a>
### 时区

使用 `timezone` 方法，你可以指定计划任务的运行时间应在给定时区内解释：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->timezone('America/New_York')
    ->at('2:00')
```

如果你反复为所有计划任务分配相同的时区，可以在应用的 `app` 配置文件中定义一个 `schedule_timezone` 选项，指定应分配给所有调度的时区：

```php
'timezone' => 'UTC',

'schedule_timezone' => 'America/Chicago',
```

> [!WARNING]
> 请记住，某些时区使用夏令时。当夏令时发生变化时，你的计划任务可能会运行两次，甚至完全不运行。因此，我们建议尽可能避免按时间进行跨时区调度。

<a name="preventing-task-overlaps"></a>
### 防止任务重叠

默认情况下，即使任务的先前实例仍在运行，计划任务也会被执行。为防止这种情况，你可以使用 `withoutOverlapping` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->withoutOverlapping();
```

在此示例中，如果 `emails:send` [Artisan 命令](/docs/{{version}}/artisan)尚未运行，它将每分钟执行一次。`withoutOverlapping` 方法对于执行时间差异很大、使你无法准确预测给定任务需要多长时间的任务特别有用。

如有需要，你可以指定在"无重叠"锁过期之前必须经过多少分钟。默认情况下，锁将在 24 小时后过期：

```php
Schedule::command('emails:send')->withoutOverlapping(10);
```

在幕后，`withoutOverlapping` 方法利用你的应用[缓存](/docs/{{version}}/cache)获取锁。如有必要，你可以使用 `schedule:clear-cache` Artisan 命令清除这些缓存锁。这通常仅在任务因意外服务器问题而卡住时才需要。

<a name="running-tasks-on-one-server"></a>
### 在单台服务器上运行任务

> [!WARNING]
> 要利用此功能，你的应用必须使用 `database`、`memcached`、`dynamodb` 或 `redis` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器必须与同一个中央缓存服务器通信。

如果你的应用调度器在多台服务器上运行，你可以将计划任务限制为仅在单台服务器上执行。例如，假设你有一个计划任务，在每个周五晚上生成一份新报告。如果任务调度器在三台工作服务器上运行，计划任务将在所有三台服务器上运行并生成三次报告。这可不好！

要指示任务应仅在一台服务器上运行，请在定义计划任务时使用 `onOneServer` 方法。第一个获得任务的服务器将获得任务的原子锁，以防止其他服务器同时运行同一任务：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->fridays()
    ->at('17:00')
    ->onOneServer();
```

你可以使用 `useCache` 方法自定义调度器用于获取单服务器任务所需原子锁的缓存存储：

```php
Schedule::useCache('database');
```

<a name="naming-unique-jobs"></a>
#### 命名单服务器任务

有时你可能需要调度具有不同参数的同一任务，同时仍指示 Laravel 在单台服务器上运行任务的每个变体。为此，你可以通过 `name` 方法为每个调度定义分配一个唯一名称：

```php
Schedule::job(new CheckUptime('https://laravel.com'))
    ->name('check_uptime:laravel.com')
    ->everyFiveMinutes()
    ->onOneServer();

Schedule::job(new CheckUptime('https://vapor.laravel.com'))
    ->name('check_uptime:vapor.laravel.com')
    ->everyFiveMinutes()
    ->onOneServer();
```

类似地，如果计划闭包要在单台服务器上运行，则必须为其分配名称：

```php
Schedule::call(fn () => User::resetApiRequestCount())
    ->name('reset-api-request-count')
    ->daily()
    ->onOneServer();
```

<a name="background-tasks"></a>
### 后台任务

默认情况下，在同一时间调度的多个任务将根据它们在 `schedule` 方法中定义的顺序依次执行。如果你有长时间运行的任务，这可能导致后续任务比预期晚得多才启动。如果你想在后台运行任务，使它们可以同时运行，可以使用 `runInBackground` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('analytics:report')
    ->daily()
    ->runInBackground();
```

> [!WARNING]
> `runInBackground` 方法只能在通过 `command` 和 `exec` 方法调度任务时使用。

<a name="maintenance-mode"></a>
### 维护模式

当应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，应用的计划任务将不会运行，因为我们不希望你的任务干扰你可能正在服务器上执行的未完成的维护。但是，如果你想强制任务即使在维护模式下也运行，可以在定义任务时调用 `evenInMaintenanceMode` 方法：

```php
Schedule::command('emails:send')->evenInMaintenanceMode();
```

<a name="pausing-scheduled-tasks"></a>
### 暂停计划任务

你可以使用 `schedule:pause` Artisan 命令临时暂停计划任务的处理，而无需更改已部署的代码：

```shell
php artisan schedule:pause
```

当调度器暂停时，不会有任何计划任务运行。你可以使用 `schedule:continue` 命令恢复计划任务的处理：

```shell
php artisan schedule:continue
```

如果某个任务在调度器暂停时仍应运行，可以用 `evenWhenPaused` 方法标记它：

```php
Schedule::command('emails:send')->evenWhenPaused();
```

<a name="schedule-groups"></a>
### 调度组

在定义具有相似配置的多个计划任务时，你可以使用 Laravel 的任务分组功能，避免为每个任务重复相同的设置。对任务进行分组可以简化代码，并确保相关任务之间的一致性。

要创建一组计划任务，请调用所需的任务配置方法，然后调用 `group` 方法。`group` 方法接受一个闭包，负责定义共享指定配置的任务：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::daily()
    ->onOneServer()
    ->timezone('America/New_York')
    ->group(function () {
        Schedule::command('emails:send --force');
        Schedule::command('emails:prune');
    });
```

<a name="running-the-scheduler"></a>
## 运行调度器

既然我们已经学会了如何定义计划任务，下面讨论如何实际在服务器上运行它们。`schedule:run` Artisan 命令将评估所有计划任务，并根据服务器的当前时间判断它们是否需要运行。

因此，使用 Laravel 的调度器时，我们只需要在服务器上添加一个 cron 配置条目，每分钟运行一次 `schedule:run` 命令。如果你不知道如何向服务器添加 cron 条目，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com) 等托管平台，它可以为你管理计划任务的执行：

```shell
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

<a name="sub-minute-scheduled-tasks"></a>
### 秒级计划任务

在大多数操作系统上，cron 任务限制为每分钟最多运行一次。但是，Laravel 的调度器允许你将任务调度为以更频繁的时间间隔运行，甚至可以每秒运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->everySecond();
```

当在应用中定义了秒级任务时，`schedule:run` 命令将持续运行到当前分钟结束，而不是立即退出。这允许该命令在整个分钟内调用所有所需的秒级任务。

由于耗时超过预期的秒级任务可能会延迟后续秒级任务的执行，建议所有秒级任务都通过分发队列任务或后台命令来处理实际的任务处理：

```php
use App\Jobs\DeleteRecentUsers;

Schedule::job(new DeleteRecentUsers)->everyTenSeconds();

Schedule::command('users:delete')->everyTenSeconds()->runInBackground();
```

<a name="interrupting-sub-minute-tasks"></a>
#### 中断秒级任务

由于定义了秒级任务后，`schedule:run` 命令会在被调用的整个分钟内运行，你在部署应用时有时可能需要中断该命令。否则，一个已经在运行的 `schedule:run` 命令实例将继续使用应用先前部署的代码，直到当前分钟结束。

要中断正在进行的 `schedule:run` 调用，可以将 `schedule:interrupt` 命令添加到应用的部署脚本中。此命令应在应用完成部署后调用：

```shell
php artisan schedule:interrupt
```

<a name="running-the-scheduler-locally"></a>
### 在本地运行调度器

通常，你不会在本地开发机器上添加调度器 cron 条目。相反，你可以使用 `schedule:work` Artisan 命令。此命令将在前台运行，并每分钟调用一次调度器，直到你终止该命令。当定义了秒级任务时，调度器将在每分钟内持续运行以处理这些任务：

```shell
php artisan schedule:work
```

<a name="task-output"></a>
## 任务输出

Laravel 调度器提供了几种处理计划任务生成输出的便捷方法。首先，使用 `sendOutputTo` 方法，你可以将输出发送到文件以供稍后检查：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->sendOutputTo($filePath);
```

如果你想将输出追加到给定文件，可以使用 `appendOutputTo` 方法：

```php
Schedule::command('emails:send')
    ->daily()
    ->appendOutputTo($filePath);
```

使用 `emailOutputTo` 方法，你可以将输出通过邮件发送到你选择的邮箱地址。在通过邮件发送任务输出之前，你应该先配置 Laravel 的[邮件服务](/docs/{{version}}/mail)：

```php
Schedule::command('report:generate')
    ->daily()
    ->sendOutputTo($filePath)
    ->emailOutputTo('taylor@example.com');
```

如果你只想在计划 Artisan 或系统命令以非零退出码终止时通过邮件发送输出，请使用 `emailOutputOnFailure` 方法：

```php
Schedule::command('report:generate')
    ->daily()
    ->emailOutputOnFailure('taylor@example.com');
```

> [!WARNING]
> `emailOutputTo`、`emailOutputOnFailure`、`sendOutputTo` 和 `appendOutputTo` 方法仅适用于 `command` 和 `exec` 方法。

<a name="task-hooks"></a>
## 任务钩子

使用 `before` 和 `after` 方法，你可以指定在计划任务执行之前和之后要执行的代码：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->before(function () {
        // The task is about to execute...
    })
    ->after(function () {
        // The task has executed...
    });
```

`onSuccess` 和 `onFailure` 方法允许你指定在计划任务成功或失败时执行的代码。失败表示计划 Artisan 或系统命令以非零退出码终止：

```php
Schedule::command('emails:send')
    ->daily()
    ->onSuccess(function () {
        // The task succeeded...
    })
    ->onFailure(function () {
        // The task failed...
    });
```

如果可以从你的命令中获得输出，你可以通过在钩子闭包定义中类型提示 `Illuminate\Support\Stringable` 实例作为 `$output` 参数，在 `after`、`onSuccess` 或 `onFailure` 钩子中访问它：

```php
use Illuminate\Support\Stringable;

Schedule::command('emails:send')
    ->daily()
    ->onSuccess(function (Stringable $output) {
        // The task succeeded...
    })
    ->onFailure(function (Stringable $output) {
        // The task failed...
    });
```

<a name="pinging-urls"></a>
#### Ping URL

使用 `pingBefore` 和 `thenPing` 方法，调度器可以在任务执行之前或之后自动 ping 给定的 URL。此方法用于通知 [Envoyer](https://envoyer.io) 等外部服务你的计划任务已开始或已完成执行：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingBefore($url)
    ->thenPing($url);
```

`pingOnSuccess` 和 `pingOnFailure` 方法可用于仅在任务成功或失败时 ping 给定的 URL。失败表示计划 Artisan 或系统命令以非零退出码终止：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingOnSuccess($successUrl)
    ->pingOnFailure($failureUrl);
```

`pingBeforeIf`、`thenPingIf`、`pingOnSuccessIf` 和 `pingOnFailureIf` 方法可用于仅在给定条件为 `true` 时 ping 给定的 URL：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingBeforeIf($condition, $url)
    ->thenPingIf($condition, $url);

Schedule::command('emails:send')
    ->daily()
    ->pingOnSuccessIf($condition, $successUrl)
    ->pingOnFailureIf($condition, $failureUrl);
```

<a name="events"></a>
## 事件

Laravel 在调度过程中分发各种[事件](/docs/{{version}}/events)。你可以为以下任何事件[定义监听器](/docs/{{version}}/events)：

| 事件名称                                                  |
| ----------------------------------------------------------- |
| `Illuminate\Console\Events\ScheduledTaskStarting`           |
| `Illuminate\Console\Events\ScheduledTaskFinished`           |
| `Illuminate\Console\Events\ScheduledBackgroundTaskFinished` |
| `Illuminate\Console\Events\ScheduledTaskSkipped`            |
| `Illuminate\Console\Events\ScheduledTaskFailed`             |
