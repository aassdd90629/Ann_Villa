<script setup>
import { ref, computed, onMounted } from 'vue'
import { UserPlus, RefreshCw, Search, CheckCircle, AlertCircle, X } from 'lucide-vue-next'
import { useAdminAuth } from '../../composables/useAdminAuth'
import AdminRoleOverviewCards from '../../components/admin/AdminRoleOverviewCards.vue'
import AdminUsersTable from '../../components/admin/AdminUsersTable.vue'
import AdminUserModal from '../../components/admin/AdminUserModal.vue'
import AdminResetPasswordModal from '../../components/admin/AdminResetPasswordModal.vue'

const { user: currentAdmin } = useAdminAuth()

const users = ref([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedRoleFilter = ref('ALL')
const feedbackMessage = ref('')
const feedbackType = ref('success')

// Modal 控制狀態
const showUserModal = ref(false)
const selectedUserForEdit = ref(null)

const showResetModal = ref(false)
const selectedUserForReset = ref(null)

const roleOptions = [
  { value: 'ALL', label: '全部角色' },
  { value: 'SUPERADMIN', label: '👑 超級管理員' },
  { value: 'CONCIERGE', label: '🛎️ 駐館管家' },
  { value: 'VIEWER', label: '👀 房務唯讀' }
]

const fetchUsers = async () => {
  isLoading.value = true
  feedbackMessage.value = ''
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '無法取得人員列表')
    }
    users.value = data.users || []
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})

