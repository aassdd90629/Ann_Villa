<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { 
  Calendar, 
  FileText, 
  RefreshCw, 
  LogOut, 
  ExternalLink, 
  ShieldCheck, 
  UserCircle 
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { user, logout } = useAdminAuth()

const navItems = [
  { path: '/admin/calendar', name: '房態日曆與鎖房', icon: Calendar },
  { path: '/admin/bookings', name: '直訂單與定金核銷', icon: FileText },
  { path: '/admin/sync', name: 'Airbnb 同步歷史', icon: RefreshCw }
]

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
          <span class="badge-role">{{ user?.role === 'SUPERADMIN' ? '超級管理員' : '駐館管家' }}</span>
          <span class="topbar-welcome">歡迎登入，{{ user?.displayName || '管家' }}</span>
        </div>

        <div class="topbar-right">
          <button @click="handleLogout" class="btn-logout" title="安全登出">
            <LogOut :size="16" />
            <span>安全登出</span>
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
  background: #0d131f;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif;
}

// 側邊欄
.admin-sidebar {
  width: 250px;
  background: #151f32;
  border-right: 1px solid rgba(212, 175, 55, 0.2);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .sidebar-brand {
    padding: 1.5rem 1.25rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .brand-gold-icon {
      color: var(--gold-primary, #d4af37);
      flex-shrink: 0;
    }

    .brand-text {
      h2 {
        font-size: 1.15rem;
        margin: 0;
        color: var(--gold-light, #f3e5ab);
        letter-spacing: 2px;
      }
      span {
        font-size: 0.75rem;
        color: #94a3b8;
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
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;

      .nav-icon {
        color: #64748b;
        transition: color 0.2s ease;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #f1f5f9;

        .nav-icon {
          color: var(--gold-primary, #d4af37);
        }
      }

      &.active {
        background: rgba(212, 175, 55, 0.15);
        color: var(--gold-light, #f3e5ab);
        border-left: 3px solid var(--gold-primary, #d4af37);

        .nav-icon {
          color: var(--gold-primary, #d4af37);
        }
      }
    }
  }

  .sidebar-bottom {
    padding: 1rem 0.75rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    .external-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1rem;
      color: #64748b;
      font-size: 0.85rem;
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover {
        color: #cbd5e1;
        background: rgba(255, 255, 255, 0.04);
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
  background: #0f172a;
}

// 頂部導航
.admin-topbar {
  height: 60px;
  background: #151f32;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.75rem;

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .badge-role {
      font-size: 0.72rem;
      padding: 0.2rem 0.5rem;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid rgba(212, 175, 55, 0.35);
      color: var(--gold-primary, #d4af37);
      border-radius: 4px;
      font-weight: 600;
    }

    .topbar-welcome {
      font-size: 0.9rem;
      color: #cbd5e1;
    }
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 1rem;

    .btn-logout {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
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
