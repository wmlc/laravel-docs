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
    - [亚分钟级调度任务](#sub-minute-scheduled-tasks)
    - [在本地运行调度器](#running-the-scheduler-locally)
- [任务输出](#task-output)
- [任务钩子](#task-hooks)
- [事件](#events)

<a name="introduction"></a>
## 简介

过去，你可能需要在服务器上为每一个要调度的任务编写一条 cron 配置项。然而，这很快就会变得令人痛苦，因为你的任务调度不再受源代码管理控制，而且你必须 SSH 到服务器才能查看已有的 cron 配置项或添加新的配置项。

Laravel 的命令调度器为管理服务器上的定时任务提供了一种全新的思路。调度器允许你在 Laravel 应用内部以流畅且富有表达力的方式定义命令调度。使用调度器时，服务器上只需要一条 cron 配置项。你的任务调度通常定义在应用的 `routes/console.php` 文件中。

<a name="defining-schedules"></a>
## 定义调度

你可以在应用的 `routes/console.php` 文件中定义所有定时任务。要开始使用，我们先来看一个示例。在这个示例中，我们会安排一个每天在午夜调用的闭包。在该闭包内部，我们执行一条数据库查询来清空某张表：

```php
<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->daily();
```

除了使用闭包调度之外，你还可以调度[可调用对象](https://secure.php.net/manual/en/language.oop5.magic.php#object.invoke)。可调用对象是包含 `__invoke` 方法的简单 PHP 类：

```php
Schedule::call(new DeleteRecentUsers)->daily();
```

如果你希望把 `routes/console.php` 文件专门留给命令定义使用，可以在应用的 `bootstrap/app.php` 文件中使用 `withSchedule` 方法来定义定时任务。该方法接受一个闭包，闭包会收到调度器的一个实例：

```php
use Illuminate\Console\Scheduling\Schedule;

->withSchedule(function (Schedule $schedule) {
    $schedule->call(new DeleteRecentUsers)->daily();
})
```

如果你想查看所有定时任务的概览以及它们下一次被调度执行的时间，可以使用 `schedule:list` Artisan 命令：

```bash
php artisan schedule:list
```

<a name="scheduling-artisan-commands"></a>
### 调度 Artisan 命令

除了调度闭包之外，你还可以调度 [Artisan 命令](/docs/{{version}}/artisan)和系统命令。例如，你可以使用 `command` 方法，按命令名称或类名来调度 Artisan 命令。

使用命令类名调度 Artisan 命令时，可以传入一个额外的命令行参数数组，用于在命令被调用时提供给它：

```php
use App\Console\Commands\SendEmailsCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send Taylor --force')->daily();

Schedule::command(SendEmailsCommand::class, ['Taylor', '--force'])->daily();
```

<a name="scheduling-artisan-closure-commands"></a>
#### 调度 Artisan 闭包命令

如果你想调度由闭包定义的 Artisan 命令，可以在命令定义之后链式调用与调度相关的方法：

```php
Artisan::command('delete:recent-users', function () {
    DB::table('recent_users')->delete();
})->purpose('Delete recent users')->daily();
```

如果需要向闭包命令传参，可以把它们提供给 `schedule` 方法：

```php
Artisan::command('emails:send {user} {--force}', function ($user) {
    // ...
})->purpose('Send emails to the specified user')->schedule(['Taylor', '--force'])->daily();
```

<a name="scheduling-queued-jobs"></a>
### 调度队列任务

`job` 方法可用于调度[队列任务](/docs/{{version}}/queues)。该方法提供了一种便捷方式，让你不必使用 `call` 方法定义闭包即可调度队列任务：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new Heartbeat)->everyFiveMinutes();
```

你还可以向 `job` 方法提供可选的第二个和第三个参数，用于指定排队该任务时应使用的队列名称和队列连接：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

// 把任务分发到 "sqs" 连接上的 "heartbeats" 队列...
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

我们已经看过几个如何把任务配置为按指定间隔运行的示例。不过，你可以为任务分配的调度频率还有更多：

<div class="overflow-auto">

| 方法                                  | 说明                                   |
| ------------------------------------- | -------------------------------------- |
| `->cron('* * * * *');`              | 按自定义 cron 调度运行任务。           |
| `->everySecond();`                  | 每秒运行任务。                          |
| `->everyTwoSeconds();`              | 每两秒运行任务。                        |
| `->everyFiveSeconds();`             | 每五秒运行任务。                        |
| `->everyTenSeconds();`              | 每十秒运行任务。                        |
| `->everyFifteenSeconds();`          | 每十五秒运行任务。                      |
| `->everyTwentySeconds();`           | 每二十秒运行任务。                      |
| `->everyThirtySeconds();`           | 每三十秒运行任务。                      |
| `->everyMinute();`                  | 每分钟运行任务。                        |
| `->everyTwoMinutes();`              | 每两分钟运行任务。                      |
| `->everyThreeMinutes();`            | 每三分钟运行任务。                      |
| `->everyFourMinutes();`             | 每四分钟运行任务。                      |
| `->everyFiveMinutes();`             | 每五分钟运行任务。                      |
| `->everyTenMinutes();`              | 每十分钟运行任务。                      |
| `->everyFifteenMinutes();`          | 每十五分钟运行任务。                    |
| `->everyThirtyMinutes();`           | 每三十分钟运行任务。                    |
| `->hourly();`                       | 每小时运行任务。                        |
| `->hourlyAt(17);`                   | 每小时在整点后第 17 分钟运行任务。       |
| `->everyOddHour($minutes = 0);`     | 每个奇数小时运行任务。                  |
| `->everyTwoHours($minutes = 0);`    | 每两小时运行任务。                      |
| `->everyThreeHours($minutes = 0);`  | 每三小时运行任务。                      |
| `->everyFourHours($minutes = 0);`   | 每四小时运行任务。                      |
| `->everySixHours($minutes = 0);`    | 每六小时运行任务。                      |
| `->daily();`                        | 每天在午夜运行任务。                    |
| `->dailyAt('13:00');`               | 每天在 13:00 运行任务。                 |
| `->twiceDaily(1, 13);`              | 每天在 1:00 和 13:00 运行任务。         |
| `->twiceDailyAt(1, 13, 15);`        | 每天在 1:15 和 13:15 运行任务。         |
| `->weekly();`                       | 每周日在 00:00 运行任务。               |
| `->weeklyOn(1, '8:00');`            | 每周一在 8:00 运行任务。                |
| `->monthly();`                      | 每月第一天在 00:00 运行任务。            |
| `->monthlyOn(4, '15:00');`          | 每月 4 日在 15:00 运行任务。            |
| `->twiceMonthly(1, 16, '13:00');`   | 每月 1 日和 16 日在 13:00 运行任务。    |
| `->lastDayOfMonth('15:00');`        | 每月最后一天在 15:00 运行任务。         |
| `->quarterly();`                    | 每季度第一天在 00:00 运行任务。         |
| `->quarterlyOn(4, '14:00');`        | 每季度 4 日在 14:00 运行任务。          |
| `->yearly();`                       | 每年第一天在 00:00 运行任务。          |
| `->yearlyOn(6, 1, '17:00');`        | 每年 6 月 1 日在 17:00 运行任务。       |
| `->timezone('America/New_York');`   | 设置任务的时区。                        |

</div>

这些方法还可以与额外的约束条件组合使用，以创建更精细、只在特定星期几运行的调度。例如，你可以把某个命令调度为每周一运行：

```php
use Illuminate\Support\Facades\Schedule;

// 每周一 13:00 运行一次...
Schedule::call(function () {
    // ...
})->weekly()->mondays()->at('13:00');

// 工作日 8:00 至 17:00 每小时运行...
Schedule::command('foo')
    ->weekdays()
    ->hourly()
    ->timezone('America/Chicago')
    ->between('8:00', '17:00');
```

下面列出了一些额外的调度约束：

<div class="overflow-auto">

| 方法                                    | 说明                                 |
| --------------------------------------- | ------------------------------------ |
| `->weekdays();`                         | 把任务限制在工作日运行。             |
| `->weekends();`                         | 把任务限制在周末运行。               |
| `->sundays();`                          | 把任务限制在星期日运行。             |
| `->mondays();`                          | 把任务限制在星期一运行。             |
| `->tuesdays();`                         | 把任务限制在星期二运行。             |
| `->wednesdays();`                       | 把任务限制在星期三运行。             |
| `->thursdays();`                        | 把任务限制在星期四运行。             |
| `->fridays();`                          | 把任务限制在星期五运行。             |
| `->saturdays();`                        | 把任务限制在星期六运行。             |
| `->days(array\|mixed);`                 | 把任务限制在特定日期运行。           |
| `->between($startTime, $endTime);`      | 把任务限制在开始与结束时间之间运行。 |
| `->unlessBetween($startTime, $endTime);` | 排除任务在开始与结束时间之间运行。   |
| `->when(Closure);`                      | 根据真假判断限制任务。               |
| `->environments($env);`                 | 把任务限制在特定环境中运行。         |

</div>

<a name="day-constraints"></a>
#### 日期约束

`days` 方法可用于把任务的执行限制在特定的星期几。例如，你可以把某个命令调度为在星期日与星期三每小时运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->hourly()
    ->days([0, 3]);
```

或者，你也可以在定义任务应运行的日期时，使用 `Illuminate\Console\Scheduling\Schedule` 类上提供的常量：

```php
use Illuminate\Support\Facades;
use Illuminate\Console\Scheduling\Schedule;

Facades\Schedule::command('emails:send')
    ->hourly()
    ->days([Schedule::SUNDAY, Schedule::WEDNESDAY]);
```

<a name="between-time-constraints"></a>
#### 时间区间约束

`between` 方法可用于根据一天中的时间来限制任务的执行：

```php
Schedule::command('emails:send')
    ->hourly()
    ->between('7:00', '22:00');
```

类似地，`unlessBetween` 方法可用于把某段时间排除在任务执行之外：

```php
Schedule::command('emails:send')
    ->hourly()
    ->unlessBetween('23:00', '4:00');
```

<a name="truth-test-constraints"></a>
#### 真假判断约束

`when` 方法可用于根据给定真假判断的结果来限制任务的执行。换句话说，如果给定闭包返回 `true`，且没有其他限制条件阻止任务运行，任务就会执行：

```php
Schedule::command('emails:send')->daily()->when(function () {
    return true;
});
```

`skip` 方法可以看作 `when` 的反面。如果 `skip` 方法返回 `true`，该定时任务就不会执行：

```php
Schedule::command('emails:send')->daily()->skip(function () {
    return true;
});
```

链式使用多个 `when` 方法时，只有当所有 `when` 条件都返回 `true`，被调度的命令才会执行。

<a name="environment-constraints"></a>
#### 环境约束

`environments` 方法可用于让任务只在指定环境（由 `APP_ENV` [环境变量](/docs/{{version}}/configuration#environment-configuration)定义）下执行：

```php
Schedule::command('emails:send')
    ->daily()
    ->environments(['staging', 'production']);
```

<a name="timezones"></a>
### 时区

借助 `timezone` 方法，你可以指定某个定时任务的时间应在给定时区下解释：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->timezone('America/New_York')
    ->at('2:00')
```

如果你反复给所有定时任务分配同一个时区，可以在应用 `app` 配置文件中定义 `schedule_timezone` 选项，指定所有调度应统一使用哪个时区：

```php
'timezone' => 'UTC',

'schedule_timezone' => 'America/Chicago',
```

> [!WARNING]
> 请记住，有些时区会使用夏令时。当夏令时发生切换时，你的定时任务可能运行两次，甚至完全不运行。因此，我们建议尽量避免使用时区调度。

<a name="preventing-task-overlaps"></a>
### 防止任务重叠

默认情况下，即使上一个任务实例仍在运行，定时任务也照样会运行。要避免这种情况，你可以使用 `withoutOverlapping` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->withoutOverlapping();
```

在这个示例中，如果 `emails:send` [Artisan 命令](/docs/{{version}}/artisan)尚未在运行，它就会每分钟运行一次。如果你的任务执行时间差异巨大，让你无法准确预测某个任务要跑多久，`withoutOverlapping` 方法会尤其有用。

如有需要，你可以指定"不重叠"锁在多少分钟后过期。默认情况下，该锁会在 24 小时后过期：

```php
Schedule::command('emails:send')->withoutOverlapping(10);
```

在底层，`withoutOverlapping` 方法借助应用的[缓存](/docs/{{version}}/cache)来获取锁。必要时，你可以使用 `schedule:clear-cache` Artisan 命令清除这些缓存锁。通常只有当任务因意外的服务器问题而卡住时才需要这么做。

<a name="running-tasks-on-one-server"></a>
### 在单台服务器上运行任务

> [!WARNING]
> 要使用该功能，你的应用必须把 `database`、`memcached`、`dynamodb` 或 `redis` 缓存驱动作为应用的默认缓存驱动。此外，所有服务器都必须与同一个中央缓存服务器通信。

如果你的应用调度器运行在多台服务器上，你可以把某个定时任务限制为只在单台服务器上执行。举个例子，假设你有一个每周五晚上生成新报表的定时任务。如果任务调度器运行在三台工作服务器上，该定时任务就会在三台服务器上全部运行，生成三次报表。这可不行！

要指明该任务只应在单台服务器上运行，请在定义定时任务时使用 `onOneServer` 方法。第一个获取到该任务的服务器会在该任务上加一把原子锁，从而防止其他服务器在同一时间运行相同任务：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->fridays()
    ->at('17:00')
    ->onOneServer();
```

<a name="naming-unique-jobs"></a>
#### 为单服务器任务命名

有时你可能需要把同一个任务以不同参数调度多次，同时仍指示 Laravel 在单台服务器上运行该任务的每一种组合。为此，你可以通过 `name` 方法为每个调度定义分配一个唯一名称：

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

类似地，如果定时闭包打算在单台服务器上运行，也必须为它分配名称：

```php
Schedule::call(fn () => User::resetApiRequestCount())
    ->name('reset-api-request-count')
    ->daily()
    ->onOneServer();
```

<a name="background-tasks"></a>
### 后台任务

默认情况下，多个在同一时刻调度的任务会按照它们在 `schedule` 方法中定义的顺序依次执行。如果你的任务运行时间较长，这可能导致后续任务比预期晚很多才开始。如果你想让任务在后台运行，以便它们可以同时执行，可以使用 `runInBackground` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('analytics:report')
    ->daily()
    ->runInBackground();
```

> [!WARNING]
> 只有在通过 `command` 和 `exec` 方法调度任务时，才能使用 `runInBackground` 方法。

<a name="maintenance-mode"></a>
### 维护模式

当应用处于[维护模式](/docs/{{version}}/configuration#maintenance-mode)时，应用的定时任务不会运行，因为我们不希望任务干扰你可能在服务器上进行的未完成维护工作。不过，如果你想强制某个任务即使在维护模式下也运行，可以在定义该任务时调用 `evenInMaintenanceMode` 方法：

```php
Schedule::command('emails:send')->evenInMaintenanceMode();
```

<a name="schedule-groups"></a>
### 调度分组

当定义多个配置相似的定时任务时，你可以使用 Laravel 的任务分组功能，避免为每个任务重复相同的设置。任务分组能简化代码，并确保相关任务之间保持一致。

要创建一组定时任务，请先调用所需的任务配置方法，然后调用 `group` 方法。`group` 方法接受一个闭包，该闭包负责定义共享指定配置的任务：

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

现在我们已经了解了如何定义定时任务，下面来讨论如何在服务器上真正运行它们。`schedule:run` Artisan 命令会评估所有定时任务，并根据服务器的当前时间判断它们是否需要运行。

因此，使用 Laravel 调度器时，我们只需在服务器上添加一条 cron 配置项，每分钟运行一次 `schedule:run` 命令。如果你不清楚如何向服务器添加 cron 配置项，可以考虑使用 [Laravel Forge](https://forge.laravel.com) 之类的服务，它可以代你管理这些 cron 配置项：

```shell
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

<a name="sub-minute-scheduled-tasks"></a>
### 亚分钟级调度任务

在大多数操作系统上，cron 作业最多只能每分钟运行一次。不过，Laravel 的调度器允许你把任务调度为更高频的间隔，甚至可以快到每秒一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->everySecond();
```

当应用中定义了亚分钟级任务时，`schedule:run` 命令会持续运行到当前分钟结束，而不是立即退出。这样该命令就能在这一分钟内不断调用所有需要的亚分钟级任务。

由于运行时间超出预期的亚分钟级任务会延迟后续亚分钟级任务的执行，建议所有亚分钟级任务都分发队列任务或后台命令来处理实际的任务执行工作：

```php
use App\Jobs\DeleteRecentUsers;

Schedule::job(new DeleteRecentUsers)->everyTenSeconds();

Schedule::command('users:delete')->everyTenSeconds()->runInBackground();
```

<a name="interrupting-sub-minute-tasks"></a>
#### 中断亚分钟级任务

由于在定义亚分钟级任务时 `schedule:run` 命令会在整个被调用的分钟内持续运行，因此你在部署应用时可能偶尔需要中断该命令。否则，已经在运行的 `schedule:run` 命令实例会继续使用你之前部署的旧代码，直到当前分钟结束。

要中断正在进行的 `schedule:run` 调用，可以把 `schedule:interrupt` 命令添加到应用的部署脚本中。该命令应当在应用部署完成后调用：

```shell
php artisan schedule:interrupt
```

<a name="running-the-scheduler-locally"></a>
### 在本地运行调度器

通常，你不会在本地开发机器上添加调度器 cron 配置项。此时你可以使用 `schedule:work` Artisan 命令。该命令会以前台方式运行，每分钟调用一次调度器，直到你终止该命令为止。当定义了亚分钟级任务时，调度器会在每一分钟内持续运行以处理这些任务：

```shell
php artisan schedule:work
```

<a name="task-output"></a>
## 任务输出

Laravel 调度器提供了若干便于处理定时任务所产生输出的方法。首先，借助 `sendOutputTo` 方法，你可以把输出发送到文件以供日后查看：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->sendOutputTo($filePath);
```

如果希望把输出追加到指定文件，可以使用 `appendOutputTo` 方法：

```php
Schedule::command('emails:send')
    ->daily()
    ->appendOutputTo($filePath);
```

借助 `emailOutputTo` 方法，你可以把输出通过邮件发送到你指定的邮箱地址。在把任务输出发送邮件之前，你应当先配置 Laravel 的[邮件服务](/docs/{{version}}/mail)：

```php
Schedule::command('report:generate')
    ->daily()
    ->sendOutputTo($filePath)
    ->emailOutputTo('taylor@example.com');
```

如果你只想在被调度的 Artisan 或系统命令以非零退出码结束时才通过邮件发送输出，可以使用 `emailOutputOnFailure` 方法：

```php
Schedule::command('report:generate')
    ->daily()
    ->emailOutputOnFailure('taylor@example.com');
```

> [!WARNING]
> `emailOutputTo`、`emailOutputOnFailure`、`sendOutputTo` 和 `appendOutputTo` 方法仅适用于 `command` 和 `exec` 方法。

<a name="task-hooks"></a>
## 任务钩子

借助 `before` 和 `after` 方法，你可以指定在定时任务执行之前和之后要执行的代码：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->before(function () {
        // 任务即将执行...
    })
    ->after(function () {
        // 任务已执行...
    });
```

`onSuccess` 和 `onFailure` 方法允许你指定在定时任务成功或失败时要执行的代码。失败是指被调度的 Artisan 或系统命令以非零退出码结束：

```php
Schedule::command('emails:send')
    ->daily()
    ->onSuccess(function () {
        // 任务成功...
    })
    ->onFailure(function () {
        // 任务失败...
    });
```

如果你的命令有输出，可以通过在钩子闭包定义中把 `Illuminate\Support\Stringable` 实例作为 `$output` 参数类型提示，在 `after`、`onSuccess` 或 `onFailure` 钩子中访问它：

```php
use Illuminate\Support\Stringable;

Schedule::command('emails:send')
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

借助 `pingBefore` 和 `thenPing` 方法，调度器可以在任务执行之前或之后自动 ping 指定 URL。该方法适合用于通知外部服务（例如 [Envoyer](https://envoyer.io)）你的定时任务即将开始或已经执行完毕：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingBefore($url)
    ->thenPing($url);
```

`pingOnSuccess` 和 `pingOnFailure` 方法可用于仅在任务成功或失败时才 ping 指定 URL。失败是指被调度的 Artisan 或系统命令以非零退出码结束：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingOnSuccess($successUrl)
    ->pingOnFailure($failureUrl);
```

`pingBeforeIf`、`thenPingIf`、`pingOnSuccessIf` 和 `pingOnFailureIf` 方法可用于仅在给定条件为 `true` 时才 ping 指定 URL：

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

Laravel 在调度过程中会分发各种[事件](/docs/{{version}}/events)。你可以为下列任意事件[定义监听器](/docs/{{version}}/events)：

<div class="overflow-auto">

| 事件名称 |
| --- |
| `Illuminate\Console\Events\ScheduledTaskStarting` |
| `Illuminate\Console\Events\ScheduledTaskFinished` |
| `Illuminate\Console\Events\ScheduledBackgroundTaskFinished` |
| `Illuminate\Console\Events\ScheduledTaskSkipped` |
| `Illuminate\Console\Events\ScheduledTaskFailed` |

</div>
