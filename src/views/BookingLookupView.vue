<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { useBookingLookup } from '../composables/useBookingLookup'
import BookingLookupForm from '../components/booking/BookingLookupForm.vue'
import BookingLookupCard from '../components/booking/BookingLookupCard.vue'
import BookingReportPaymentModal from '../components/booking/BookingReportPaymentModal.vue'
import BookingCancelModal from '../components/booking/BookingCancelModal.vue'
import { ShieldCheck, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()
const { isEn } = useI18n()

const {
  isLoading,
  isReporting,
  isCancelling,
  errorMessage,
  successMessage,
  bookings,
  currentCredentials,
  lookupBookings,
  reportPayment,
  cancelBooking
} = useBookingLookup()

const showReportModal = ref(false)
const showCancelModal = ref(false)
const selectedBooking = ref(null)

// 頁面載入時檢查 URL query 參數（支援直訂完成後的自動直達查詢）
onMounted(async () => {
  const qPhone = route.query.phone ? String(route.query.phone).trim() : ''
  const qEmail = route.query.email ? String(route.query.email).trim() : ''
  const qOrderId = route.query.orderId || route.query.id ? String(route.query.orderId || route.query.id).trim() : ''

  if (qPhone && qEmail) {
    try {
      await lookupBookings({
        phone: qPhone,
        email: qEmail,
        bookingId: qOrderId
      })
    } catch {
      // 錯誤已在 composable 處理
    }
  }
})

const handleSearch = async (credentials) => {
  try {
    await lookupBookings(credentials)
  } catch {
    // 錯誤已在 composable 處理
  }
}

const openReportModal = (booking) => {
  selectedBooking.value = booking
  showReportModal.value = true
}

const openCancelModal = (booking) => {
  selectedBooking.value = booking
  showCancelModal.value = true
}

const handlePaymentReport = async (payload) => {
  try {
    await reportPayment(payload)
    showReportModal.value = false
  } catch {
    // 錯誤已在 composable 處理
  }
}

const handleCancelBooking = async (payload) => {
  try {
    await cancelBooking(payload)
    showCancelModal.value = false
  } catch {
    // 錯誤已在 composable 處理
  }
}
</script>

<template>
  <div class="booking-lookup-page">
    <!-- 頂部頁頭 -->
    <header class="lookup-hero">
      <div class="container hero-inner">
        <span class="hero-badge">
          <ShieldCheck :size="15" />
          <span>{{ isEn ? 'Official Direct Booking Service' : '山語 Villa 官方直訂貴賓服務' }}</span>
        </span>
        <h1 class="hero-title">
          {{ isEn ? 'Reservation Lookup & Verification' : '貴賓訂單查詢與線上對帳' }}
        </h1>
        <p class="hero-subtitle">
          {{ isEn 
            ? 'Track your reservation status, view payment details, or report your deposit transfer anytime.' 
            : '輸入預訂時填寫的手機號碼與電子信箱，即刻掌握最新檔期保留進度、定金匯款資訊與線上回報。' }}
        </p>
      </div>
    </header>

    <main class="container lookup-body">
      <!-- 查詢表單區塊 -->
      <section class="form-wrapper">
        <BookingLookupForm 
          :initialPhone="route.query.phone || ''"
          :initialEmail="route.query.email || ''"
          :initialOrderId="route.query.orderId || route.query.id || ''"
          :isLoading="isLoading"
          @search="handleSearch"
        />
      </section>

      <!-- 全域成功或錯誤訊息提示 -->
      <div v-if="successMessage" class="alert-banner alert-success">
        <CheckCircle2 :size="18" />
        <span>{{ successMessage }}</span>
      </div>

      <div v-if="errorMessage && !isLoading" class="alert-banner alert-error">
        <AlertCircle :size="18" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- 查詢結果列表區塊 -->
      <section v-if="bookings.length > 0" class="results-wrapper">
        <div class="results-header">
          <h3 class="results-title">
            {{ isEn ? 'Found Reservations' : '查詢結果' }}
            <span class="count-badge">({{ bookings.length }})</span>
          </h3>
          <p class="results-hint">
            {{ isEn ? 'Sorted by booking creation time (newest first).' : '依訂單建立時間排序，最新訂單置於最上方。' }}
          </p>
        </div>

        <div class="cards-list">
          <BookingLookupCard 
            v-for="b in bookings" 
            :key="b.id"
            :booking="b"
            @open-report="openReportModal"
            @open-cancel="openCancelModal"
          />
        </div>
      </section>

      <!-- 查無資料時之客服引導 -->
      <section v-else-if="!isLoading && errorMessage" class="empty-guidance">
        <div class="empty-icon-wrap">
          <MessageCircle :size="32" class="text-gold" />
        </div>
        <h4 class="empty-title">{{ isEn ? 'Need Assistance?' : '需要管家協助查詢？' }}</h4>
        <p class="empty-desc">
          若您確認已完成直訂但查無資料，可能為填寫時手機或信箱輸入有誤。您可直接透過官方 LINE 聯繫管家為您人工查詢核對。
        </p>
        <a 
          href="https://line.me/R/ti/p/@209yrich" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="btn btn-gold"
        >
          <MessageCircle :size="16" />
          <span>{{ isEn ? 'Contact Butler via LINE' : '加入官方 LINE 洽詢管家' }}</span>
        </a>
      </section>
    </main>

    <!-- 回報末五碼獨立彈窗 -->
    <BookingReportPaymentModal 
      v-model="showReportModal"
      :booking="selectedBooking"
      :defaultPhone="currentCredentials.phone"
      :defaultEmail="currentCredentials.email"
      :isSubmitting="isReporting"
      @submit-payment="handlePaymentReport"
    />

    <!-- 取消預訂與退訂申請獨立彈窗 -->
    <BookingCancelModal 
      v-model="showCancelModal"
      :booking="selectedBooking"
      :defaultPhone="currentCredentials.phone"
      :defaultEmail="currentCredentials.email"
      :isSubmitting="isCancelling"
      @confirm-cancel="handleCancelBooking"
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../assets/styles/variables' as *;

.booking-lookup-page {
  min-height: 80vh;
  padding-bottom: 5rem;
}

.lookup-hero {
  padding: 8rem 1.5rem 4rem;
  background: radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08), transparent 70%);
  text-align: center;
  border-bottom: 1px solid var(--border-color);

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.35rem 1rem;
    border-radius: 9999px;
    background-color: rgba(212, 175, 55, 0.12);
    border: 1px solid var(--border-gold-subtle);
    color: var(--gold-primary);
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .hero-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;

    @media (min-width: $bp-md) {
      font-size: 2.5rem;
    }
  }

  .hero-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    max-width: 640px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

