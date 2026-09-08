# MongoDB

- [简介](#introduction)
- [安装](#installation)
    - [MongoDB 驱动](#mongodb-driver)
    - [启动 MongoDB 服务器](#starting-a-mongodb-server)
    - [安装 Laravel MongoDB 软件包](#install-the-laravel-mongodb-package)
- [配置](#configuration)
- [特性](#features)

<a name="introduction"></a>
## 简介

[MongoDB](https://www.mongodb.com/resources/products/fundamentals/why-use-mongodb) 是最受欢迎的面向文档的 NoSQL 数据库之一。它以高写入负载（适合分析或物联网场景）和高可用性（可以轻松搭建带自动故障转移的副本集）而著称。它还能轻松对数据库进行分片以实现水平扩展，并拥有强大的查询语言，可以执行聚合、文本搜索或地理空间查询。

与 SQL 数据库以行列表格形式存储数据不同，MongoDB 数据库中的每条记录都是一个用 BSON（数据的二进制表示形式）描述的文档。应用随后可以以 JSON 格式检索这些信息。它支持多种多样的数据类型，包括文档、数组、内嵌文档和二进制数据。

在 Laravel 中使用 MongoDB 之前，我们建议通过 Composer 安装并使用 `mongodb/laravel-mongodb` 软件包。`laravel-mongodb` 软件包由 MongoDB 官方维护。虽然 PHP 通过 MongoDB 驱动原生支持 MongoDB，但 [Laravel MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/) 软件包提供了与 Eloquent 及其他 Laravel 特性的更深度集成：

```shell
composer require mongodb/laravel-mongodb
```

<a name="installation"></a>
## 安装

<a name="mongodb-driver"></a>
### MongoDB 驱动

要连接 MongoDB 数据库，需要安装 `mongodb` PHP 扩展。如果你使用 [Laravel Herd](https://herd.laravel.com) 进行本地开发，或通过 `php.new` 安装的 PHP，那么系统中已经装好了这个扩展。如果需要手动安装该扩展，可以通过 PECL 完成：

```shell
pecl install mongodb
```

有关安装 MongoDB PHP 扩展的更多信息，请查阅 [MongoDB PHP 扩展安装说明](https://www.php.net/manual/en/mongodb.installation.php)。

<a name="starting-a-mongodb-server"></a>
### 启动 MongoDB 服务器

你可以使用 MongoDB Community Server 在本地运行 MongoDB，它支持安装在 Windows、macOS、Linux 上，也可以作为 Docker 容器运行。要了解如何安装 MongoDB，请参阅 [MongoDB Community 官方安装指南](https://docs.mongodb.com/manual/administration/install-community/)。

MongoDB 服务器的连接字符串可以设置在 `.env` 文件中：

```ini
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DATABASE="laravel_app"
```

如果想在云端托管 MongoDB，可以考虑使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)。
要在本地从你的应用访问 MongoDB Atlas 集群，你需要在集群的网络设置中[将自己的 IP 地址加入](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/)项目的 IP 访问列表。

MongoDB Atlas 的连接字符串同样可以设置在 `.env` 文件中：

```ini
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
MONGODB_DATABASE="laravel_app"
```

<a name="install-the-laravel-mongodb-package"></a>
### 安装 Laravel MongoDB 软件包

最后，使用 Composer 安装 Laravel MongoDB 软件包：

```shell
composer require mongodb/laravel-mongodb
```

> [!NOTE]
> 如果没有安装 `mongodb` PHP 扩展，这个软件包的安装将会失败。CLI 和 Web 服务器的 PHP 配置可能不同，请确保两处配置中都已启用该扩展。

<a name="configuration"></a>
## 配置

你可以在应用的 `config/database.php` 配置文件中配置 MongoDB 连接。在这个文件中，添加一个使用 `mongodb` 驱动的 `mongodb` 连接：

```php
'connections' => [
    'mongodb' => [
        'driver' => 'mongodb',
        'dsn' => env('MONGODB_URI', 'mongodb://localhost:27017'),
        'database' => env('MONGODB_DATABASE', 'laravel_app'),
    ],
],
```

<a name="features"></a>
## 特性

配置完成后，你就可以在应用中使用 `mongodb` 软件包和数据库连接，享受一系列强大的特性：

- [使用 Eloquent](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/eloquent-models/)，模型可以存储在 MongoDB 集合中。除标准 Eloquent 特性外，Laravel MongoDB 软件包还提供了内嵌关联等额外特性。该软件包还支持直接访问 MongoDB 驱动，可用于执行原生查询和聚合管道等操作。
- 使用查询构造器[编写复杂查询](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/query-builder/)。
- `mongodb` [缓存驱动](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)针对 MongoDB 的特性做了优化，例如利用 TTL 索引自动清理过期的缓存条目。
- 使用 `mongodb` 队列驱动来[分发和处理队列任务](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/)。
- 借助 [Flysystem 的 GridFS 适配器](https://flysystem.thephpleague.com/docs/adapter/gridfs/)，[将文件存储到 GridFS](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/filesystems/)。
- 大多数使用数据库连接或 Eloquent 的第三方软件包都可以配合 MongoDB 使用。

要继续学习如何在 Laravel 中使用 MongoDB，请参阅 MongoDB 的[快速入门指南](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/quick-start/)。
