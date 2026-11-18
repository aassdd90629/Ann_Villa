<script setup>
import { ref, onMounted } from 'vue'
import { getAdminPricing, saveAdminPricing } from '../../services/adminService'
import { 
  Sparkles, 
  Save, 
  RotateCcw, 
  CalendarDays, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Coffee
} from 'lucide-vue-next'

const isLoading = ref(false)
const isSaving = ref(false)
const saveSuccess = ref(false)
const errorMessage = ref('')

const pricing = ref({
  weekdayTier1: 20000,
  weekdayTier2: 25000,
  weekdayTier3: 30000,
  weekend: 35000,
  deposit: 3000,
  maxCapacity: 18
})

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

const handleAddHoliday = () => {
  const newId = `h-custom-${Date.now()}`
  holidays.value.push({
    id: newId,
    nameZh: '新連續假期',
    nameEn: 'New Holiday',
    startDate: '2027-01-01',
    endDate: '2027-01-02',
    price: 38000,
    hasBreakfast: true,
    noteZh: '一律自前一天起算含早餐'
  })
}

const handleRemoveHoliday = (index) => {
  if (confirm(`確定要刪除「${holidays.value[index].nameZh}」嗎？`)) {
    holidays.value.splice(index, 1)
  }
}

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
        <p class="page-subtitle">設定即時寫入 Cloudflare D1，前台預約日曆、直訂試算與後端防竄改計價同步生效。</p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn btn-outline btn-refresh" :disabled="isLoading || isSaving" @click="loadPricingData">
          <RotateCcw :size="15" :class="{ 'spin-icon': isLoading }" />
          <span>重新讀取</span>
        </button>
        <button type="button" class="btn btn-gold btn-save" :disabled="isSaving" @click="handleSaveAll">
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

    <!-- 2. 平假日包棟定價設定卡片 -->
    <div class="pricing-card">
      <div class="card-head-row">
        <div class="head-title">
          <Sparkles :size="20" class="text-gold" />
          <h3>全區包棟基礎定價政策 (含早餐)</h3>
        </div>
        <span class="policy-tag">平日週一~四・一般假日週五~日</span>
      </div>

      <div class="pricing-grid-cols">
        <!-- 平日 10人以下 -->
        <div class="price-input-group highlight-group">
          <label class="p-label">
            <span class="badge-num">1</span>
            <span>平日 10人以下 (NT$ / 晚)</span>
          </label>
          <div class="input-with-unit">
            <span class="currency">NT$</span>
            <input type="number" v-model.number="pricing.weekdayTier1" min="1000" step="1000" class="form-control" />
            <span class="unit-tag">含早餐</span>
          </div>
          <p class="field-note">週一至週四，小家庭/摯友特惠</p>
        </div>

        <!-- 平日 11-14人 -->
        <div class="price-input-group highlight-group">
          <label class="p-label">
            <span class="badge-num">2</span>
            <span>平日 11-14人以下 (NT$ / 晚)</span>
          </label>
          <div class="input-with-unit">
            <span class="currency">NT$</span>
            <input type="number" v-model.number="pricing.weekdayTier2" min="1000" step="1000" class="form-control" />
            <span class="unit-tag">含早餐</span>
          </div>
          <p class="field-note">週一至週四，中型聚會高CP</p>
        </div>

        <!-- 平日 15-18人 -->
        <div class="price-input-group highlight-group">
          <label class="p-label">
            <span class="badge-num">3</span>
            <span>平日 15-18人以下 (NT$ / 晚)</span>
          </label>
          <div class="input-with-unit">
            <span class="currency">NT$</span>
            <input type="number" v-model.number="pricing.weekdayTier3" min="1000" step="1000" class="form-control" />
            <span class="unit-tag">含早餐</span>
          </div>
          <p class="field-note">週一至週四，全開滿額包棟</p>
        </div>

        <!-- 一般假日 -->
        <div class="price-input-group weekend-group">
          <label class="p-label">
            <span class="badge-tag-holiday">假日</span>
            <span>一般假日每晚 (週五、六、日)</span>
          </label>
          <div class="input-with-unit">
            <span class="currency">NT$</span>
            <input type="number" v-model.number="pricing.weekend" min="1000" step="1000" class="form-control" />
            <span class="unit-tag">含早餐</span>
          </div>
          <p class="field-note">週五晚上起算（含週五、六、日）</p>
        </div>

        <!-- 現場押金 -->
        <div class="price-input-group">
          <label class="p-label">
            <span>現場入住押金 (保證金)</span>
          </label>
          <div class="input-with-unit">
            <span class="currency">NT$</span>
            <input type="number" v-model.number="pricing.deposit" min="0" step="500" class="form-control" />
            <span class="unit-tag">退房退還</span>
          </div>
          <p class="field-note">入住現場收取，退房無損全退</p>
        </div>
      </div>
    </div>

    <!-- 3. 國定連續假期價目表卡片 -->
    <div class="pricing-card holidays-card">
      <div class="card-head-row">
        <div class="head-title">
          <CalendarDays :size="20" class="text-gold" />
          <h3>國定假日與連續假期專案價目表</h3>
        </div>
        <button type="button" class="btn btn-outline btn-sm btn-add" @click="handleAddHoliday">
          <Plus :size="14" />
          <span>新增假期檔期</span>
        </button>
      </div>
      <p class="card-desc">依業主規範：國定假日一律自「假日前一天」開始起算連假房價含早餐；農曆過年期間不提供早餐。</p>

      <div class="table-responsive">
        <table class="admin-pricing-table">
          <thead>
            <tr>
              <th style="width: 22%;">連假名稱</th>
              <th style="width: 15%;">開始日期 (前夕)</th>
              <th style="width: 15%;">結束日期</th>
              <th style="width: 18%;">每晚專案價 (NT$)</th>
              <th style="width: 16%;">早餐供應</th>
              <th style="width: 14%; text-align: center;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(h, idx) in holidays" :key="h.id || idx" :class="{ 'is-cny': h.nameZh.includes('春節') || h.nameZh.includes('過年') }">
              <td>
                <input type="text" v-model="h.nameZh" class="form-control table-input" placeholder="連假名稱" />
              </td>
              <td>
                <input type="date" v-model="h.startDate" class="form-control table-input" />
              </td>
              <td>
                <input type="date" v-model="h.endDate" class="form-control table-input" />
              </td>
              <td>
                <div class="table-price-wrap">
                  <span class="p-sign">NT$</span>
                  <input type="number" v-model.number="h.price" min="10000" step="1000" class="form-control table-input text-right" />
                </div>
              </td>
              <td>
                <label class="breakfast-toggle-label">
                  <input type="checkbox" v-model="h.hasBreakfast" class="toggle-checkbox" />
                  <span class="toggle-text" :class="{ 'has-bf': h.hasBreakfast, 'no-bf': !h.hasBreakfast }">
                    <Coffee :size="13" />
                    <span>{{ h.hasBreakfast ? '提供早餐' : '不含早餐' }}</span>
                  </span>
                </label>
              </td>
              <td class="text-center">
                <button type="button" class="btn-del-row" @click="handleRemoveHoliday(idx)" title="刪除此連假">
                  <Trash2 :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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

