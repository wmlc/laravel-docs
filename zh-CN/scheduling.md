# 任务调度

在过去，你可能已经为你服务器上需要计划的每个任务都编写了一个 cron 配置条目。然而，这会很快变得令人头疼，因为你的任务计划不再处于版本控制之下，而且你必须通过 SSH 登录服务器才能查看现有的 cron 条目或添加新条目。

Laravel 的命令调度器为管理服务器上的计划任务提供了一种全新的方式。调度器允许你在 Laravel 应用自身内部流畅且富有表现力地定义你的命令计划。使用调度器时，你的服务器上只需要一个 cron 条目。你的任务计划通常定义在应用的 `routes/console.php` 文件中。

## 定义计划任务

你可以在应用的 `routes/console.php` 文件中定义所有计划任务。我们先来看一个示例。在这个例子中，我们将计划一个闭包，使其在每天午夜被调用。在闭包内部，我们会执行一个数据库查询来清空一个表：

```php
<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->daily();
```

除了使用闭包进行计划之外，你还可以计划 [可调用对象](https://secure.php.net/manual/en/language.oop5.magic.php#object.invoke)。可调用对象是包含 `__invoke` 方法的简单 PHP 类：

```php
Schedule::call(new DeleteRecentUsers)->daily();
```

如果你希望将 `routes/console.php` 文件仅保留用于命令定义，可以使用应用 `bootstrap/app.php` 文件中的 `withSchedule` 方法来定义计划任务。该方法接受一个接收调度器实例的闭包：

```php
use Illuminate\Console\Scheduling\Schedule;

->withSchedule(function (Schedule $schedule) {
    $schedule->call(new DeleteRecentUsers)->daily();
})
```

如果你想查看计划任务的概览以及它们下一次计划运行的时间，可以使用 `schedule:list` Artisan 命令：

```shell
php artisan schedule:list
```

### 调度 Artisan 命令

除了计划闭包之外，你还可以计划 [Artisan 命令](/topic/Laravel%2013.x/3dykqdoyl0.html) 和系统命令。例如，你可以使用 `command` 方法，通过命令的名称或类名来计划一个 Artisan 命令。

使用 Artisan 命令的类名来计划 Artisan 命令时，你可以传入一个额外的命令行参数数组，这些参数会在命令被调用时提供给它：

```php
use App\Console\Commands\SendEmailsCommand;
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send Taylor --force')->daily();

Schedule::command(SendEmailsCommand::class, ['Taylor', '--force'])->daily();
```

#### 调度 Artisan 闭包命令

如果你想计划一个由闭包定义的 Artisan 命令，可以在该命令的定义之后链式调用与计划相关的方法：

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

### 调度队列任务

`job` 方法可用于计划一个 [队列任务](/topic/Laravel%2013.x/wevwmkz9l2.html)。该方法提供了一种便捷的方式，无需使用 `call` 方法定义闭包来将任务加入队列：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new Heartbeat)->everyFiveMinutes();
```

可以提供可选的第二个和第三个参数给 `job` 方法，用于指定应该用于将该任务加入队列的队列名称和队列连接：

```php
use App\Jobs\Heartbeat;
use Illuminate\Support\Facades\Schedule;

// 将任务分发到 "sqs" 连接上的 "heartbeats" 队列...
Schedule::job(new Heartbeat, 'heartbeats', 'sqs')->everyFiveMinutes();
```

### 调度 Shell 命令

`exec` 方法可用于向操作系统发出一个命令：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::exec('node /home/forge/script.js')->daily();
```

### 计划任务频率选项

我们已经见过几个示例，展示了如何配置任务以指定的时间间隔运行。不过，你还可以为任务分配更多任务计划频率：

