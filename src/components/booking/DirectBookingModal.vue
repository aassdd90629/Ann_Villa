<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { X, AlertCircle, Sparkles, RefreshCw } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'
import { submitOnlineBooking } from '../../services/bookingService'
import DirectBookingSuccessScreen from './DirectBookingSuccessScreen.vue'

const router = useRouter()
const { basicInfo, formattedBankInfo, fetchContent } = useSiteContent()
fetchContent()

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
  maxCapacity: {
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

const { t } = useI18n()

// 表單輸入與狀態
const isSubmitting = ref(false)
const bookingSuccess = ref(null)
const bookingError = ref('')
const formGuestName = ref('')
const formGuestPhone = ref('')
const formGuestEmail = ref('')
const formSpecialRequests = ref('')

const goToOrderLookup = () => {
  const b = bookingSuccess.value
  const q = {
    phone: formGuestPhone.value.trim(),
    email: formGuestEmail.value.trim(),
    orderId: b?.id || ''
  }
  closeModal()
  router.push({ path: '/booking-lookup', query: q })
}

const closeModal = () => {
  emit('update:modelValue', false)
  if (bookingSuccess.value) {
    emit('booking-success', bookingSuccess.value)
    bookingSuccess.value = null
  }
}

const submitBookingForm = async () => {
  if (!formGuestName.value.trim() || !formGuestPhone.value.trim() || !formGuestEmail.value.trim()) {
    bookingError.value = t('bookingModal.errFields')
    return
  }

  const cleanPhone = formGuestPhone.value.trim().replace(/[-\s]/g, '')
  const isTwMobile = /^09\d{8}$/.test(cleanPhone)
  const isIntlPhone = /^\+[1-9]\d{7,14}$/.test(cleanPhone)
  if (!isTwMobile && !isIntlPhone) {
    bookingError.value = t('bookingModal.errPhone')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formGuestEmail.value.trim())) {
    bookingError.value = t('bookingModal.errEmail')
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
    bookingError.value = err.message || t('bookingModal.errFailed')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="booking-modal-overlay" @click.self="closeModal">
      <div class="booking-modal-card" role="dialog" aria-modal="true">
        <!-- 關閉按鈕 -->
        <button class="modal-close-btn" @click="closeModal" aria-label="Close modal">
          <X :size="20" />
        </button>

        <!-- 1. 下單成功畫面 (子組件) -->
        <DirectBookingSuccessScreen
          v-if="bookingSuccess"
          :booking="bookingSuccess"
          :formatted-bank-info="formattedBankInfo"
          :line-id="basicInfo.lineId"
          :line-url="basicInfo.lineUrl"
          @lookup="goToOrderLookup"
          @close="closeModal"
        />

        <!-- 2. 線上填單表單畫面 -->
        <div v-else class="booking-modal-form">
          <div class="modal-header">
            <span class="modal-badge">{{ t('bookingModal.badge') }}</span>
            <h3 class="modal-title">{{ t('bookingModal.title') }}</h3>
            <p class="modal-meta">
              {{ t('bookingModal.meta', { checkIn: checkInDate, checkOut: checkOutDate, nights: calculation.nights, guests: guestCount }) }}
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
                {{ t('bookingModal.nameLabel') }} <span class="required">*</span>
              </label>
              <input 
                id="guestName" 
                v-model="formGuestName" 
                type="text" 
                class="form-input" 
                :placeholder="t('bookingModal.namePlaceholder')" 
                required 
              />
            </div>

            <!-- 電話 -->
            <div class="form-group">
              <label for="guestPhone">
                {{ t('bookingModal.phoneLabel') }} <span class="required">*</span>
              </label>
              <input 
                id="guestPhone" 
                v-model="formGuestPhone" 
                type="tel" 
                class="form-input" 
                :placeholder="t('bookingModal.phonePlaceholder')" 
                required 
              />
            </div>

            <!-- Email -->
            <div class="form-group full-width">
              <label for="guestEmail">
                {{ t('bookingModal.emailLabel') }} <span class="required">*</span>
              </label>
              <input 
                id="guestEmail" 
                v-model="formGuestEmail" 
                type="email" 
                class="form-input" 
                :placeholder="t('bookingModal.emailPlaceholder')" 
                required 
              />
            </div>

            <!-- 特殊需求 -->
            <div class="form-group full-width">
              <label for="specialRequests">
                {{ t('bookingModal.specialRequestsLabel') }}
              </label>
              <textarea 
                id="specialRequests" 
                v-model="formSpecialRequests" 
                class="form-textarea" 
                rows="2"
                :placeholder="t('bookingModal.specialRequestsPlaceholder')"
              ></textarea>
            </div>

            <!-- 費用小結 -->
            <div class="form-summary-card full-width">
              <div class="f-sum-row">
                <span>{{ t('bookingModal.estTotal') }}</span>
                <span class="f-sum-val">NT$ {{ calculation.grandTotal.toLocaleString() }}</span>
              </div>
              <div class="f-sum-row highlight">
                <span>{{ t('bookingModal.deposit50') }}</span>
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
                <span>{{ isSubmitting ? t('bookingModal.submitting') : t('bookingModal.submitBtn') }}</span>
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
  position: fixed; inset: 0;
  background: var(--overlay-bg, rgba(10, 15, 12, 0.75));
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
  padding: 1rem; animation: fadeIn 0.25s ease-out;
  @media (max-width: $bp-sm) { padding: 0.75rem; }
}

.booking-modal-card {
  position: relative; background: var(--bg-card);
  border: 1px solid var(--border-color); border-radius: 8px;
  max-width: 580px; width: 100%; max-height: calc(100dvh - 2rem);
  overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 2rem 1.5rem; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
  animation: modalScaleUp 0.3s $ease-oriental;
  &:hover { transform: none; }
  @media (max-width: $bp-sm) { padding: 1.5rem 1.15rem; }
  @media (min-width: $bp-md) { padding: 2.5rem 2.25rem; }
}

.modal-close-btn {
  position: absolute; top: 1.25rem; right: 1.25rem;
  background: transparent; border: none; color: var(--text-muted);
  cursor: pointer; padding: 0.35rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; transition: $transition-base;
  &:hover { color: var(--text-primary); background: var(--bg-primary); }
}

.modal-header {
  margin-bottom: 1.5rem;
  .modal-badge {
    display: inline-block; font-size: 0.75rem; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold-primary); margin-bottom: 0.4rem;
  }
  .modal-title {
    font-family: $font-display; font-size: 1.45rem; color: var(--text-primary); margin: 0 0 0.35rem;
    @media (max-width: $bp-sm) { font-size: 1.25rem; }
  }
  .modal-meta { font-size: 0.88rem; color: var(--text-sub); margin: 0; }
}

