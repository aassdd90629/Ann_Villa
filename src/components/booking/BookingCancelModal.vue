<script setup>
import { ref, computed, watch } from 'vue'
import { X, AlertTriangle, CalendarX, ShieldAlert, MessageCircle, Check } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'
import { buildLineUrl } from '../../utils/lineUrl'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  booking: { type: Object, default: null },
  defaultPhone: { type: String, default: '' },
  defaultEmail: { type: String, default: '' },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'confirm-cancel'])

const { isEn } = useI18n()
const { channelsInfo, basicInfo } = useSiteContent()

const rescheduleLineUrl = computed(() => {
  const lineId = basicInfo.value?.lineUrl || basicInfo.value?.lineId || channelsInfo.value?.directBooking?.lineUrl || '@209yrich'
  const bookingId = props.booking?.id || ''
  const text = `您好，關於訂單【${bookingId}】，我想洽詢行程改期與定金保留事宜。`
  return buildLineUrl({ lineId, text })
})

const confirmName = ref('')
const cancelReason = ref('')
const refundBankCode = ref('')
const refundBankName = ref('')
const refundAccount = ref('')
const refundAccountName = ref('')
const agreedPolicy = ref(false)
const formError = ref('')

// 計算當前距離入住日期的天數（台灣時區）
const diffDays = computed(() => {
  if (!props.booking?.check_in) return 0
  const now = new Date()
  const twTodayStr = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now).replace(/\//g, '-')
  
  const checkInMs = new Date(`${props.booking.check_in}T00:00:00+08:00`).getTime()
  const todayMs = new Date(`${twTodayStr}T00:00:00+08:00`).getTime()
  return Math.ceil((checkInMs - todayMs) / (1000 * 60 * 60 * 24))
})

// 依據官方正式站退訂政策計算退款比例
const refundPercentage = computed(() => {
  const d = diffDays.value
  if (d >= 15) return 100
  if (d >= 8) return 50
  return 0
})

// 預估應退定金金額
const estimatedRefundAmount = computed(() => {
  if (!props.booking || props.booking.deposit_status !== 'PAID') return 0
  const deposit = Number(props.booking.deposit_amount) || 0
  return Math.round(deposit * (refundPercentage.value / 100))
})

const isPaid = computed(() => props.booking?.deposit_status === 'PAID')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      confirmName.value = ''
      cancelReason.value = ''
      refundBankCode.value = ''
      refundBankName.value = ''
      refundAccount.value = ''
      refundAccountName.value = props.booking?.guest_name || ''
      agreedPolicy.value = false
      formError.value = ''
    }
  }
)

const handleClose = () => {
  if (!props.isSubmitting) {
    emit('update:modelValue', false)
  }
}

