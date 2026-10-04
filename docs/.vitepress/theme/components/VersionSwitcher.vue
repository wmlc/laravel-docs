<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vitepress'
import { versions, versionPattern, versionMeta } from '../../shared/versions.mjs'
import pageIndex from '../../page-index.json'

const route = useRoute()
const open = ref(false)
const versionRe = new RegExp(`^/(${versionPattern})/`)

/** 展示名：优先取 versionMeta.label，未配置的直接用版本号 */
function labelOf(v: string) {
  return (versionMeta as Record<string, { label?: string }>)[v]?.label || v
}

const current = computed(() => {
  const m = route.path.match(versionRe)
  return m ? m[1] : ''
})

const currentLabel = computed(() => (current.value ? labelOf(current.value) : ''))

/** 目标版本是否存在同 slug 页面（基于 prepare 生成、编译期打包的页面索引；
 *    生产环境 site.pages 为空，不可用于运行时判断） */
function pageExists(v: string, rest: string) {
  if (!rest) return true
  const slugs = (pageIndex as Record<string, string[]>)[v] || []
  return slugs.includes(rest) || rest === 'index'
}

function href(v: string) {
  let rest = ''
  if (current.value) {
    rest = route.path
      .replace(versionRe, '')
      .replace(/\/index\.html$/, '')
      .replace(/\.html$/, '')
      .replace(/\/$/, '')
  }
  if (!rest) rest = 'installation'
  // 目标版本没有该页时回退：优先 installation（各版本均有），再回退版本落地页
  if (!pageExists(v, rest)) {
    rest = pageExists(v, 'installation') ? 'installation' : ''
  }
  return `/${v}/${rest}`
}
</script>

<template>
  <div class="version-switch" @mouseenter="open = true" @mouseleave="open = false">
    <button class="trigger" :aria-expanded="open" aria-label="切换版本">
      <span class="label">{{ currentLabel || '版本' }}</span>
      <svg class="icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
        <path d="M7 10l5 5 5-5z" fill="currentColor" />
      </svg>
    </button>
    <transition name="fade">
      <ul v-if="open" class="menu">
        <li v-for="v in versions" :key="v">
          <a :href="href(v)" :class="{ active: v === current }" @click="open = false">{{ labelOf(v) }}</a>
        </li>
      </ul>
    </transition>
  </div>
</template>

<style scoped>
.version-switch {
  position: relative;
  display: flex;
  align-items: center;
}
.trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 36px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: border-color 0.25s;
}
.trigger:hover {
  border-color: var(--vp-c-brand-1);
}
.icon {
  opacity: 0.6;
}
.menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 88px;
  list-style: none;
  margin: 0;
  padding: 4px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-2);
  z-index: 100;
}
.menu a {
  display: block;
  padding: 6px 12px;
  border-radius: 4px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}
.menu a:hover {
  background: var(--vp-c-bg-soft);
}
.menu a.active {
  color: var(--vp-c-brand-1);
  font-weight: 700;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