.lookup-body {
  max-width: 900px;
  margin: -2rem auto 0;
  position: relative;
  z-index: 2;
  padding: 0 1.25rem;
}

.form-wrapper {
  margin-bottom: 2rem;
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.9rem 1.25rem;
  border-radius: 8px;
  font-size: 0.92rem;
  margin-bottom: 1.5rem;

  &.alert-success {
    background-color: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  &.alert-error {
    background-color: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }
}

.results-wrapper {
  margin-top: 2rem;

  .results-header {
    margin-bottom: 1.25rem;

    .results-title {
      font-size: 1.35rem;
      font-weight: 600;
      color: var(--text-primary);

      .count-badge {
        color: var(--gold-primary);
        font-weight: 700;
        margin-left: 0.35rem;
      }
    }

    .results-hint {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
  }
}

.empty-guidance {
  text-align: center;
  padding: 3rem 2rem;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-top: 1.5rem;
  transition: border-color 0.2s ease;

  &:hover {
    transform: none;
    border-color: var(--border-gold-subtle);
  }

  .empty-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: rgba(212, 175, 55, 0.1);
    margin-bottom: 1rem;
  }

  .empty-title {
    font-size: 1.25rem;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }

  .empty-desc {
    font-size: 0.92rem;
    color: var(--text-muted);
    max-width: 520px;
    margin: 0 auto 1.5rem;
    line-height: 1.6;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &.btn-gold {
    background-color: var(--gold-primary);
    border: 1px solid var(--gold-primary);
    color: #121212;

    &:hover {
      background-color: var(--gold-hover);
    }
  }
}
</style>
