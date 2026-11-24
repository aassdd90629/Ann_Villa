<script setup>
import { ref, onMounted } from 'vue'
import { getBookedRanges } from '../../services/availabilityService'
import { deleteAdminBlock } from '../../services/adminService'
import { usePagination } from '../../composables/usePagination'
import { Calendar, Plus, CheckCircle2 } from 'lucide-vue-next'
import AdminScheduleNavTabs from '../../components/admin/AdminScheduleNavTabs.vue'
import AdminBookedRangesTable from '../../components/admin/AdminBookedRangesTable.vue'
import AdminLockModal from '../../components/admin/AdminLockModal.vue'
import Pagination from '../../components/common/Pagination.vue'

const bookedRanges = ref([])
const isLoading = ref(false)
const isLockModalOpen = ref(false)
const statusMessage = ref('')

// 通用 10 筆分頁邏輯
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  paginatedItems,
  startIndex,
  endIndex
} = usePagination(bookedRanges, 10)

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
    <!-- 1. 頂部核心動線導航標籤 -->
    <AdminScheduleNavTabs />

    <!-- 頂部標題與快捷動作列 -->
    <div class="view-header">
      <div>
        <h1 class="view-title">檔期佔用與鎖房清單</h1>
        <p class="view-desc">全館佔用檔期清單總覽（官網直訂、管家自主保留與 Airbnb 外部同步），支援手動指定區間鎖房</p>
      </div>

      <div class="header-actions">
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

    <!-- 檔期清單表格組件 -->
    <AdminBookedRangesTable
      :ranges="paginatedItems"
      :total-count="bookedRanges.length"
      :is-loading="isLoading"
      @refresh="fetchRanges"
      @delete="handleDeleteBlock"
    >
      <template #pagination>
        <Pagination
          v-model:current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :page-size="pageSize"
          :start-index="startIndex"
          :end-index="endIndex"
        />
      </template>
    </AdminBookedRangesTable>

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
    color: var(--admin-text-main, #f8fafc);
    margin: 0 0 0.35rem 0;
    letter-spacing: 1px;
  }

  .view-desc {
    font-size: 0.85rem;
    color: var(--admin-text-sub, #94a3b8);
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
      background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.2));
      color: var(--admin-text-main, #e2e8f0);
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      &:hover:not(:disabled) { 
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .btn-action-gold {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.15rem;
      background: var(--gold-primary, #d4af37);
      border: none;
      color: #121415;
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
  color: #22c55e;
  border-radius: 6px;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;

    .view-title {
      font-size: 1.25rem;
    }

    .header-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;

      .btn-action-outline,
      .btn-action-gold {
        justify-content: center;
        padding: 0.6rem 0.5rem;
        font-size: 0.8rem;
      }
    }
  }
}
</style>
