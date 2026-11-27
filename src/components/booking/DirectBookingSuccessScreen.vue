<script setup>
import { ref, computed } from 'vue'
import { CheckCircle2, CreditCard, Send, Search, Check, Copy } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n'
import { buildLineUrl } from '../../utils/lineUrl'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  },
  formattedBankInfo: {
    type: String,
    default: ''
  },
  lineId: {
    type: String,
    default: ''
  },
  lineUrl: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['lookup', 'close'])

const { isEn } = useI18n()
const copiedOrderId = ref(false)

const copyOrderId = async () => {
  if (!props.booking?.id) return
  try {
    await navigator.clipboard.writeText(props.booking.id)
    copiedOrderId.value = true
    setTimeout(() => { copiedOrderId.value = false }, 2000)
  } catch (err) {}
}

const lineReportSuccessUrl = computed(() => {
  const b = props.booking
  if (!b) return ''
  const msg = `您好，我已送出線上直訂！\n【訂單編號】：${b.id}\n【訂房人】：${b.guestName}\n【入住日期】：${b.checkIn} 至 ${b.checkOut}\n【應付定金】：NT$ ${Number(b.depositAmount).toLocaleString()}\n【匯款後五碼】：`
  return buildLineUrl({ lineId: props.lineUrl || props.lineId, text: msg })
})
</script>

<template>
  <div class="booking-modal-success">
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
        <div class="order-id-action">
          <span class="t-value order-id font-mono">{{ booking.id }}</span>
          <button type="button" class="btn-copy-mini" @click="copyOrderId" :title="isEn ? 'Copy' : '複製單號'">
            <Check v-if="copiedOrderId" :size="13" class="text-green" />
            <Copy v-else :size="13" />
            <span class="hint">{{ copiedOrderId ? (isEn ? 'Copied' : '已複製') : (isEn ? 'Copy' : '複製') }}</span>
          </button>
        </div>
      </div>
      <div class="ticket-row">
        <span class="t-label">{{ isEn ? 'Selected Plan' : '預訂項目' }}</span>
        <span class="t-value">{{ booking.roomName }}</span>
      </div>
      <div class="ticket-row">
        <span class="t-label">{{ isEn ? 'Dates & Guests' : '日期與人數' }}</span>
        <span class="t-value">{{ booking.checkIn }} 至 {{ booking.checkOut }} ({{ booking.nights }} 晚・{{ booking.guestCount }} 人)</span>
      </div>
      <div class="ticket-divider"></div>
      <div class="ticket-row">
        <span class="t-label">{{ isEn ? 'Total Amount' : '預估總房費' }}</span>
        <span class="t-value">NT$ {{ Number(booking.totalAmount).toLocaleString() }}</span>
      </div>
      <div class="ticket-row highlight">
        <span class="t-label font-bold">{{ isEn ? 'Required Deposit (50%)' : '應收定金 (50%)' }}</span>
        <span class="t-value deposit-price">NT$ {{ Number(booking.depositAmount).toLocaleString() }}</span>
      </div>
    </div>

    <div class="payment-instructions-box">
      <h5 class="pay-heading">
        <CreditCard :size="16" />
        <span>{{ isEn ? 'Payment Instructions' : '定金匯款說明' }}</span>
      </h5>
      <p class="pay-desc">
        請於 <strong>24 小時內</strong> 將定金匯款至民宿帳戶：<strong>{{ formattedBankInfo }}</strong>。匯款完成後可點擊下方按鈕直接<strong>線上回報末五碼</strong>或加入官方 LINE (<strong>{{ lineId }}</strong>) 由管家核對確認！
      </p>
    </div>

    <div class="modal-actions-col">
      <!-- 核心導引：立即前往訂單查詢頁面查看與線上回報 -->
      <button 
        type="button" 
        class="btn btn-gold btn-block"
        @click="emit('lookup')"
      >
        <Search :size="18" />
        <span>{{ isEn ? 'View Reservation & Report Transfer' : '查看訂單詳細資料 / 線上回報末五碼' }}</span>
      </button>

      <!-- 官方 LINE 聯繫 -->
      <a 
        :href="lineReportSuccessUrl"
        target="_blank" 
        rel="noopener noreferrer" 
        class="btn btn-outline-gold btn-block"
      >
        <Send :size="16" />
        <span>{{ isEn ? 'Report Transfer via LINE' : '加入官方 LINE 回報後五碼' }}</span>
      </a>

      <button type="button" class="btn btn-outline btn-block" @click="emit('close')">
        {{ isEn ? 'Close & Return' : '確認並返回網站' }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.booking-modal-success {
  text-align: center;
  padding: 0.5rem 0;

  .success-icon-wrap {
    margin-bottom: 0.85rem;
  }

  .text-gold {
    color: var(--gold-primary);
  }

  .success-title {
    font-family: $font-display;
    font-size: 1.4rem;
    color: var(--text-primary);
    margin: 0 0 0.5rem;

    @media (max-width: $bp-sm) {
      font-size: 1.25rem;
    }
  }

  .success-subtitle {
    font-size: 0.88rem;
    color: var(--text-sub);
    margin-bottom: 1.25rem;
    line-height: 1.6;
  }

  .order-summary-ticket {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1.15rem;
    text-align: left;
    margin-bottom: 1.25rem;

    @media (max-width: $bp-sm) {
      padding: 0.85rem;
    }

    .ticket-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.88rem;
      gap: 0.5rem;

      @media (max-width: 440px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.2rem;
        margin-bottom: 0.65rem;
      }

      .t-label {
        color: var(--text-muted);
        flex-shrink: 0;
      }

      .t-value {
        color: var(--text-primary);
        font-weight: 500;
        text-align: right;

        @media (max-width: 440px) {
          text-align: left;
        }

        &.order-id {
          font-family: monospace;
          color: var(--gold-primary);
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        &.deposit-price {
          font-family: $font-display;
          font-size: 1.2rem;
          color: var(--gold-primary);
          font-weight: 700;
        }
      }

      &.highlight {
        margin-top: 0.5rem;

        @media (max-width: 440px) {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
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
    padding: 0.85rem 1rem;
    text-align: left;
    margin-bottom: 1.25rem;

    .pay-heading {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.88rem;
      color: var(--gold-primary);
      margin: 0 0 0.35rem;
    }

    .pay-desc {
      font-size: 0.82rem;
      color: var(--text-sub);
      margin: 0;
      line-height: 1.6;
    }
  }

  .modal-actions-col {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 6px;
      font-size: 0.92rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-block {
      width: 100%;
    }

    .btn-gold {
      background-color: var(--gold-primary);
      border: 1px solid var(--gold-primary);
      color: #121212;

      &:hover {
        background-color: var(--gold-hover);
        border-color: var(--gold-hover);
      }
    }

    .btn-outline-gold {
      background: transparent;
      border: 1px solid var(--gold-primary);
      color: var(--gold-primary);

      &:hover {
        background: rgba(212, 175, 55, 0.1);
      }
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-sub);

      &:hover {
        border-color: var(--text-primary);
        color: var(--text-primary);
      }
    }
  }

  .order-id-action {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;

    .btn-copy-mini {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 0.2rem 0.45rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }

      .text-green {
        color: #10b981;
      }
    }
  }
}
</style>
