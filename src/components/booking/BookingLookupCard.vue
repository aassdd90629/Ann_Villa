<script setup>
import { ref } from 'vue'
import { 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  MapPin, 
  FileText
} from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'
import BookingLookupBankCard from './BookingLookupBankCard.vue'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-report'])

const { isEn } = useI18n()
const { basicInfo } = useSiteContent()
const copiedOrderId = ref(false)

const copyOrderId = async (id) => {
  try {
    await navigator.clipboard.writeText(id)
    copiedOrderId.value = true
    setTimeout(() => { copiedOrderId.value = false }, 2000)
  } catch (err) {}
}

const getStatusBadge = (b) => {
  if (b.status === 'CANCELLED') {
    return { text: isEn.value ? 'Cancelled' : '已取消', class: 'status-cancelled', icon: XCircle }
  }
  if (b.deposit_status === 'PAID') {
    return { text: isEn.value ? 'Confirmed (Paid)' : '已確認・定金已入帳', class: 'status-paid', icon: CheckCircle2 }
  }
  if (b.bank_last_5) {
    return { text: isEn.value ? 'Verifying Transfer' : '對帳中・已回報末五碼', class: 'status-verifying', icon: Clock }
  }
  return { text: isEn.value ? 'Pending Payment' : '待付款・保留 24 小時', class: 'status-pending', icon: Clock }
}

const remainingBalance = (b) => {
  const total = Number(b.total_amount) || 0
  const deposit = Number(b.deposit_amount) || 0
  return Math.max(0, total - deposit)
}
</script>

<template>
  <div class="booking-order-card card-luxury" :class="{ 'is-cancelled': booking.status === 'CANCELLED' }">
    <!-- 1. 卡片頂部：單號與狀態徽章 -->
    <div class="order-card-header">
      <div class="order-id-group">
        <span class="label">{{ isEn ? 'Order No.' : '訂單編號' }}</span>
        <span class="order-id font-mono">{{ booking.id }}</span>
        <button 
          class="btn-copy-mini" 
          @click="copyOrderId(booking.id)"
          :title="isEn ? 'Copy Order ID' : '複製訂單編號'"
        >
          <Check v-if="copiedOrderId" :size="14" class="text-green" />
          <Copy v-else :size="14" />
        </button>
      </div>

      <div class="status-badge-wrap" :class="getStatusBadge(booking).class">
        <component :is="getStatusBadge(booking).icon" :size="15" />
        <span>{{ getStatusBadge(booking).text }}</span>
      </div>
    </div>

    <!-- 2. 核心訂單細節網格 -->
    <div class="order-details-grid">
      <div class="detail-item">
        <span class="d-label">{{ isEn ? 'Plan Name' : '預訂房型方案' }}</span>
        <span class="d-val font-semibold">{{ booking.room_name || '山語・全區尊榮包棟' }}</span>
      </div>

      <div class="detail-item">
        <span class="d-label">{{ isEn ? 'Stay Period' : '入住與退房日期' }}</span>
        <span class="d-val">
          <Calendar :size="14" class="inline-icon" />
          <span>{{ booking.check_in }} 至 {{ booking.check_out }} ({{ booking.nights }} 晚)</span>
        </span>
      </div>

      <div class="detail-item">
        <span class="d-label">{{ isEn ? 'Guest Count' : '入住人數' }}</span>
        <span class="d-val">
          <Users :size="14" class="inline-icon" />
          <span>{{ booking.guest_count }} 位貴賓</span>
        </span>
      </div>

      <div class="detail-item">
        <span class="d-label">{{ isEn ? 'Primary Guest' : '主要訂房貴賓' }}</span>
        <span class="d-val">{{ booking.guest_name }} ({{ booking.guest_phone }})</span>
      </div>
    </div>

    <!-- 特殊需求備註 -->
    <div v-if="booking.special_requests" class="special-requests-note">
      <FileText :size="14" class="text-gold" />
      <span><strong>{{ isEn ? 'Special Requests' : '需求備註' }}：</strong>{{ booking.special_requests }}</span>
    </div>

    <!-- 3. 費用明細看板 -->
    <div class="pricing-summary-bar">
      <div class="price-col">
        <span class="p-label">{{ isEn ? 'Total Rate' : '預估總房費' }}</span>
        <span class="p-val">NT$ {{ Number(booking.total_amount).toLocaleString() }}</span>
      </div>
      <div class="price-col highlight">
        <span class="p-label">{{ isEn ? 'Deposit (50%)' : '應收定金 (50%)' }}</span>
        <span class="p-val text-gold font-bold">NT$ {{ Number(booking.deposit_amount).toLocaleString() }}</span>
      </div>
      <div class="price-col">
        <span class="p-label">{{ isEn ? 'Due at Check-in' : '現場結清尾款' }}</span>
        <span class="p-val">NT$ {{ remainingBalance(booking).toLocaleString() }}</span>
      </div>
    </div>

    <!-- 4. 依狀態互動專區 -->
    <!-- (A) 待付款 / 待核銷狀態：由子組件負責匯款資訊與末五碼回報 -->
    <div v-if="booking.status !== 'CANCELLED' && booking.deposit_status !== 'PAID'" class="action-section unfulfilled-section">
      <BookingLookupBankCard 
        :booking="booking"
        @open-report="emit('open-report', booking)"
      />
    </div>

    <!-- (B) 已付定金 / 已確認狀態 -->
    <div v-else-if="booking.deposit_status === 'PAID'" class="action-section confirmed-section">
      <div class="confirmed-card">
        <CheckCircle2 :size="24" class="text-green" />
        <div class="c-info">
          <h4 class="c-title">{{ isEn ? 'Reservation Secured & Guaranteed' : '訂單已確認，檔期已為您保留！' }}</h4>
          <p class="c-desc">
            {{ isEn 
              ? 'Check-in time is 15:00, check-out is 11:00. Remaining balance can be settled upon arrival.' 
              : '山語 Villa 期待您的蒞臨！入住時間為當日 15:00 以後，退房時間為隔日 11:00 以前。現場尾款將於當日現場辦理入住時結清。' }}
          </p>
        </div>
      </div>

      <div class="confirmed-buttons">
        <RouterLink to="/rules" class="btn btn-outline btn-sm">
          <FileText :size="15" />
          <span>{{ isEn ? 'Check-in Guidelines' : '查看入住須知與生活公約' }}</span>
        </RouterLink>
        <a :href="basicInfo.googleMapUrl" target="_blank" rel="noopener noreferrer" class="btn btn-outline-gold btn-sm">
          <MapPin :size="15" />
          <span>{{ isEn ? 'Google Maps Navigation' : 'Google 地圖導航路線' }}</span>
        </a>
      </div>
    </div>

    <!-- (C) 已取消狀態 -->
    <div v-else class="action-section cancelled-section">
      <p class="cancelled-desc">
        {{ isEn ? 'This reservation has been cancelled. For inquiries, please contact our butler.' : '此預訂單目前已取消。如需重新預約或了解詳情，請洽詢官方 LINE 管家。' }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.booking-order-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.75rem 1.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--border-gold-subtle);
  }

  &.is-cancelled {
    opacity: 0.8;
  }
}

