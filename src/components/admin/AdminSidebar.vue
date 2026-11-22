<script setup>
import { ShieldCheck, ExternalLink, X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  navItems: {
    type: Array,
    required: true
  },
  currentPath: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div>
    <!-- 行動端背景遮罩 -->
    <div 
      v-if="isOpen" 
      class="admin-sidebar-backdrop" 
      @click="handleClose"
      aria-label="關閉側邊選單"
    ></div>

    <!-- 左側後台側邊欄（手機平板支援側滑抽屜） -->
    <aside class="admin-sidebar" :class="{ 'mobile-open': isOpen }">
      <div class="sidebar-brand">
        <ShieldCheck :size="24" class="brand-gold-icon" />
        <div class="brand-text">
          <h2>山語 Villa</h2>
          <span>管家管理後台</span>
        </div>
        <!-- 手機端關閉抽屜按鈕 -->
        <button 
          type="button" 
          class="btn-close-sidebar" 
          @click="handleClose"
          aria-label="關閉選單"
        >
          <X :size="18" />
        </button>
      </div>

      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path"
          class="nav-link"
          :class="{ active: currentPath === item.path || (item.path === '/admin/calendar' && currentPath === '/admin') }"
          @click="handleClose"
        >
          <component :is="item.icon" :size="18" class="nav-icon" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="sidebar-bottom">
        <a href="/" target="_blank" class="nav-link external-link" @click="handleClose">
          <ExternalLink :size="16" class="nav-icon" />
          <span>開啟前台官網</span>
        </a>
      </div>
    </aside>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

// 行動端遮罩
.admin-sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 998;
}

// 側邊欄
.admin-sidebar {
  width: 250px;
  background: var(--admin-bg-sidebar, #151f32);
  border-right: 1px solid var(--admin-border, rgba(212, 175, 55, 0.2));
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .sidebar-brand {
    padding: 1.5rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

    .brand-gold-icon {
      color: var(--gold-primary, #d4af37);
      flex-shrink: 0;
    }

    .brand-text {
      h2 {
        font-size: 1.15rem;
        margin: 0;
        color: var(--gold-primary, #d4af37);
        letter-spacing: 2px;
      }
      span {
        font-size: 0.75rem;
        color: var(--admin-text-muted, #94a3b8);
        letter-spacing: 0.5px;
      }
    }

    .btn-close-sidebar {
      display: none;
      margin-left: auto;
      background: transparent;
      border: none;
      color: var(--admin-text-muted, #94a3b8);
      padding: 0.35rem;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        color: var(--gold-primary, #d4af37);
        background: rgba(255, 255, 255, 0.06);
      }
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 1.25rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    overflow-y: auto;

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      color: var(--admin-text-sub, #94a3b8);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;

      .nav-icon {
        color: var(--admin-text-muted, #64748b);
        transition: color 0.2s ease;
      }

      &:hover {
        background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05));
        color: var(--admin-text-main, #f1f5f9);

        .nav-icon {
          color: var(--gold-primary, #d4af37);
        }
      }

      &.active {
        background: rgba(212, 175, 55, 0.15);
        color: var(--gold-primary, #d4af37);
        border-left: 3px solid var(--gold-primary, #d4af37);

        .nav-icon {
          color: var(--gold-primary, #d4af37);
        }
      }
    }
  }

  .sidebar-bottom {
    padding: 1rem 0.75rem;
    border-top: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

    .external-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      color: var(--admin-text-muted, #64748b);
      font-size: 0.85rem;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        color: var(--admin-text-main, #cbd5e1);
        background: var(--admin-tr-hover, rgba(255, 255, 255, 0.04));
      }
    }
  }
}

// 響應式斷點設計 (RWD Breakpoints)
@media (max-width: 1024px) {
  .admin-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 999;
    width: 270px;
    max-width: 82vw;
    height: 100vh;
    transform: translateX(-100%);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);

    &.mobile-open {
      transform: translateX(0);
    }

    .sidebar-brand .btn-close-sidebar {
      display: inline-flex;
    }
  }
}
</style>