.pricing-card {
  padding: 1.75rem 2rem;
  margin-bottom: 2rem;
  border-radius: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  transform: none !important;

  &:hover {
    transform: none !important;
  }

  .card-head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    .head-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      h3 {
        font-size: 1.2rem;
        margin: 0;
        font-weight: 700;
        color: var(--text-primary);
      }
    }

    .policy-tag {
      font-size: 0.8rem;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      background: var(--badge-bg);
      color: var(--gold-primary);
      font-weight: 600;
    }
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 0 1.25rem;
  }
}

.pricing-grid-cols {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
}

.price-input-group {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-radius: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);

  &.highlight-group {
    border-color: rgba(200, 169, 110, 0.3);
  }

  &.weekend-group {
    border-color: rgba(200, 169, 110, 0.6);
    background: rgba(200, 169, 110, 0.05);
  }

  .p-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-sub);
    margin-bottom: 0.65rem;

    .badge-num {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--gold-primary);
      color: #121614;
      font-size: 0.7rem;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .badge-tag-holiday {
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      background: var(--gold-primary);
      color: #121614;
      font-size: 0.7rem;
      font-weight: 700;
    }
  }

  .input-with-unit {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.25rem 0.5rem;

    .currency {
      font-size: 0.82rem;
      color: var(--gold-primary);
      font-weight: 700;
    }

    input {
      border: none;
      background: transparent;
      padding: 0.35rem 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      width: 100%;

      &:focus {
        outline: none;
      }
    }

    .unit-tag {
      font-size: 0.72rem;
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      background: rgba(200, 169, 110, 0.15);
      color: var(--gold-primary);
      white-space: nowrap;
    }
  }

  .field-note {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0.5rem 0 0;
  }
}

.table-responsive {
  overflow-x: auto;
}

.admin-pricing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;

  th {
    padding: 0.75rem 0.85rem;
    text-align: left;
    background: var(--bg-primary);
    color: var(--gold-primary);
    font-weight: 600;
    border-bottom: 1px solid var(--border-color);
  }

  td {
    padding: 0.65rem 0.85rem;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    vertical-align: middle;
  }

  tr.is-cny td {
    background: rgba(200, 169, 110, 0.05);
  }

  .table-input {
    width: 100%;
    padding: 0.45rem 0.6rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    color: var(--text-primary);
    font-size: 0.88rem;

    &.text-right {
      text-align: right;
      font-weight: 600;
    }

    &:focus {
      border-color: var(--gold-primary);
      outline: none;
    }
  }

  .table-price-wrap {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    .p-sign {
      color: var(--gold-primary);
      font-weight: 600;
      font-size: 0.82rem;
    }
  }

  .breakfast-toggle-label {
    display: inline-flex;
    align-items: center;
    cursor: pointer;

    .toggle-checkbox {
      margin-right: 0.4rem;
    }

    .toggle-text {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;

      &.has-bf {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
      }

      &.no-bf {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }
    }
  }

  .btn-del-row {
    background: transparent;
    border: 1px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.35rem;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.3);
    }
  }
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