const handleSubmit = () => {
  formError.value = ''

  if (!confirmName.value.trim()) {
    formError.value = '請輸入主要訂房人真實姓名以確認身分。'
    return
  }

  if (confirmName.value.trim().toLowerCase() !== (props.booking?.guest_name || '').trim().toLowerCase()) {
    formError.value = '輸入的姓名與本訂單預訂貴賓不符，請確認後再試。'
    return
  }

  if (isPaid.value && estimatedRefundAmount.value > 0) {
    if (!refundBankCode.value.trim() || !refundAccount.value.trim() || !refundAccountName.value.trim()) {
      formError.value = '本筆訂單符合定金退費，請完整填寫退款銀行代碼、帳號與戶名。'
      return
    }
  }

  if (!agreedPolicy.value) {
    formError.value = '請詳閱並勾選同意山語 Villa 退訂政策條款。'
    return
  }

  emit('confirm-cancel', {
    bookingId: props.booking.id,
    phone: props.defaultPhone || props.booking.guest_phone,
    email: props.defaultEmail || props.booking.guest_email,
    confirmName: confirmName.value.trim(),
    cancelReason: cancelReason.value.trim(),
    refundBankCode: refundBankCode.value.trim(),
    refundBankName: refundBankName.value.trim(),
    refundAccount: refundAccount.value.trim(),
    refundAccountName: refundAccountName.value.trim()
  })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && booking" class="modal-overlay" @click.self="handleClose">
      <div class="modal-card" role="dialog" aria-modal="true">
        <button class="btn-close" :disabled="isSubmitting" @click="handleClose" aria-label="Close">
          <X :size="20" />
        </button>

        <div class="modal-header">
          <div class="header-icon-wrap">
            <CalendarX :size="22" class="text-danger" />
          </div>
          <div class="header-titles">
            <h3 class="modal-title">{{ isEn ? 'Cancel Reservation & Refund' : '取消訂單與退訂申請' }}</h3>
            <p class="modal-subtitle font-mono">{{ booking.id }}</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="cancel-modal-form">
          <div class="modal-grid-body">
            <!-- 左欄：改期挽留與訂單試算 -->
            <div class="col-summary">
              <!-- 協商改期挽留橫幅 -->
              <div class="retention-banner">
                <div class="b-icon"><MessageCircle :size="18" /></div>
                <div class="b-text">
                  <strong>{{ isEn ? 'Flexible Rescheduling' : '💡 行程異動？可免費協商延期！' }}</strong>
                  <p>{{ isEn ? 'Contact our butler on LINE to hold your deposit with zero penalty.' : '若因突發因素無法成行，山語 Villa 支援【全額保留定金、彈性延期】，免扣任何手續費。' }}</p>
                </div>
                <a :href="rescheduleLineUrl" target="_blank" rel="noopener noreferrer" class="btn-line-mini">
                  <span>{{ isEn ? 'LINE Butler' : '洽詢改期' }}</span>
                </a>
              </div>

              <!-- 訂單摘要看板 -->
              <div class="order-summary-box">
                <div class="summary-row">
                  <span class="label">{{ isEn ? 'Plan' : '預訂房型' }}</span>
                  <span class="value font-semibold">{{ booking.room_name || '山語・全區尊榮包棟' }}</span>
                </div>
                <div class="summary-row">
                  <span class="label">{{ isEn ? 'Stay Period' : '預約檔期' }}</span>
                  <span class="value font-mono">{{ booking.check_in }} 至 {{ booking.check_out }} ({{ booking.nights }} 晚)</span>
                </div>
                <div class="summary-row">
                  <span class="label">{{ isEn ? 'Days Ahead' : '距入住天數' }}</span>
                  <span class="value font-bold text-gold">尚有 {{ diffDays }} 天</span>
                </div>
                <div class="summary-row" :class="{ highlight: isPaid }">
                  <span class="label">{{ isEn ? 'Deposit / Refund %' : '定金狀態 / 退款比例' }}</span>
                  <span class="value">
                    {{ isPaid ? `定金 NT$ ${Number(booking.deposit_amount).toLocaleString()} (退還 ${refundPercentage}%)` : '尚未付款 (無涉退款)' }}
                  </span>
                </div>
                <div v-if="isPaid" class="summary-row refund-highlight">
                  <span class="label font-bold">{{ isEn ? 'Est. Refund Amount' : '預計退款總額' }}</span>
                  <span class="value font-bold font-mono">NT$ {{ estimatedRefundAmount.toLocaleString() }}</span>
                </div>
              </div>

              <!-- 未達退款標準提示 -->
              <div v-if="isPaid && estimatedRefundAmount === 0" class="forfeited-notice">
                <ShieldAlert :size="16" />
                <span>依官方退訂規章，入住前 7 天內取消定金將全額沒入。</span>
              </div>
            </div>

            <!-- 右欄：退款帳戶與身分確認 -->
            <div class="col-inputs">
              <!-- 若有應退定金，填寫退款帳戶資訊 -->
              <div v-if="isPaid && estimatedRefundAmount > 0" class="refund-bank-section">
                <label class="section-sublabel font-bold">退款匯入帳戶（管家於 3-5 工作天內匯退）：</label>
                <div class="bank-inputs-grid">
                  <input v-model="refundBankCode" type="text" maxlength="5" class="form-input" placeholder="銀行代碼 (例: 004 或 822)" required />
                  <input v-model="refundBankName" type="text" class="form-input" placeholder="分行或金融機構名稱" />
                  <input v-model="refundAccount" type="text" class="form-input" placeholder="退款銀行帳號" required />
                  <input v-model="refundAccountName" type="text" class="form-input" placeholder="戶名" required />
                </div>
              </div>

              <!-- 訂房人二次身分確認 -->
              <div class="form-group">
                <label class="form-label">
                  <span>主要訂房人真實姓名</span>
                  <span class="required">*</span>
                  <span class="sub-tip">(核對身分防誤按)</span>
                </label>
                <input v-model="confirmName" type="text" class="form-input" placeholder="請輸入預訂時填寫之真實姓名" required />
              </div>

              <!-- 取消原因 (選填) -->
              <div class="form-group">
                <label class="form-label">取消原因說明（選填）：</label>
                <input v-model="cancelReason" type="text" class="form-input" placeholder="例：家庭行程變動、交通不便等" />
              </div>

              <!-- 條款同意核取方塊 -->
              <label class="agree-label">
                <input v-model="agreedPolicy" type="checkbox" />
                <span>我已詳閱並同意退訂政策，確認取消後原檔期將立即釋放供他人預訂。</span>
              </label>

              <!-- 錯誤提示 -->
              <div v-if="formError" class="form-error-msg">
                <AlertTriangle :size="15" />
                <span>{{ formError }}</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" :disabled="isSubmitting" @click="handleClose">
              放棄取消（保留預訂）
            </button>
            <button type="submit" class="btn btn-danger" :disabled="isSubmitting">
              <Check v-if="!isSubmitting" :size="16" />
              <span>{{ isSubmitting ? '正在處理取消與釋放檔期...' : '確認取消預訂並釋出檔期' }}</span>
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
  position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1.25rem; overflow-y: auto;
}

