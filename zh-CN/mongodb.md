# MongoDB

## 简介

[MongoDB](https://www.mongodb.com/resources/products/fundamentals/why-use-mongodb) 是最受欢迎的 NoSQL 面向文档数据库之一，因其高写入负载（适用于分析或物联网）和高可用性（易于配置带自动故障转移的副本集）而被广泛使用。它还可以轻松对数据库进行分片（shard）以实现水平扩展，并拥有强大的查询语言，可用于聚合、文本搜索或地理空间查询。

与 SQL 数据库将数据存储在行列表或列中不同，MongoDB 数据库中的每条记录都是一个以 BSON 描述的文档，BSON 是数据的二进制表示形式。应用随后可以以 JSON 格式检索这些信息。它支持多种数据类型，包括文档、数组、嵌入文档和二进制数据。

在 Laravel 中使用 MongoDB 之前，我们建议通过 Composer 安装并使用 `mongodb/laravel-mongodb` 包。该 `laravel-mongodb` 包由 MongoDB 官方维护；虽然 PHP 通过 MongoDB 驱动原生支持 MongoDB，但 Laravel MongoDB 包提供了与 Eloquent 及其他 Laravel 功能更丰富的集成：

```shell
composer require mongodb/laravel-mongodb
```

## 安装

### MongoDB 驱动

要连接 MongoDB 数据库，需要 `mongodb` PHP 扩展。如果你使用 [Laravel Herd](https://herd.laravel.com) 进行本地开发，或通过 `php.new` 安装 PHP，那么你的系统已经安装了这个扩展。不过，如果你需要手动安装该扩展，可以通过 PECL 安装：

```shell
pecl install mongodb
```

有关安装 MongoDB PHP 扩展的更多信息，请参阅 [MongoDB PHP 扩展安装说明](https://www.php.net/manual/en/mongodb.installation.php)。

### 启动 MongoDB 服务器

MongoDB Community Server 可用于在本地运行 MongoDB，支持在 Windows、macOS、Linux 上安装，或以 Docker 容器形式运行。要了解如何安装 MongoDB，请参阅 [MongoDB Community 官方安装指南](https://docs.mongodb.com/manual/administration/install-community/)。

MongoDB 服务器的连接字符串（connection string）可以在你的 `.env` 文件中进行设置：

```ini
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DATABASE="laravel_app"
```

要在云端托管 MongoDB，可以考虑使用 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)。要让你的应用从本地访问 MongoDB Atlas 集群，你需要将你自己的 IP 地址添加到该集群网络设置中的项目 IP 访问列表（IP Access List）。

MongoDB Atlas 的连接字符串也可以在你的 `.env` 文件中进行设置：

```ini
MONGODB_URI="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
MONGODB_DATABASE="laravel_app"
```

### 安装 Laravel MongoDB 扩展包

最后，使用 Composer 安装 Laravel MongoDB 包：

```shell
composer require mongodb/laravel-mongodb
```

> [!NOTE]
> 如果未安装 `mongodb` PHP 扩展，该包的安装将会失败。CLI 与 Web 服务器之间的 PHP 配置可能不同，因此请确保在两种配置中都已启用该扩展。

## 配置

你可以通过应用的 `config/database.php` 配置文件来配置 MongoDB 连接。在该文件中，添加一个使用 `mongodb` 驱动的 `mongodb` 连接：

```php
'connections' => [
    'mongodb' => [
        'driver' => 'mongodb',
        'dsn' => env('MONGODB_URI', 'mongodb://localhost:27017'),
        'database' => env('MONGODB_DATABASE', 'laravel_app'),
    ],
],
```

## 功能

配置完成后，你可以在应用中使用 `mongodb` 包和数据库连接，以利用多种强大的功能：

- [使用 Eloquent](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/eloquent-models/)，模型可以存储在 MongoDB 集合中。除了标准 Eloquent 功能外，Laravel MongoDB 包还提供了嵌入关联等额外功能。该包还提供了对 MongoDB 驱动的直接访问，可用于执行原始查询和聚合管道等操作。
- [编写复杂查询](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/query-builder/)，使用查询构造器。
- [相似度 / 向量搜索](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/fundamentals/vector-search/)，使用向量嵌入和 `vectorSearch` Eloquent 方法。
- `mongodb` [缓存驱动](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/cache/)经过优化，可使用 MongoDB 的 TTL 索引等特性自动清除过期的缓存条目。
- [派发与处理队列任务](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/queues/)，使用 `mongodb` 队列驱动。
- [在 GridFS 中存储文件](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/filesystems/)，通过 [Flysystem 的 GridFS 适配器](https://flysystem.thephpleague.com/docs/adapter/gridfs/)。
- [全文搜索](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/scout/)，使用 `mongodb` Scout 引擎。
- 大多数使用数据库连接或 Eloquent 的第三方包都可以与 MongoDB 配合使用。

要继续学习如何在 Laravel 中使用 MongoDB，请参阅 MongoDB 的 [Quick Start 指南](https://www.mongodb.com/docs/drivers/php/laravel-mongodb/current/quick-start/)。
