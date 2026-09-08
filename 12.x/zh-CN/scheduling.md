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
    - [调度分组](#schedule-groups)
- [运行调度器](#running-the-scheduler)
    - [分钟内调度任务](#sub-minute-scheduled-tasks)
    - [在本地运行调度器](#running-the-scheduler-locally)
- [任务输出](#task-output)
- [任务钩子](#task-hooks)
- [事件](#events)

<a name="introduction"></a>
## 简介

过去，你可能需要为服务器上每个需要调度的任务编写一条 cron 配置条目。然而，这种方式很快就会变得令人头疼：你的任务计划不再纳入源码版本控制，而且你必须通过 SSH 登录服务器才能查看现有的 cron 条目或添加新条目。

Laravel 的命令调度器为管理服务器上的计划任务提供了一种全新的方式。调度器让你能够在 Laravel 应用内部流畅而富有表现力地定义命令计划。使用调度器时，服务器上只需要一条 cron 条目。你的任务计划通常定义在应用的 `routes/console.php` 文件中。

<a name="defining-schedules"></a>
## 定义调度

你可以在应用的 `routes/console.php` 文件中定义所有的计划任务。首先，我们来看一个示例。在这个示例中，我们将调度一个闭包在每天午夜调用。在闭包中，我们将执行一个数据库查询来清空一张表：

```php
<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->daily();
```

除了使用闭包进行调度，你还可以调度[可调用对象](https://secure.php.net/manual/en/language.oop5.magic.php#object.invoke)。可调用对象是包含 `__invoke` 方法的简单 PHP 类：

```php
Schedule::call(new DeleteRecentUsers)->daily();
```

如果你更愿意让 `routes/console.php` 文件只用于命令定义，可以使用应用 `bootstrap/app.php` 文件中的 `withSchedule` 方法定义计划任务。该方法接收一个闭包，闭包会收到调度器实例：

```php
use Illuminate\Console\Scheduling\Schedule;

->withSchedule(function (Schedule $schedule) {
    $schedule->call(new DeleteRecentUsers)->daily();
})
```

如果你想查看计划任务的概览及其下次计划运行时间，可以使用 `schedule:list` Artisan 命令：

```shell
php artisan schedule:list
```

<a name="scheduling-artisan-commands"></a>
### 调度 Artisan 命令

除了调度闭包，你还可以调度 [Artisan 命令](/docs/{{version}}/artisan)和系统命令。例如，你可以使用 `command` 方法，通过命令名称或类来调度 Artisan 命令。

使用命令类名调度 Artisan 命令时，你可以传递一个数组，其中包含命令被调用时应附带的额外命令行参数：

```php
use App\Console\Commands\SendEmailsCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send Taylor --force')->daily();

Schedule::command(SendEmailsCommand::class, ['Taylor', '--force'])->daily();
```

<a name="scheduling-artisan-closure-commands"></a>
#### 调度 Artisan 闭包命令

如果你想调度一个由闭包定义的 Artisan 命令，可以在命令定义之后链式调用调度相关方法：

```php
Artisan::command('delete:recent-users', function () {
    DB::table('recent_users')->delete();
})->purpose('Delete recent users')->daily();
```

如果需要向闭包命令传递参数，可以将它们提供给 `schedule` 方法：

```php
Artisan::command('emails:send {user} {--force}', function ($user) {
    // ...
})->purpose('Send emails to the specified user')->schedule(['Taylor', '--force'])->daily();
```

<a name="scheduling-queued-jobs"></a>
### 调度队列任务

`job` 方法可用于调度一个[队列任务](/docs/{{version}}/queues)。该方法提供了一种便捷的方式来调度队列任务，无需使用 `call` 方法定义闭包来将任务加入队列：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new Heartbeat)->everyFiveMinutes();
```

`job` 方法还可以选择性地提供第二个和第三个参数，分别用于指定任务入队时应使用的队列名称和队列连接：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

// 通过 "sqs" 连接将任务分发到 "heartbeats" 队列……
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

我们已经看过几个如何配置任务按指定间隔运行的示例。不过，你还可以为任务指定更多的调度频率：

| 方法                             | 说明                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `->cron('* * * * *');`             | 按自定义 cron 计划运行任务。                  |
| `->everySecond();`                 | 每秒运行一次任务。                               |
| `->everyTwoSeconds();`             | 每两秒运行一次任务。                          |
| `->everyFiveSeconds();`            | 每五秒运行一次任务。                         |
| `->everyTenSeconds();`             | 每十秒运行一次任务。                         |
| `->everyFifteenSeconds();`         | 每十五秒运行一次任务。                         |
| `->everyTwentySeconds();`          | 每二十秒运行一次任务。                         |
| `->everyThirtySeconds();`          | 每三十秒运行一次任务。                         |
| `->everyMinute();`                 | 每分钟运行一次任务。                               |
| `->everyTwoMinutes();`             | 每两分钟运行一次任务。                          |
| `->everyThreeMinutes();`           | 每三分钟运行一次任务。                        |
| `->everyFourMinutes();`            | 每四分钟运行一次任务。                         |
| `->everyFiveMinutes();`            | 每五分钟运行一次任务。                         |
| `->everyTenMinutes();`             | 每十分钟运行一次任务。                         |
| `->everyFifteenMinutes();`         | 每十五分钟运行一次任务。                         |
| `->everyThirtyMinutes();`          | 每三十分钟运行一次任务。                         |
| `->hourly();`                      | 每小时运行一次任务。                                 |
| `->hourlyAt(17);`                  | 每小时的第 17 分钟运行一次任务。     |
| `->everyOddHour($minutes = 0);`    | 每隔一个奇数小时运行一次任务。                             |
| `->everyTwoHours($minutes = 0);`   | 每两小时运行一次任务。                            |
| `->everyThreeHours($minutes = 0);` | 每三小时运行一次任务。                          |
| `->everyFourHours($minutes = 0);`  | 每四小时运行一次任务。                           |
| `->everySixHours($minutes = 0);`   | 每六小时运行一次任务。                            |
| `->daily();`                       | 每天午夜运行一次任务。                      |
| `->dailyAt('13:00');`              | 每天 13:00 运行一次任务。                         |
| `->twiceDaily(1, 13);`             | 每天 1:00 和 13:00 各运行一次任务。                      |
| `->twiceDailyAt(1, 13, 15);`       | 每天 1:15 和 13:15 各运行一次任务。                      |
| `->daysOfMonth([1, 10, 20]);`      | 在每月的指定日期运行任务。              |
| `->weekly();`                      | 每周日 00:00 运行一次任务。                      |
| `->weeklyOn(1, '8:00');`           | 每周一 8:00 运行一次任务。               |
| `->monthly();`                     | 每月第一天 00:00 运行一次任务。   |
| `->monthlyOn(4, '15:00');`         | 每月 4 日 15:00 运行一次任务。            |
| `->twiceMonthly(1, 16, '13:00');`  | 每月 1 日和 16 日的 13:00 各运行一次任务。       |
| `->lastDayOfMonth('15:00');`       | 每月最后一天 15:00 运行一次任务。      |
| `->quarterly();`                   | 每季度第一天 00:00 运行一次任务。 |
| `->quarterlyOn(4, '14:00');`       | 每季度第 4 天 14:00 运行一次任务。          |
| `->yearly();`                      | 每年第一天 00:00 运行一次任务。    |
| `->yearlyOn(6, 1, '17:00');`       | 每年 6 月 1 日 17:00 运行一次任务。            |
| `->timezone('America/New_York');`  | 设置任务的时区。                           |

这些方法可以与额外的约束条件组合，创建只在每周特定日期运行的更精细的计划。例如，你可以调度一个命令每周一运行：

```php
use Illuminate\Support\Facades\Schedule;

// 每周一下午 1 点运行一次……
Schedule::call(function () {
    // ...
})->weekly()->mondays()->at('13:00');

// 工作日上午 8 点到下午 5 点每小时运行一次……
Schedule::command('foo')
    ->weekdays()
    ->hourly()
    ->timezone('America/Chicago')
    ->between('8:00', '17:00');
```

下面是额外的调度约束条件列表：

| 方法                                   | 说明                                            |
| ---------------------------------------- | ------------------------------------------------------ |
| `->weekdays();`                          | 将任务限制在工作日。                            |
| `->weekends();`                          | 将任务限制在周末。                            |
| `->sundays();`                           | 将任务限制在周日。                              |
| `->mondays();`                           | 将任务限制在周一。                              |
| `->tuesdays();`                          | 将任务限制在周二。                              |
| `->wednesdays();`                        | 将任务限制在周三。                              |
| `->thursdays();`                         | 将任务限制在周四。                              |
| `->fridays();`                           | 将任务限制在周五。                              |
| `->saturdays();`                         | 将任务限制在周六。                              |
| `->days(array\|mixed);`                  | 将任务限制在指定日期。                       |
| `->between($startTime, $endTime);`       | 将任务限制在开始时间与结束时间之间运行。     |
| `->unlessBetween($startTime, $endTime);` | 将任务限制为不在开始时间与结束时间之间运行。 |
| `->when(Closure);`                       | 基于真值测试来限制任务。                  |
| `->environments($env);`                  | 将任务限制在指定环境。               |

<a name="day-constraints"></a>
#### 日期约束

`days` 方法可用于将任务的执行限制在一周中的指定日期。例如，你可以调度一个命令在周日和周三每小时运行一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->hourly()
    ->days([0, 3]);
```

此外，在定义任务应运行的日期时，可以使用 `Illuminate\Console\Scheduling\Schedule` 类上提供的常量：

```php
use Illuminate\Support\Facades;
use Illuminate\Console\Scheduling\Schedule;

Facades\Schedule::command('emails:send')
    ->hourly()
    ->days([Schedule::SUNDAY, Schedule::WEDNESDAY]);
```

<a name="between-time-constraints"></a>
#### 时间段约束

`between` 方法可用于根据一天中的时间来限制任务的执行：

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

`when` 方法可用于根据给定真值测试的结果来限制任务的执行。换言之，如果给定的闭包返回 `true`，那么只要没有其他约束条件阻止任务运行，任务就会执行：

```php
Schedule::command('emails:send')->daily()->when(function () {
    return true;
});
```

`skip` 方法可以看作 `when` 的反向操作。如果 `skip` 方法返回 `true`，计划任务将不会执行：

```php
Schedule::command('emails:send')->daily()->skip(function () {
    return true;
});
```

使用链式调用的多个 `when` 方法时，只有当所有 `when` 条件都返回 `true`，被调度的命令才会执行。

<a name="environment-constraints"></a>
#### 环境约束

`environments` 方法可用于仅在指定环境中执行任务（环境由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#environment-configuration)定义）：

```php
Schedule::command('emails:send')
    ->daily()
    ->environments(['staging', 'production']);
```

<a name="timezones"></a>
### 时区

使用 `timezone` 方法，你可以指定计划任务的时间应在给定的时区内解释：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->timezone('America/New_York')
    ->at('2:00')
```

如果你需要反复为所有计划任务指定同一个时区，可以在应用的 `app` 配置文件中定义 `schedule_timezone` 选项，为所有调度指定该时区：

```php
'timezone' => 'UTC',

'schedule_timezone' => 'America/Chicago',
```

> [!WARNING]
> 请记住，有些时区使用夏令时。当夏令时切换发生时，你的计划任务可能会运行两次，甚至完全不会运行。因此，我们建议尽可能避免使用时区调度。

<a name="preventing-task-overlaps"></a>
### 防止任务重叠

默认情况下，即使任务的上一个实例仍在运行，计划任务也会照常运行。要防止这种情况，你可以使用 `withoutOverlapping` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->withoutOverlapping();
```

在这个示例中，`emails:send` [Artisan 命令](/docs/{{version}}/artisan)如果尚未在运行，则每分钟都会运行一次。`withoutOverlapping` 方法对于执行时间差异极大的任务尤其有用，因为这类任务让你无法准确预测某个任务需要运行多长时间。

如有需要，你可以指定「不重叠」锁过期前需要经过的分钟数。默认情况下，该锁会在 24 小时后过期：

```php
Schedule::command('emails:send')->withoutOverlapping(10);
```

在底层，`withoutOverlapping` 方法利用应用的[缓存](/docs/{{version}}/cache)来获取锁。必要时，你可以使用 `schedule:clear-cache` Artisan 命令清除这些缓存锁。通常，只有在任务因服务器意外故障而卡住时，才需要这样做。

<a name="running-tasks-on-one-server"></a>
### 在单台服务器上运行任务

> [!WARNING]
> 要使用此功能，你的应用必须使用 `database`、`memcached`、`dynamodb` 或 `redis` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器都必须与同一个中央缓存服务器通信。

如果你的应用调度器运行在多台服务器上，你可以将计划任务限制为只在单台服务器上执行。例如，假设你有一个每周五晚上生成新报告的计划任务。如果任务调度器运行在三台 worker 服务器上，该计划任务就会在三台服务器上各运行一次，报告会被生成三次。这可不行！

要指明任务只应在一台服务器上运行，请在定义计划任务时使用 `onOneServer` 方法。最先获取到任务的服务器会对该任务加一把原子锁，防止其他服务器同时运行同一任务：

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
#### 为单服务器任务命名

有时，你可能需要调度同一个任务以不同参数分发多次，同时仍让 Laravel 在单台服务器上运行该任务的每种组合。为此，你可以通过 `name` 方法为每个调度定义指定唯一的名称：

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

类似地，如果计划任务闭包打算在单台服务器上运行，也必须为其指定名称：

```php
Schedule::call(fn () => User::resetApiRequestCount())
    ->name('reset-api-request-count')
    ->daily()
    ->onOneServer();
```

<a name="background-tasks"></a>
### 后台任务

默认情况下，同一时间调度的多个任务会根据它们在 `schedule` 方法中定义的顺序依次执行。如果你有长时间运行的任务，这可能导致后续任务的启动时间比预期晚得多。如果你想让任务在后台运行以便它们能同时运行，可以使用 `runInBackground` 方法：

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

当应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，应用的计划任务不会运行，因为我们不希望你的任务干扰服务器上尚未完成的维护工作。不过，如果你想强制某个任务即使在维护模式下也照常运行，可以在定义该任务时调用 `evenInMaintenanceMode` 方法：

```php
Schedule::command('emails:send')->evenInMaintenanceMode();
```

<a name="schedule-groups"></a>
### 调度分组

在定义多个配置相似的计划任务时，你可以使用 Laravel 的任务分组功能，避免为每个任务重复相同的设置。任务分组可以简化代码，并确保相关任务的配置保持一致。

要创建一组计划任务，请先调用所需的任务配置方法，再调用 `group` 方法。`group` 方法接收一个闭包，由该闭包负责定义共享指定配置的任务：

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

既然我们已经学会了如何定义计划任务，接下来讨论如何在服务器上实际运行它们。`schedule:run` Artisan 命令会评估你的所有计划任务，并根据服务器的当前时间判断它们是否需要运行。

因此，在使用 Laravel 的调度器时，我们只需在服务器上添加一条 cron 配置条目，每分钟运行一次 `schedule:run` 命令。如果你不知道如何向服务器添加 cron 条目，可以考虑使用 [Laravel Cloud](https://cloud.laravel.com) 之类的托管平台，由它替你管理计划任务的执行：

```shell
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

<a name="sub-minute-scheduled-tasks"></a>
### 分钟内调度任务

在大多数操作系统上，cron 任务的运行频率最高为每分钟一次。不过，Laravel 的调度器允许你以更高的频率调度任务，甚至可以每秒一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->everySecond();
```

当应用中定义了分钟内任务时，`schedule:run` 命令会持续运行到当前分钟结束，而不是立即退出。这样，该命令就能在这一分钟内调用所有需要的分钟内任务。

由于运行时间超出预期的分钟内任务可能会延迟后续分钟内任务的执行，因此建议所有分钟内任务都分发队列任务或后台命令来处理实际的任务逻辑：

```php
use App\Jobs\DeleteRecentUsers;

Schedule::job(new DeleteRecentUsers)->everyTenSeconds();

Schedule::command('users:delete')->everyTenSeconds()->runInBackground();
```

<a name="interrupting-sub-minute-tasks"></a>
#### 中断分钟内任务

当定义了分钟内任务时，`schedule:run` 命令会在被调用的整个分钟内持续运行，因此在部署应用时，你有时可能需要中断该命令。否则，已经在运行的 `schedule:run` 命令实例会继续使用应用先前部署的代码，直到当前分钟结束。

要中断正在进行的 `schedule:run` 调用，可以将 `schedule:interrupt` 命令添加到应用的部署脚本中。该命令应在应用部署完成后调用：

```shell
php artisan schedule:interrupt
```

<a name="running-the-scheduler-locally"></a>
### 在本地运行调度器

通常，你不需要在本地开发机器上添加调度器 cron 条目。你可以改用 `schedule:work` Artisan 命令。该命令会在前台运行，并每分钟调用一次调度器，直到你终止该命令。当定义了分钟内任务时，调度器会在每一分钟内持续运行以处理这些任务：

```shell
php artisan schedule:work
```

<a name="task-output"></a>
## 任务输出

Laravel 调度器提供了几种便捷的方法来处理计划任务产生的输出。首先，使用 `sendOutputTo` 方法，你可以将输出发送到一个文件中，以便稍后检查：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->sendOutputTo($filePath);
```

如果你想将输出追加到指定文件，可以使用 `appendOutputTo` 方法：

```php
Schedule::command('emails:send')
    ->daily()
    ->appendOutputTo($filePath);
```

使用 `emailOutputTo` 方法，你可以将输出通过邮件发送到你选择的邮箱地址。在通过邮件发送任务输出之前，你应先配置 Laravel 的[邮件服务](/docs/{{version}}/mail)：

```php
Schedule::command('report:generate')
    ->daily()
    ->sendOutputTo($filePath)
    ->emailOutputTo('taylor@example.com');
```

如果你只想在计划调度的 Artisan 命令或系统命令以非零退出码终止时，才通过邮件发送输出，请使用 `emailOutputOnFailure` 方法：

```php
Schedule::command('report:generate')
    ->daily()
    ->emailOutputOnFailure('taylor@example.com');
```

> [!WARNING]
> `emailOutputTo`、`emailOutputOnFailure`、`sendOutputTo` 和 `appendOutputTo` 方法只能配合 `command` 和 `exec` 方法使用。

<a name="task-hooks"></a>
## 任务钩子

使用 `before` 和 `after` 方法，你可以指定在计划任务执行之前和之后执行的代码：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->before(function () {
        // 任务即将执行……
    })
    ->after(function () {
        // 任务已执行……
    });
```

`onSuccess` 和 `onFailure` 方法允许你指定在计划任务成功或失败时执行的代码。失败表示被调度的 Artisan 命令或系统命令以非零退出码终止：

```php
Schedule::command('emails:send')
    ->daily()
    ->onSuccess(function () {
        // 任务成功……
    })
    ->onFailure(function () {
        // 任务失败……
    });
```

如果命令有可用输出，你可以在 `after`、`onSuccess` 或 `onFailure` 钩子中访问它。只需在钩子闭包定义的 `$output` 参数上以类型提示的方式声明 `Illuminate\Support\Stringable` 实例：

```php
use Illuminate\Support\Stringable;

Schedule::command('emails:send')
    ->daily()
    ->onSuccess(function (Stringable $output) {
        // 任务成功……
    })
    ->onFailure(function (Stringable $output) {
        // 任务失败……
    });
```

<a name="pinging-urls"></a>
#### Ping URL

使用 `pingBefore` 和 `thenPing` 方法，调度器可以在任务执行之前或之后自动 ping 指定的 URL。此方法适用于通知外部服务（例如 [Envoyer](https://envoyer.io)）你的计划任务正在开始或已经结束执行：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingBefore($url)
    ->thenPing($url);
```

`pingOnSuccess` 和 `pingOnFailure` 方法可用于仅在任务成功或失败时 ping 指定的 URL。失败表示被调度的 Artisan 命令或系统命令以非零退出码终止：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingOnSuccess($successUrl)
    ->pingOnFailure($failureUrl);
```

`pingBeforeIf`、`thenPingIf`、`pingOnSuccessIf` 和 `pingOnFailureIf` 方法可用于仅在给定条件为 `true` 时 ping 指定的 URL：

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

Laravel 会在调度过程中派发多种[事件](/docs/{{version}}/events)。你可以为以下任何事件[定义监听器](/docs/{{version}}/events)：

| 事件名称                                                  |
| ----------------------------------------------------------- |
| `Illuminate\Console\Events\ScheduledTaskStarting`           |
| `Illuminate\Console\Events\ScheduledTaskFinished`           |
| `Illuminate\Console\Events\ScheduledBackgroundTaskFinished` |
| `Illuminate\Console\Events\ScheduledTaskSkipped`            |
| `Illuminate\Console\Events\ScheduledTaskFailed`             |