.modal-card {
  width: 100%; max-width: 960px;
  background-color: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 1.65rem 2rem 1.75rem; position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  &:hover { transform: none; }
}

.btn-close {
  position: absolute; top: 1.25rem; right: 1.25rem;
  background: transparent; border: none; color: var(--text-muted);
  cursor: pointer; padding: 0.25rem; z-index: 2;
  &:hover { color: var(--text-primary); }
}

.modal-header {
  display: flex; align-items: center; gap: 0.75rem;
  padding-bottom: 0.85rem; margin-bottom: 1.15rem; border-bottom: 1px solid var(--border-color);
  .header-icon-wrap {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(239, 68, 68, 0.12);
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .header-titles {
    display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap;
    .modal-title { font-size: 1.25rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .modal-subtitle { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
  }
}

.cancel-modal-form { display: flex; flex-direction: column; }

.modal-grid-body {
  display: grid; grid-template-columns: 1fr; gap: 1.25rem;
  @media (min-width: $bp-md) {
    grid-template-columns: 1.15fr 1fr; align-items: start; gap: 1.75rem;
  }
}

.col-summary, .col-inputs { display: flex; flex-direction: column; gap: 0.85rem; }

.retention-banner {
  display: flex; align-items: center; gap: 0.65rem;
  padding: 0.75rem 0.85rem; border-radius: 8px;
  background: rgba(212, 175, 55, 0.1); border: 1px solid var(--border-gold-subtle);
  .b-icon { color: var(--gold-primary); flex-shrink: 0; }
  .b-text {
    flex: 1; font-size: 0.8rem;
    strong { color: var(--gold-primary); display: block; margin-bottom: 0.15rem; font-size: 0.82rem; }
    p { margin: 0; color: var(--text-secondary); line-height: 1.35; font-size: 0.78rem; }
  }
  .btn-line-mini {
    padding: 0.35rem 0.65rem; background: #06c755; color: #fff;
    border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-decoration: none; white-space: nowrap;
    &:hover { opacity: 0.9; }
  }
}

.order-summary-box {
  background: var(--bg-body); border: 1px solid var(--border-color);
  border-radius: 8px; padding: 0.85rem 1.15rem;
  .summary-row {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 0.85rem; font-size: 0.86rem; margin-bottom: 0.45rem;
    &:last-child { margin-bottom: 0; }
    .label { color: var(--text-secondary); white-space: nowrap; flex-shrink: 0; min-width: 82px; }
    .value { color: var(--text-primary); text-align: right; word-break: break-word; }
    &.refund-highlight {
      margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-color);
      .label { color: #f87171; font-weight: 600; }
      .value { color: #f87171; font-size: 1.05rem; }
    }
  }
}

.forfeited-notice {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.65rem 0.85rem; border-radius: 6px;
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171; font-size: 0.8rem; line-height: 1.35;
}

.refund-bank-section {
  background: rgba(212, 175, 55, 0.05); border: 1px solid var(--border-gold-subtle);
  padding: 0.75rem 0.85rem; border-radius: 8px;
  .section-sublabel { font-size: 0.82rem; color: var(--gold-primary); display: block; margin-bottom: 0.35rem; }
  .bank-inputs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; }
}

.form-group {
  display: flex; flex-direction: column; gap: 0.25rem;
  .form-label {
    font-size: 0.82rem; font-weight: 600; color: var(--text-primary);
    .required { color: #ef4444; margin-left: 2px; }
    .sub-tip { font-size: 0.75rem; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
  }
}

.form-input {
  width: 100%; padding: 0.5rem 0.75rem;
  background: var(--bg-body); border: 1px solid var(--border-color);
  border-radius: 6px; color: var(--text-primary); font-size: 0.86rem;
  &:focus { outline: none; border-color: var(--gold-primary); box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2); }
}

.agree-label {
  display: flex; align-items: flex-start; gap: 0.5rem;
  font-size: 0.78rem; color: var(--text-secondary); cursor: pointer; line-height: 1.35;
  input { margin-top: 2px; accent-color: var(--gold-primary); }
}

.form-error-msg { display: flex; align-items: center; gap: 0.4rem; color: #ef4444; font-size: 0.82rem; }

.modal-actions {
  display: flex; gap: 0.85rem; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-color);
  .btn {
    flex: 1; display: inline-flex; align-items: center; justify-content: center;
    gap: 0.5rem; padding: 0.7rem 1.25rem; border-radius: 6px; font-size: 0.9rem;
    font-weight: 600; cursor: pointer; transition: all 0.2s ease;
  }
  .btn-outline {
    background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary);
    &:hover:not(:disabled) { border-color: var(--text-primary); color: var(--text-primary); }
  }
  .btn-danger {
    background: #dc2626; border: 1px solid #dc2626; color: #fff;
    &:hover:not(:disabled) { background: #b91c1c; }
  }
}

// RWD 響應式微調 (Tablet & Mobile)
@media (max-width: 640px) {
  .modal-overlay { padding: 0.75rem; align-items: flex-start; }
  .modal-card { padding: 1.25rem 1rem 1.5rem; border-radius: 10px; margin: auto 0; }
  .modal-header {
    margin-bottom: 0.85rem;
    .header-titles {
      gap: 0.35rem;
      .modal-title { font-size: 1.12rem; }
      .modal-subtitle { font-size: 0.8rem; }
    }
  }
  .retention-banner { flex-wrap: wrap; gap: 0.5rem; .btn-line-mini { align-self: flex-start; } }
  .bank-inputs-grid { grid-template-columns: 1fr !important; }
  .modal-actions { flex-direction: column-reverse; gap: 0.65rem; .btn { width: 100%; padding: 0.75rem 1rem; } }
}

@media (max-width: 480px) {
  .order-summary-box .summary-row {
    flex-direction: column; align-items: flex-start; gap: 0.2rem; margin-bottom: 0.55rem;
    .label { min-width: auto; font-size: 0.8rem; }
    .value { text-align: left; width: 100%; font-size: 0.85rem; }
    &.refund-highlight {
      flex-direction: row; align-items: center; justify-content: space-between;
      .label { font-size: 0.85rem; }
      .value { text-align: right; width: auto; font-size: 1.05rem; }
    }
  }
}
</style>
