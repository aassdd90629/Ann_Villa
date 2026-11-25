<script setup>
import { ref, watch } from 'vue'
import { Search, Phone, Mail, Hash, Sparkles } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'

const props = defineProps({
  initialPhone: { type: String, default: '' },
  initialEmail: { type: String, default: '' },
  initialOrderId: { type: String, default: '' },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits(['search'])
const { isEn } = useI18n()

const phone = ref(props.initialPhone)
const email = ref(props.initialEmail)
const orderId = ref(props.initialOrderId)
const validationError = ref('')

watch(() => props.initialPhone, (v) => { if (v) phone.value = v })
watch(() => props.initialEmail, (v) => { if (v) email.value = v })
watch(() => props.initialOrderId, (v) => { if (v) orderId.value = v })

const handleSearch = () => {
  if (!phone.value.trim() || !email.value.trim()) {
    validationError.value = isEn.value 
      ? 'Please enter both your mobile phone and email address.' 
      : '請完整填寫當初預約時登記的手機號碼與電子信箱。'
    return
  }

  validationError.value = ''
  emit('search', {
    phone: phone.value.trim(),
    email: email.value.trim(),
    bookingId: orderId.value.trim()
  })
}
</script>

<template>
  <div class="lookup-form-card card-luxury">
    <div class="card-header">
      <div class="badge-gold">
        <Sparkles :size="14" />
        <span>{{ isEn ? 'Secure Guest Verification' : '貴賓身分核驗' }}</span>
      </div>
      <h2 class="form-title">
        {{ isEn ? 'Search Your Villa Reservation' : '查詢您的包棟訂單' }}
      </h2>
      <p class="form-desc">
        {{ isEn 
          ? 'Enter the mobile phone and email used during reservation to view real-time booking details and report deposit transfer.' 
          : '請輸入您送出預約單時所留下的聯絡電話與電子信箱，即可即時查看檔期確認進度與回報匯款。' }}
      </p>
    </div>

    <form @submit.prevent="handleSearch" class="lookup-grid">
      <!-- 錯誤提示 -->
      <div v-if="validationError" class="alert-error full-width">
        {{ validationError }}
      </div>

      <!-- 手機號碼 -->
      <div class="form-group">
        <label for="lookupPhone">
          <Phone :size="15" />
          <span>{{ isEn ? 'Mobile Phone' : '聯絡手機號碼' }} <span class="required">*</span></span>
        </label>
        <input 
          id="lookupPhone" 
          v-model="phone" 
          type="tel" 
          class="form-input"
          :placeholder="isEn ? 'e.g. 0912-345-678' : '例：0912-345-678'"
          required
          :disabled="isLoading"
        />
      </div>

      <!-- 電子信箱 -->
      <div class="form-group">
        <label for="lookupEmail">
          <Mail :size="15" />
          <span>{{ isEn ? 'Email Address' : '電子信箱' }} <span class="required">*</span></span>
        </label>
        <input 
          id="lookupEmail" 
          v-model="email" 
          type="email" 
          class="form-input"
          :placeholder="isEn ? 'e.g. guest@example.com' : '例：guest@example.com'"
          required
          :disabled="isLoading"
        />
      </div>

      <!-- 訂單編號 (選填) -->
      <div class="form-group full-width">
        <label for="lookupOrderId">
          <Hash :size="15" />
          <span>{{ isEn ? 'Order Number (Optional)' : '訂單編號 (選填，可精準查詢單筆)' }}</span>
        </label>
        <input 
          id="lookupOrderId" 
          v-model="orderId" 
          type="text" 
          class="form-input font-mono"
          :placeholder="isEn ? 'e.g. SY-20261125-8821' : '例：SY-20261125-8821 (留空則列出該手機之所有訂單)'"
          :disabled="isLoading"
        />
      </div>

      <!-- 送出按鈕 -->
      <div class="form-actions full-width">
        <button type="submit" class="btn btn-gold btn-block" :disabled="isLoading">
          <Search :size="18" />
          <span>{{ isLoading ? (isEn ? 'Searching...' : '正在查詢訂房資料...') : (isEn ? 'Search Reservations' : '即刻查詢訂房資料') }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.lookup-form-card {
  max-width: 780px;
  margin: 0 auto;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 2.25rem 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;

  .badge-gold {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.85rem;
    border-radius: 9999px;
    background-color: rgba(212, 175, 55, 0.12);
    border: 1px solid var(--border-gold-subtle);
    color: var(--gold-primary);
    font-size: 0.82rem;
    font-weight: 500;
    margin-bottom: 0.85rem;
  }

  .form-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .form-desc {
    font-size: 0.92rem;
    color: var(--text-muted);
    max-width: 580px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

.lookup-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.alert-error {
  padding: 0.75rem 1rem;
  background-color: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #f87171;
  font-size: 0.88rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.88rem;
    font-weight: 500;
    color: var(--text-secondary);

    .required {
      color: var(--gold-primary);
    }
  }

  .form-input {
    width: 100%;
    padding: 0.8rem 1rem;
    background-color: var(--bg-body);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 0.95rem;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--gold-primary);
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
    }
  }
}

.form-actions {
  margin-top: 0.5rem;

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.85rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-gold {
    background-color: var(--gold-primary);
    border: 1px solid var(--gold-primary);
    color: #121212;

    &:hover:not(:disabled) {
      background-color: var(--gold-hover);
      border-color: var(--gold-hover);
    }
  }

  .btn-block {
    width: 100%;
  }
}
</style>
