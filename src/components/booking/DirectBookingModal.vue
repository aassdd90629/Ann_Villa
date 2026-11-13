<script setup>
import { ref } from 'vue'
import { useI18n } from '../../composables/useI18n'
import siteData from '../../data/site.json'
import { submitOnlineBooking } from '../../services/bookingService'
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Send, 
  AlertCircle, 
  Sparkles, 
  RefreshCw 
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  checkInDate: {
    type: String,
    default: null
  },
  checkOutDate: {
    type: String,
    default: null
  },
  guestCount: {
    type: Number,
    default: 18
  },
  calculation: {
    type: Object,
    default: () => ({
      nights: 0,
      grandTotal: 0
    })
  }
})

const emit = defineEmits(['update:modelValue', 'booking-success'])

const { isEn } = useI18n()

// 表單輸入與狀態
const isSubmitting = ref(false)
const bookingSuccess = ref(null)
const bookingError = ref('')
const formGuestName = ref('')
const formGuestPhone = ref('')
const formGuestEmail = ref('')
const formLineId = ref('')
const formSpecialRequests = ref('')

const closeModal = () => {
  emit('update:modelValue', false)
  if (bookingSuccess.value) {
    emit('booking-success', bookingSuccess.value)
    bookingSuccess.value = null
  }
}

