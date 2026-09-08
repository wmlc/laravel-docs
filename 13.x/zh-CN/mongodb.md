# MongoDB

- [简介](#introduction)
- [安装](#installation)
    - [MongoDB 驱动](#mongodb-driver)
    - [启动 MongoDB 服务器](#starting-a-mongodb-server)
    - [安装 Laravel MongoDB 包](#install-the-laravel-mongodb-package)
- [配置](#configuration)
- [功能特性](#features)

<a name="introduction"></a>
## 简介

[MongoDB](https://www.mongodb.com/resources/products/fundamentals/why-use-mongodb) 是最流行的 NoSQL 文档型数据库之一，常用于高写入负载（适用于分析或物联网场景）和高可用（易于搭建带自动故障转移的副本集）场景。它还可以轻松地对数据库进行分片以实现水平扩展，并提供了强大的查询语言，用于执行聚合、文本搜索或地理空间查询。

与 SQL 数据库将数据存储在行列式表中不同，MongoDB 数据库中的每条记录都是一个以 BSON（数据的二进制表示形式）描述的文档。应用程序随后可以以 JSON 格式检索这些信息。它支持多种数据类型，包括文档、数组、内嵌文档和二进制数据。

在 Laravel 中使用 MongoDB 之前，我们建议通过 Composer 安装并使用 `mongodb/laravel-mongodb` 包。该包由 MongoDB 官方维护。虽然 PHP 通过 MongoDB 驱动原生支持 MongoDB，但 [Laravel MongoDB](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/) 包提供了与 Eloquent 及其他 Laravel 功能更丰富的集成：

```shell
composer require mongodb/laravel-mongodb
```

<a name="installation"></a>
## 安装

<a name="mongodb-driver"></a>
### MongoDB 驱动

要连接 MongoDB 数据库，需要安装 `mongodb` PHP 扩展。如果你正在本地使用 [Laravel Herd](https://herd.laravel.com) 进行开发，或通过 `php.new` 安装了 PHP，那么系统中已经安装了这个扩展。不过，如果需要手动安装该扩展，可以通过 PECL 进行：

```shell
pecl install mongodb
```

关于安装 MongoDB PHP 扩展的更多信息，请查看 [MongoDB PHP 扩展安装说明](https://www.php.net/manual/en/mongodb.installation.php)。

<a name="starting-a-mongodb-server"></a>
### 启动 MongoDB 服务器

MongoDB Community Server 可用于在本地运行 MongoDB，支持在 Windows、macOS、Linux 上安装，也可以作为 Docker 容器运行。要了解如何安装 MongoDB，请参阅[官方 MongoDB Community 安装指南](https://docs.mongodb.com/manual/administration/install-community/)。

MongoDB 服务器的连接字符串可以在你的 `.env` 文件中设置：

```ini
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DATABASE="laravel_app"
```

如果要在云端托管 MongoDB，可以考虑使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)。
要从本地应用访问 MongoDB Atlas 集群，你需要在集群的网络设置中[将自己的 IP 地址添加到项目的 IP 访问列表](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/)。

MongoDB Atlas 的连接字符串同样可以在 `.env` 文件中设置：

```ini
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
MONGODB_DATABASE="laravel_app"
```

<a name="install-the-laravel-mongodb-package"></a>
### 安装 Laravel MongoDB 包

最后，使用 Composer 安装 Laravel MongoDB 包：

```shell
composer require mongodb/laravel-mongodb
```

> [!NOTE]
> 如果未安装 `mongodb` PHP 扩展，本包的安装将会失败。CLI 与 Web 服务器之间的 PHP 配置可能存在差异，因此请确保两种配置下都启用了该扩展。

<a name="configuration"></a>
## 配置

你可以通过应用的 `config/database.php` 配置文件来配置 MongoDB 连接。在该文件中添加一个使用 `mongodb` 驱动的 `mongodb` 连接：

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
## 功能特性

配置完成后，你就可以在应用中使用 `mongodb` 包和数据库连接，以利用各种强大的功能：

- [使用 Eloquent](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/eloquent-models/)，模型可以存储在 MongoDB 集合中。除了标准的 Eloquent 功能外，Laravel MongoDB 包还提供了诸如嵌入式关联等额外功能。该包还提供对 MongoDB 驱动的直接访问，可用于执行原始查询和聚合管道等操作。
- 使用查询构造器[编写复杂查询](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/query-builder/)。
- 使用向量嵌入和 `vectorSearch` Eloquent 方法进行[相似度 / 向量搜索](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/fundamentals/vector-search/)。
- `mongodb` [缓存驱动](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)针对 MongoDB 的特性进行了优化，例如利用 TTL 索引自动清除过期的缓存条目。
- 使用 `mongodb` 队列驱动[分发和处理队列任务](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/)。
- 通过 [Flysystem 的 GridFS 适配器](https://flysystem.thephpleague.com/docs/adapter/gridfs/)[在 GridFS 中存储文件](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/filesystems/)。
- 使用 `mongodb` Scout 引擎进行[全文搜索](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/scout/)。
- 大多数使用数据库连接或 Eloquent 的第三方包都可以与 MongoDB 配合使用。

要继续学习如何使用 MongoDB 与 Laravel，请参阅 MongoDB 的[快速入门指南](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/quick-start/)。
