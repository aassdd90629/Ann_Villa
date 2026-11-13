<script setup>
import { ref, onMounted } from 'vue'
import { getBookedRanges } from '../../services/availabilityService'
import { deleteAdminBlock, triggerAdminSync } from '../../services/adminService'
import { Calendar, Plus, RefreshCw, Trash2, Shield, Info, CheckCircle2 } from 'lucide-vue-next'
import AdminLockModal from '../../components/admin/AdminLockModal.vue'

const bookedRanges = ref([])
const isLoading = ref(false)
const isSyncing = ref(false)
const isLockModalOpen = ref(false)
const statusMessage = ref('')

const fetchRanges = async () => {
  isLoading.value = true
  try {
    bookedRanges.value = await getBookedRanges()
  } catch (err) {
    console.error('取得檔期失敗:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRanges()
})

const handleTriggerSync = async () => {
  isSyncing.value = true
  statusMessage.value = ''
  try {
    const res = await triggerAdminSync()
    statusMessage.value = `同步成功！Airbnb 已同步 ${res.count || 0} 筆檔期`
    await fetchRanges()
  } catch (err) {
    alert('同步失敗: ' + err.message)
  } finally {
    isSyncing.value = false
  }
}

const handleDeleteBlock = async (item) => {
  if (!confirm(`確定要解除【${item.startDate} 至 ${item.endDate}】的鎖房狀態嗎？解除後前台將重新開放預約。`)) {
    return
  }

  try {
    await deleteAdminBlock(item.id || item.uid)
    statusMessage.value = '鎖房已成功解除！'
    await fetchRanges()
  } catch (err) {
    alert('解除失敗: ' + err.message)
  }
}

const handleBlockCreated = async () => {
  statusMessage.value = '手動鎖房成功已生效，前台已即刻反灰！'
  await fetchRanges()
}
</script>

<template>
  <div class="admin-calendar-view">
    <!-- 頂部標題與快捷動作列 -->
    <div class="view-header">
      <div>
        <h1 class="view-title">房態檔期與即時鎖房</h1>
        <p class="view-desc">檢視當前已佔用之檔期，支援管家手動保留與即時同步 Airbnb</p>
      </div>

      <div class="header-actions">
        <button 
          class="btn-action-outline" 
          :disabled="isSyncing" 
          @click="handleTriggerSync"
        >
          <RefreshCw :size="15" :class="{ 'spin-anim': isSyncing }" />
          <span>{{ isSyncing ? '正在拉取 Airbnb...' : '立即同步 Airbnb 檔期' }}</span>
        </button>

        <button class="btn-action-gold" @click="isLockModalOpen = true">
          <Plus :size="16" />
          <span>手動新增鎖房</span>
        </button>
      </div>
    </div>

    <!-- 提示條 -->
    <div v-if="statusMessage" class="alert-success">
      <CheckCircle2 :size="16" />
      <span>{{ statusMessage }}</span>
    </div>

    <!-- 檔期清單表格 -->
    <div class="table-container">
      <div class="table-header-title">
        <div class="left-info">
          <Calendar :size="18" class="text-gold" />
          <span>現有佔用檔期 (共 {{ bookedRanges.length }} 筆)</span>
        </div>
        <button class="btn-refresh-sm" @click="fetchRanges" :disabled="isLoading">
          <RefreshCw :size="13" :class="{ 'spin-anim': isLoading }" />
          <span>重新整理</span>
        </button>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>來源管道</th>
            <th>起始日期 (Check-in)</th>
            <th>結束日期 (Check-out)</th>
            <th>晚數</th>
            <th>鎖定事由 / 說明</th>
            <th class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="text-center py-4">正在自 Cloudflare D1 載入最新檔期...</td>
          </tr>
          <tr v-else-if="bookedRanges.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">目前暫無任何鎖定檔期</td>
          </tr>
          <tr v-for="(range, idx) in bookedRanges" :key="idx">
            <td>
              <span 
                class="source-badge" 
                :class="{
                  'airbnb': range.source === 'AIRBNB',
                  'manual': range.source === 'MANUAL_LOCK',
                  'direct': range.source === 'DIRECT_BOOKING'
                }"
              >
                {{ range.source === 'AIRBNB' ? 'Airbnb 同步' : (range.source === 'DIRECT_BOOKING' ? '官網直訂單' : '管家手動鎖房') }}
              </span>
            </td>
            <td class="font-mono text-gold-light">{{ range.startDate }}</td>
            <td class="font-mono text-gold-light">{{ range.endDate }}</td>
            <td>
              {{ Math.max(1, Math.round((new Date(range.endDate) - new Date(range.startDate)) / (1000 * 60 * 60 * 24))) }} 晚
            </td>
            <td class="text-muted">{{ range.summary || '已保留' }}</td>
            <td class="text-right">
              <button 
                v-if="range.source === 'MANUAL_LOCK'"
                class="btn-delete" 
                @click="handleDeleteBlock(range)"
                title="解除手動鎖定"
              >
                <Trash2 :size="15" />
                <span>解除</span>
              </button>
              <span v-else class="text-dim text-xs">
                {{ range.source === 'AIRBNB' ? '外部同步' : '正式訂單' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 手動鎖房彈窗組件 -->
    <AdminLockModal 
      v-model="isLockModalOpen" 
      @block-created="handleBlockCreated" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-calendar-view {
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
    letter-spacing: 1px;
  }

  .view-desc {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .btn-action-outline {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e2e8f0;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
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
      transition: all 0.2s;
      &:hover { background: #dfbc46; }
    }
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

  .table-header-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .left-info {
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
      &:hover { color: #fff; border-color: rgba(255, 255, 255, 0.3); }
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

  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-mono { font-family: monospace; }
  .text-gold-light { color: var(--gold-light, #f3e5ab); }
  .text-muted { color: #94a3b8; }
  .text-dim { color: #64748b; }
  .text-xs { font-size: 0.75rem; }

  .source-badge {
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;

    &.airbnb {
      background: rgba(255, 90, 95, 0.15);
      color: #ff5a5f;
      border: 1px solid rgba(255, 90, 95, 0.3);
    }
    &.manual {
      background: rgba(234, 179, 8, 0.15);
      color: #facc15;
      border: 1px solid rgba(234, 179, 8, 0.3);
    }
    &.direct {
      background: rgba(212, 175, 55, 0.15);
      color: var(--gold-light, #f3e5ab);
      border: 1px solid rgba(212, 175, 55, 0.35);
    }
  }

  .btn-delete {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #f87171;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    &:hover { background: rgba(239, 68, 68, 0.2); }
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
