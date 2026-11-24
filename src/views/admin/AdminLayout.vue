<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useTheme } from '../../composables/useTheme'
import { 
  Calendar, 
  CalendarX,
  FileText, 
  DollarSign, 
  ScrollText, 
  Users, 
  FileEdit, 
  Image as ImageIcon 
} from 'lucide-vue-next'
import AdminSidebar from '../../components/admin/AdminSidebar.vue'
import AdminTopbar from '../../components/admin/AdminTopbar.vue'

const router = useRouter()
const route = useRoute()
const { user, isSuperAdmin, logout } = useAdminAuth()
const { theme, toggleTheme } = useTheme()

// 行動端側邊抽屜開關狀態
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

// 換頁時自動關閉抽屜
watch(() => route.path, () => {
  isMobileMenuOpen.value = false
})

const allNavItems = [
  { path: '/admin/close-calendar', name: '房態月曆與自主關閉', icon: Calendar },
  { path: '/admin/bookings', name: '直訂單與定金核銷', icon: FileText },
  { path: '/admin/calendar', name: '檔期佔用與鎖房清單', icon: CalendarX },
  { path: '/admin/pricing', name: '房價政策與連假', icon: DollarSign, superAdminOnly: true },
  { path: '/admin/content', name: '全站文案與內容', icon: FileEdit },
  { path: '/admin/media', name: '圖片與媒體庫', icon: ImageIcon },
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
    <!-- 1. 左側後台側邊欄組件 -->
    <AdminSidebar 
      :is-open="isMobileMenuOpen"
      :nav-items="navItems"
      :current-path="currentPath"
      @close="closeMobileMenu"
    />

    <!-- 2. 右側主內容區 -->
    <div class="admin-main-wrapper">
      <!-- 頂部導航列組件 -->
      <AdminTopbar 
        :user="user"
        :theme="theme"
        :is-mobile-menu-open="isMobileMenuOpen"
        @toggle-menu="toggleMobileMenu"
        @toggle-theme="toggleTheme"
        @logout="handleLogout"
      />

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
  position: relative;
  overflow-x: hidden;
}

// 主體內容
.admin-main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  background: var(--admin-bg-base, #0f172a);
  transition: background-color 0.3s ease;
}

.admin-content-body {
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .admin-content-body {
    padding: 1.25rem 1rem;
  }
}

@media (max-width: 640px) {
  .admin-content-body {
    padding: 1rem 0.75rem;
  }
}
</style>
