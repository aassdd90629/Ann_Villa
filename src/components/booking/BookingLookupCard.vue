<script setup>
import { ref } from 'vue'
import { Calendar, Users, CheckCircle2, Clock, XCircle, Copy, Check, MapPin, FileText, CalendarX } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { useSiteContent } from '../../composables/useSiteContent'
import BookingLookupBankCard from './BookingLookupBankCard.vue'
import BookingLookupConfirmedCard from './BookingLookupConfirmedCard.vue'
import BookingLineNotificationCard from './BookingLineNotificationCard.vue'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-report', 'open-cancel'])

const { t } = useI18n()
const { basicInfo } = useSiteContent()
const copiedOrderId = ref(false)

const handleLineUpdated = (uid) => {
  if (props.booking) props.booking.line_user_id = uid
}

const copyOrderId = async (id) => {
  try {
    await navigator.clipboard.writeText(id)
    copiedOrderId.value = true
    setTimeout(() => { copiedOrderId.value = false }, 2000)
  } catch (err) {}
}

const getStatusBadge = (b) => {
  if (b.status === 'CANCELLED') return { text: t('lookup.card.statusCancelled'), class: 'status-cancelled', icon: XCircle }
  if (b.deposit_status === 'PAID') return { text: t('lookup.card.statusPaid'), class: 'status-paid', icon: CheckCircle2 }
  if (b.bank_last_5) return { text: t('lookup.card.statusVerifying'), class: 'status-verifying', icon: Clock }
  return { text: t('lookup.card.statusPending'), class: 'status-pending', icon: Clock }
}

const remainingBalance = (b) => Math.max(0, (Number(b.total_amount) || 0) - (Number(b.deposit_amount) || 0))
</script>

<template>
  <div class="booking-order-card" :class="{ 'is-cancelled': booking.status === 'CANCELLED' }">
    <!-- 1. 卡片頂部：單號與狀態徽章 -->
    <div class="order-card-header">
      <div class="order-id-group">
        <span class="label">{{ t('lookup.card.orderNo') }}</span>
        <span class="order-id font-mono">{{ booking.id }}</span>
        <button 
          class="btn-copy-mini" 
          @click="copyOrderId(booking.id)"
          :title="t('lookup.card.copyOrderNo')"
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
        <span class="d-label">{{ t('lookup.card.planName') }}</span>
        <span class="d-val font-semibold">{{ booking.room_name || '山語・全區尊榮包棟' }}</span>
      </div>

      <div class="detail-item">
        <span class="d-label">{{ t('lookup.card.stayPeriod') }}</span>
        <span class="d-val">
          <Calendar :size="14" class="inline-icon" />
          <span>{{ booking.check_in }} 至 {{ booking.check_out }} ({{ booking.nights }} 晚)</span>
        </span>
      </div>

      <div class="detail-item">
        <span class="d-label">{{ t('lookup.card.guestCount') }}</span>
        <span class="d-val">
          <Users :size="14" class="inline-icon" />
          <span>{{ booking.guest_count }} 位貴賓</span>
        </span>
      </div>

      <div class="detail-item">
        <span class="d-label">{{ t('lookup.card.primaryGuest') }}</span>
        <span class="d-val">{{ booking.guest_name }} ({{ booking.guest_phone }})</span>
      </div>
    </div>

    <!-- 特殊需求備註 -->
    <div v-if="booking.special_requests" class="special-requests-note">
      <FileText :size="14" class="text-gold" />
      <span><strong>{{ t('lookup.card.specialRequests') }}：</strong>{{ booking.special_requests }}</span>
    </div>

    <!-- 3. 費用明細看板 -->
    <div class="pricing-summary-bar">
      <div class="price-col">
        <span class="p-label">{{ t('lookup.card.totalRate') }}</span>
        <span class="p-val">NT$ {{ Number(booking.total_amount).toLocaleString() }}</span>
      </div>
      <div class="price-col highlight">
        <span class="p-label">{{ t('lookup.card.deposit50') }}</span>
        <span class="p-val text-gold font-bold">NT$ {{ Number(booking.deposit_amount).toLocaleString() }}</span>
      </div>
      <div class="price-col">
        <span class="p-label">{{ t('lookup.card.dueAtCheckIn') }}</span>
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
      <div class="card-cancel-row">
        <button type="button" class="btn-cancel-ghost" @click="emit('open-cancel', booking)">
          <CalendarX :size="13" />
          <span>{{ t('lookup.card.cancelBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- (B) 已付定金 / 已確認狀態 (獨立組件) -->
    <BookingLookupConfirmedCard 
      v-else-if="booking.deposit_status === 'PAID' && booking.status !== 'CANCELLED'"
      :booking="booking"
      @open-cancel="emit('open-cancel', booking)"
    />

    <!-- (C) 已取消狀態 -->
    <div v-else class="action-section cancelled-section">
      <div class="cancelled-box">
        <p class="cancelled-desc">
          {{ t('lookup.card.cancelledNotice') }}
        </p>
        <div v-if="booking.refund_status === 'PENDING'" class="refund-hint-tag pending">
          ⏳ 定金退款核銷中：依規定退還 NT$ {{ Number(booking.refund_amount || 0).toLocaleString() }}，管家將匯入您指定之銀行帳戶。
        </div>
        <div v-else-if="booking.refund_status === 'COMPLETED'" class="refund-hint-tag completed">
          ✅ 定金 NT$ {{ Number(booking.refund_amount || 0).toLocaleString() }} 已於 {{ booking.refund_completed_at?.slice(0, 10) || '近日' }} 完成退款匯出。
        </div>
        <div v-else-if="booking.refund_status === 'FORFEITED'" class="refund-hint-tag forfeited">
          ⚠️ 依官方規章（入住前 7 天內取消），定金不予退還。
        </div>
      </div>
    </div>

    <!-- 5. LINE 官方帳號通知連動卡片 -->
    <BookingLineNotificationCard 
      :booking="booking" 
      @line-updated="handleLineUpdated" 
    />
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
    transform: none;
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

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;

    .price-col {
      flex-direction: row !important;
      justify-content: space-between !important;
      align-items: center !important;

      &.highlight {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        border-top: 1px dashed var(--border-color);
        border-bottom: 1px dashed var(--border-color);
      }
    }
  }

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

.card-cancel-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;

  .btn-cancel-ghost {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-size: 0.8rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.5rem;
    transition: color 0.2s ease;

    &:hover {
      color: #ef4444;
    }
  }
}

.refund-hint-tag {
  margin-top: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  line-height: 1.4;

  &.pending {
    background: rgba(234, 179, 8, 0.12);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #ca8a04;
  }

  &.completed {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  &.forfeited {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.25);
    color: #f87171;
  }
}
</style>
