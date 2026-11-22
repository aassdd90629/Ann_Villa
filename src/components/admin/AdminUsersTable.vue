<script setup>
import { 
  Users, 
  RefreshCw, 
  Edit3, 
  KeyRound, 
  Trash2, 
  Clock 
} from 'lucide-vue-next'

const props = defineProps({
  users: { type: Array, default: () => [] },
  currentAdmin: { type: Object, default: null },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['edit', 'resetPassword', 'toggleStatus', 'delete'])

const formatDateTime = (val) => {
  if (!val) return '尚未登入'
  try {
    const d = new Date(val)
    if (isNaN(d.getTime())) return val
    return d.toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  } catch (e) {
    return val
  }
}
</script>

<template>
  <div class="users-table-card">
    <div v-if="isLoading && users.length === 0" class="loading-state">
      <RefreshCw :size="24" class="spinning gold-icon" />
      <span>管家人員名冊讀取中...</span>
    </div>

    <div v-else-if="users.length === 0" class="empty-state">
      <Users :size="36" class="empty-icon" />
      <p>查無符合篩選條件的管家人員</p>
    </div>

    <div v-else class="table-responsive">
      <table class="users-table">
        <thead>
          <tr>
            <th>管家稱謂 / 帳號</th>
            <th>權限角色</th>
            <th>帳號狀態</th>
            <th>最後登入時間</th>
            <th>建立日期</th>
            <th class="text-right">操作管理</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" :class="{ 'is-self': u.id === currentAdmin?.id }">
            <td>
              <div class="user-identity">
                <div class="user-name-row">
                  <span class="user-display-name">{{ u.displayName }}</span>
                  <span v-if="u.id === currentAdmin?.id" class="self-tag">您本人</span>
                </div>
                <code class="user-username">@{{ u.username }}</code>
              </div>
            </td>
            <td>
              <span :class="['role-chip', u.role.toLowerCase()]">
                {{ u.role === 'SUPERADMIN' ? '👑 超級管理員' : u.role === 'VIEWER' ? '👀 房務唯讀' : '🛎️ 駐館管家' }}
              </span>
            </td>
            <td>
              <button 
                type="button" 
                class="status-toggle-btn" 
                :class="{ active: u.isActive, disabled: !u.isActive }"
                @click="emit('toggleStatus', u)"
                :title="u.isActive ? '點擊停用帳號' : '點擊啟用帳號'"
              >
                <span class="status-indicator"></span>
                <span>{{ u.isActive ? '啟用中' : '已停用' }}</span>
              </button>
            </td>
            <td>
              <div class="time-cell">
                <Clock :size="13" class="time-icon" />
                <span>{{ formatDateTime(u.lastLoginAt) }}</span>
              </div>
            </td>
            <td>
              <span class="date-cell">{{ formatDateTime(u.createdAt).split(' ')[0] }}</span>
            </td>
            <td class="text-right">
              <div class="table-actions">
                <button 
                  type="button" 
                  class="action-btn edit" 
                  @click="emit('edit', u)" 
                  title="編輯資料與角色"
                >
                  <Edit3 :size="14" />
                  <span>編輯</span>
                </button>
                <button 
                  type="button" 
                  class="action-btn key" 
                  @click="emit('resetPassword', u)" 
                  title="重設安全密碼"
                >
                  <KeyRound :size="14" />
                  <span>密碼</span>
                </button>
                <button 
                  type="button" 
                  class="action-btn delete" 
                  @click="emit('delete', u)" 
                  title="刪除帳號"
                  :disabled="u.id === currentAdmin?.id"
                >
                  <Trash2 :size="14" />
                  <span>刪除</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.users-table-card {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--admin-border, rgba(212, 175, 55, 0.3));
    border-radius: 3px;
  }
}

.users-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;

  thead tr {
    background: var(--admin-bg-thead, rgba(0, 0, 0, 0.25));
    border-bottom: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));

    th {
      padding: 0.9rem 1.1rem;
      font-weight: 600;
      color: var(--gold-primary, #d4af37);
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  }

  tbody tr {
    border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.05));
    transition: background-color 0.15s ease;

    &:hover {
      background: var(--admin-tr-hover, rgba(255, 255, 255, 0.03));
    }

    &.is-self {
      background: rgba(212, 175, 55, 0.04);
    }

    td {
      padding: 0.9rem 1.1rem;
      color: var(--admin-text-main, #e2e8f0);
      vertical-align: middle;
    }
  }
}

.user-identity {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  .user-name-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    .user-display-name {
      font-weight: 600;
      color: var(--admin-text-main, #fff);
    }

    .self-tag {
      font-size: 0.68rem;
      background: rgba(212, 175, 55, 0.18);
      border: 1px solid rgba(212, 175, 55, 0.4);
      color: var(--gold-primary, #d4af37);
      border-radius: 3px;
      padding: 0.1rem 0.35rem;
    }
  }

  .user-username {
    font-family: monospace;
    font-size: 0.78rem;
    color: var(--admin-text-muted, #94a3b8);
  }
}

.role-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.65rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  &.superadmin {
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.4);
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

.status-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 20px;
  border: 1px solid transparent;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;

  .status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  &.active {
    background: rgba(34, 197, 94, 0.15);
    border-color: rgba(34, 197, 94, 0.35);
    color: #22c55e;
    .status-indicator { background: #22c55e; }
  }

  &.disabled {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.35);
    color: #ef4444;
    .status-indicator { background: #ef4444; }
  }
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--admin-text-sub, #cbd5e1);

  .time-icon { color: var(--admin-text-muted, #94a3b8); }
}

.date-cell {
  font-size: 0.8rem;
  color: var(--admin-text-muted, #94a3b8);
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.35rem 0.65rem;
    border-radius: 4px;
    font-size: 0.75rem;
    border: 1px solid transparent;
    cursor: pointer;
    background: var(--admin-bg-base, rgba(0, 0, 0, 0.25));

    &.edit {
      border-color: rgba(56, 189, 248, 0.3);
      color: #38bdf8;
      &:hover { background: rgba(56, 189, 248, 0.15); }
    }

    &.key {
      border-color: rgba(212, 175, 55, 0.3);
      color: var(--gold-primary, #d4af37);
      &:hover { background: rgba(212, 175, 55, 0.15); }
    }

    &.delete {
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
      &:hover:not(:disabled) { background: rgba(239, 68, 68, 0.15); }
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3.5rem 1rem;
  color: var(--admin-text-muted, #94a3b8);
  font-size: 0.88rem;

  .empty-icon { opacity: 0.4; }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.text-right {
  text-align: right;
}
</style>
