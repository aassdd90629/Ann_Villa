<script setup>
import { ref, onMounted } from 'vue'
import { triggerAdminSync } from '../../services/adminService'
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-vue-next'

const logs = ref([])
const isLoading = ref(false)
const isSyncing = ref(false)
const message = ref('')

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
    message.value = `Airbnb 檔期同步成功！更新了 ${res.count || 0} 筆預約。`
    await fetchSyncLogs()
  } catch (err) {
    alert('同步失敗: ' + err.message)
  } finally {
    isSyncing.value = false
  }
}
</script>

<template>
  <div class="admin-sync-view">
    <div class="view-header">
      <div>
        <h1 class="view-title">Airbnb 檔期排程同步日誌</h1>
        <p class="view-desc">追蹤山語 Villa 官方網站與 Airbnb 外部行事曆之自動與手動同步記錄</p>
      </div>

      <button class="btn-action-gold" :disabled="isSyncing" @click="handleTriggerSync">
        <RefreshCw :size="15" :class="{ 'spin-anim': isSyncing }" />
        <span>{{ isSyncing ? '正在同步中...' : '手動觸發即時同步' }}</span>
      </button>
    </div>

    <div v-if="message" class="alert-success">
      <CheckCircle2 :size="16" />
      <span>{{ message }}</span>
    </div>

    <div class="table-container">
      <div class="table-bar">
        <div class="bar-title">
          <Clock :size="18" class="text-gold" />
          <span>近期同步日誌 (共 {{ logs.length }} 筆)</span>
        </div>
        <button class="btn-refresh-sm" @click="fetchSyncLogs" :disabled="isLoading">
          <RefreshCw :size="13" :class="{ 'spin-anim': isLoading }" />
          <span>重新整理</span>
        </button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>記錄 ID</th>
            <th>同步管道</th>
            <th>狀態</th>
            <th>成功解析事件數</th>
            <th>系統反饋訊息</th>
            <th class="text-right">同步時間 (UTC)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="text-center py-4">正在載入日誌...</td>
          </tr>
          <tr v-else-if="logs.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">目前暫無任何排程日誌</td>
          </tr>
          <tr v-for="log in logs" :key="log.id">
            <td class="font-mono text-xs text-muted">#{{ log.id }}</td>
            <td>
              <span class="channel-badge">{{ log.channel || 'AIRBNB' }}</span>
            </td>
            <td>
              <span class="status-badge" :class="log.status?.toLowerCase()">
                {{ log.status === 'SUCCESS' ? '成功' : '失敗' }}
              </span>
            </td>
            <td class="font-bold text-gold">{{ log.events_count || 0 }} 筆</td>
            <td class="text-muted text-xs">{{ log.message || '正常' }}</td>
            <td class="text-right font-mono text-xs text-muted">{{ log.created_at }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-sync-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  .view-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #f8fafc;
    margin: 0 0 0.35rem 0;
  }
  .view-desc {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
  }

  .btn-action-gold {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.15rem;
    background: var(--gold-primary, #d4af37);
    border: none;
    color: #0d131f;
    font-weight: 600;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    &:hover:not(:disabled) { background: #dfbc46; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

.alert-success {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
  border-radius: 6px;
  font-size: 0.85rem;
}

.table-container {
  background: #151f32;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;

  .table-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .bar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #f1f5f9;
      font-size: 0.95rem;
      .text-gold { color: var(--gold-primary, #d4af37); }
    }

    .btn-refresh-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #94a3b8;
      padding: 0.35rem 0.65rem;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      &:hover { color: #fff; }
    }
  }
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;

  th {
    padding: 0.85rem 1.25rem;
    background: rgba(0, 0, 0, 0.2);
    color: #94a3b8;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  td {
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }

  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-mono { font-family: monospace; }
  .font-bold { font-weight: 600; }
  .text-gold { color: var(--gold-primary, #d4af37); }
  .text-muted { color: #94a3b8; }
  .text-xs { font-size: 0.78rem; }

  .channel-badge {
    padding: 0.2rem 0.5rem;
    background: rgba(255, 90, 95, 0.15);
    color: #ff5a5f;
    border: 1px solid rgba(255, 90, 95, 0.3);
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
  }

  .status-badge {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    &.success { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    &.failed { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  }
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

