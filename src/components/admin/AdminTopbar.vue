<script setup>
import { 
  LogOut, 
  Sun, 
  Moon, 
  Menu, 
  X 
} from 'lucide-vue-next'

const props = defineProps({
  user: {
    type: Object,
    default: null
  },
  theme: {
    type: String,
    default: 'dark'
  },
  isMobileMenuOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggleMenu', 'toggleTheme', 'logout'])
</script>

<template>
  <header class="admin-topbar">
    <div class="topbar-left">
      <!-- 漢堡按鈕（<= 1024px 顯現） -->
      <button 
        type="button" 
        class="btn-hamburger" 
        @click="emit('toggleMenu')" 
        aria-label="切換後台選單"
      >
        <component :is="isMobileMenuOpen ? X : Menu" :size="20" />
      </button>

      <span :class="['badge-role', user?.role?.toLowerCase() || 'concierge']">
        {{ user?.role === 'SUPERADMIN' ? '👑 超級管理員' : user?.role === 'VIEWER' ? '👀 唯讀人員' : '🛎️ 駐館管家' }}
      </span>
      <span class="topbar-welcome">歡迎登入，{{ user?.displayName || '管家' }}</span>
    </div>

    <div class="topbar-right">
      <!-- 亮/暗色主題切換鈕 -->
      <button 
        type="button" 
        @click="emit('toggleTheme')" 
        class="btn-theme-toggle" 
        :title="theme === 'light' ? '切換為夜景模式 (Dark Mode)' : '切換為晨曦模式 (Light Mode)'"
        aria-label="Toggle theme"
      >
        <Moon v-if="theme === 'light'" :size="15" />
        <Sun v-else :size="15" />
        <span class="theme-text">{{ theme === 'light' ? '夜景' : '晨曦' }}</span>
      </button>

      <button @click="emit('logout')" class="btn-logout" title="安全登出">
        <LogOut :size="15" />
        <span class="logout-text">登出</span>
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-topbar {
  height: 60px;
  background: var(--admin-bg-topbar, #151f32);
  border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  position: sticky;
  top: 0;
  z-index: 100;

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .btn-hamburger {
      display: none;
      align-items: center;
      justify-content: center;
      background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.06));
      border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.3));
      color: var(--gold-primary, #d4af37);
      border-radius: 6px;
      padding: 0.45rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(212, 175, 55, 0.15);
      }
    }

    .badge-role {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-weight: 600;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      white-space: nowrap;

      &.superadmin {
        background: rgba(212, 175, 55, 0.18);
        border: 1px solid rgba(212, 175, 55, 0.45);
        color: var(--gold-primary, #d4af37);
      }

      &.concierge, &.host {
        background: rgba(56, 189, 248, 0.15);
        border: 1px solid rgba(56, 189, 248, 0.35);
        color: #38bdf8;
      }

      &.viewer {
        background: rgba(148, 163, 184, 0.15);
        border: 1px solid rgba(148, 163, 184, 0.35);
        color: #94a3b8;
      }
    }

    .topbar-welcome {
      font-size: 0.9rem;
      color: var(--admin-text-sub, #cbd5e1);
      white-space: nowrap;
    }
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .btn-theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.8rem;
      background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.06));
      border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.15));
      color: var(--admin-text-main, #e2e8f0);
      border-radius: 6px;
      font-size: 0.82rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--gold-primary, #d4af37);
        color: var(--gold-primary, #d4af37);
      }
    }

    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.8rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: #f87171;
      border-radius: 6px;
      font-size: 0.82rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }
    }
  }
}

// 響應式斷點設計
@media (max-width: 1024px) {
  .admin-topbar {
    padding: 0 1.25rem;

    .topbar-left .btn-hamburger {
      display: inline-flex;
    }
  }
}

@media (max-width: 640px) {
  .admin-topbar {
    height: 54px;
    padding: 0 0.75rem;

    .topbar-left {
      gap: 0.5rem;

      .topbar-welcome {
        display: none; // 手機版隱藏歡迎詞，騰出寶貴寬度
      }

      .badge-role {
        padding: 0.2rem 0.45rem;
        font-size: 0.7rem;
      }
    }

    .topbar-right {
      gap: 0.4rem;

      .btn-theme-toggle {
        padding: 0.4rem 0.55rem;
        .theme-text {
          display: none; // 手機版僅顯示月亮/太陽圖標
        }
      }

      .btn-logout {
        padding: 0.4rem 0.55rem;
        .logout-text {
          display: none; // 手機版僅顯示登出圖標
        }
      }
    }
  }
}
</style>
