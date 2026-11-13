<script setup>
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/layout/Navbar.vue'
import MobileActionBar from './components/layout/MobileActionBar.vue'
import Footer from './components/layout/Footer.vue'
import { useTheme } from './composables/useTheme'
import { useI18n } from './composables/useI18n'

const route = useRoute()
const { initTheme } = useTheme()
const { isSwitchingLang } = useI18n()

// 後台管理路由不渲染前台 Navbar, Footer 與行動操作條
const isAdminRoute = computed(() => {
  return route.path ? route.path.startsWith('/admin') : false
})

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div class="app-layout" :class="{ 'lang-switching': isSwitchingLang, 'is-admin-mode': isAdminRoute }">
    <Navbar v-if="!isAdminRoute" />
    
    <main :class="isAdminRoute ? 'admin-main-wrapper' : 'main-content'">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <Footer v-if="!isAdminRoute" />
    <MobileActionBar v-if="!isAdminRoute" />
  </div>
</template>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  // 僅針對純文字進行平滑透明度過渡，背景、卡片外框與實景照片皆保持不動
  :deep(:where(h1, h2, h3, h4, h5, h6, p, span, li, label, strong, em, small, a)) {
    transition: opacity 0.18s ease;
  }

  &.lang-switching {
    :deep(:where(h1, h2, h3, h4, h5, h6, p, span, li, label, strong, em, small, a)) {
      opacity: 0.12;
    }
  }
}

.main-content {
  flex: 1;
}
</style>
