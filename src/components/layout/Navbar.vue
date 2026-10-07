<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from '../../composables/useI18n'
import { useTheme } from '../../composables/useTheme'
import siteData from '../../data/site.json'
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Globe, 
  PhoneCall, 
  MessageCircle,
  Sparkles
} from 'lucide-vue-next'

const { isEn, toggleLocale, t } = useI18n()
const { theme, toggleTheme } = useTheme()
const route = useRoute()

const isScrolled = ref(false)
const mobileMenuOpen = ref(false)

const navLinks = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/rooms', labelKey: 'nav.rooms' },
  { path: '/facilities', labelKey: 'nav.facilities' },
  { path: '/packages', labelKey: 'nav.packages' },
  { path: '/rules', labelKey: 'nav.rules' },
  { path: '/guide', labelKey: 'nav.guide' },
  { path: '/news', labelKey: 'nav.news' }
]

const handleScroll = () => {
  isScrolled.value = window.scrollY > 40
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <header 
    class="navbar-header"
    :class="{ 'scrolled': isScrolled, 'menu-open': mobileMenuOpen }"
  >
    <div class="nav-container">
      <!-- 品牌標誌 -->
      <RouterLink to="/" class="brand-logo" @click="closeMobileMenu">
        <span class="logo-kanji">山語</span>
        <div class="brand-text">
          <span class="brand-title">{{ isEn ? siteData.shortNameEn : siteData.shortNameZh }}</span>
          <span class="brand-sub">{{ isEn ? 'LUXURY RETREAT' : siteData.sloganZh }}</span>
        </div>
      </RouterLink>

      <!-- 桌面端導航選單 -->
      <nav class="desktop-nav">
        <RouterLink 
          v-for="link in navLinks" 
          :key="link.path" 
          :to="link.path"
          class="nav-item"
          :class="{ 'active': route.path === link.path }"
        >
          {{ t(link.labelKey) }}
        </RouterLink>
      </nav>

      <!-- 右側功能區 (雙語 / 日夜主題 / 預約 CTA) -->
      <div class="nav-actions">
        <!-- 語言切換 -->
        <button 
          class="btn-icon" 
          @click="toggleLocale" 
          :title="isEn ? 'Switch to Traditional Chinese' : '切換為英文'"
          aria-label="Toggle language"
        >
          <Globe :size="18" />
          <span class="btn-icon-text">{{ isEn ? 'ZH' : 'EN' }}</span>
        </button>

        <!-- 深淺色切換 -->
        <button 
          class="btn-icon" 
          @click="toggleTheme" 
          :title="theme === 'light' ? '切換為夜景模式' : '切換為晨曦模式'"
          aria-label="Toggle theme"
        >
          <Moon v-if="theme === 'light'" :size="18" />
          <Sun v-else :size="18" />
        </button>

        <!-- 預約諮詢按鈕 -->
        <a 
          :href="siteData.lineUrl" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn btn-gold btn-reserve desktop-only"
        >
          <Sparkles :size="16" />
          <span>{{ t('nav.reserve') }}</span>
        </a>

        <!-- 手機漢堡選單按鈕 -->
        <button 
          class="hamburger-btn mobile-only" 
          @click="toggleMobileMenu"
          aria-label="Open mobile menu"
        >
          <X v-if="mobileMenuOpen" :size="24" />
          <Menu v-else :size="24" />
        </button>
      </div>
    </div>

    <!-- 手機端全螢幕抽屜選單 -->
    <transition name="drawer">
      <div v-if="mobileMenuOpen" class="mobile-drawer">
        <div class="drawer-header">
          <div class="drawer-brand">
            <span class="drawer-title">{{ isEn ? siteData.brandNameEn : siteData.brandNameZh }}</span>
            <span class="drawer-slogan">{{ isEn ? siteData.sloganEn : siteData.sloganZh }}</span>
          </div>
        </div>

        <nav class="mobile-nav-list">
          <RouterLink 
            v-for="link in navLinks" 
            :key="link.path" 
            :to="link.path"
            class="mobile-nav-item"
            :class="{ 'active': route.path === link.path }"
            @click="closeMobileMenu"
          >
            <span>{{ t(link.labelKey) }}</span>
            <span class="nav-arrow">→</span>
          </RouterLink>
        </nav>

        <div class="drawer-footer">
          <a 
            :href="siteData.lineUrl" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn btn-gold drawer-cta"
            @click="closeMobileMenu"
          >
            <MessageCircle :size="18" />
            <span>{{ t('action.line') }}</span>
          </a>
        </div>
      </div>
    </transition>
  </header>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.navbar-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: background-color 0.4s ease, backdrop-filter 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease;
  background-color: transparent;
  border-bottom: 1px solid transparent;

  &.scrolled {
    background-color: var(--bg-nav);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }
}

