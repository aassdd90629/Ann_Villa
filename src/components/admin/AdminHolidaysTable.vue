<script setup>
import { ref } from 'vue'
import { CalendarDays, Plus, Trash2, Coffee, DownloadCloud, Check } from 'lucide-vue-next'
import { generateVillaHolidays, getSupportedHolidayYears } from '../../utils/taiwanHolidayGenerator'

const props = defineProps({
  holidays: { type: Array, required: true }
})

const emit = defineEmits(['add-holiday', 'remove-holiday', 'import-gov-holidays'])

const selectedYear = ref(2027)
const yearOptions = getSupportedHolidayYears()
const isImporting = ref(false)
const importToast = ref('')

// 觸發一鍵匯入政府公告連假
const handleTriggerImport = () => {
  const year = Number(selectedYear.value)
  const count = props.holidays.length
  
  let confirmMsg = `即將依據行政院人事行政總處 ${year} 年度行事曆自動排定連續假期：\n` +
    `• 一律套用山語規則：「假日前一天」開始起算專案價\n` +
    `• 農曆春節自動設定為 60,000 元（不提供早餐）\n` +
    `• 一般國定連假自動設定為 38,000 元（提供早餐）\n\n`
  
  if (count > 0) {
    confirmMsg += `⚠️ 目前已有 ${count} 筆假期設定，確認要用 ${year} 年度政府行事曆重新替換嗎？`
  } else {
    confirmMsg += `確定匯入？`
  }

  if (window.confirm(confirmMsg)) {
    isImporting.value = true
    const generated = generateVillaHolidays(year)
    emit('import-gov-holidays', generated)
    
    importToast.value = `已成功匯入 ${year} 年度政府公告連假（共 ${generated.length} 組）！請檢視後點擊上方儲存。`
    setTimeout(() => {
      importToast.value = ''
      isImporting.value = false
    }, 4500)
  }
}
</script>

<template>
  <div class="pricing-card holidays-card">
    <div class="card-head-row">
      <div class="head-title">
        <CalendarDays :size="20" class="text-gold" />
        <h3>國定假日與連續假期專案價目表</h3>
      </div>

      <!-- 右側動作區：政府行事曆快速匯入 + 手動新增 -->
      <div class="card-actions-group">
        <div class="gov-import-box">
          <select v-model="selectedYear" class="form-select year-select">
            <option v-for="opt in yearOptions" :key="opt.year" :value="opt.year">
              {{ opt.label }}
            </option>
          </select>
          <button 
            type="button" 
            class="btn btn-gold btn-sm btn-gov-import" 
            :disabled="isImporting"
            @click="handleTriggerImport"
            title="一鍵抓取官方公告連假，自動往前扣 1 天計算起算日與早餐設定"
          >
            <DownloadCloud :size="15" />
            <span>{{ isImporting ? '匯入中...' : '一鍵匯入政府連假' }}</span>
          </button>
        </div>

        <button type="button" class="btn btn-outline btn-sm btn-add" @click="emit('add-holiday')">
          <Plus :size="14" />
          <span>手動新增假期</span>
        </button>
      </div>
    </div>

    <!-- 匯入成功提示 -->
    <div v-if="importToast" class="import-alert">
      <Check :size="16" />
      <span>{{ importToast }}</span>
    </div>

    <p class="card-desc">
      依業主規範：國定假日一律自「假日前一天」開始起算連假房價含早餐；農曆過年期間不提供早餐。
    </p>

    <!-- 假期列表 -->
    <div class="table-responsive">
      <table class="admin-pricing-table">
        <thead>
          <tr>
            <th style="width: 22%;">連假名稱</th>
            <th style="width: 16%;">開始日期 (前夕)</th>
            <th style="width: 16%;">結束日期</th>
            <th style="width: 18%;">每晚專案價 (NT$)</th>
            <th style="width: 16%;">早餐供應</th>
            <th style="width: 12%; text-align: center;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(h, idx) in props.holidays" 
            :key="h.id || idx" 
            :class="{ 'is-cny': h.nameZh && (h.nameZh.includes('春節') || h.nameZh.includes('過年')) }"
          >
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
                <input 
                  type="number" 
                  v-model.number="h.price" 
                  min="10000" 
                  step="1000" 
                  class="form-control table-input text-right" 
                />
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
              <button type="button" class="btn-del-row" @click="emit('remove-holiday', idx)" title="刪除此連假">
                <Trash2 :size="15" />
              </button>
            </td>
          </tr>
          <tr v-if="props.holidays.length === 0">
            <td colspan="6" class="empty-state">
              尚無連續假期設定，建議點擊右上角「一鍵匯入政府連假」自動產生。
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

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
    flex-wrap: wrap;
    gap: 1rem;
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
  }

  .card-actions-group {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;

    .gov-import-box {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-primary);
      padding: 0.25rem 0.4rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);

      .year-select {
        border: none;
        background: transparent;
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--text-primary);
        padding: 0.2rem 0.4rem;
        cursor: pointer;

        &:focus { outline: none; }
        option { background: var(--bg-surface); color: var(--text-primary); }
      }

      .btn-gov-import {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        font-size: 0.82rem;
        font-weight: 600;
        border-radius: 4px;
        white-space: nowrap;
      }
    }

    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.85rem;
      font-size: 0.82rem;
      border-radius: 4px;
      white-space: nowrap;
    }
  }

  .import-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border-radius: 6px;
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.85rem;
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin: 0 0 1.25rem;
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

  .empty-state {
    text-align: center;
    padding: 2.5rem 1rem;
    color: var(--text-muted);
    font-size: 0.9rem;
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
      font-weight: 600;

      &.has-bf {
        background: rgba(34, 197, 94, 0.12);
        color: #22c55e;
      }

      &.no-bf {
        background: rgba(239, 68, 68, 0.12);
        color: #ef4444;
      }
    }
  }

  .btn-del-row {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.4rem;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease, background-color 0.2s ease;

    &:hover {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
  }
}
</style>