.order-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.25rem;
}

.order-id-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .label {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .order-id {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.05em;
  }

  .btn-copy-mini {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem;
    display: inline-flex;
    align-items: center;

    &:hover {
      color: var(--gold-primary);
    }
  }
}

.status-badge-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 600;

  &.status-pending {
    background-color: rgba(234, 179, 8, 0.12);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #eab308;
  }

  &.status-verifying {
    background-color: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #60a5fa;
  }

  &.status-paid {
    background-color: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  &.status-cancelled {
    background-color: rgba(156, 163, 175, 0.12);
    border: 1px solid rgba(156, 163, 175, 0.3);
    color: var(--text-muted);
  }
}

.order-details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem 1.5rem;
  margin-bottom: 1.25rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 1fr 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .d-label {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .d-val {
    font-size: 0.95rem;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}

.special-requests-note {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background-color: var(--bg-body);
  border-radius: 6px;
  padding: 0.65rem 0.85rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1.25rem;
}

.pricing-summary-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-body);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.85rem 1.25rem;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .price-col {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;

    .p-label {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .p-val {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 600;
    }

    &.highlight .p-val {
      font-size: 1.15rem;
    }
  }
}

.confirmed-card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.25);
  margin-bottom: 1rem;

  .c-title {
    font-size: 0.98rem;
    font-weight: 600;
    color: #10b981;
    margin-bottom: 0.25rem;
  }

  .c-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
}

.confirmed-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.7rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;

  &.btn-sm {
    padding: 0.45rem 0.85rem;
    font-size: 0.82rem;
  }

  &.btn-outline-gold {
    background: transparent;
    border: 1px solid var(--gold-primary);
    color: var(--gold-primary);

    &:hover {
      background-color: rgba(212, 175, 55, 0.1);
    }
  }

  &.btn-outline {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);

    &:hover {
      border-color: var(--text-primary);
      color: var(--text-primary);
    }
  }
}
</style>