.nav-container {
  max-width: 1380px;
  margin: 0 auto;
  padding: 1.1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (min-width: $bp-lg) {
    padding: 1.25rem 2.5rem;
  }
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 0.85rem;

  .logo-kanji {
    font-family: $font-serif;
    font-size: 1.65rem;
    font-weight: 700;
    color: var(--gold-primary);
    border: 1px solid var(--gold-primary);
    padding: 0.15rem 0.45rem;
    border-radius: 2px;
    letter-spacing: 0.1em;
    transition: $transition-smooth;
  }

  .brand-text {
    display: flex;
    flex-direction: column;

    .brand-title {
      font-family: $font-serif;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .brand-sub {
      font-family: $font-display;
      font-size: 0.7rem;
      letter-spacing: 0.18em;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-top: 2px;
    }
  }

  &:hover .logo-kanji {
    background: var(--gold-primary);
    color: #FFFFFF;
  }
}

.desktop-nav {
  display: none;
  align-items: center;
  gap: 2rem;

  @media (min-width: $bp-lg) {
    display: flex;
  }

  .nav-item {
    font-family: $font-sans;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-primary);
    letter-spacing: 0.06em;
    position: relative;
    padding: 0.4rem 0;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 2px;
      background: var(--gold-primary);
      transition: width 0.3s ease;
    }

    &:hover, &.active {
      color: var(--gold-primary);

      &::after {
        width: 100%;
      }
    }
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (min-width: $bp-lg) {
    gap: 1.25rem;
  }
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  background: var(--bg-card-glass);
  font-size: 0.85rem;
  font-weight: 500;

  &:hover {
    border-color: var(--gold-primary);
    color: var(--gold-primary);
  }

  .btn-icon-text {
    font-family: $font-display;
    font-weight: 600;
  }
}

.btn-reserve {
  padding: 0.6rem 1.4rem;
  font-size: 0.9rem;
}

.hamburger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  color: var(--text-primary);
}

.desktop-only {
  display: none;
  @media (min-width: $bp-lg) {
    display: inline-flex;
  }
}

.mobile-only {
  display: inline-flex;
  @media (min-width: $bp-lg) {
    display: none;
  }
}

// 手機抽屜樣式
.mobile-drawer {
  position: fixed;
  top: 72px;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(100vh - 72px);
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 1.75rem 6rem;
  overflow-y: auto;
  border-top: 1px solid var(--border-color);

  @media (min-width: $bp-lg) {
    display: none;
  }
}

.mobile-nav-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1.5rem 0;

  .mobile-nav-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: $font-serif;
    font-size: 1.25rem;
    color: var(--text-primary);
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);

    .nav-arrow {
      font-family: $font-sans;
      color: var(--text-muted);
      transition: transform 0.3s ease;
    }

    &.active, &:hover {
      color: var(--gold-primary);
      .nav-arrow {
        transform: translateX(4px);
        color: var(--gold-primary);
      }
    }
  }
}

.drawer-footer {
  .drawer-cta {
    width: 100%;
    padding: 0.9rem;
    font-size: 1rem;
  }
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