| Method                             | Description                                              |
| ---------------------------------- | -------------------------------------------------------- |
| `->cron('* * * * *');`             | 按自定义 cron 计划运行任务。                             |
| `->everySecond();`                 | 每秒运行任务。                                           |
| `->everyTwoSeconds();`             | 每两秒运行任务。                                         |
| `->everyFiveSeconds();`            | 每五秒运行任务。                                         |
| `->everyTenSeconds();`             | 每十秒运行任务。                                         |
| `->everyFifteenSeconds();`         | 每十五秒运行任务。                                       |
| `->everyTwentySeconds();`          | 每二十秒运行任务。                                       |
| `->everyThirtySeconds();`          | 每三十秒运行任务。                                       |
| `->everyMinute();`                 | 每分钟运行任务。                                         |
| `->everyTwoMinutes();`             | 每两分钟运行任务。                                       |
| `->everyThreeMinutes();`           | 每三分钟运行任务。                                       |
| `->everyFourMinutes();`            | 每四分钟运行任务。                                       |
| `->everyFiveMinutes();`            | 每五分钟运行任务。                                       |
| `->everyTenMinutes();`             | 每十分钟运行任务。                                       |
| `->everyFifteenMinutes();`         | 每十五分钟运行任务。                                     |
| `->everyThirtyMinutes();`          | 每三十分钟运行任务。                                     |
| `->hourly();`                      | 每小时运行任务。                                         |
| `->hourlyAt(17);`                  | 每小时的第 17 分钟运行任务。                             |
| `->everyOddHour($minutes = 0);`    | 每奇数小时运行任务。                                     |
| `->everyTwoHours($minutes = 0);`   | 每两小时运行任务。                                       |
| `->everyThreeHours($minutes = 0);` | 每三小时运行任务。                                       |
| `->everyFourHours($minutes = 0);`  | 每四小时运行任务。                                       |
| `->everySixHours($minutes = 0);`   | 每六小时运行任务。                                       |
| `->daily();`                       | 每天午夜运行任务。                                       |
| `->dailyAt('13:00');`              | 每天 13:00 运行任务。                                    |
| `->twiceDaily(1, 13);`             | 每天 1:00 和 13:00 运行任务。                            |
| `->twiceDailyAt(1, 13, 15);`       | 每天 1:15 和 13:15 运行任务。                            |
| `->daysOfMonth([1, 10, 20]);`      | 在每月特定的几天运行任务。                               |
| `->weekly();`                      | 每周日 00:00 运行任务。                                  |
| `->weeklyOn(1, '8:00');`           | 每周一 8:00 运行任务。                                   |
| `->monthly();`                     | 每月第一天 00:00 运行任务。                              |
| `->monthlyOn(4, '15:00');`         | 每月 4 号 15:00 运行任务。                               |
| `->twiceMonthly(1, 16, '13:00');`  | 每月 1 号和 16 号 13:00 运行任务。                       |
| `->lastDayOfMonth('15:00');`       | 每月最后一天 15:00 运行任务。                            |
| `->quarterly();`                   | 每季度第一天 00:00 运行任务。                            |
| `->quarterlyOn(4, '14:00');`       | 每季度 4 号 14:00 运行任务。                             |
| `->yearly();`                      | 每年第一天 00:00 运行任务。                              |
| `->yearlyOn(6, 1, '17:00');`       | 每年 6 月 1 日 17:00 运行任务。                          |
| `->timezone('America/New_York');`  | 设置任务的时区。                                         |

这些方法可以与额外的约束组合使用，以创建更精细的计划，只在每周特定的几天运行。例如，你可以将命令计划为每周一运行：

```php
use Illuminate\Support\Facades\Schedule;

// 每周一 13:00 运行一次...
Schedule::call(function () {
    // ...
})->weekly()->mondays()->at('13:00');

// 工作日上午 8 点到下午 5 点每小时运行...
Schedule::command('foo')
    ->weekdays()
    ->hourly()
    ->timezone('America/Chicago')
    ->between('8:00', '17:00');
```

下面列出了其他计划约束：

| Method                                   | Description                                            |
| ---------------------------------------- | ------------------------------------------------------ |
| `->weekdays();`                          | 将任务限制在工作日。                                   |
| `->weekends();`                          | 将任务限制在周末。                                     |
| `->sundays();`                           | 将任务限制在周日。                                     |
| `->mondays();`                           | 将任务限制在周一。                                     |
| `->tuesdays();`                          | 将任务限制在周二。                                     |
| `->wednesdays();`                        | 将任务限制在周三。                                     |
| `->thursdays();`                         | 将任务限制在周四。                                     |
| `->fridays();`                           | 将任务限制在周五。                                     |
| `->saturdays();`                         | 将任务限制在周六。                                     |
| `->days(array\|mixed);`                  | 将任务限制在特定的几天。                               |
| `->between($startTime, $endTime);`       | 将任务限制在开始和结束时间之间运行。                   |
| `->unlessBetween($startTime, $endTime);` | 将任务限制为不在开始和结束时间之间运行。               |
| `->when(Closure);`                       | 基于真值测试限制任务。                                 |
| `->environments($env);`                  | 将任务限制在特定环境。                                 |

