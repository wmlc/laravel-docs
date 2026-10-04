<?php
/**
 * Laravel 中文文档站 Deployer 部署配置（https://deployer.org，v8.x）
 *
 * 部署命令在 Docker 容器 linux116 内执行，使用全局别名 dep8（见 ~/.profile，
 * 指向 wandada 项目的 Deployer 8 vendor/bin/dep，本目录不再单独安装 Deployer）。
 * 容器内 /alidata 与项目目录 /Users/wml/alidata 均为同路径挂载，故用 localhost 自部署，无需 ssh。
 *
 * 用法（在容器内本目录执行；文档修改后先在宿主机 npm run build）:
 *   dep8 deploy              # 校验产物 + rsync 同步 dist + 原子切换 current 软链
 *   dep8 releases            # 查看历史版本
 *   dep8 rollback            # 回滚到上一个版本
 *
 * 目录结构（与服务器上 wangmaolin.net 的 Deployer 标准结构一致）:
 *   /alidata/www/laraveldoc.wangmaolin.net/
 *   ├── current  -> releases/<id>            # nginx root 指向这里
 *   ├── releases/<id>                        # 每次部署一个独立版本目录（keep_releases 份）
 *   ├── shared                                 # 跨版本共享目录
 *   └── .dep                                   # 部署锁与日志
 */

namespace Deployer;

require 'recipe/common.php';
require 'contrib/rsync.php';

set('application', 'laravel-docs');

// 容器内自部署（dep8 命令跑在 linux116 容器里，deploy_path 就是本机路径）
localhost()
    ->set('deploy_path', '/alidata/www/laraveldoc.wangmaolin.net');

// 保留的历史版本数
set('keep_releases', 5);

// rsync 源：本地 VitePress 构建产物目录
set('rsync_src', __DIR__ . '/../docs/.vitepress/dist');

// rsync 目标：本次部署的新版本目录
set('rsync_dest', '{{release_path}}');

desc('构建 VitePress 站点（仅适用于能在本环境跑 npm run build 的场景；
    当前容器内全量构建会内存溢出，请在宿主机构建后只执行 deploy）');
task('build', function () {
    runLocally('npm run build', cwd: __DIR__ . '/..', timeout: 600, env: ['NODE_OPTIONS' => '--max-old-space-size=4096']);
});

desc('校验 dist 产物存在且不早于文档源码（防止部署旧内容）');
task('deploy:check_dist', function () {
    $root = __DIR__ . '/..';
    if (!testLocally("[ -f $root/docs/.vitepress/dist/index.html ]")) {
        throw new \RuntimeException('构建产物不存在（docs/.vitepress/dist），请先在宿主机执行 npm run build。');
    }
    // 只比较真实源文档目录（与 shared/versions.mjs 的 versions + versionMeta.srcDir 保持同步）；
    // docs/ 下的 md 是 prepare 生成的中间产物，dev 进程重启会刷新其 mtime，不能作为新鲜度基准
    $srcDirs = '13.x/zh-CN 12.x/zh-CN 11.x/zh-CN 9.x/zh-CN DcatAdmin';
    $find = "find";
    foreach (explode(' ', $srcDirs) as $d) {
        $find .= " $root/$d";
    }
    $stale = runLocally("$find -name '*.md' -newer $root/docs/.vitepress/dist/index.html 2>/dev/null | head -1");
    if ($stale !== '') {
        throw new \RuntimeException("文档比构建产物更新（如 {$stale}），请先在宿主机执行 npm run build 再部署。");
    }
});

desc('部署文档站：校验产物 -> rsync dist -> 切换 current 软链');
task('deploy', [
    'deploy:info',
    'deploy:setup',      // 首次部署时创建 releases/ shared/ .dep 结构
    'deploy:lock',
    'deploy:check_dist', // 产物存在且比源码新，否则中断（构建在宿主机完成）
    'deploy:release',    // 创建本次发布目录 releases/<id>
    'rsync',             // dist/ -> releases/<id>/
    'deploy:symlink',    // current 原子指向新版本
    'deploy:cleanup',    // 清理超出 keep_releases 的旧版本
    'deploy:unlock',
]);

fail('deploy', 'deploy:failed');
after('deploy:failed', 'deploy:unlock'); // 部署失败时自动释放锁

after('deploy:symlink', function () {
    writeln('✅ Deployed. nginx root 应指向: {{deploy_path}}/current');
});
