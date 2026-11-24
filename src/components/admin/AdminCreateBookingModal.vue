<script setup>
import { ref, watch, computed } from 'vue'
import { X, Calendar, User, DollarSign, PlusCircle, AlertCircle, Save } from 'lucide-vue-next'
import { useBookingPricing } from '../../composables/useBookingPricing'
import { createAdminBooking } from '../../services/adminService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const isSubmitting = ref(false)
const errorMessage = ref('')
const useCustomPrice = ref(false)
const customPrice = ref('')

const form = ref({
  guestName: '',
  guestPhone: '',
  guestEmail: '',
  lineId: '',
  guestCount: 14,
  checkIn: '',
  checkOut: '',
  depositStatus: 'PAID', // 代客預訂預設為已收定金
  status: 'CONFIRMED',   // 代客預訂預設為正式已確認
  specialRequests: ''
})

// 綁定動態計價 Composable
const checkInRef = computed(() => form.value.checkIn)
const checkOutRef = computed(() => form.value.checkOut)
const guestCountRef = computed(() => form.value.guestCount)
const { bookingCalculation } = useBookingPricing(checkInRef, checkOutRef, guestCountRef)

// 重置表單
const resetForm = () => {
  form.value = {
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    lineId: '',
    guestCount: 14,
    checkIn: '',
    checkOut: '',
    depositStatus: 'PAID',
    status: 'CONFIRMED',
    specialRequests: ''
  }
  useCustomPrice.value = false
  customPrice.value = ''
  errorMessage.value = ''
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)

const closeModal = () => {
  if (!isSubmitting.value) {
    emit('update:modelValue', false)
  }
}

const displayTotalAmount = computed(() => {
  if (useCustomPrice.value) {
    return Number(customPrice.value) || 0
  }
  return bookingCalculation.value?.total || 0
})

const displayDepositAmount = computed(() => {
  return Math.round(displayTotalAmount.value * 0.5)
})

