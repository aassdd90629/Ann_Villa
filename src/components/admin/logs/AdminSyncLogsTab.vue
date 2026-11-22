<script setup>
import { ref, onMounted } from 'vue'
import { triggerAdminSync } from '../../../services/adminService'
import { usePagination } from '../../../composables/usePagination'
import { RefreshCw, CheckCircle2, Clock } from 'lucide-vue-next'
import Pagination from '../../common/Pagination.vue'

const logs = ref([])
const isLoading = ref(false)
const isSyncing = ref(false)
const message = ref('')

const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  paginatedItems,
  startIndex,
  endIndex
} = usePagination(logs, 10)

const fetchSyncLogs = async () => {
  isLoading.value = true
  try {
    const res = await fetch('/api/admin/sync/logs', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('shanyu_admin_token') || ''}`
      }
    })
    const data = await res.json()
    logs.value = data.logs || []
  } catch (err) {
    console.error('取得同步紀錄失敗:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchSyncLogs()
})

const handleTriggerSync = async () => {
  isSyncing.value = true
  message.value = ''
  try {
    const res = await triggerAdminSync()
    const count = res.eventsCount || res.count || 0
    message.value = `Airbnb 檔期同步成功！更新了 ${count} 筆預約。`
    await fetchSyncLogs()
  } catch (err) {
    alert('同步失敗: ' + err.message)
  } finally {
    isSyncing.value = false
  }
}

defineExpose({ refresh: fetchSyncLogs })
</script>

<template>
  <div class="sync-logs-tab">
    <div class="alert-paused">
      <span>⚠️ 系統提醒：目前已暫停 Airbnb 外部匯入月曆，避免覆蓋本地房態。若需調整檔期，請前往【自主關閉月曆】頁面設定。</span>
    </div>

    <div v-if="message" class="alert-success">
      <CheckCircle2 :size="16" />
      <span>{{ message }}</span>
    </div>

    <div class="table-container">
      <div class="table-bar">
        <div class="bar-title">
          <Clock :size="18" class="text-gold" />
          <span>近期 Airbnb 檔期排程同步日誌 (共 {{ logs.length }} 筆)</span>
          <span class="scroll-hint-text">↔ 可左右滑動</span>
        </div>
        <button class="btn-refresh-sm" @click="fetchSyncLogs" :disabled="isLoading">
          <RefreshCw :size="13" :class="{ 'spin-anim': isLoading }" />
          <span>重新整理</span>
        </button>
      </div>

      <div class="table-responsive-wrapper">
        <table class="admin-table">
        <thead>
          <tr>
            <th>記錄 ID</th>
            <th>同步管道</th>
            <th>狀態</th>
            <th>成功解析事件數</th>
            <th>訊息摘要</th>
            <th>執行時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="text-center py-4 text-muted">讀取同步日誌中...</td>
          </tr>
          <tr v-else-if="logs.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">尚無同步日誌記錄</td>
          </tr>
          <tr v-for="log in paginatedItems" :key="log.id">
            <td>#{{ log.id }}</td>
            <td>
              <span class="badge-channel">{{ log.channel || 'Airbnb iCal' }}</span>
            </td>
            <td>
              <span :class="['badge-status', log.status === 'SUCCESS' ? 'status-success' : 'status-fail']">
                {{ log.status === 'SUCCESS' ? '同步成功' : '同步失敗' }}
              </span>
            </td>
            <td>{{ log.events_count ?? 0 }} 組</td>
            <td class="text-muted message-cell">{{ log.message || '正常排程抓取' }}</td>
            <td>{{ log.executed_at || log.created_at || '剛剛' }}</td>
          </tr>
        </tbody>
      </table>
      </div>

      <Pagination
        v-if="logs.length > 0"
        :current-page="currentPage"
        :total-pages="totalPages"
        :total-items="totalItems"
        :page-size="pageSize"
        :start-index="startIndex"
        :end-index="endIndex"
        @page-change="p => currentPage = p"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.alert-paused {
  background: rgba(200, 169, 110, 0.1);
  border: 1px solid rgba(200, 169, 110, 0.3);
  padding: 0.85rem 1.25rem;
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 0.88rem;
  margin-bottom: 1.25rem;
}

.alert-success {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.88rem;
}

.table-container {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.table-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);

  .bar-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: var(--text-primary);
    font-size: 0.92rem;

    .scroll-hint-text {
      display: none;
      font-size: 0.72rem;
      color: var(--gold-primary);
      background: rgba(200, 169, 110, 0.15);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 500;
    }
  }
}

.btn-refresh-sm {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--gold-primary);
  }
}

.table-responsive-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }
}

.admin-table {
  width: 100%;
  min-width: 680px;
  border-collapse: collapse;
  font-size: 0.88rem;

  th, td {
    padding: 0.85rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
  }

  th {
    background: var(--bg-primary);
    color: var(--gold-primary);
    font-weight: 600;
  }

  td {
    color: var(--text-primary);
  }

  .message-cell {
    max-width: 320px;
    word-break: break-all;
  }
}

.badge-channel {
  background: rgba(200, 169, 110, 0.15);
  color: var(--gold-primary);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;
}

.badge-status {
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.78rem;
  font-weight: 600;

  &.status-success {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  &.status-fail {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
}

.spin-anim {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .table-bar {
    padding: 0.75rem 1rem;

    .bar-title .scroll-hint-text {
      display: inline-block;
    }
  }
}
</style>