const submitBookingForm = async () => {
  if (!formGuestName.value.trim() || !formGuestPhone.value.trim() || !formGuestEmail.value.trim()) {
    bookingError.value = isEn.value ? 'Please fill in all required fields (Name, Phone, Email).' : '請完整填寫姓名、手機電話與電子信箱。'
    return
  }

  isSubmitting.value = true
  bookingError.value = ''

  try {
    const payload = {
      roomId: 'villa-full',
      guestName: formGuestName.value.trim(),
      guestPhone: formGuestPhone.value.trim(),
      guestEmail: formGuestEmail.value.trim(),
      lineId: formLineId.value.trim(),
      guestCount: props.guestCount,
      checkIn: props.checkInDate,
      checkOut: props.checkOutDate,
      specialRequests: formSpecialRequests.value.trim()
    }

    const res = await submitOnlineBooking(payload)
    if (res && res.success) {
      bookingSuccess.value = res.booking
      emit('booking-success', res.booking)
    } else {
      throw new Error(res.message || '預約送出失敗')
    }
  } catch (err) {
    bookingError.value = err.message || (isEn.value ? 'Failed to submit reservation. Please check dates.' : '預約送出失敗，請檢查日期是否衝突或稍後再試。')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="booking-modal-overlay" @click.self="closeModal">
      <div class="booking-modal-card card-luxury" role="dialog" aria-modal="true">
        <!-- 關閉按鈕 -->
        <button class="modal-close-btn" @click="closeModal" aria-label="Close modal">
          <X :size="20" />
        </button>

        <!-- 1. 下單成功畫面 -->
        <div v-if="bookingSuccess" class="booking-modal-success">
          <div class="success-icon-wrap">
            <CheckCircle2 :size="56" class="text-gold" />
          </div>
          <h3 class="success-title">{{ isEn ? 'Reservation Request Submitted' : '預約單已成功送出！' }}</h3>
          <p class="success-subtitle">
            {{ isEn ? 'Your reservation request has been secured in our system.' : '您的包棟檔期已在系統成功登記保留，請依指示完成定金支付。' }}
          </p>

          <div class="order-summary-ticket">
            <div class="ticket-row">
              <span class="t-label">{{ isEn ? 'Order Number' : '訂單編號' }}</span>
              <span class="t-value order-id">{{ bookingSuccess.id }}</span>
            </div>
            <div class="ticket-row">
              <span class="t-label">{{ isEn ? 'Selected Plan' : '預訂項目' }}</span>
              <span class="t-value">{{ bookingSuccess.roomName }}</span>
            </div>
            <div class="ticket-row">
              <span class="t-label">{{ isEn ? 'Dates & Guests' : '日期與人數' }}</span>
              <span class="t-value">{{ bookingSuccess.checkIn }} 至 {{ bookingSuccess.checkOut }} ({{ bookingSuccess.nights }} 晚・{{ bookingSuccess.guestCount }} 人)</span>
            </div>
            <div class="ticket-divider"></div>
            <div class="ticket-row">
              <span class="t-label">{{ isEn ? 'Total Amount' : '預估總房費' }}</span>
              <span class="t-value">NT$ {{ Number(bookingSuccess.totalAmount).toLocaleString() }}</span>
            </div>
            <div class="ticket-row highlight">
              <span class="t-label font-bold">{{ isEn ? 'Required Deposit (50%)' : '應收定金 (50%)' }}</span>
              <span class="t-value deposit-price">NT$ {{ Number(bookingSuccess.depositAmount).toLocaleString() }}</span>
            </div>
          </div>

          <div class="payment-instructions-box">
            <h5 class="pay-heading">
              <CreditCard :size="16" />
              <span>{{ isEn ? 'Payment Instructions' : '定金匯款說明' }}</span>
            </h5>
            <p class="pay-desc">
              請於 <strong>24 小時內</strong> 將定金匯款至民宿官方帳戶，匯款完成後請點擊下方按鈕加入官方 LINE (<strong>{{ siteData.lineId }}</strong>) 回報您的<strong>帳號末五碼</strong>以完成正式鎖房確認！
            </p>
          </div>

          <div class="modal-actions-col">
            <a 
              :href="`https://line.me/R/ti/p/@209yrich?text=${encodeURIComponent(`您好，我已送出線上直訂！\n【訂單編號】：${bookingSuccess.id}\n【訂房人】：${bookingSuccess.guestName}\n【入住日期】：${bookingSuccess.checkIn} 至 ${bookingSuccess.checkOut}\n【應付定金】：NT$ ${Number(bookingSuccess.depositAmount).toLocaleString()}\n【匯款後五碼】：`)}`"
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn btn-gold btn-block"
            >
              <Send :size="18" />
              <span>{{ isEn ? 'Report Transfer via LINE' : '加入官方 LINE 回報後五碼' }}</span>
            </a>
            <button class="btn btn-outline btn-block mt-2" @click="closeModal">
              {{ isEn ? 'Close & Return' : '確認並返回網站' }}
            </button>
          </div>
        </div>

        <!-- 2. 線上填單表單畫面 -->
        <div v-else class="booking-modal-form">
          <div class="modal-header">
            <span class="modal-badge">{{ isEn ? 'Official Direct Booking' : '山語 Villa 官方直訂預約' }}</span>
            <h3 class="modal-title">{{ isEn ? 'Confirm Your Luxury Stay' : '填寫貴賓聯絡資料' }}</h3>
            <p class="modal-meta">
              【{{ checkInDate }} 至 {{ checkOutDate }}】共 {{ calculation.nights }} 晚・{{ guestCount }} 人入住
            </p>
          </div>

          <form @submit.prevent="submitBookingForm" class="booking-form-grid">
            <!-- 錯誤提醒 -->
            <div v-if="bookingError" class="booking-error-alert">
              <AlertCircle :size="18" />
              <span>{{ bookingError }}</span>
            </div>

            <!-- 姓名 -->
            <div class="form-group">
              <label for="guestName">
                {{ isEn ? 'Full Name' : '訂房人姓名' }} <span class="required">*</span>
              </label>
              <input 
                id="guestName" 
                v-model="formGuestName" 
                type="text" 
                class="form-input" 
                :placeholder="isEn ? 'e.g. John Doe' : '請輸入真實姓名'" 
                required 
              />
            </div>

            <!-- 電話 -->
            <div class="form-group">
              <label for="guestPhone">
                {{ isEn ? 'Mobile Phone' : '聯絡手機電話' }} <span class="required">*</span>
              </label>
              <input 
                id="guestPhone" 
                v-model="formGuestPhone" 
                type="tel" 
                class="form-input" 
                :placeholder="isEn ? 'e.g. 0912-345-678' : '請輸入聯絡手機'" 
                required 
              />
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="guestEmail">
                {{ isEn ? 'Email Address' : '電子信箱 (接收訂單確認)' }} <span class="required">*</span>
              </label>
              <input 
                id="guestEmail" 
                v-model="formGuestEmail" 
                type="email" 
                class="form-input" 
                :placeholder="isEn ? 'e.g. guest@example.com' : '請輸入正確 Email'" 
                required 
              />
            </div>

            <!-- LINE ID -->
            <div class="form-group">
              <label for="lineId">
                {{ isEn ? 'LINE ID (Optional)' : 'LINE ID (選填，方便管家聯繫)' }}
              </label>
              <input 
                id="lineId" 
                v-model="formLineId" 
                type="text" 
                class="form-input" 
                :placeholder="isEn ? 'Your LINE ID' : '方便管家第一時間聯繫確認'" 
              />
            </div>

            <!-- 特殊需求 -->
            <div class="form-group full-width">
              <label for="specialRequests">
                {{ isEn ? 'Special Requests & Notes' : '特殊需求或備註事項 (選填)' }}
              </label>
              <textarea 
                id="specialRequests" 
                v-model="formSpecialRequests" 
                class="form-textarea" 
                rows="2"
                :placeholder="isEn ? 'e.g. BBQ grill preparation, infant tub, check-in arrival estimates...' : '例如：預計抵達時間、加烤肉架、長輩同行等需求備註'"
              ></textarea>
            </div>

            <!-- 費用小結 -->
            <div class="form-summary-card full-width">
              <div class="f-sum-row">
                <span>{{ isEn ? 'Estimated Total Rate' : '預估總房價' }}</span>
                <span class="f-sum-val">NT$ {{ calculation.grandTotal.toLocaleString() }}</span>
              </div>
              <div class="f-sum-row highlight">
                <span>{{ isEn ? 'Deposit to pay (50%)' : '預計應付定金 (50%)' }}</span>
                <span class="f-sum-val f-gold">NT$ {{ Math.round(calculation.grandTotal * 0.5).toLocaleString() }}</span>
              </div>
            </div>

            <!-- 送出按鈕 -->
            <div class="form-submit-row full-width">
              <button 
                type="submit" 
                class="btn btn-gold btn-block btn-submit"
                :disabled="isSubmitting"
              >
                <RefreshCw v-if="isSubmitting" :size="18" class="spin" />
                <Sparkles v-else :size="18" />
                <span>{{ isSubmitting ? (isEn ? 'Submitting Reservation...' : '訂單傳送中...') : (isEn ? 'Confirm & Secure Dates' : '確認送出直訂預約') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.booking-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg, rgba(10, 15, 12, 0.75));
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: fadeIn 0.25s ease-out;
}

.booking-modal-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  max-width: 580px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  animation: modalScaleUp 0.3s $ease-oriental;

  @media (min-width: $bp-md) {
    padding: 2.5rem 2.25rem;
  }
}

.modal-close-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.35rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: $transition-base;

  &:hover {
    color: var(--text-primary);
    background: var(--bg-primary);
  }
}