#### 按天约束

`days` 方法可用于将任务的执行限制在每周特定的几天。例如，你可以将命令计划为在周日和周三每小时运行：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->hourly()
    ->days([0, 3]);
```

或者，在定义任务应该运行的日子时，你可以使用 `Illuminate\Console\Scheduling\Schedule` 类上可用的常量：

```php
use Illuminate\Support\Facades;
use Illuminate\Console\Scheduling\Schedule;

Facades\Schedule::command('emails:send')
    ->hourly()
    ->days([Schedule::SUNDAY, Schedule::WEDNESDAY]);
```

#### 时间区间约束

`between` 方法可用于根据一天中的时间限制任务的执行：

```php
Schedule::command('emails:send')
    ->hourly()
    ->between('7:00', '22:00');
```

类似地，`unlessBetween` 方法可用于排除任务在一段时间内执行：

```php
Schedule::command('emails:send')
    ->hourly()
    ->unlessBetween('23:00', '4:00');
```

#### 真值测试约束

`when` 方法可用于根据给定的真值测试结果限制任务的执行。换句话说，如果给定的闭包返回 `true`，只要没有其他约束条件阻止任务运行，任务就会执行：

```php
Schedule::command('emails:send')->daily()->when(function () {
    return true;
});
```

`skip` 方法可以看作是 `when` 的反面。如果 `skip` 方法返回 `true`，计划任务将不会被执行：

```php
Schedule::command('emails:send')->daily()->skip(function () {
    return true;
});
```

当使用链式 `when` 方法时，只有当所有 `when` 条件都返回 `true` 时，计划命令才会执行。

#### 环境约束

`environments` 方法可用于只在给定的环境（由 `APP_ENV` [环境变量](/topic/Laravel%2013.x/3dykqpoyl0.html) 定义）上执行任务：

```php
Schedule::command('emails:send')
    ->daily()
    ->environments(['staging', 'production']);
```

### 时区

使用 `timezone` 方法，你可以指定计划任务的时间应在给定的时区内解释：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('report:generate')
    ->timezone('America/New_York')
    ->at('2:00')
```

如果你反复为所有计划任务分配相同的时区，可以通过在应用的 `app` 配置文件中定义一个 `schedule_timezone` 选项，来指定应为所有计划分配的时区：

```php
'timezone' => 'UTC',

'schedule_timezone' => 'America/Chicago',
```

> [!WARNING]
> 请记住，某些时区会使用夏令时。当夏令时发生变化时，你的计划任务可能会运行两次，甚至完全不运行。因此，我们建议尽可能避免按时区计划任务。

### 防止任务重叠

默认情况下，即使任务的上一个实例仍在运行，计划任务也会运行。要防止这种情况，你可以使用 `withoutOverlapping` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->withoutOverlapping();
```

在这个例子中，如果 `emails:send` [Artisan 命令](/topic/Laravel%2013.x/3dykqdoyl0.html) 尚未运行，它会每分钟运行一次。`withoutOverlapping` 方法在你那些执行时间差异很大的任务上尤其有用，它能让你无法精确预测某个给定任务会花费多长时间。

如果需要，你可以指定在"不重叠"锁过期之前必须经过多少分钟。默认情况下，该锁会在 24 小时后过期：

```php
Schedule::command('emails:send')->withoutOverlapping(10);
```

在底层，`withoutOverlapping` 方法利用应用的 [缓存](/topic/Laravel%2013.x/5dve2w3v4x.html) 来获取锁。如有必要，你可以使用 `schedule:clear-cache` Artisan 命令清除这些缓存锁。这通常只有在任务因意外的服务器问题而卡住时才需要。

### 在单台服务器上运行任务

> [!WARNING]
> 要使用此功能，你的应用必须将 `database`、`memcached`、`dynamodb` 或 `redis` 缓存驱动用作应用的默认缓存驱动。此外，所有服务器都必须与同一个中央缓存服务器通信。

如果你的应用调度器运行在多台服务器上，你可以将计划任务限制为只在一台服务器上执行。例如，假设你有一个计划任务，每个周五晚上生成一份新报告。如果任务调度器运行在三台工作服务器上，该计划任务会在三台服务器上都运行，并生成三份报告。这可不好！

要指示任务只在一台服务器上运行，请在定义计划任务时使用 `onOneServer` 方法。第一台获取任务的服务器会为作业获得一个原子锁，以防止其他服务器同时运行相同的任务：

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

#### 命名单服务器任务

有时你可能需要计划同一个作业以不同的参数被分发，同时仍然指示 Laravel 在单台服务器上运行该作业的每个排列组合。为此，你可以通过 `name` 方法为每个计划定义分配一个唯一的名称：

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

类似地，计划闭包如果打算在单台服务器上运行，必须被分配一个名称：

```php
Schedule::call(fn () => User::resetApiRequestCount())
    ->name('reset-api-request-count')
    ->daily()
    ->onOneServer();
