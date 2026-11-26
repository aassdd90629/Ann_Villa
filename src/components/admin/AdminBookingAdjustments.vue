<script setup>
import { ref, watch } from 'vue'
import { Plus, Trash2, DollarSign, AlertCircle, CheckCircle } from 'lucide-vue-next'

const props = defineProps({
  bookingId: { type: String, required: true },
  booking: { type: Object, default: () => ({}) }
})

const isLoading = ref(false)
const adjustments = ref([])
const summary = ref({
  originalTotal: 0,
  depositAmount: 0,
  depositStatus: 'UNPAID',
  totalAdjustments: 0,
  finalTotal: 0,
  paidDeposit: 0,
  balanceDue: 0
})

const showAddForm = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const newTitle = ref('')
const newAmount = ref(0)
const newNote = ref('')

const fetchAdjustments = async () => {
  if (!props.bookingId) return
  isLoading.value = true
  try {
    const res = await fetch(`/api/admin/bookings/${props.bookingId}/adjustments`)
    const data = await res.json()
    if (data.success) {
      adjustments.value = data.adjustments || []
      summary.value = data.summary || summary.value
    }
  } catch (err) {
    console.warn('載入費用調整失敗:', err)
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.bookingId,
  (id) => {
    if (id) {
      showAddForm.value = false
      formError.value = ''
      fetchAdjustments()
    }
  },
  { immediate: true }
)

const handleAddAdjustment = async () => {
  formError.value = ''
  const trimmed = newTitle.value.trim()
  const amount = parseInt(newAmount.value, 10)

  if (!trimmed) {
    formError.value = '請填寫費用項目名稱（例如：現場加床 2 位、烤肉場地清潔費）。'
    return
  }
  if (isNaN(amount) || amount === 0) {
    formError.value = '請填寫有效且不為 0 之調整金額（正數加收、負數折讓）。'
    return
  }

  isSubmitting.value = true
  try {
    const res = await fetch(`/api/admin/bookings/${props.bookingId}/adjustments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: trimmed,
        amount,
        note: newNote.value.trim()
      })
    })
    const data = await res.json()
    if (data.success) {
      newTitle.value = ''
      newAmount.value = 0
      newNote.value = ''
      showAddForm.value = false
      await fetchAdjustments()
    } else {
      formError.value = data.message || '新增調整項目失敗'
    }
  } catch (err) {
    formError.value = '網路異常或伺服器錯誤'
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteAdjustment = async (adjId) => {
  if (!confirm('確定要移除此筆現場費用調整項目嗎？')) return
  try {
    const res = await fetch(`/api/admin/bookings/${props.bookingId}/adjustments?adjId=${adjId}`, {
      method: 'DELETE'
    })
    const data = await res.json()
    if (data.success) {
      await fetchAdjustments()
    } else {
      alert(data.message || '刪除失敗')
    }
  } catch (err) {
    alert('網路異常，刪除失敗')
  }
}
</script>

<template>
  <div class="adjustments-section">
    <div class="section-top">
      <div class="title-wrap">
        <DollarSign :size="16" class="text-gold" />
        <span class="sec-heading">現場費用調整與尾款核銷（P3 營運子表）</span>
      </div>
      <button
        v-if="!showAddForm && booking?.status !== 'CANCELLED'"
        type="button"
        class="btn-toggle-add"
        @click="showAddForm = true"
      >
        <Plus :size="14" />
        <span>新增費用調整</span>
      </button>
    </div>

    <!-- 新增表單折疊區 -->
    <div v-if="showAddForm" class="add-form-card">
      <div class="form-row">
        <div class="input-group flex-2">
          <label>調整項目名稱 *</label>
          <input
            v-model="newTitle"
            type="text"
            placeholder="例：加人加床 2 位、烤肉場地清潔費、提早入住"
            class="adj-input"
          />
        </div>
        <div class="input-group flex-1">
          <label>金額 (正數加收 / 負數折讓) *</label>
          <input
            v-model.number="newAmount"
            type="number"
            step="100"
            placeholder="例：2000 或 -500"
            class="adj-input"
          />
        </div>
      </div>
      <div class="input-group">
        <label>調整備註說明 (選填)</label>
        <input
          v-model="newNote"
          type="text"
          placeholder="例：現場旅客要求加床含早餐，管家確認收款"
          class="adj-input"
        />
      </div>

      <div v-if="formError" class="err-msg">
        <AlertCircle :size="14" />
        <span>{{ formError }}</span>
      </div>

      <div class="form-btns">
        <button
          type="button"
          class="btn-submit-adj"
          :disabled="isSubmitting"
          @click="handleAddAdjustment"
        >
          <CheckCircle :size="14" />
          <span>{{ isSubmitting ? '儲存中...' : '確認新增調整' }}</span>
        </button>
        <button
          type="button"
          class="btn-cancel-adj"
          :disabled="isSubmitting"
          @click="showAddForm = false"
        >
          取消
        </button>
      </div>
    </div>

    <!-- 調整明細列表 -->
    <div v-if="adjustments.length > 0" class="adj-table-wrap">
      <table class="adj-table">
        <thead>
          <tr>
            <th>項目名稱</th>
            <th>備註</th>
            <th class="text-right">金額調整</th>
            <th class="text-center" style="width: 45px;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in adjustments" :key="item.id">
            <td class="font-bold">{{ item.title }}</td>
            <td class="text-sub text-xs">{{ item.note || '-' }}</td>
            <td class="text-right font-mono" :class="item.amount >= 0 ? 'text-green' : 'text-danger'">
              {{ item.amount >= 0 ? '+' : '' }}NT$ {{ Number(item.amount).toLocaleString() }}
            </td>
            <td class="text-center">
              <button
                type="button"
                class="btn-del-adj"
                title="刪除此調整項目"
                @click="handleDeleteAdjustment(item.id)"
              >
                <Trash2 :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="!isLoading" class="empty-adjustments">
      尚未建立現場額外費用調整（如加人加床、場地清潔費等）
    </div>

    <!-- 尾款結算看板卡片 -->
    <div class="balance-summary-card">
      <div class="summary-grid">
        <div class="sum-col">
          <span class="s-label">預約原總額</span>
          <span class="s-val font-mono">NT$ {{ Number(summary.originalTotal).toLocaleString() }}</span>
        </div>
        <div class="sum-col">
          <span class="s-label">現場調整合計</span>
          <span
            class="s-val font-mono"
            :class="summary.totalAdjustments >= 0 ? 'text-green' : 'text-danger'"
          >
            {{ summary.totalAdjustments >= 0 ? '+' : '' }}NT$ {{ Number(summary.totalAdjustments).toLocaleString() }}
          </span>
        </div>
        <div class="sum-col">
          <span class="s-label">調整後總金額</span>
          <span class="s-val font-mono font-bold">NT$ {{ Number(summary.finalTotal).toLocaleString() }}</span>
        </div>
        <div class="sum-col">
          <span class="s-label">已付 50% 定金</span>
          <span class="s-val font-mono text-muted">
            - NT$ {{ Number(summary.paidDeposit).toLocaleString() }}
            <span class="text-xs">({{ summary.depositStatus === 'PAID' ? '已核銷' : '未付' }})</span>
          </span>
        </div>
        <div class="sum-col highlight">
          <span class="s-label">★ 現場應收尾款</span>
          <span class="s-val font-mono font-bold text-gold-bold">
            NT$ {{ Number(summary.balanceDue).toLocaleString() }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.adjustments-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
  border-radius: 8px;
  padding: 1rem 1.15rem;
}

.section-top {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 0.45rem;

    .sec-heading {
      font-size: 0.92rem;
      font-weight: 600;
      color: var(--admin-text-main, #1A1E1F);
    }
  }

  .btn-toggle-add {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.65rem;
    background: var(--gold-primary, #C5A880);
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: var(--gold-dark, #91754F);
    }
  }
}

.add-form-card {
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
  border-radius: 6px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .form-row {
    display: flex;
    gap: 0.75rem;

    .flex-2 { flex: 2; }
    .flex-1 { flex: 1; }
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    label {
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--admin-text-sub, #64748b);
    }

    .adj-input {
      padding: 0.45rem 0.65rem;
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
      border-radius: 4px;
      font-size: 0.84rem;
      color: var(--admin-text-main, #1A1E1F);
      background: var(--admin-bg-card, #FFFFFF);

      &:focus {
        outline: none;
        border-color: var(--gold-primary, #C5A880);
      }
    }
  }

  .err-msg {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: #ef4444;
    font-size: 0.78rem;
  }

  .form-btns {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 0.2rem;

    .btn-submit-adj {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.85rem;
      background: var(--gold-primary, #C5A880);
      color: #ffffff;
      border: none;
      border-radius: 4px;
      font-size: 0.82rem;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--gold-dark, #91754F);
      }
    }

    .btn-cancel-adj {
      padding: 0.4rem 0.75rem;
      background: transparent;
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
      border-radius: 4px;
      font-size: 0.82rem;
      color: var(--admin-text-sub, #64748b);
      cursor: pointer;
    }
  }
}

.adj-table-wrap {
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));
  border-radius: 6px;
  overflow: hidden;

  .adj-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;

    th {
      background: rgba(197, 168, 128, 0.1);
      padding: 0.45rem 0.65rem;
      font-weight: 600;
      color: var(--admin-text-sub, #475569);
      border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
    }

    td {
      padding: 0.45rem 0.65rem;
      border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.15));
      color: var(--admin-text-main, #1A1E1F);
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .text-green { color: #16a34a; font-weight: 600; }
  .text-danger { color: #dc2626; font-weight: 600; }

  .btn-del-adj {
    background: transparent;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 0.2rem;
    border-radius: 3px;

    &:hover {
      background: rgba(239, 68, 68, 0.1);
    }
  }
}

.empty-adjustments {
  font-size: 0.8rem;
  color: var(--admin-text-sub, #64748b);
  font-style: italic;
  padding: 0.35rem 0;
}

.balance-summary-card {
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
  border-radius: 6px;
  padding: 0.75rem 1rem;

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.6rem;

    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }

    .sum-col {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      .s-label {
        font-size: 0.72rem;
        color: var(--admin-text-sub, #64748b);
      }

      .s-val {
        font-size: 0.88rem;
        color: var(--admin-text-main, #1A1E1F);
      }

      &.highlight {
        background: rgba(197, 168, 128, 0.12);
        padding: 0.35rem 0.55rem;
        border-radius: 4px;
        border: 1px solid rgba(197, 168, 128, 0.3);

        .s-label {
          color: var(--gold-dark, #91754F);
          font-weight: 700;
        }

        .text-gold-bold {
          color: var(--gold-dark, #91754F);
          font-size: 0.96rem;
          font-weight: 700;
        }
      }
    }
  }
}
</style>
