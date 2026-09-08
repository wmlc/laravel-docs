# Laravel AI SDK

- [简介](#introduction)
- [安装](#installation)
    - [配置](#configuration)
    - [自定义基础 URL](#custom-base-urls)
    - [提供商支持](#provider-support)
- [智能体](#agents)
    - [提示](#prompting)
    - [会话上下文](#conversation-context)
    - [结构化输出](#structured-output)
    - [附件](#attachments)
    - [流式传输](#streaming)
    - [广播](#broadcasting)
    - [队列](#queueing)
    - [工具](#tools)
    - [提供商工具](#provider-tools)
    - [中间件](#middleware)
    - [匿名智能体](#anonymous-agents)
    - [智能体配置](#agent-configuration)
    - [提供商选项](#provider-options)
- [图片](#images)
- [音频（TTS）](#audio)
- [转录（STT）](#transcription)
- [嵌入](#embeddings)
    - [查询嵌入](#querying-embeddings)
    - [缓存嵌入](#caching-embeddings)
- [重排序](#reranking)
- [文件](#files)
- [向量存储](#vector-stores)
    - [向存储中添加文件](#adding-files-to-stores)
- [故障转移](#failover)
- [测试](#testing)
    - [智能体](#testing-agents)
    - [图片](#testing-images)
    - [音频](#testing-audio)
    - [转录](#testing-transcriptions)
    - [嵌入](#testing-embeddings)
    - [重排序](#testing-reranking)
    - [文件](#testing-files)
    - [向量存储](#testing-vector-stores)
- [事件](#events)

<a name="introduction"></a>
## 简介

[Laravel AI SDK](https://github.com/laravel/ai) 提供了一套统一且富有表现力的 API，用于与 OpenAI、Anthropic、Gemini 等 AI 提供商交互。借助 AI SDK，你可以构建具备工具和结构化输出能力的智能体（Agent）、生成图片、合成和转录音频、创建向量嵌入等等——所有这些都通过一致的、Laravel 风格的接口完成。

<a name="installation"></a>
## 安装

你可以通过 Composer 安装 Laravel AI SDK：

```shell
composer require laravel/ai
```

接下来，你应使用 `vendor:publish` Artisan 命令发布 AI SDK 的配置文件和数据库迁移文件：

```shell
php artisan vendor:publish --provider="Laravel\Ai\AiServiceProvider"
```

最后，你应运行应用的数据库迁移。迁移会创建 `agent_conversations` 和 `agent_conversation_messages` 表，AI SDK 用它们来实现会话存储：

```shell
php artisan migrate
```

<a name="configuration"></a>
### 配置

你可以在应用的 `config/ai.php` 配置文件中定义 AI 提供商的凭据，也可以在应用的 `.env` 文件中以环境变量的方式定义：

```ini
ANTHROPIC_API_KEY=
COHERE_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
MISTRAL_API_KEY=
OLLAMA_API_KEY=
OPENAI_API_KEY=
JINA_API_KEY=
VOYAGEAI_API_KEY=
XAI_API_KEY=
```

用于文本、图片、音频、转录和嵌入的默认模型，也可以在应用的 `config/ai.php` 配置文件中配置。

<a name="custom-base-urls"></a>
### 自定义基础 URL

默认情况下，Laravel AI SDK 会直接连接各提供商的公开 API 端点。不过，你可能需要让请求走另一个端点——例如，使用代理服务来集中管理 API 密钥、实现速率限制，或让流量经过企业网关。

你可以通过在提供商配置中添加 `url` 参数来配置自定义基础 URL：

```php
'providers' => [
    'openai' => [
        'driver' => 'openai',
        'key' => env('OPENAI_API_KEY'),
        'url' => env('OPENAI_BASE_URL'),
    ],

    'anthropic' => [
        'driver' => 'anthropic',
        'key' => env('ANTHROPIC_API_KEY'),
        'url' => env('ANTHROPIC_BASE_URL'),
    ],
],
```

在通过代理服务（如 LiteLLM 或 Azure OpenAI Gateway）路由请求，或使用备用端点时，这非常有用。

以下提供商支持自定义基础 URL：OpenAI、Anthropic、Gemini、Groq、Cohere、DeepSeek、xAI 和 OpenRouter。

<a name="provider-support"></a>
### 提供商支持

AI SDK 的各项功能支持多种提供商。下表汇总了每项功能可用的提供商：

| 功能 | 提供商 |
|---|---|
| 文本 | OpenAI, Anthropic, Gemini, Azure, Groq, xAI, DeepSeek, Mistral, Ollama |
| 图片 | OpenAI, Gemini, xAI |
| TTS | OpenAI, ElevenLabs |
| STT | OpenAI, ElevenLabs, Mistral |
| 嵌入 | OpenAI, Gemini, Azure, Cohere, Mistral, Jina, VoyageAI |
| 重排序 | Cohere, Jina |
| 文件 | OpenAI, Anthropic, Gemini |

你可以使用 `Laravel\Ai\Enums\Lab` 枚举在整个代码中引用提供商，而不必使用普通字符串：

```php
use Laravel\Ai\Enums\Lab;

Lab::Anthropic;
Lab::OpenAI;
Lab::Gemini;
// ...
```

<a name="agents"></a>
## 智能体

智能体是 Laravel AI SDK 中与 AI 提供商交互的基础构建单元。每个智能体都是一个专用的 PHP 类，封装了与大语言模型交互所需的指令、会话上下文、工具和输出模式（Schema）。可以把智能体看作一个专业助手——销售教练、文档分析器、客服机器人——只需配置一次，就可以在应用的任何地方按需提示。

你可以通过 `make:agent` Artisan 命令创建智能体：

```shell
php artisan make:agent SalesCoach

php artisan make:agent SalesCoach --structured
```

在生成的智能体类中，你可以定义系统提示 / 指令、消息上下文、可用工具和输出模式（如果适用）：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Tools\RetrievePreviousTranscripts;
use App\Models\History;
use App\Models\User;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

class SalesCoach implements Agent, Conversational, HasTools, HasStructuredOutput
{
    use Promptable;

    public function __construct(public User $user) {}

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return 'You are a sales coach, analyzing transcripts and providing feedback and an overall sales strength score.';
    }

    /**
     * Get the list of messages comprising the conversation so far.
     */
    public function messages(): iterable
    {
        return History::where('user_id', $this->user->id)
            ->latest()
            ->limit(50)
            ->get()
            ->reverse()
            ->map(function ($message) {
                return new Message($message->role, $message->content);
            })->all();
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [
            new RetrievePreviousTranscripts,
        ];
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'feedback' => $schema->string()->required(),
            'score' => $schema->integer()->min(1)->max(10)->required(),
        ];
    }
}
```

<a name="prompting"></a>
### 提示

要提示一个智能体，首先使用 `make` 方法或标准实例化方式创建实例，然后调用 `prompt`：

```php
$response = (new SalesCoach)
    ->prompt('Analyze this sales transcript...');

return (string) $response;
```

`make` 方法会从容器解析你的智能体，支持自动依赖注入。你还可以向智能体的构造函数传递参数：

```php
$agent = SalesCoach::make(user: $user);
```

通过向 `prompt` 方法传递额外参数，你可以在提示时覆盖默认的提供商、模型或 HTTP 超时：

```php
$response = (new SalesCoach)->prompt(
    'Analyze this sales transcript...',
    provider: Lab::Anthropic,
    model: 'claude-haiku-4-5-20251001',
    timeout: 120,
);
```

<a name="conversation-context"></a>
### 会话上下文

如果你的智能体实现了 `Conversational` 接口，可以使用 `messages` 方法返回之前的会话上下文（如果适用）：

```php
use App\Models\History;
use Laravel\Ai\Messages\Message;

/**
 * Get the list of messages comprising the conversation so far.
 */
public function messages(): iterable
{
    return History::where('user_id', $this->user->id)
        ->latest()
        ->limit(50)
        ->get()
        ->reverse()
        ->map(function ($message) {
            return new Message($message->role, $message->content);
        })->all();
}
```

<a name="remembering-conversations"></a>
#### 记住会话

> **Note:** 在使用 `RemembersConversations` trait 之前，你应使用 `vendor:publish` Artisan 命令发布并运行 AI SDK 的迁移。这些迁移会创建存储会话所需的数据库表。

如果你希望 Laravel 自动为智能体存储和获取会话历史，可以使用 `RemembersConversations` trait。该 trait 提供了一种将会话消息持久化到数据库的简单方式，无需手动实现 `Conversational` 接口：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Concerns\RemembersConversations;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, Conversational
{
    use Promptable, RemembersConversations;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): string
    {
        return 'You are a sales coach...';
    }
}
```

要为某个用户开启新会话，在提示之前调用 `forUser` 方法：

```php
$response = (new SalesCoach)->forUser($user)->prompt('Hello!');

$conversationId = $response->conversationId;
```

会话 ID 会随响应返回，可以存储起来供以后使用；你也可以直接从 `agent_conversations` 表中获取用户的所有会话。

要继续一个已有的会话，使用 `continue` 方法：

```php
$response = (new SalesCoach)
    ->continue($conversationId, as: $user)
    ->prompt('Tell me more about that.');
```

使用 `RemembersConversations` trait 时，之前的消息会在提示时自动加载并包含在会话上下文中。每次交互后，新消息（包括用户和助手消息）都会被自动存储。

<a name="structured-output"></a>
### 结构化输出

如果你希望智能体返回结构化输出，可以实现 `HasStructuredOutput` 接口，这要求你的智能体定义一个 `schema` 方法：

```php
<?php

namespace App\Ai\Agents;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasStructuredOutput
{
    use Promptable;

    // ...

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'score' => $schema->integer()->required(),
        ];
    }
}
```

提示一个返回结构化输出的智能体时，你可以像访问数组一样访问返回的 `StructuredAgentResponse`：

```php
$response = (new SalesCoach)->prompt('Analyze this sales transcript...');

return $response['score'];
```

<a name="attachments"></a>
### 附件

提示时，你还可以随提示传递附件，让模型检查图片和文档：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Files;

$response = (new SalesCoach)->prompt(
    'Analyze the attached sales transcript...',
    attachments: [
        Files\Document::fromStorage('transcript.pdf') // 附加来自文件系统磁盘的文档...
        Files\Document::fromPath('/home/laravel/transcript.md') // 附加来自本地路径的文档...
        $request->file('transcript'), // 附加上传的文件...
    ]
);
```

同样，`Laravel\Ai\Files\Image` 类可用于向提示附加图片：

```php
use App\Ai\Agents\ImageAnalyzer;
use Laravel\Ai\Files;

$response = (new ImageAnalyzer)->prompt(
    'What is in this image?',
    attachments: [
        Files\Image::fromStorage('photo.jpg') // 附加来自文件系统磁盘的图片...
        Files\Image::fromPath('/home/laravel/photo.jpg') // 附加来自本地路径的图片...
        $request->file('photo'), // 附加上传的文件...
    ]
);
```

<a name="streaming"></a>
### 流式传输

你可以通过调用 `stream` 方法对智能体的响应进行流式传输。返回的 `StreamableAgentResponse` 可以直接从路由返回，自动向客户端发送流式响应（SSE）：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)->stream('Analyze this sales transcript...');
});
```

可以使用 `then` 方法提供一个闭包，在整个响应流式发送给客户端后触发：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Responses\StreamedAgentResponse;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('Analyze this sales transcript...')
        ->then(function (StreamedAgentResponse $response) {
            // $response->text, $response->events, $response->usage...
        });
});
```

此外，你也可以手动遍历流式事件：

```php
$stream = (new SalesCoach)->stream('Analyze this sales transcript...');

foreach ($stream as $event) {
    // ...
}
```

<a name="streaming-using-the-vercel-ai-sdk-protocol"></a>
#### 使用 Vercel AI SDK 协议进行流式传输

通过在可流式响应上调用 `usingVercelDataProtocol` 方法，你可以使用 [Vercel AI SDK 流协议](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)对流式事件进行传输：

```php
use App\Ai\Agents\SalesCoach;

Route::get('/coach', function () {
    return (new SalesCoach)
        ->stream('Analyze this sales transcript...')
        ->usingVercelDataProtocol();
});
```

<a name="broadcasting"></a>
### 广播

你可以通过几种不同的方式广播流式事件。首先，你可以直接在流式事件上调用 `broadcast` 或 `broadcastNow` 方法：

```php
use App\Ai\Agents\SalesCoach;
use Illuminate\Broadcasting\Channel;

$stream = (new SalesCoach)->stream('Analyze this sales transcript...');

foreach ($stream as $event) {
    $event->broadcast(new Channel('channel-name'));
}
```

或者，你可以调用智能体的 `broadcastOnQueue` 方法，将智能体操作加入队列，并在流式事件可用时广播它们：

```php
(new SalesCoach)->broadcastOnQueue(
    'Analyze this sales transcript...'
    new Channel('channel-name'),
);
```

<a name="queueing"></a>
### 队列

使用智能体的 `queue` 方法，你可以提示智能体，同时让它在后台处理响应，使你的应用保持快速和灵敏。`then` 和 `catch` 方法可用于注册闭包，分别在响应可用或发生异常时触发：

```php
use Illuminate\Http\Request;
use Laravel\Ai\Responses\AgentResponse;
use Throwable;

Route::post('/coach', function (Request $request) {
    return (new SalesCoach)
        ->queue($request->input('transcript'))
        ->then(function (AgentResponse $response) {
            // ...
        })
        ->catch(function (Throwable $e) {
            // ...
        });

    return back();
});
```

<a name="tools"></a>
### 工具

工具可用于为智能体提供额外功能，供其在响应提示时使用。可以使用 `make:tool` Artisan 命令创建工具：

```shell
php artisan make:tool RandomNumberGenerator
```

生成的工具会被放置在应用的 `app/Ai/Tools` 目录中。每个工具都包含一个 `handle` 方法，当智能体需要使用该工具时会调用它：

```php
<?php

namespace App\Ai\Tools;

use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Tools\Request;
use Stringable;

class RandomNumberGenerator implements Tool
{
    /**
     * Get the description of the tool's purpose.
     */
    public function description(): Stringable|string
    {
        return 'This tool may be used to generate cryptographically secure random numbers.';
    }

    /**
     * Execute the tool.
     */
    public function handle(Request $request): Stringable|string
    {
        return (string) random_int($request['min'], $request['max']);
    }

    /**
     * Get the tool's schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'min' => $schema->integer()->min(0)->required(),
            'max' => $schema->integer()->required(),
        ];
    }
}
```

定义好工具后，你可以在任何智能体的 `tools` 方法中返回它：

```php
use App\Ai\Tools\RandomNumberGenerator;

/**
 * Get the tools available to the agent.
 *
 * @return Tool[]
 */
public function tools(): iterable
{
    return [
        new RandomNumberGenerator,
    ];
}
```

<a name="similarity-search"></a>
#### 相似度搜索

`SimilaritySearch` 工具允许智能体使用存储在数据库中的向量嵌入，搜索与给定查询相似的文档。当你希望让智能体能够搜索应用数据时，这对于检索增强生成（RAG）非常有用。

创建相似度搜索工具最简单的方式，是使用 `usingModel` 方法配合一个带有向量嵌入的 Eloquent 模型：

```php
use App\Models\Document;
use Laravel\Ai\Tools\SimilaritySearch;

public function tools(): iterable
{
    return [
        SimilaritySearch::usingModel(Document::class, 'embedding'),
    ];
}
```

第一个参数是 Eloquent 模型类，第二个参数是包含向量嵌入的列。

你还可以提供介于 `0.0` 和 `1.0` 之间的最小相似度阈值，以及一个用于自定义查询的闭包：

```php
SimilaritySearch::usingModel(
    model: Document::class,
    column: 'embedding',
    minSimilarity: 0.7,
    limit: 10,
    query: fn ($query) => $query->where('published', true),
),
```

如需更多控制，你可以创建一个带有自定义闭包的相似度搜索工具，该闭包返回搜索结果：

```php
use App\Models\Document;
use Laravel\Ai\Tools\SimilaritySearch;

public function tools(): iterable
{
    return [
        new SimilaritySearch(using: function (string $query) {
            return Document::query()
                ->where('user_id', $this->user->id)
                ->whereVectorSimilarTo('embedding', $query)
                ->limit(10)
                ->get();
        }),
    ];
}
```

你可以使用 `withDescription` 方法自定义工具的描述：

```php
SimilaritySearch::usingModel(Document::class, 'embedding')
    ->withDescription('Search the knowledge base for relevant articles.'),
```

<a name="provider-tools"></a>
### 提供商工具

提供商工具是由 AI 提供商原生实现的特殊工具，提供网页搜索、URL 抓取和文件搜索等能力。与普通工具不同，提供商工具由提供商自身执行，而不是由你的应用执行。

提供商工具可以由智能体的 `tools` 方法返回。

<a name="web-search"></a>
#### 网页搜索

`WebSearch` 提供商工具允许智能体搜索网络以获取实时信息。这对于回答有关时事、最新数据，或模型训练截止时间之后可能已发生变化的话题非常有用。

**支持的提供商：** Anthropic、OpenAI、Gemini

```php
use Laravel\Ai\Providers\Tools\WebSearch;

public function tools(): iterable
{
    return [
        new WebSearch,
    ];
}
```

你可以配置网页搜索工具，限制搜索次数或将结果限制在特定域名：

```php
(new WebSearch)->max(5)->allow(['laravel.com', 'php.net']),
```

要根据用户位置优化搜索结果，使用 `location` 方法：

```php
(new WebSearch)->location(
    city: 'New York',
    region: 'NY',
    country: 'US'
);
```

<a name="web-fetch"></a>
#### 网页抓取

`WebFetch` 提供商工具允许智能体抓取并阅读网页内容。当你需要智能体分析特定 URL，或从已知网页获取详细信息时，这非常有用。

**支持的提供商：** Anthropic、Gemini

```php
use Laravel\Ai\Providers\Tools\WebFetch;

public function tools(): iterable
{
    return [
        new WebFetch,
    ];
}
```

你可以配置网页抓取工具，限制抓取次数或限制在特定域名：

```php
(new WebFetch)->max(3)->allow(['docs.laravel.com']),
```

<a name="file-search"></a>
#### 文件搜索

`FileSearch` 提供商工具允许智能体搜索存储在[向量存储](#vector-stores)中的[文件](#files)。它让智能体能够搜索你上传的文档以获取相关信息，从而实现检索增强生成（RAG）。

**支持的提供商：** OpenAI、Gemini

```php
use Laravel\Ai\Providers\Tools\FileSearch;

public function tools(): iterable
{
    return [
        new FileSearch(stores: ['store_id']),
    ];
}
```

你可以提供多个向量存储 ID，跨多个存储进行搜索：

```php
new FileSearch(stores: ['store_1', 'store_2']);
```

如果你的文件带有[元数据](#adding-files-to-stores)，可以通过提供 `where` 参数来过滤搜索结果。对于简单的相等过滤，传递一个数组：

```php
new FileSearch(stores: ['store_id'], where: [
    'author' => 'Taylor Otwell',
    'year' => 2026,
]);
```

对于更复杂的过滤，你可以传递一个接收 `FileSearchQuery` 实例的闭包：

```php
use Laravel\Ai\Providers\Tools\FileSearchQuery;

new FileSearch(stores: ['store_id'], where: fn (FileSearchQuery $query) =>
    $query->where('author', 'Taylor Otwell')
        ->whereNot('status', 'draft')
        ->whereIn('category', ['news', 'updates'])
);
```

<a name="middleware"></a>
### 中间件

智能体支持中间件，允许你在提示发送给提供商之前拦截并修改它们。可以使用 `make:agent-middleware` Artisan 命令创建中间件：

```shell
php artisan make:agent-middleware LogPrompts
```

生成的中间件会被放置在应用的 `app/Ai/Middleware` 目录中。要为智能体添加中间件，需实现 `HasMiddleware` 接口，并定义一个返回中间件类数组的 `middleware` 方法：

```php
<?php

namespace App\Ai\Agents;

use App\Ai\Middleware\LogPrompts;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasMiddleware;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasMiddleware
{
    use Promptable;

    // ...

    /**
     * Get the agent's middleware.
     */
    public function middleware(): array
    {
        return [
            new LogPrompts,
        ];
    }
}
```

每个中间件类都应定义一个 `handle` 方法，接收 `AgentPrompt` 和一个用于将提示传递给下一个中间件的 `Closure`：

```php
<?php

namespace App\Ai\Middleware;

use Closure;
use Laravel\Ai\Prompts\AgentPrompt;

class LogPrompts
{
    /**
     * Handle the incoming prompt.
     */
    public function handle(AgentPrompt $prompt, Closure $next)
    {
        Log::info('Prompting agent', ['prompt' => $prompt->prompt]);

        return $next($prompt);
    }
}
```

你可以在响应上使用 `then` 方法，在智能体处理完成后执行代码。这同时适用于同步响应和流式响应：

```php
public function handle(AgentPrompt $prompt, Closure $next)
{
    return $next($prompt)->then(function (AgentResponse $response) {
        Log::info('Agent responded', ['text' => $response->text]);
    });
}
```

<a name="anonymous-agents"></a>
### 匿名智能体

有时你可能只想快速与某个模型交互，而不想创建专用的智能体类。你可以使用 `agent` 函数创建一个临时的匿名智能体：

```php
use function Laravel\Ai\{agent};

$response = agent(
    instructions: 'You are an expert at software development.',
    messages: [],
    tools: [],
)->prompt('Tell me about Laravel')
```

匿名智能体同样可以产生结构化输出：

```php
use Illuminate\Contracts\JsonSchema\JsonSchema;

use function Laravel\Ai\{agent};

$response = agent(
    schema: fn (JsonSchema $schema) => [
        'number' => $schema->integer()->required(),
    ],
)->prompt('Generate a random number less than 100')
```

<a name="agent-configuration"></a>
### 智能体配置

你可以使用 PHP 属性为智能体配置文本生成选项。可用的属性如下：

- `MaxSteps`：智能体使用工具时最多可执行的步骤数。
- `MaxTokens`：模型最多可生成的 token 数。
- `Model`：智能体应使用的模型。
- `Provider`：智能体使用的 AI 提供商（故障转移时可指定多个）。
- `Temperature`：生成时使用的采样温度（0.0 到 1.0）。
- `Timeout`：智能体请求的 HTTP 超时秒数（默认：60）。
- `UseCheapestModel`：使用提供商最便宜的文本模型以优化成本。
- `UseSmartestModel`：使用提供商最强大的文本模型处理复杂任务。

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Attributes\MaxSteps;
use Laravel\Ai\Attributes\MaxTokens;
use Laravel\Ai\Attributes\Model;
use Laravel\Ai\Attributes\Provider;
use Laravel\Ai\Attributes\Temperature;
use Laravel\Ai\Attributes\Timeout;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

#[Provider(Lab::Anthropic)]
#[Model('claude-haiku-4-5-20251001')]
#[MaxSteps(10)]
#[MaxTokens(4096)]
#[Temperature(0.7)]
#[Timeout(120)]
class SalesCoach implements Agent
{
    use Promptable;

    // ...
}
```

`UseCheapestModel` 和 `UseSmartestModel` 属性允许你在不指定模型名称的情况下，自动为给定提供商选择最具成本效益或最强大的模型。当你希望在不同提供商之间针对成本或能力进行优化时，这非常有用：

```php
use Laravel\Ai\Attributes\UseCheapestModel;
use Laravel\Ai\Attributes\UseSmartestModel;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

#[UseCheapestModel]
class SimpleSummarizer implements Agent
{
    use Promptable;

    // Will use the cheapest model (e.g., Haiku)...
}

#[UseSmartestModel]
class ComplexReasoner implements Agent
{
    use Promptable;

    // Will use the most capable model (e.g., Opus)...
}
```

除了 `Provider`、`Model` 和 `Timeout` 属性之外，你还可以在智能体上定义 `provider`、`model` 和 `timeout` 方法，在运行时解析这些值。当配置依赖于数据库记录、配置值或其他运行时状态时，这非常有用。`maxSteps`、`maxTokens` 和 `temperature` 同理：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent
{
    use Promptable;

    public function maxSteps(): int
    {
        return config('agents.sales_coach.max_steps', 5);
    }

    public function maxTokens(): int
    {
        return $this->user->plan->maxTokens();
    }

    public function temperature(): float
    {
        return Setting::get('sales_coach_temperature', 0.7);
    }
}
```

当同一选项同时定义了方法和属性时，方法的优先级更高。

<a name="provider-options"></a>
### 提供商选项

如果你的智能体需要传递特定于提供商的选项（例如 OpenAI 的推理力度或惩罚设置），可以实现 `HasProviderOptions` 契约并定义一个 `providerOptions` 方法：

```php
<?php

namespace App\Ai\Agents;

use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\HasProviderOptions;
use Laravel\Ai\Enums\Lab;
use Laravel\Ai\Promptable;

class SalesCoach implements Agent, HasProviderOptions
{
    use Promptable;

    // ...

    /**
     * Get provider-specific generation options.
     */
    public function providerOptions(Lab|string $provider): array
    {
        return match ($provider) {
            Lab::OpenAI => [
                'reasoning' => ['effort' => 'low'],
                'frequency_penalty' => 0.5,
                'presence_penalty' => 0.3,
            ],
            Lab::Anthropic => [
                'thinking' => ['budget_tokens' => 1024],
            ],
            default => [],
        };
    }
}
```

`providerOptions` 方法会接收当前使用的提供商（`Lab` 枚举或字符串），允许你为每个提供商返回不同的选项。在使用[故障转移](#failover)时这尤其有用，因为每个后备提供商都可以获得自己的配置。

<a name="images"></a>
## 图片

`Laravel\Ai\Image` 类可用于通过 `openai`、`gemini` 或 `xai` 提供商生成图片：

```php
use Laravel\Ai\Image;

$image = Image::of('A donut sitting on the kitchen counter')->generate();

$rawContent = (string) $image;
```

可以使用 `square`、`portrait` 和 `landscape` 方法控制图片的宽高比，使用 `quality` 方法引导模型的最终图片质量（`high`、`medium`、`low`）。可以使用 `timeout` 方法指定 HTTP 超时秒数：

```php
use Laravel\Ai\Image;

$image = Image::of('A donut sitting on the kitchen counter')
    ->quality('high')
    ->landscape()
    ->timeout(120)
    ->generate();
```

你可以使用 `attachments` 方法附加参考图片：

```php
use Laravel\Ai\Files;
use Laravel\Ai\Image;

$image = Image::of('Update this photo of me to be in the style of an impressionist painting.')
    ->attachments([
        Files\Image::fromStorage('photo.jpg'),
        // Files\Image::fromPath('/home/laravel/photo.jpg'),
        // Files\Image::fromUrl('https://example.com/photo.jpg'),
        // $request->file('photo'),
    ])
    ->landscape()
    ->generate();
```

生成的图片可以轻松存储到应用的 `config/filesystems.php` 配置文件中配置的默认磁盘：

```php
$image = Image::of('A donut sitting on the kitchen counter');

$path = $image->store();
$path = $image->storeAs('image.jpg');
$path = $image->storePublicly();
$path = $image->storePubliclyAs('image.jpg');
```

图片生成也可以加入队列：

```php
use Laravel\Ai\Image;
use Laravel\Ai\Responses\ImageResponse;

Image::of('A donut sitting on the kitchen counter')
    ->portrait()
    ->queue()
    ->then(function (ImageResponse $image) {
        $path = $image->store();

        // ...
    });
```

<a name="audio"></a>
## 音频

`Laravel\Ai\Audio` 类可用于根据给定文本生成音频：

```php
use Laravel\Ai\Audio;

$audio = Audio::of('I love coding with Laravel.')->generate();

$rawContent = (string) $audio;
```

可以使用 `male`、`female` 和 `voice` 方法确定生成音频的声音：

```php
$audio = Audio::of('I love coding with Laravel.')
    ->female()
    ->generate();

$audio = Audio::of('I love coding with Laravel.')
    ->voice('voice-id-or-name')
    ->generate();
```

类似地，可以使用 `instructions` 方法动态指导模型如何生成音频的音色风格：

```php
$audio = Audio::of('I love coding with Laravel.')
    ->female()
    ->instructions('Said like a pirate')
    ->generate();
```

生成的音频可以轻松存储到应用的 `config/filesystems.php` 配置文件中配置的默认磁盘：

```php
$audio = Audio::of('I love coding with Laravel.')->generate();

$path = $audio->store();
$path = $audio->storeAs('audio.mp3');
$path = $audio->storePublicly();
$path = $audio->storePubliclyAs('audio.mp3');
```

音频生成也可以加入队列：

```php
use Laravel\Ai\Audio;
use Laravel\Ai\Responses\AudioResponse;

Audio::of('I love coding with Laravel.')
    ->queue()
    ->then(function (AudioResponse $audio) {
        $path = $audio->store();

        // ...
    });
```

<a name="transcription"></a>
## 转录

`Laravel\Ai\Transcription` 类可用于生成给定音频的转录文本：

```php
use Laravel\Ai\Transcription;

$transcript = Transcription::fromPath('/home/laravel/audio.mp3')->generate();
$transcript = Transcription::fromStorage('audio.mp3')->generate();
$transcript = Transcription::fromUpload($request->file('audio'))->generate();

return (string) $transcript;
```

可以使用 `diarize` 方法表明你希望响应在原始文本转录之外，还包含带说话人分离的转录，让你能够按说话人访问分段转录：

```php
$transcript = Transcription::fromStorage('audio.mp3')
    ->diarize()
    ->generate();
```

转录生成也可以加入队列：

```php
use Laravel\Ai\Transcription;
use Laravel\Ai\Responses\TranscriptionResponse;

Transcription::fromStorage('audio.mp3')
    ->queue()
    ->then(function (TranscriptionResponse $transcript) {
        // ...
    });
```

<a name="embeddings"></a>
## 嵌入

你可以使用 Laravel `Stringable` 类新增的 `toEmbeddings` 方法，轻松为任意给定字符串生成向量嵌入：

```php
use Illuminate\Support\Str;

$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings();
```

此外，你也可以使用 `Embeddings` 类一次性为多个输入生成嵌入：

```php
use Laravel\Ai\Embeddings;

$response = Embeddings::for([
    'Napa Valley has great wine.',
    'Laravel is a PHP framework.',
])->generate();

$response->embeddings; // [[0.123, 0.456, ...], [0.789, 0.012, ...]]
```

你可以为嵌入指定维度和提供商：

```php
$response = Embeddings::for(['Napa Valley has great wine.'])
    ->dimensions(1536)
    ->generate(Lab::OpenAI, 'text-embedding-3-small');
```

<a name="querying-embeddings"></a>
### 查询嵌入

生成嵌入后，你通常会将它们存储到数据库的 `vector` 列中，以便之后查询。Laravel 通过 `pgvector` 扩展为 PostgreSQL 上的向量列提供了原生支持。开始之前，在迁移中定义一个 `vector` 列并指定维度数：

```php
Schema::ensureVectorExtensionExists();

Schema::create('documents', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->text('content');
    $table->vector('embedding', dimensions: 1536);
    $table->timestamps();
});
```

你还可以添加向量索引来加速相似度搜索。在向量列上调用 `index` 时，Laravel 会自动创建一个使用余弦距离的 HNSW 索引：

```php
$table->vector('embedding', dimensions: 1536)->index();
```

在 Eloquent 模型上，你应将向量列转换为 `array` 类型：

```php
protected function casts(): array
{
    return [
        'embedding' => 'array',
    ];
}
```

要查询相似的记录，使用 `whereVectorSimilarTo` 方法。该方法按最小余弦相似度（介于 `0.0` 和 `1.0` 之间，`1.0` 表示完全相同）过滤结果，并按相似度排序：

```php
use App\Models\Document;

$documents = Document::query()
    ->whereVectorSimilarTo('embedding', $queryEmbedding, minSimilarity: 0.4)
    ->limit(10)
    ->get();
```

`$queryEmbedding` 可以是浮点数数组，也可以是普通字符串。当传入字符串时，Laravel 会自动为其生成嵌入：

```php
$documents = Document::query()
    ->whereVectorSimilarTo('embedding', 'best wineries in Napa Valley')
    ->limit(10)
    ->get();
```

如果需要更多控制，你可以独立使用更底层的 `whereVectorDistanceLessThan`、`selectVectorDistance` 和 `orderByVectorDistance` 方法：

```php
$documents = Document::query()
    ->select('*')
    ->selectVectorDistance('embedding', $queryEmbedding, as: 'distance')
    ->whereVectorDistanceLessThan('embedding', $queryEmbedding, maxDistance: 0.3)
    ->orderByVectorDistance('embedding', $queryEmbedding)
    ->limit(10)
    ->get();
```

如果你希望让智能体能够将相似度搜索作为工具执行，请查阅[相似度搜索](#similarity-search)工具的文档。

> [!NOTE]
> 向量查询目前仅在使用 `pgvector` 扩展的 PostgreSQL 连接上受支持。

<a name="caching-embeddings"></a>
### 缓存嵌入

嵌入生成可以被缓存，以避免对相同输入的重复 API 调用。要启用缓存，将 `ai.caching.embeddings.cache` 配置选项设置为 `true`：

```php
'caching' => [
    'embeddings' => [
        'cache' => true,
        'store' => env('CACHE_STORE', 'database'),
        // ...
    ],
],
```

启用缓存后，嵌入会被缓存 30 天。缓存键基于提供商、模型、维度和输入内容生成，确保相同的请求返回缓存结果，而不同的配置生成新的嵌入。

即使全局缓存被禁用，你也可以使用 `cache` 方法为特定请求启用缓存：

```php
$response = Embeddings::for(['Napa Valley has great wine.'])
    ->cache()
    ->generate();
```

你可以指定自定义的缓存时长（秒）：

```php
$response = Embeddings::for(['Napa Valley has great wine.'])
    ->cache(seconds: 3600) // 缓存 1 小时
    ->generate();
```

`toEmbeddings` Stringable 方法也接受 `cache` 参数：

```php
// 以默认时长缓存...
$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings(cache: true);

// 以指定时长缓存...
$embeddings = Str::of('Napa Valley has great wine.')->toEmbeddings(cache: 3600);
```

<a name="reranking"></a>
## 重排序

重排序允许你根据文档与给定查询的相关性对文档列表重新排序。通过语义理解来改进搜索结果时，这非常有用：

`Laravel\Ai\Reranking` 类可用于对文档进行重排序：

```php
use Laravel\Ai\Reranking;

$response = Reranking::of([
    'Django is a Python web framework.',
    'Laravel is a PHP web application framework.',
    'React is a JavaScript library for building user interfaces.',
])->rerank('PHP frameworks');

// Access the top result...
$response->first()->document; // "Laravel is a PHP web application framework."
$response->first()->score;    // 0.95
$response->first()->index;    // 1 (original position)
```

可以使用 `limit` 方法限制返回的结果数量：

```php
$response = Reranking::of($documents)
    ->limit(5)
    ->rerank('search query');
```

<a name="reranking-collections"></a>
### 重排序集合

为了方便，Laravel 集合可以使用 `rerank` 宏进行重排序。第一个参数指定用于重排序的字段，第二个参数是查询：

```php
// Rerank by a single field...
$posts = Post::all()
    ->rerank('body', 'Laravel tutorials');

// Rerank by multiple fields (sent as JSON)...
$reranked = $posts->rerank(['title', 'body'], 'Laravel tutorials');

// Rerank using a closure to build the document...
$reranked = $posts->rerank(
    fn ($post) => $post->title.': '.$post->body,
    'Laravel tutorials'
);
```

你还可以限制结果数量并指定提供商：

```php
$reranked = $posts->rerank(
    by: 'content',
    query: 'Laravel tutorials',
    limit: 10,
    provider: Lab::Cohere
);
```

<a name="files"></a>
## 文件

`Laravel\Ai\Files` 类或各个单独的文件类可用于将文件存储到 AI 提供商处，供之后在会话中使用。对于大型文档，或你希望多次引用而无需重复上传的文件，这非常有用：

```php
use Laravel\Ai\Files\Document;
use Laravel\Ai\Files\Image;

// Store a file from a local path...
$response = Document::fromPath('/home/laravel/document.pdf')->put();
$response = Image::fromPath('/home/laravel/photo.jpg')->put();

// Store a file that is stored on a filesystem disk...
$response = Document::fromStorage('document.pdf', disk: 'local')->put();
$response = Image::fromStorage('photo.jpg', disk: 'local')->put();

// Store a file that is stored on a remote URL...
$response = Document::fromUrl('https://example.com/document.pdf')->put();
$response = Image::fromUrl('https://example.com/photo.jpg')->put();

return $response->id;
```

你还可以存储原始内容或上传的文件：

```php
use Laravel\Ai\Files;
use Laravel\Ai\Files\Document;

// Store raw content...
$stored = Document::fromString('Hello, World!', 'text/plain')->put();

// Store an uploaded file...
$stored = Document::fromUpload($request->file('document'))->put();
```

文件存储好之后，你就可以在通过智能体生成文本时引用该文件，而无需重新上传：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Files;

$response = (new SalesCoach)->prompt(
    'Analyze the attached sales transcript...'
    attachments: [
        Files\Document::fromId('file-id') // Attach a stored document...
    ]
);
```

要获取之前存储的文件，在文件实例上使用 `get` 方法：

```php
use Laravel\Ai\Files\Document;

$file = Document::fromId('file-id')->get();

$file->id;
$file->mimeType();
```

要从提供商处删除文件，使用 `delete` 方法：

```php
Document::fromId('file-id')->delete();
```

默认情况下，`Files` 类使用应用 `config/ai.php` 配置文件中配置的默认 AI 提供商。对于大多数操作，你可以使用 `provider` 参数指定其他提供商：

```php
$response = Document::fromPath(
    '/home/laravel/document.pdf'
)->put(provider: Lab::Anthropic);
```

<a name="using-stored-files-in-conversations"></a>
### 在会话中使用已存储的文件

文件存储到提供商处之后，你可以在智能体会话中使用 `Document` 或 `Image` 类的 `fromId` 方法引用它：

```php
use App\Ai\Agents\DocumentAnalyzer;
use Laravel\Ai\Files;
use Laravel\Ai\Files\Document;

$stored = Document::fromPath('/path/to/report.pdf')->put();

$response = (new DocumentAnalyzer)->prompt(
    'Summarize this document.',
    attachments: [
        Document::fromId($stored->id),
    ],
);
```

类似地，存储的图片可以使用 `Image` 类引用：

```php
use Laravel\Ai\Files;
use Laravel\Ai\Files\Image;

$stored = Image::fromPath('/path/to/photo.jpg')->put();

$response = (new ImageAnalyzer)->prompt(
    'What is in this image?',
    attachments: [
        Image::fromId($stored->id),
    ],
);
```

<a name="vector-stores"></a>
## 向量存储

向量存储允许你创建可搜索的文件集合，用于检索增强生成（RAG）。`Laravel\Ai\Stores` 类提供了创建、获取和删除向量存储的方法：

```php
use Laravel\Ai\Stores;

// Create a new vector store...
$store = Stores::create('Knowledge Base');

// Create a store with additional options...
$store = Stores::create(
    name: 'Knowledge Base',
    description: 'Documentation and reference materials.',
    expiresWhenIdleFor: days(30),
);

return $store->id;
```

要根据 ID 获取已有的向量存储，使用 `get` 方法：

```php
use Laravel\Ai\Stores;

$store = Stores::get('store_id');

$store->id;
$store->name;
$store->fileCounts;
$store->ready;
```

要删除向量存储，使用 `Stores` 类或存储实例上的 `delete` 方法：

```php
use Laravel\Ai\Stores;

// Delete by ID...
Stores::delete('store_id');

// Or delete via a store instance...
$store = Stores::get('store_id');

$store->delete();
```

<a name="adding-files-to-stores"></a>
### 向存储中添加文件

有了向量存储之后，你可以使用 `add` 方法向其中添加[文件](#files)。添加到存储中的文件会自动建立索引，供[文件搜索提供商工具](#file-search)进行语义搜索：

```php
use Laravel\Ai\Files\Document;
use Laravel\Ai\Stores;

$store = Stores::get('store_id');

// Add a file that has already been stored with the provider...
$document = $store->add('file_id');
$document = $store->add(Document::fromId('file_id'));

// Or, store and add a file in one step...
$document = $store->add(Document::fromPath('/path/to/document.pdf'));
$document = $store->add(Document::fromStorage('manual.pdf'));
$document = $store->add($request->file('document'));

$document->id;
$document->fileId;
```

> **Note:** 通常，将之前已存储的文件添加到向量存储时，返回的文档 ID 会与该文件之前分配的 ID 一致；不过，某些向量存储提供商可能会返回一个新的、不同的「文档 ID」。因此，建议你始终将两个 ID 都存储到数据库中，以备将来参考。

向存储添加文件时，你可以为文件附加元数据。之后使用[文件搜索提供商工具](#file-search)时，这些元数据可用于过滤搜索结果：

```php
$store->add(Document::fromPath('/path/to/document.pdf'), metadata: [
    'author' => 'Taylor Otwell',
    'department' => 'Engineering',
    'year' => 2026,
]);
```

要从存储中移除文件，使用 `remove` 方法：

```php
$store->remove('file_id');
```

从向量存储中移除文件并不会将其从提供商的[文件存储](#files)中删除。要从向量存储中移除文件并从文件存储中永久删除它，使用 `deleteFile` 参数：

```php
$store->remove('file_abc123', deleteFile: true);
```

<a name="failover"></a>
## 故障转移

在提示或生成其他媒体时，你可以提供一组提供商 / 模型，当主提供商遇到服务中断或速率限制时，自动故障转移到备用的提供商 / 模型：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Image;

$response = (new SalesCoach)->prompt(
    'Analyze this sales transcript...',
    provider: [Lab::OpenAI, Lab::Anthropic],
);

$image = Image::of('A donut sitting on the kitchen counter')
    ->generate(provider: [Lab::Gemini, Lab::xAI]);
```

<a name="testing"></a>
## 测试

<a name="testing-agents"></a>
### 智能体

要在测试中伪造智能体的响应，可以在智能体类上调用 `fake` 方法。你可以选择提供一个响应数组或一个闭包：

```php
use App\Ai\Agents\SalesCoach;
use Laravel\Ai\Prompts\AgentPrompt;

// Automatically generate a fixed response for every prompt...
SalesCoach::fake();

// Provide a list of prompt responses...
SalesCoach::fake([
    'First response',
    'Second response',
]);

// Dynamically handle prompt responses based on the incoming prompt...
SalesCoach::fake(function (AgentPrompt $prompt) {
    return 'Response for: '.$prompt->prompt;
});
```

> **Note:** 对返回结构化输出的智能体调用 `Agent::fake()` 时，Laravel 会自动生成符合该智能体所定义输出模式的伪造数据。

提示智能体之后，你可以对收到的提示进行断言：

```php
use Laravel\Ai\Prompts\AgentPrompt;

SalesCoach::assertPrompted('Analyze this...');

SalesCoach::assertPrompted(function (AgentPrompt $prompt) {
    return $prompt->contains('Analyze');
});

SalesCoach::assertNotPrompted('Missing prompt');

SalesCoach::assertNeverPrompted();
```

对于加入队列的智能体调用，使用队列断言方法：

```php
use Laravel\Ai\QueuedAgentPrompt;

SalesCoach::assertQueued('Analyze this...');

SalesCoach::assertQueued(function (QueuedAgentPrompt $prompt) {
    return $prompt->contains('Analyze');
});

SalesCoach::assertNotQueued('Missing prompt');

SalesCoach::assertNeverQueued();
```

要确保所有智能体调用都有对应的伪造响应，可以使用 `preventStrayPrompts`。如果智能体在没有定义伪造响应的情况下被调用，将抛出异常：

```php
SalesCoach::fake()->preventStrayPrompts();
```

<a name="testing-images"></a>
### 图片

可以通过在 `Image` 类上调用 `fake` 方法来伪造图片生成。图片被伪造后，可以对记录的图片生成提示执行各种断言：

```php
use Laravel\Ai\Image;
use Laravel\Ai\Prompts\ImagePrompt;
use Laravel\Ai\Prompts\QueuedImagePrompt;

// Automatically generate a fixed response for every prompt...
Image::fake();

// Provide a list of prompt responses...
Image::fake([
    base64_encode($firstImage),
    base64_encode($secondImage),
]);

// Dynamically handle prompt responses based on the incoming prompt...
Image::fake(function (ImagePrompt $prompt) {
    return base64_encode('...');
});
```

生成图片之后，你可以对收到的提示进行断言：

```php
Image::assertGenerated(function (ImagePrompt $prompt) {
    return $prompt->contains('sunset') && $prompt->isLandscape();
});

Image::assertNotGenerated('Missing prompt');

Image::assertNothingGenerated();
```

对于加入队列的图片生成，使用队列断言方法：

```php
Image::assertQueued(
    fn (QueuedImagePrompt $prompt) => $prompt->contains('sunset')
);

Image::assertNotQueued('Missing prompt');

Image::assertNothingQueued();
```

要确保所有图片生成都有对应的伪造响应，可以使用 `preventStrayImages`。如果在没有定义伪造响应的情况下生成图片，将抛出异常：

```php
Image::fake()->preventStrayImages();
```

<a name="testing-audio"></a>
### 音频

可以通过在 `Audio` 类上调用 `fake` 方法来伪造音频生成。音频被伪造后，可以对记录的音频生成提示执行各种断言：

```php
use Laravel\Ai\Audio;
use Laravel\Ai\Prompts\AudioPrompt;
use Laravel\Ai\Prompts\QueuedAudioPrompt;

// Automatically generate a fixed response for every prompt...
Audio::fake();

// Provide a list of prompt responses...
Audio::fake([
    base64_encode($firstAudio),
    base64_encode($secondAudio),
]);

// Dynamically handle prompt responses based on the incoming prompt...
Audio::fake(function (AudioPrompt $prompt) {
    return base64_encode('...');
});
```

生成音频之后，你可以对收到的提示进行断言：

```php
Audio::assertGenerated(function (AudioPrompt $prompt) {
    return $prompt->contains('Hello') && $prompt->isFemale();
});

Audio::assertNotGenerated('Missing prompt');

Audio::assertNothingGenerated();
```

对于加入队列的音频生成，使用队列断言方法：

```php
Audio::assertQueued(
    fn (QueuedAudioPrompt $prompt) => $prompt->contains('Hello')
);

Audio::assertNotQueued('Missing prompt');

Audio::assertNothingQueued();
```

要确保所有音频生成都有对应的伪造响应，可以使用 `preventStrayAudio`。如果在没有定义伪造响应的情况下生成音频，将抛出异常：

```php
Audio::fake()->preventStrayAudio();
```

<a name="testing-transcriptions"></a>
### 转录

可以通过在 `Transcription` 类上调用 `fake` 方法来伪造转录生成。转录被伪造后，可以对记录的转录生成提示执行各种断言：

```php
use Laravel\Ai\Transcription;
use Laravel\Ai\Prompts\TranscriptionPrompt;
use Laravel\Ai\Prompts\QueuedTranscriptionPrompt;

// Automatically generate a fixed response for every prompt...
Transcription::fake();

// Provide a list of prompt responses...
Transcription::fake([
    'First transcription text.',
    'Second transcription text.',
]);

// Dynamically handle prompt responses based on the incoming prompt...
Transcription::fake(function (TranscriptionPrompt $prompt) {
    return 'Transcribed text...';
});
```

生成转录之后，你可以对收到的提示进行断言：

```php
Transcription::assertGenerated(function (TranscriptionPrompt $prompt) {
    return $prompt->language === 'en' && $prompt->isDiarized();
});

Transcription::assertNotGenerated(
    fn (TranscriptionPrompt $prompt) => $prompt->language === 'fr'
);

Transcription::assertNothingGenerated();
```

对于加入队列的转录生成，使用队列断言方法：

```php
Transcription::assertQueued(
    fn (QueuedTranscriptionPrompt $prompt) => $prompt->isDiarized()
);

Transcription::assertNotQueued(
    fn (QueuedTranscriptionPrompt $prompt) => $prompt->language === 'fr'
);

Transcription::assertNothingQueued();
```

要确保所有转录生成都有对应的伪造响应，可以使用 `preventStrayTranscriptions`。如果在没有定义伪造响应的情况下生成转录，将抛出异常：

```php
Transcription::fake()->preventStrayTranscriptions();
```

<a name="testing-embeddings"></a>
### 嵌入

可以通过在 `Embeddings` 类上调用 `fake` 方法来伪造嵌入生成。嵌入被伪造后，可以对记录的嵌入生成提示执行各种断言：

```php
use Laravel\Ai\Embeddings;
use Laravel\Ai\Prompts\EmbeddingsPrompt;
use Laravel\Ai\Prompts\QueuedEmbeddingsPrompt;

// Automatically generate fake embeddings of the proper dimensions for every prompt...
Embeddings::fake();

// Provide a list of prompt responses...
Embeddings::fake([
    [$firstEmbeddingVector],
    [$secondEmbeddingVector],
]);

// Dynamically handle prompt responses based on the incoming prompt...
Embeddings::fake(function (EmbeddingsPrompt $prompt) {
    return array_map(
        fn () => Embeddings::fakeEmbedding($prompt->dimensions),
        $prompt->inputs
    );
});
```

生成嵌入之后，你可以对收到的提示进行断言：

```php
Embeddings::assertGenerated(function (EmbeddingsPrompt $prompt) {
    return $prompt->contains('Laravel') && $prompt->dimensions === 1536;
});

Embeddings::assertNotGenerated(
    fn (EmbeddingsPrompt $prompt) => $prompt->contains('Other')
);

Embeddings::assertNothingGenerated();
```

对于加入队列的嵌入生成，使用队列断言方法：

```php
Embeddings::assertQueued(
    fn (QueuedEmbeddingsPrompt $prompt) => $prompt->contains('Laravel')
);

Embeddings::assertNotQueued(
    fn (QueuedEmbeddingsPrompt $prompt) => $prompt->contains('Other')
);

Embeddings::assertNothingQueued();
```

要确保所有嵌入生成都有对应的伪造响应，可以使用 `preventStrayEmbeddings`。如果在没有定义伪造响应的情况下生成嵌入，将抛出异常：

```php
Embeddings::fake()->preventStrayEmbeddings();
```

<a name="testing-reranking"></a>
### 重排序

可以通过在 `Reranking` 类上调用 `fake` 方法来伪造重排序操作：

```php
use Laravel\Ai\Reranking;
use Laravel\Ai\Prompts\RerankingPrompt;
use Laravel\Ai\Responses\Data\RankedDocument;

// Automatically generate a fake reranked responses...
Reranking::fake();

// Provide custom responses...
Reranking::fake([
    [
        new RankedDocument(index: 0, document: 'First', score: 0.95),
        new RankedDocument(index: 1, document: 'Second', score: 0.80),
    ],
]);
```

执行重排序之后，你可以对所执行的操作进行断言：

```php
Reranking::assertReranked(function (RerankingPrompt $prompt) {
    return $prompt->contains('Laravel') && $prompt->limit === 5;
});

Reranking::assertNotReranked(
    fn (RerankingPrompt $prompt) => $prompt->contains('Django')
);

Reranking::assertNothingReranked();
```

<a name="testing-files"></a>
### 文件

可以通过在 `Files` 类上调用 `fake` 方法来伪造文件操作：

```php
use Laravel\Ai\Files;

Files::fake();
```

文件操作被伪造后，你可以对发生的上传和删除进行断言：

```php
use Laravel\Ai\Contracts\Files\StorableFile;
use Laravel\Ai\Files\Document;

// Store files...
Document::fromString('Hello, Laravel!', mimeType: 'text/plain')
    ->as('hello.txt')
    ->put();

// Make assertions...
Files::assertStored(fn (StorableFile $file) =>
    (string) $file === 'Hello, Laravel!' &&
        $file->mimeType() === 'text/plain';
);

Files::assertNotStored(fn (StorableFile $file) =>
    (string) $file === 'Hello, World!'
);

Files::assertNothingStored();
```

要对文件删除进行断言，可以传递文件 ID：

```php
Files::assertDeleted('file-id');
Files::assertNotDeleted('file-id');
Files::assertNothingDeleted();
```

<a name="testing-vector-stores"></a>
### 向量存储

可以通过在 `Stores` 类上调用 `fake` 方法来伪造向量存储操作。伪造存储的同时也会自动伪造[文件操作](#files)：

```php
use Laravel\Ai\Stores;

Stores::fake();
```

存储操作被伪造后，你可以对创建或删除的存储进行断言：

```php
use Laravel\Ai\Stores;

// Create store...
$store = Stores::create('Knowledge Base');

// Make assertions...
Stores::assertCreated('Knowledge Base');

Stores::assertCreated(fn (string $name, ?string $description) =>
    $name === 'Knowledge Base'
);

Stores::assertNotCreated('Other Store');

Stores::assertNothingCreated();
```

要对存储删除进行断言，可以提供存储 ID：

```php
Stores::assertDeleted('store_id');
Stores::assertNotDeleted('other_store_id');
Stores::assertNothingDeleted();
```

要断言文件被添加到存储或从存储中移除，使用给定 `Store` 实例上的断言方法：

```php
Stores::fake();

$store = Stores::get('store_id');

// Add / remove files...
$store->add('added_id');
$store->remove('removed_id');

// Make assertions...
$store->assertAdded('added_id');
$store->assertRemoved('removed_id');

$store->assertNotAdded('other_file_id');
$store->assertNotRemoved('other_file_id');
```

如果某个文件在同一请求中既存储到提供商的[文件存储](#files)又添加到向量存储，你可能不知道该文件的提供商 ID。此时，你可以向 `assertAdded` 方法传递一个闭包，对所添加文件的内容进行断言：

```php
use Laravel\Ai\Contracts\Files\StorableFile;
use Laravel\Ai\Files\Document;

$store->add(Document::fromString('Hello, World!', 'text/plain')->as('hello.txt'));

$store->assertAdded(fn (StorableFile $file) => $file->name() === 'hello.txt');
$store->assertAdded(fn (StorableFile $file) => $file->content() === 'Hello, World!');
```

<a name="events"></a>
## 事件

Laravel AI SDK 会分发多种[事件](/docs/{{version}}/events)，包括：

- `AddingFileToStore`
- `AgentPrompted`
- `AgentStreamed`
- `AudioGenerated`
- `CreatingStore`
- `EmbeddingsGenerated`
- `FileAddedToStore`
- `FileDeleted`
- `FileRemovedFromStore`
- `FileStored`
- `GeneratingAudio`
- `GeneratingEmbeddings`
- `GeneratingImage`
- `GeneratingTranscription`
- `ImageGenerated`
- `InvokingTool`
- `PromptingAgent`
- `RemovingFileFromStore`
- `Reranked`
- `Reranking`
- `StoreCreated`
- `StoringFile`
- `StreamingAgent`
- `ToolInvoked`
- `TranscriptionGenerated`

你可以监听其中任何事件，来记录或存储 AI SDK 的使用信息。
