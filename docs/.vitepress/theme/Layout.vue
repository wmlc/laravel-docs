<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useRoute, withBase } from 'vitepress'
import { versionPattern, versionMeta } from '../shared/versions.mjs'

const route = useRoute()
const versionRe = new RegExp(`^/(${versionPattern})(/|$)`)

const current = computed(() => route.path.match(versionRe)?.[1] || '')
const meta = computed(() => (versionMeta as Record<string, any>)[current.value] || {})

// 未匹配到版本（如首页）时回退到默认资源
const logo = computed(() => meta.value.logo || '/logo.svg')
const siteTitle = computed(() => meta.value.siteTitle || 'Laravel 文档')
const icon = computed(() => meta.value.icon || '/logo.svg')

function setFavicon(href: string) {
  if (typeof document === 'undefined') return // SSR 阶段跳过
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = withBase(href)
}

watch(icon, (v) => setFavicon(v), { immediate: true })
onMounted(() => setFavicon(icon.value))
</script>

<template>
  <DefaultTheme.Layout>
    <!-- 该版 VitePress 无 nav-bar-title-template，使用 nav-bar-title-before 插槽；
         配合 config 中 siteTitle:false 且不设 logo，默认标题隐藏，仅渲染下面的自定义内容 -->
    <template #nav-bar-title-before>
      <img class="version-logo" :src="withBase(logo)" alt="logo" />
      <span class="version-title">{{ siteTitle }}</span>
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
.version-logo {
  width: 26px;
  height: 26px;
  margin-right: 8px;
  border-radius: 6px;
}
.version-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
</style>
