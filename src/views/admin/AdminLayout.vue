<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useTheme } from '../../composables/useTheme'
import { 
  Calendar, 
  CalendarX,
  FileText, 
  RefreshCw, 
  LogOut, 
  ExternalLink, 
  ShieldCheck,
  Sun,
  Moon,
  DollarSign,
  ScrollText,
  Users,
  FileEdit
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { user, isSuperAdmin, roleName, logout } = useAdminAuth()
const { theme, toggleTheme } = useTheme()

const allNavItems = [
  { path: '/admin/calendar', name: '房態日曆與鎖房', icon: Calendar },
  { path: '/admin/close-calendar', name: '自主關閉月曆', icon: CalendarX },
  { path: '/admin/bookings', name: '直訂單與定金核銷', icon: FileText },
  { path: '/admin/pricing', name: '房價政策與連假', icon: DollarSign, superAdminOnly: true },
  { path: '/admin/content', name: '全站文案與內容', icon: FileEdit },
  { path: '/admin/users', name: '人員與權限管理', icon: Users, superAdminOnly: true },
  { path: '/admin/logs', name: 'LOG 紀錄', icon: ScrollText }
]

const navItems = computed(() => {
  return allNavItems.filter(item => !item.superAdminOnly || isSuperAdmin.value)
})

const currentPath = computed(() => route.path)

const handleLogout = () => {
  if (confirm('確定要登出山語 Villa 後台管理系統嗎？')) {
    logout()
  }
}
</script>

<template>
  <div class="admin-app-layout">
    <!-- 1. 左側後台側邊欄 -->
    <aside class="admin-sidebar">
      <div class="sidebar-brand">
        <ShieldCheck :size="24" class="brand-gold-icon" />
        <div class="brand-text">
          <h2>山語 Villa</h2>
          <span>管家管理後台</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="item.path"
          class="nav-link"
          :class="{ active: currentPath === item.path || (item.path === '/admin/calendar' && currentPath === '/admin') }"
        >
          <component :is="item.icon" :size="18" class="nav-icon" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="sidebar-bottom">
        <a href="/" target="_blank" class="nav-link external-link">
          <ExternalLink :size="16" class="nav-icon" />
          <span>開啟前台官網</span>
        </a>
      </div>
    </aside>

    <!-- 2. 右側主內容區 -->
    <div class="admin-main-wrapper">
      <!-- 頂部資訊列 -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <span :class="['badge-role', user?.role?.toLowerCase() || 'concierge']">
            {{ user?.role === 'SUPERADMIN' ? '👑 超級管理員' : user?.role === 'VIEWER' ? '👀 唯讀人員' : '🛎️ 駐館管家' }}
          </span>
          <span class="topbar-welcome">歡迎登入，{{ user?.displayName || '管家' }}</span>
        </div>

        <div class="topbar-right">
          <!-- 亮/暗色主題切換鈕 -->
          <button 
            type="button" 
            @click="toggleTheme" 
            class="btn-theme-toggle" 
            :title="theme === 'light' ? '切換為夜景模式 (Dark Mode)' : '切換為晨曦模式 (Light Mode)'"
            aria-label="Toggle theme"
          >
            <Moon v-if="theme === 'light'" :size="15" />
            <Sun v-else :size="15" />
            <span>{{ theme === 'light' ? '夜景' : '晨曦' }}</span>
          </button>

          <button @click="handleLogout" class="btn-logout" title="安全登出">
            <LogOut :size="15" />
            <span>登出</span>
          </button>
        </div>
      </header>

      <!-- 頁面視圖注入 -->
      <main class="admin-content-body">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--admin-bg-base, #0d131f);
  color: var(--admin-text-main, #e2e8f0);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}

// 側邊欄
.admin-sidebar {
  width: 250px;
  background: var(--admin-bg-sidebar, #151f32);
  border-right: 1px solid var(--admin-border, rgba(212, 175, 55, 0.2));
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;

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
  }

  .sidebar-nav {
    flex: 1;
    padding: 1.25rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

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

// 主體內容
.admin-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--admin-bg-base, #0f172a);
  transition: background-color 0.3s ease;
}

// 頂部導航
.admin-topbar {
  height: 60px;
  background: var(--admin-bg-topbar, #151f32);
  border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;
  transition: background-color 0.3s ease, border-color 0.3s ease;

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .badge-role {
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-weight: 600;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

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
      transition: all 0.2s ease;

      &:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #fca5a5;
      }
    }
  }
}

.admin-content-body {
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
}
</style>
