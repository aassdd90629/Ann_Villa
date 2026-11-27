<script setup>
import { ref, onMounted } from 'vue'
import { getAdminPricing, saveAdminPricing } from '../../services/adminService'
import { 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-vue-next'
import AdminBasePricingCard from '../../components/admin/AdminBasePricingCard.vue'
import AdminHolidaysTable from '../../components/admin/AdminHolidaysTable.vue'

const isLoading = ref(false)
const isSaving = ref(false)
const saveSuccess = ref(false)
const errorMessage = ref('')

// 基礎平假日與保證金
const pricing = ref({
  weekdayTier1: 20000,
  weekdayTier2: 25000,
  weekdayTier3: 30000,
  weekdayTier1MaxGuests: 10,
  weekdayTier2MaxGuests: 14,
  weekend: 35000,
  deposit: 3000,
  maxCapacity: 18
})

// 國定連假列表
const holidays = ref([])

const loadPricingData = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await getAdminPricing()
    if (res && res.success) {
      if (res.pricing) pricing.value = { ...pricing.value, ...res.pricing }
      if (Array.isArray(res.holidays)) {
        holidays.value = res.holidays.map(h => ({
          ...h,
          hasBreakfast: h.hasBreakfast === 1 || h.hasBreakfast === true
        }))
      }
    }
  } catch (err) {
    errorMessage.value = err.message || '讀取定價設定失敗'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadPricingData()
})

// 新增自訂連假檔期
const handleAddHoliday = () => {
  const newId = `h-custom-${Date.now()}`
  holidays.value.push({
    id: newId,
    nameZh: '新連續假期',
    nameEn: 'New Holiday Special',
    startDate: '2027-01-01',
    endDate: '2027-01-02',
    price: 38000,
    hasBreakfast: true,
    noteZh: '一律自前一天起算含早餐'
  })
}

// 刪除連假檔期
const handleRemoveHoliday = (index) => {
  if (confirm(`確定要刪除「${holidays.value[index].nameZh}」嗎？`)) {
    holidays.value.splice(index, 1)
  }
}

// 接收來自子組件的一鍵匯入政府連假清單
const handleImportGovHolidays = (importedList) => {
  if (Array.isArray(importedList)) {
    holidays.value = importedList
  }
}

// 儲存所有定價設定寫入 D1
const handleSaveAll = async () => {
  isSaving.value = true
  errorMessage.value = ''
  saveSuccess.value = false

  try {
    const payload = {
      pricing: pricing.value,
      holidays: holidays.value
    }
    const res = await saveAdminPricing(payload)
    if (res && res.success) {
      saveSuccess.value = true
      setTimeout(() => { saveSuccess.value = false }, 4000)
    }
  } catch (err) {
    errorMessage.value = err.message || '儲存失敗，請重試'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="admin-pricing-view">
    <!-- 1. 頁面標題列 -->
    <div class="admin-page-header">
      <div class="header-left">
        <h1 class="page-title">房價政策與連續假期管理</h1>
        <p class="page-subtitle">設定即時寫入系統資料庫，前台預約日曆、直訂試算與後端防竄改計價同步生效。</p>
      </div>

      <div class="header-actions">
        <button 
          type="button" 
          class="btn btn-outline btn-refresh" 
          :disabled="isLoading || isSaving" 
          @click="loadPricingData"
        >
          <RotateCcw :size="15" :class="{ 'spin-icon': isLoading }" />
          <span>重新讀取</span>
        </button>
        <button 
          type="button" 
          class="btn btn-gold btn-save" 
          :disabled="isSaving" 
          @click="handleSaveAll"
        >
          <Save :size="16" />
          <span>{{ isSaving ? '儲存中...' : '儲存所有定價設定' }}</span>
        </button>
      </div>
    </div>

    <!-- 訊息提示列 -->
    <div v-if="saveSuccess" class="alert-box alert-success">
      <CheckCircle2 :size="18" />
      <span>定價政策與國定連續假期已成功更新至資料庫！前台已即時同步生效。</span>
    </div>
    <div v-if="errorMessage" class="alert-box alert-danger">
      <AlertCircle :size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 2. 平假日包棟基礎定價卡片 (獨立組件) -->
    <AdminBasePricingCard :pricing="pricing" />

    <!-- 3. 國定連假價目表卡片 (獨立組件，支援政府行事曆一鍵匯入) -->
    <AdminHolidaysTable 
      :holidays="holidays" 
      @add-holiday="handleAddHoliday" 
      @remove-holiday="handleRemoveHoliday"
      @import-gov-holidays="handleImportGovHolidays"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-pricing-view {
  padding-bottom: 3rem;
}

.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .page-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .page-subtitle {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
}

.alert-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;

  &.alert-success {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  &.alert-danger {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .admin-page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;

    .page-title {
      font-size: 1.25rem;
    }

    .header-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;

      .btn {
        justify-content: center;
        padding: 0.6rem 0.5rem;
        font-size: 0.8rem;
      }
    }
  }
}
</style>
