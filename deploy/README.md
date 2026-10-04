# Laravel 中文文档站 部署说明

采用 [Deployer](https://deployer.org) 8.x 方案，配置文件为 `deploy/deploy.php`。
部署命令在 Docker 容器 `linux116` 内执行，使用 `~/.profile` 中已全局定义的别名：

```bash
alias dep8='/Users/wml/alidata/www/wandada/wandada_server/vendor/bin/dep -vvv'
```

本目录**不再单独安装 Deployer**（无 composer.json / vendor）。
容器内 `/alidata` 与项目目录 `/Users/wml/alidata` 均为同路径挂载，
因此 deploy.php 使用 `localhost()` 自部署，无需 ssh。
目录结构与主站 `wangmaolin.net` 一致，采用标准 `releases / current / shared` 版本结构。

## 环境信息

| 项 | 值 |
| --- | --- |
| 执行环境 | 容器 `linux116` 内，用户 `wml`（IDE 终端已默认 ssh 进容器） |
| Deployer | 复用 wandada 项目的 `vendor/bin/dep`（v8.x，容器内 PHP 8.3.7） |
| 站点目录（容器内=挂载路径） | `/alidata/www/laraveldoc.wangmaolin.net` |
| 构建工具 | VitePress（`npm run build`，产物在 `docs/.vitepress/dist`） |

## 部署流程

构建与部署分工：**宿主机（macOS）负责构建，容器（linux116）负责部署**。

```bash
# ① 宿主机：修改文档后构建（二选一）
#    a. PhpStorm 直接运行 package.json 里的 npm 脚本 build
#    b. 或宿主终端（不进容器的那个 shell）：
cd /Users/wml/alidata/www/laravel-docs && npm run build

# ② 容器终端（IDE 默认终端）：一键部署
cd /Users/wml/alidata/www/laravel-docs/deploy && dep8 deploy
```

忘做 ① 直接做 ② 时，`deploy:check_dist` 会拦截并报「文档比构建产物更新」，
不会把旧内容部署上线。

> 为什么不在容器内构建：四版本文档全量构建在容器内会内存溢出
> （提堆到 3~4GB 仍会 V8 OOM / 被内核 OOM killer 杀），而宿主机默认堆可正常构建。

`dep8 deploy` 按序执行（见 deploy.php 中 deploy 任务定义）：

1. `deploy:setup` — 首次部署时创建 `releases/`、`shared/`、`.dep/` 目录结构
2. `deploy:lock` — 加部署锁，防止并发部署
3. `deploy:check_dist` — 产物新鲜度校验：`dist/index.html` 必须存在，且不早于真实源文档
   （`{13.x,12.x,11.x,9.x}/zh-CN/` 与 `DcatAdmin/`）；否则中断并提示先在宿主机 `npm run build`（防止部署旧内容）
4. `deploy:release` — 创建新版本目录 `releases/<id>`
5. `rsync` — 将 `docs/.vitepress/dist/` 同步到 `releases/<id>/`（只同步产物，不含源码）
6. `deploy:symlink` — `current` 软链原子切换（nginx 无感知，不掉线）
7. `deploy:cleanup` — 只保留最近 `keep_releases`（5）个版本

## 常用命令

```bash
dep8 releases    # 查看历史版本列表（回滚过的版本标记 bad）
dep8 rollback    # 回滚到上一个版本（current 软链切回）
dep8 deploy:unlock  # 部署中断残留锁时手动解锁
```

## 站点目录结构

```
/alidata/www/laraveldoc.wangmaolin.net/
├── current -> releases/<id>       # nginx root 指向这里
├── releases/<id>/                 # 每次部署一个版本目录
├── shared/                        # 跨版本共享目录（本站暂不使用）
└── .dep/                          # 部署锁 deploy.lock 与日志 log.log
```

## nginx 接入（首次部署需确认）

需在容器 nginx 中添加 vhost（配置目录：`/usr/local/nginx/conf/vhost/`），参考配置：

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name laraveldoc.wangmaolin.net;
    ssl_certificate /root/.acme.sh/wangmaolin.net_ecc/fullchain.cer;
    ssl_certificate_key /root/.acme.sh/wangmaolin.net_ecc/wangmaolin.net.key;

    root /alidata/www/laraveldoc.wangmaolin.net/current;
    index index.html;

    location / {
        try_files $uri $uri/ $uri.html =404;
    }
}
```

修改 nginx 配置后重载：

```bash
/usr/local/nginx/sbin/nginx -t && /usr/local/nginx/sbin/nginx -s reload
```

## 首次部署前置条件（已就绪，环境重建时需检查）

- 站点根目录属主为容器内用户 `wml`：
  `chown wml:wml /alidata/www/laraveldoc.wangmaolin.net`（root 容器内执行）

## 常见问题

- **部署报“文档比构建产物更新”**：正常拦截，先在宿主机 `npm run build` 再 `dep8 deploy`。
- **容器内 `npm run build` 报 Bus error**：`node_modules/@rollup/rollup-linux-arm64-gnu` 二进制被截断（npm 安装中断）所致，已用 registry 原包修复；但容器内构建仍会因内存溢出失败，不要以容器为构建环境。
- **页面 404**：检查 vhost 的 `root` 是否指向 `current` 子目录，以及 nginx 是否已 reload。
- **首次访问报 502，刷新就好了**：不是站点问题（nginx 日志无任何 502，静态 vhost 也无上游）。是 Docker Desktop 端口转发的冷启动抖动：`/etc/hosts` 把域名指到 127.0.0.1:80，监听者是 `com.docker.backend`，闲置后首条连接偶发空响应，被浏览器/代理层渲染成 502；刷新时链路已热即正常。缓解：升级 Docker Desktop；若有调试代理给 `*.wangmaolin.net` 加 DIRECT 绕过。
- **终端输出 nvm/npmrc 警告**：来自容器登录 shell 的 profile，不影响部署，可忽略。
- **Deploy locked by xxx**：上次部署被中断残留锁，执行 `dep8 deploy:unlock` 后再部署。