```

### 后台任务

默认情况下，同时计划在同一时间的多个任务，会按照它们在 `schedule` 方法中定义的顺序依次执行。如果你有长时间运行的任务，这可能会导致后续任务比预期晚很多才开始。如果你想让任务在后台运行，以便它们可以同时运行，可以使用 `runInBackground` 方法：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('analytics:report')
    ->daily()
    ->runInBackground();
```

> [!WARNING]
> `runInBackground` 方法只能用于通过 `command` 和 `exec` 方法计划的任务。

### 维护模式

当应用处于 [维护模式](/topic/Laravel%2013.x/3dykqpoyl0.html) 时，应用的计划任务不会运行，因为我们不希望你的任务干扰你可能在服务器上执行的任何未完成的维护工作。不过，如果你想强制任务即使在维护模式下也运行，可以在定义任务时调用 `evenInMaintenanceMode` 方法：

```php
Schedule::command('emails:send')->evenInMaintenanceMode();
```

### 暂停计划任务

你可以使用 `schedule:pause` Artisan 命令暂时暂停计划任务的处理，而无需更改已部署的代码：

```shell
php artisan schedule:pause
```

在调度器暂停期间，不会运行任何计划任务。你可以使用 `schedule:continue` 命令恢复计划任务的处理：

```shell
php artisan schedule:continue
```

如果某个任务在调度器暂停期间仍应运行，你可以用 `evenWhenPaused` 方法标记它：

```php
Schedule::command('emails:send')->evenWhenPaused();
```

### 计划任务分组

在定义多个具有相似配置的计划任务时，你可以使用 Laravel 的任务分组功能，避免为每个任务重复相同的设置。对任务进行分组可以简化你的代码，并确保相关任务之间的一致性。

要创建一组计划任务，先调用所需的任务配置方法，然后再调用 `group` 方法。`group` 方法接受一个负责定义共享指定配置的那些任务的闭包：

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

## 运行调度器

既然我们已经了解了如何定义计划任务，接下来我们讨论如何在实际的服务器上运行它们。`schedule:run` Artisan 命令会评估你所有的计划任务，并根据服务器的当前时间判断是否需要运行它们。