.booking-error-alert {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
  background: var(--color-danger-bg); border: 1px solid var(--color-danger-border);
  color: var(--color-danger); border-radius: 4px; font-size: 0.88rem;
  grid-column: 1 / -1; margin-bottom: 0.5rem;
}

.booking-form-grid {
  display: grid; grid-template-columns: 1fr; gap: 1.15rem;
  @media (min-width: $bp-sm) { grid-template-columns: 1fr 1fr; }
  .full-width { grid-column: 1 / -1; }
  .form-group {
    display: flex; flex-direction: column; gap: 0.35rem;
    label {
      font-size: 0.82rem; font-weight: 500; color: var(--text-primary);
      .required { color: var(--color-danger); }
    }
    .form-input, .form-textarea {
      padding: 0.65rem 0.85rem; background: var(--bg-primary);
      border: 1px solid var(--border-color); color: var(--text-primary);
      border-radius: 4px; font-size: 0.9rem; transition: border-color 0.2s ease;
      &:focus { outline: none; border-color: var(--gold-primary); box-shadow: 0 0 0 2px var(--badge-bg); }
    }
  }
}

.form-summary-card {
  background: var(--bg-primary); border: 1px solid var(--border-color);
  border-radius: 6px; padding: 0.85rem 1rem;
  .f-sum-row {
    display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-sub); margin-bottom: 0.35rem;
    &.highlight {
      margin-bottom: 0; padding-top: 0.35rem; border-top: 1px dashed var(--border-color); font-weight: 600;
      .f-gold { color: var(--gold-primary); font-family: $font-display; font-size: 1.1rem; }
    }
  }
}

.form-submit-row {
  margin-top: 0.5rem;
  .btn-submit {
    padding: 0.85rem 1.5rem; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    .spin { animation: spin 1s linear infinite; }
  }
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
    padding: 0.75rem 1.25rem; border-radius: 6px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
  }
  .btn-gold {
    background-color: var(--gold-primary); border: 1px solid var(--gold-primary); color: #121212;
    &:hover:not(:disabled) { background-color: var(--gold-hover); border-color: var(--gold-hover); }
  }
  .btn-block { width: 100%; }
}

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes modalScaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