.modal-header {
  margin-bottom: 1.5rem;

  .modal-badge {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--gold-primary);
    margin-bottom: 0.4rem;
  }

  .modal-title {
    font-family: $font-display;
    font-size: 1.45rem;
    color: var(--text-primary);
    margin: 0 0 0.35rem;
  }

  .modal-meta {
    font-size: 0.88rem;
    color: var(--text-sub);
    margin: 0;
  }
}

.booking-error-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--color-danger-bg);
  border: 1px solid var(--color-danger-border);
  color: var(--color-danger);
  border-radius: 4px;
  font-size: 0.88rem;
  grid-column: 1 / -1;
  margin-bottom: 0.5rem;
}

.booking-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.15rem;

  @media (min-width: $bp-sm) {
    grid-template-columns: 1fr 1fr;
  }

  .full-width {
    grid-column: 1 / -1;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;

    label {
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--text-primary);

      .required {
        color: var(--color-danger);
      }
    }

    .form-input,
    .form-textarea {
      padding: 0.65rem 0.85rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: 4px;
      font-size: 0.9rem;
      transition: border-color 0.2s ease;

      &:focus {
        outline: none;
        border-color: var(--gold-primary);
        box-shadow: 0 0 0 2px var(--badge-bg);
      }
    }
  }
}

.form-summary-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.85rem 1rem;

  .f-sum-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-sub);
    margin-bottom: 0.35rem;

    &.highlight {
      margin-bottom: 0;
      padding-top: 0.35rem;
      border-top: 1px dashed var(--border-color);
      font-weight: 600;

      .f-gold {
        color: var(--gold-primary);
        font-family: $font-display;
        font-size: 1.1rem;
      }
    }
  }
}

.form-submit-row {
  margin-top: 0.5rem;

  .btn-submit {
    padding: 0.85rem 1.5rem;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;

    .spin {
      animation: spin 1s linear infinite;
    }
  }
}

// 成功結案卡片
.booking-modal-success {
  text-align: center;
  padding: 1rem 0;

  .success-icon-wrap {
    margin-bottom: 1rem;
  }

  .text-gold {
    color: var(--gold-primary);
  }

  .success-title {
    font-family: $font-display;
    font-size: 1.5rem;
    color: var(--text-primary);
    margin: 0 0 0.5rem;
  }

  .success-subtitle {
    font-size: 0.9rem;
    color: var(--text-sub);
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .order-summary-ticket {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1.25rem;
    text-align: left;
    margin-bottom: 1.5rem;

    .ticket-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.88rem;

      .t-label {
        color: var(--text-muted);
      }

      .t-value {
        color: var(--text-primary);
        font-weight: 500;

        &.order-id {
          font-family: monospace;
          color: var(--gold-primary);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        &.deposit-price {
          font-family: $font-display;
          font-size: 1.25rem;
          color: var(--gold-primary);
          font-weight: 700;
        }
      }

      &.highlight {
        margin-top: 0.5rem;
      }
    }

    .ticket-divider {
      height: 1px;
      background: var(--border-color);
      margin: 0.65rem 0;
    }
  }

  .payment-instructions-box {
    background: var(--badge-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
    text-align: left;
    margin-bottom: 1.5rem;

    .pay-heading {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.9rem;
      color: var(--gold-primary);
      margin: 0 0 0.4rem;
    }

    .pay-desc {
      font-size: 0.85rem;
      color: var(--text-sub);
      margin: 0;
      line-height: 1.6;
    }
  }

  .modal-actions-col {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalScaleUp {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>