因此，使用 Laravel 的调度器时，我们只需要在服务器上添加一个单一的 cron 配置条目，让它每分钟运行一次 `schedule:run` 命令。如果你不知道如何向服务器添加 cron 条目，可以考虑使用像 [Laravel Cloud](https://cloud.laravel.com) 这样的托管平台，它可以替你管理计划任务的执行：

```shell
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

### 亚分钟级计划任务

在大多数操作系统上，cron 作业被限制为每分钟最多运行一次。不过，Laravel 的调度器允许你将任务计划在更频繁的间隔运行，甚至可以频繁到每秒一次：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::call(function () {
    DB::table('recent_users')->delete();
})->everySecond();
```

当应用中定义了亚分钟（sub-minute）任务时，`schedule:run` 命令会持续运行到当前这一分钟结束，而不是立即退出。这允许该命令在这一分钟内调用所有必需的亚分钟任务。

由于运行时间超出预期的亚分钟任务可能会延迟后续亚分钟任务的执行，建议所有亚分钟任务都分发队列任务或后台命令来处理实际的任务处理：

```php
use App\Jobs\DeleteRecentUsers;

Schedule::job(new DeleteRecentUsers)->everyTenSeconds();

Schedule::command('users:delete')->everyTenSeconds()->runInBackground();
```

#### 中断不足一分钟的任务

由于当定义了亚分钟任务时，`schedule:run` 命令会运行被调用时的整分钟，你有时可能需要在部署应用时中断该命令。否则，已经在运行的 `schedule:run` 命令实例会继续使用应用先前部署的代码，直到当前这一分钟结束。

要中断正在进行的 `schedule:run` 调用，你可以将 `schedule:interrupt` 命令添加到应用的部署脚本中。该命令应该在你的应用完成部署后调用：

```shell
php artisan schedule:interrupt
```

### 在本地运行调度器

通常，你不会在本地开发机器上添加调度器 cron 条目。相反，你可以使用 `schedule:work` Artisan 命令。该命令会在前台运行，并每分钟调用一次调度器，直到你终止该命令。当定义了亚分钟任务时，调度器会在每一分钟内持续运行以处理那些任务：

```shell
php artisan schedule:work
```

## 任务输出

Laravel 调度器提供了几个便捷的方法来处理计划任务生成的输出。首先，使用 `sendOutputTo` 方法，你可以将输出发送到一个文件以便后续检查：

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

使用 `emailOutputTo` 方法，你可以将输出通过邮件发送到你选择的电子邮件地址。在通过邮件发送任务输出之前，你应该先配置好 Laravel 的 [邮件服务](/topic/Laravel%2013.x/d6vro0rv3g.html)：

```php
Schedule::command('report:generate')
    ->daily()
    ->sendOutputTo($filePath)
    ->emailOutputTo('taylor@example.com');
```

如果你只想在计划的 Artisan 或系统命令以非零退出码终止时才通过邮件发送输出，可以使用 `emailOutputOnFailure` 方法：

```php
Schedule::command('report:generate')
    ->daily()
    ->emailOutputOnFailure('taylor@example.com');
```

> [!WARNING]
> `emailOutputTo`、`emailOutputOnFailure`、`sendOutputTo` 和 `appendOutputTo` 方法仅适用于 `command` 和 `exec` 方法。

## 任务钩子

使用 `before` 和 `after` 方法，你可以指定在计划任务执行之前和之后执行的代码：

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')
    ->daily()
    ->before(function () {
        // 任务即将执行...
    })
    ->after(function () {
        // 任务已经执行...
    });
```

`onSuccess` 和 `onFailure` 方法允许你指定在计划任务成功或失败时执行的代码。失败表示计划的 Artisan 或系统命令以非零退出码终止：

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

如果你的命令有可用输出，你可以通过类型提示一个 `Illuminate\Support\Stringable` 实例作为钩子闭包定义中的 `$output` 参数，在 `after`、`onSuccess` 或 `onFailure` 钩子中访问它：

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

#### Ping URL

使用 `pingBefore` 和 `thenPing` 方法，调度器可以在任务执行之前或之后自动 ping 一个给定的 URL。这个方法对于通知外部服务（如 [Envoyer](https://envoyer.io)）你的计划任务已经开始或已经完成执行很有用：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingBefore($url)
    ->thenPing($url);
```

`pingOnSuccess` 和 `pingOnFailure` 方法可用于仅在任务成功或失败时 ping 一个给定的 URL。失败表示计划的 Artisan 或系统命令以非零退出码终止：

```php
Schedule::command('emails:send')
    ->daily()
    ->pingOnSuccess($successUrl)
    ->pingOnFailure($failureUrl);
```

`pingBeforeIf`、`thenPingIf`、`pingOnSuccessIf` 和 `pingOnFailureIf` 方法可用于仅在给定条件为 `true` 时 ping 一个给定的 URL：

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

## 事件

Laravel 在调度过程中会调度各种 [事件](/topic/Laravel%2013.x/x3vo0l4vm1.html)。你可以为以下任意事件 [定义监听器](/topic/Laravel%2013.x/x3vo0l4vm1.html)：

| Event Name                                                  |
| ----------------------------------------------------------- |
| `Illuminate\Console\Events\ScheduledTaskStarting`           |
| `Illuminate\Console\Events\ScheduledTaskFinished`           |
| `Illuminate\Console\Events\ScheduledBackgroundTaskFinished` |
| `Illuminate\Console\Events\ScheduledTaskSkipped`            |
| `Illuminate\Console\Events\ScheduledTaskFailed`             |