const calculatedNights = computed(() => {
  if (!form.value.checkIn || !form.value.checkOut) return 0
  const d1 = new Date(form.value.checkIn)
  const d2 = new Date(form.value.checkOut)
  if (isNaN(d1.getTime()) || isNaN(d2.getTime()) || d2 <= d1) return 0
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)))
})

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!form.value.guestName.trim()) {
    errorMessage.value = '請輸入訂房旅客姓名！'
    return
  }
  if (!form.value.guestPhone.trim()) {
    errorMessage.value = '請輸入聯絡電話！'
    return
  }
  if (!form.value.checkIn || !form.value.checkOut) {
    errorMessage.value = '請選擇入住與退房日期！'
    return
  }
  if (form.value.checkIn >= form.value.checkOut) {
    errorMessage.value = '退房日期必須晚於入住日期！'
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      guestName: form.value.guestName.trim(),
      guestPhone: form.value.guestPhone.trim(),
      guestEmail: form.value.guestEmail.trim(),
      lineId: form.value.lineId.trim(),
      guestCount: Number(form.value.guestCount) || 14,
      checkIn: form.value.checkIn,
      checkOut: form.value.checkOut,
      depositStatus: form.value.depositStatus,
      status: form.value.status,
      specialRequests: form.value.specialRequests.trim(),
      customTotalAmount: useCustomPrice.value ? Number(customPrice.value) : undefined
    }

    const res = await createAdminBooking(payload)
    emit('success', res.booking || payload)
    closeModal()
  } catch (err) {
    errorMessage.value = err.message || '建立訂單失敗'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-info">
            <PlusCircle :size="20" class="text-gold" />
            <h3>手動新增訂單 (代客預訂)</h3>
          </div>
          <button class="btn-close" @click="closeModal" :disabled="isSubmitting" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <form class="modal-body" @submit.prevent="handleSubmit">
          <div v-if="errorMessage" class="error-banner">
            <AlertCircle :size="16" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- 入住退房日期與人數 -->
          <div class="form-section">
            <h4 class="section-title">
              <Calendar :size="15" class="text-gold" />
              <span>入住日期與天數</span>
            </h4>
            <div class="grid-2col">
              <div class="field-item">
                <label>入住日期 (Check-in) <span class="required">*</span></label>
                <input v-model="form.checkIn" type="date" class="form-input" required />
              </div>
              <div class="field-item">
                <label>退房日期 (Check-out) <span class="required">*</span></label>
                <input v-model="form.checkOut" type="date" class="form-input" required />
              </div>
            </div>
            <div v-if="calculatedNights > 0" class="nights-hint">
              已選取 <strong>{{ calculatedNights }}</strong> 晚住宿（{{ form.checkIn }} ~ {{ form.checkOut }}）
            </div>
          </div>

          <!-- 旅客聯絡資料 -->
          <div class="form-section">
            <h4 class="section-title">
              <User :size="15" class="text-gold" />
              <span>旅客基本資料</span>
            </h4>
            <div class="grid-2col">
              <div class="field-item">
                <label>旅客姓名 <span class="required">*</span></label>
                <input v-model="form.guestName" type="text" placeholder="例：林先生 / 陳小姐" class="form-input" required />
              </div>
              <div class="field-item">
                <label>聯絡電話 <span class="required">*</span></label>
                <input v-model="form.guestPhone" type="tel" placeholder="例：0912-345-678" class="form-input" required />
              </div>
              <div class="field-item">
                <label>電子信箱 (選填)</label>
                <input v-model="form.guestEmail" type="email" placeholder="example@gmail.com" class="form-input" />
              </div>
              <div class="field-item">
                <label>LINE ID (選填)</label>
                <input v-model="form.lineId" type="text" placeholder="例：lin123" class="form-input" />
              </div>
              <div class="field-item">
                <label>入住人數 (上限 18 人)</label>
                <input v-model.number="form.guestCount" type="number" min="1" max="18" class="form-input" />
              </div>
            </div>
          </div>

          <!-- 金額與定金試算 -->
          <div class="form-section">
            <h4 class="section-title">
              <DollarSign :size="15" class="text-gold" />
              <span>金額與定金設定</span>
            </h4>
            <div class="price-box">
              <div class="toggle-row">
                <label class="checkbox-label">
                  <input v-model="useCustomPrice" type="checkbox" />
                  <span>手動指定總金額 (特殊優惠/親友價)</span>
                </label>
              </div>

              <div v-if="useCustomPrice" class="field-item mt-2">
                <label>自訂包棟總金額 (NT$)</label>
                <input v-model="customPrice" type="number" min="0" placeholder="請輸入總金額" class="form-input" />
              </div>

              <div class="price-summary-bar">
                <div class="p-item">
                  <span class="p-lbl">總金額：</span>
                  <span class="p-val font-bold">NT$ {{ displayTotalAmount.toLocaleString() }}</span>
                </div>
                <div class="p-item">
                  <span class="p-lbl">50% 應付定金：</span>
                  <span class="p-val text-gold font-bold">NT$ {{ displayDepositAmount.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 訂單狀態與管家備註 -->
          <div class="form-section">
            <div class="grid-2col">
              <div class="field-item">
                <label>定金付款狀態</label>
                <select v-model="form.depositStatus" class="form-select">
                  <option value="PAID">已收定金 (PAID)</option>
                  <option value="UNPAID">待付定金 (UNPAID)</option>
                </select>
              </div>
              <div class="field-item">
                <label>訂單狀態</label>
                <select v-model="form.status" class="form-select">
                  <option value="CONFIRMED">正式已確認 (CONFIRMED)</option>
                  <option value="PENDING">待確認預訂 (PENDING)</option>
                </select>
              </div>
            </div>

            <div class="field-item mt-2">
              <label>管家備註 / 旅客特殊需求 (選填)</label>
              <textarea v-model="form.specialRequests" rows="2" placeholder="例：自備烤肉食材、慶生佈置需求等" class="form-textarea"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              <Save :size="15" />
              <span>{{ isSubmitting ? '正在建立訂單中...' : '確認建立訂單並鎖房' }}</span>
            </button>
            <button type="button" class="btn-cancel" :disabled="isSubmitting" @click="closeModal">
              取消返回
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(6px); z-index: 9999;
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.modal-card {
  width: 100%; max-width: 620px; background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
  border-radius: 10px; box-shadow: 0 16px 36px rgba(0, 0, 0, 0.22);
  display: flex; flex-direction: column; max-height: 90vh; overflow: hidden;
}
.modal-header {
  padding: 1.15rem 1.5rem;
  border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex; align-items: center; justify-content: space-between;
  .header-info {
    display: flex; align-items: center; gap: 0.6rem;
    .text-gold { color: var(--gold-dark, #91754F); }
    h3 { font-size: 1.1rem; margin: 0; font-weight: 600; color: var(--admin-text-main, #1A1E1F); }
  }
  .btn-close {
    background: transparent; border: none; color: var(--admin-text-muted, #64748b);
    cursor: pointer; padding: 0.25rem;
    &:hover:not(:disabled) { color: var(--admin-text-main, #1A1E1F); }
  }
}
.modal-body {
  padding: 1.25rem 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.15rem;
}
.error-banner {
  display: flex; align-items: center; gap: 0.5rem; background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3); color: #dc2626;
  padding: 0.65rem 0.9rem; border-radius: 6px; font-size: 0.85rem;
}
.form-section {
  background: var(--admin-bg-base, #F5F3EC);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.22));
  border-radius: 8px; padding: 1rem 1.15rem; display: flex; flex-direction: column; gap: 0.75rem;
  .section-title {
    display: flex; align-items: center; gap: 0.45rem; font-size: 0.88rem;
    font-weight: 600; color: var(--admin-text-main, #1A1E1F); margin: 0;
    .text-gold { color: var(--gold-dark, #91754F); }
  }
}
.grid-2col {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
}
.field-item {
  display: flex; flex-direction: column; gap: 0.25rem;
  label {
    font-size: 0.8rem; font-weight: 500; color: var(--admin-text-sub, #475569);
    .required { color: #dc2626; font-weight: 700; }
  }
  .form-input, .form-select, .form-textarea {
    padding: 0.45rem 0.65rem; background: var(--admin-bg-card, #FFFFFF);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
    border-radius: 5px; font-size: 0.85rem; color: var(--admin-text-main, #1A1E1F); outline: none;
    &:focus { border-color: var(--gold-dark, #91754F); }
  }
}
.nights-hint {
  font-size: 0.82rem; color: var(--gold-dark, #91754F); padding: 0.4rem 0.6rem;
  background: rgba(197, 168, 128, 0.15); border-radius: 4px;
}
.price-box {
  display: flex; flex-direction: column; gap: 0.5rem;
  .checkbox-label {
    display: inline-flex; align-items: center; gap: 0.45rem;
    font-size: 0.82rem; color: var(--admin-text-sub, #475569); cursor: pointer;
  }
  .price-summary-bar {
    display: flex; gap: 1.25rem; padding: 0.6rem 0.8rem;
    background: var(--admin-bg-card, #FFFFFF);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));
    border-radius: 6px; margin-top: 0.25rem;
    .p-item {
      display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem;
      .p-lbl { color: var(--admin-text-sub, #475569); }
      .p-val { color: var(--admin-text-main, #1A1E1F); }
      .text-gold { color: var(--gold-dark, #91754F); }
    }
  }
}
.mt-2 { margin-top: 0.5rem; }
.modal-footer {
  padding-top: 0.5rem; display: flex; gap: 0.65rem; justify-content: flex-end;
  .btn-submit {
    display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.6rem 1.15rem;
    background: var(--gold-dark, #91754F); color: #FFFFFF; border: none; border-radius: 6px;
    font-size: 0.88rem; font-weight: 600; cursor: pointer;
    &:hover:not(:disabled) { background: var(--gold-primary, #C5A880); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
  .btn-cancel {
    padding: 0.6rem 1rem; background: var(--admin-bg-base, #F5F3EC);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
    color: var(--admin-text-sub, #475569); border-radius: 6px; font-size: 0.88rem; cursor: pointer;
    &:hover:not(:disabled) { color: var(--admin-text-main, #1A1E1F); }
  }
}
</style>
