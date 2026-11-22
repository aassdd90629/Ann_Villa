<script setup>
import { ref, watch, onMounted } from 'vue'
import { getAdminAuditLogs } from '../../../services/adminService'
import { usePagination } from '../../../composables/usePagination'
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next'
import Pagination from '../../common/Pagination.vue'

const props = defineProps({
  category: {
    type: String,
    default: 'all'
  }
})

const logs = ref([])
const isLoading = ref(false)
const expandedRows = ref({})

const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  paginatedItems,
  startIndex,
  endIndex
} = usePagination(logs, 12)

const fetchAuditLogs = async () => {
  isLoading.value = true
  try {
    const params = { limit: 100 }
    if (props.category && props.category !== 'all') {
      params.category = props.category
    }
    const res = await getAdminAuditLogs(params)
    if (res && res.success) {
      logs.value = res.logs || []
    }
  } catch (err) {
    console.error('取得審計日誌失敗:', err)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.category, () => {
  currentPage.value = 1
  fetchAuditLogs()
})

onMounted(() => {
  fetchAuditLogs()
})

const toggleDetails = (id) => {
  expandedRows.value[id] = !expandedRows.value[id]
}

const getCategoryLabel = (cat) => {
  switch (cat) {
    case 'booking': return { label: '訂單與金流', class: 'cat-booking' }
    case 'calendar': return { label: '關房與檔期', class: 'cat-calendar' }
    case 'pricing': return { label: '房價政策', class: 'cat-pricing' }
    case 'security': return { label: '系統安全', class: 'cat-security' }
    default: return { label: '一般操作', class: 'cat-general' }
  }
}

defineExpose({ refresh: fetchAuditLogs })
</script>

<template>
  <div class="audit-logs-tab">
    <div class="table-container">
      <div class="table-bar">
        <div class="bar-title">
          <Clock :size="18" class="text-gold" />
          <span>{{ getCategoryLabel(category).label }} 審計紀錄 (共 {{ logs.length }} 筆)</span>
          <span class="scroll-hint-text">↔ 可左右滑動</span>
        </div>
        <button class="btn-refresh-sm" @click="fetchAuditLogs" :disabled="isLoading">
          <RefreshCw :size="13" :class="{ 'spin-anim': isLoading }" />
          <span>重新整理</span>
        </button>
      </div>

      <div class="table-responsive-wrapper">
        <table class="admin-table">
        <thead>
          <tr>
            <th style="width: 10%;">日誌編號</th>
            <th style="width: 14%;">業務分類</th>
            <th style="width: 38%;">操作摘要說明</th>
            <th style="width: 14%;">關聯對象</th>
            <th style="width: 10%;">操作者</th>
            <th style="width: 14%;">操作時間</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="text-center py-4 text-muted">日誌讀取中...</td>
          </tr>
          <tr v-else-if="logs.length === 0">
            <td colspan="6" class="text-center py-4 text-muted">此分類目前無操作紀錄</td>
          </tr>
          <template v-for="log in paginatedItems" :key="log.id">
            <tr :class="{ 'row-expanded': expandedRows[log.id] }">
              <td>#{{ log.id }}</td>
              <td>
                <span :class="['badge-category', getCategoryLabel(log.category).class]">
                  {{ getCategoryLabel(log.category).label }}
                </span>
              </td>
              <td>
                <div class="summary-wrap">
                  <span class="summary-text">{{ log.summary }}</span>
                  <button 
                    v-if="log.details" 
                    type="button" 
                    class="btn-expand-json" 
                    @click="toggleDetails(log.id)"
                    title="檢視前後數據對比"
                  >
                    <span>明細</span>
                    <component :is="expandedRows[log.id] ? ChevronUp : ChevronDown" :size="13" />
                  </button>
                </div>
              </td>
              <td>
                <code v-if="log.targetId" class="target-code">{{ log.targetId }}</code>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="operator-tag">{{ log.operator || 'admin' }}</span>
              </td>
              <td class="text-muted">{{ log.createdAt }}</td>
            </tr>

            <!-- 展開之 JSON 細部比對資訊 -->
            <tr v-if="expandedRows[log.id] && log.details" class="details-row">
              <td colspan="6">
                <div class="details-box">
                  <div class="details-title">操作參數與前後數值詳細快照：</div>
                  <pre class="json-code">{{ JSON.stringify(log.details, null, 2) }}</pre>
                </div>
              </td>
            </tr>
          </template>
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
  min-width: 750px;
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
}

.summary-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;

  .summary-text {
    font-weight: 500;
    line-height: 1.4;
  }
}

.btn-expand-json {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--gold-primary);
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: var(--gold-primary);
  }
}

.badge-category {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.76rem;
  font-weight: 600;
  white-space: nowrap;

  &.cat-booking {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }

  &.cat-calendar {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
  }

  &.cat-pricing {
    background: rgba(200, 169, 110, 0.18);
    color: var(--gold-primary);
  }

  &.cat-security {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  &.cat-general {
    background: rgba(156, 163, 175, 0.15);
    color: var(--text-muted);
  }
}

.target-code {
  background: var(--bg-primary);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--gold-primary);
  border: 1px solid var(--border-color);
}

.operator-tag {
  font-size: 0.82rem;
  color: var(--text-sub);
}

.details-row td {
  background: var(--bg-primary);
  padding: 1rem 1.25rem;
}

.details-box {
  .details-title {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.4rem;
  }

  .json-code {
    margin: 0;
    padding: 0.75rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-family: monospace;
    font-size: 0.82rem;
    color: var(--text-primary);
    overflow-x: auto;
    max-height: 200px;
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