const filteredUsers = computed(() => {
  let list = users.value
  if (selectedRoleFilter.value !== 'ALL') {
    list = list.filter(u => u.role === selectedRoleFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(u => 
      u.username.toLowerCase().includes(q) || 
      u.displayName.toLowerCase().includes(q)
    )
  }
  return list
})

const handleOpenAddModal = () => {
  selectedUserForEdit.value = null
  showUserModal.value = true
}

const handleOpenEditModal = (targetUser) => {
  selectedUserForEdit.value = { ...targetUser }
  showUserModal.value = true
}

const handleOpenResetModal = (targetUser) => {
  selectedUserForReset.value = targetUser
  showResetModal.value = true
}

const handleToggleStatus = async (targetUser) => {
  if (targetUser.id === currentAdmin.value?.id && targetUser.isActive) {
    alert('安全防護：您無法停用自己目前正在登入使用的管理員帳號。')
    return
  }

  const nextStatus = !targetUser.isActive
  const actionText = nextStatus ? '啟用' : '停用'

  if (!confirm(`確定要${actionText}管家「${targetUser.displayName}」(@${targetUser.username}) 的帳號嗎？`)) {
    return
  }

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: targetUser.id,
        isActive: nextStatus
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '更新狀態失敗')
    }

    targetUser.isActive = nextStatus
    feedbackMessage.value = `管家「${targetUser.displayName}」已成功${actionText}！`
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleDeleteUser = async (targetUser) => {
  if (targetUser.id === currentAdmin.value?.id) {
    alert('安全防護：您無法刪除自己目前正在登入使用的管理員帳號。')
    return
  }

  if (!confirm(`⚠️ 確定要永久刪除管家「${targetUser.displayName}」(@${targetUser.username}) 嗎？此動作無法復原！`)) {
    return
  }

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch(`/api/admin/users?id=${encodeURIComponent(targetUser.id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '刪除失敗')
    }

    users.value = users.value.filter(u => u.id !== targetUser.id)
    feedbackMessage.value = `管家「${targetUser.displayName}」帳號已成功刪除！`
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleUserSaved = () => {
  fetchUsers()
  feedbackMessage.value = '管家資料已成功儲存並同步！'
  feedbackType.value = 'success'
}

const handlePasswordResetSaved = (payload) => {
  feedbackMessage.value = `管家 (@${payload.username}) 之密碼已成功重設！`
  feedbackType.value = 'success'
}
</script>

<template>
  <div class="admin-users-view">
    <!-- 頁面標題列 -->
    <div class="admin-page-header">
      <div class="header-left">
        <h1 class="page-title">後台人員帳號與權限角色管理 (RBAC)</h1>
        <p class="page-subtitle">落實責任到人審計與最小權限原則，依角色隔離定價、訂單核銷與日曆權限，全面防範誤操作。</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-primary-action" @click="handleOpenAddModal">
          <UserPlus :size="16" />
          <span>新增管家帳號</span>
        </button>
      </div>
    </div>

    <!-- 訊息提示 -->
    <div v-if="feedbackMessage" :class="['alert-feedback', feedbackType]">
      <CheckCircle v-if="feedbackType === 'success'" :size="16" />
      <AlertCircle v-else :size="16" />
      <span>{{ feedbackMessage }}</span>
      <button type="button" class="btn-dismiss" @click="feedbackMessage = ''">
        <X :size="14" />
      </button>
    </div>

    <!-- 三大角色權限定位說明卡 -->
    <AdminRoleOverviewCards />

    <!-- 工具列 (搜尋與篩選) -->
    <div class="users-toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <Search :size="16" class="search-icon" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜尋管家姓名或帳號..." 
            class="search-input"
          />
        </div>

        <div class="role-filter-group">
          <button 
            v-for="r in roleOptions" 
            :key="r.value"
            type="button"
            class="filter-pill"
            :class="{ active: selectedRoleFilter === r.value }"
            @click="selectedRoleFilter = r.value"
          >
            {{ r.label }}
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <button type="button" class="btn-refresh" @click="fetchUsers" :disabled="isLoading" title="重新整理">
          <RefreshCw :size="15" :class="{ spinning: isLoading }" />
          <span>重新整理</span>
        </button>
      </div>
    </div>

    <!-- 人員資料表格卡片組件 -->
    <AdminUsersTable 
      :users="filteredUsers" 
      :current-admin="currentAdmin" 
      :is-loading="isLoading" 
      @edit="handleOpenEditModal"
      @reset-password="handleOpenResetModal"
      @toggle-status="handleToggleStatus"
      @delete="handleDeleteUser"
    />

    <!-- 子組件彈窗 1：新增 / 編輯管家資料 -->
    <AdminUserModal 
      :show="showUserModal" 
      :user="selectedUserForEdit" 
      @close="showUserModal = false"
      @saved="handleUserSaved"
    />

    <!-- 子組件彈窗 2：重設安全密碼 -->
    <AdminResetPasswordModal 
      :show="showResetModal" 
      :user="selectedUserForReset" 
      @close="showResetModal = false"
      @saved="handlePasswordResetSaved"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-users-view {
  padding-bottom: 3rem;
}

.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  .page-title {
    font-size: 1.45rem;
    font-weight: 600;
    color: var(--admin-text-main, #f8fafc);
    margin: 0 0 0.4rem 0;
  }

  .page-subtitle {
    font-size: 0.85rem;
    color: var(--admin-text-muted, #94a3b8);
    margin: 0;
  }

  .btn-primary-action {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    background: var(--gold-primary, #d4af37);
    border: 1px solid var(--gold-primary, #d4af37);
    border-radius: 6px;
    color: #121415;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover { background: #dfbc46; }
  }
}

.alert-feedback {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;

  &.success {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.35);
    color: #22c55e;
  }

  &.error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #ef4444;
  }

  .btn-dismiss {
    margin-left: auto;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
  }
}

.users-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;

    .search-box {
      position: relative;
      display: flex;
      align-items: center;

      .search-icon {
        position: absolute;
        left: 0.85rem;
        color: var(--admin-text-muted, #94a3b8);
        pointer-events: none;
      }

      .search-input {
        padding: 0.55rem 0.85rem 0.55rem 2.4rem;
        background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
        border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25));
        border-radius: 6px;
        color: var(--admin-text-main, #fff);
        font-size: 0.85rem;
        outline: none;
        width: 220px;
        transition: border-color 0.2s ease;

        &:focus {
          border-color: var(--gold-primary, #d4af37);
        }
      }
    }

    .role-filter-group {
      display: flex;
      gap: 0.4rem;

      .filter-pill {
        padding: 0.45rem 0.85rem;
        background: var(--admin-bg-card, #151f32);
        border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.12));
        border-radius: 20px;
        color: var(--admin-text-sub, #cbd5e1);
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: rgba(212, 175, 55, 0.4);
          color: var(--gold-primary, #d4af37);
        }

        &.active {
          background: rgba(212, 175, 55, 0.18);
          border-color: var(--gold-primary, #d4af37);
          color: var(--gold-primary, #d4af37);
          font-weight: 600;
        }
      }
    }
  }

  .btn-refresh {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.9rem;
    background: var(--admin-bg-card, #151f32);
    border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
    border-radius: 6px;
    color: var(--admin-text-main, #e2e8f0);
    font-size: 0.82rem;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37);
    }
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
