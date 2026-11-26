<script setup>
import { ref } from 'vue'
import { Landmark, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-vue-next'

const props = defineProps({
  booking: {
    type: Object,
    required: true
  },
  isSubmitting: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update-refund'])

const referenceNo = ref('')
const adminNote = ref('')
const isConfirming = ref(false)

const handleCompleteRefund = () => {
  if (!referenceNo.value.trim()) {
    alert('請填寫網銀轉帳末五碼或匯款流水號以備查驗。')
    return
  }

  emit('update-refund', {
    refundStatus: 'COMPLETED',
    refundReferenceNo: referenceNo.value.trim(),
    refundAdminNote: adminNote.value.trim()
  })
}
</script>

<template>
  <div v-if="booking.status === 'CANCELLED' || booking.refund_status !== 'NONE'" class="section-card refund-card">
    <div class="card-head">
      <Landmark :size="16" class="text-gold" />
      <span class="head-title">退訂與金流退款核銷</span>
      <span v-if="booking.cancelled_by" class="cancel-by-tag">
        {{ booking.cancelled_by === 'GUEST' ? '旅客線上自主取消' : '管家後台取消' }}
      </span>
    </div>

    <!-- 待退款處理中 -->
    <div v-if="booking.refund_status === 'PENDING'" class="refund-body pending-body">
      <div class="refund-alert">
        <AlertTriangle :size="16" />
        <span>此單由旅客取消並申請退訂，應退金額：<strong>NT$ {{ Number(booking.refund_amount || 0).toLocaleString() }}</strong></span>
      </div>

      <div class="bank-details-box">
        <div class="b-row"><span class="b-lbl">退款銀行：</span><span class="b-val font-mono">{{ booking.refund_bank_code }} {{ booking.refund_bank_name || '' }}</span></div>
        <div class="b-row"><span class="b-lbl">退款帳號：</span><span class="b-val font-mono font-bold">{{ booking.refund_account }}</span></div>
        <div class="b-row"><span class="b-lbl">帳戶戶名：</span><span class="b-val font-bold">{{ booking.refund_account_name }}</span></div>
      </div>

      <div class="action-form">
        <div class="form-row">
          <label class="lbl">匯款後五碼 / 交易流水號：</label>
          <input v-model="referenceNo" type="text" placeholder="例: 12345 或 TXN882910" class="input-sm" />
        </div>
        <div class="form-row">
          <label class="lbl">管家查驗附言（選填）：</label>
          <input v-model="adminNote" type="text" placeholder="例: 已由台銀網銀匯出" class="input-sm" />
        </div>
        <button 
          type="button" 
          class="btn-mark-refund" 
          :disabled="isSubmitting"
          @click="handleCompleteRefund"
        >
          <CheckCircle2 :size="14" />
          <span>{{ isSubmitting ? '正在更新狀態...' : '確認款項已匯出（標記已退款）' }}</span>
        </button>
      </div>
    </div>

    <!-- 已完成退款 -->
    <div v-else-if="booking.refund_status === 'COMPLETED'" class="refund-body completed-body">
      <div class="completed-msg">
        <ShieldCheck :size="18" class="text-green" />
        <span>已於 {{ booking.refund_completed_at?.slice(0, 16) || '近期' }} 完成退款 NT$ {{ Number(booking.refund_amount || 0).toLocaleString() }}</span>
      </div>
      <div v-if="booking.refund_reference_no" class="ref-note">
        轉帳憑證 / 流水號: <span class="font-mono">{{ booking.refund_reference_no }}</span>
        <span v-if="booking.refund_admin_note" class="admin-note">（{{ booking.refund_admin_note }}）</span>
      </div>
    </div>

    <!-- 依約沒入不予退還 -->
    <div v-else-if="booking.refund_status === 'FORFEITED'" class="refund-body forfeited-body">
      <span>⚠️ 依官方規章（入住前 7 天內取消），定金全額沒入不予退還。</span>
    </div>

    <!-- 無需退款 (未付款即取消) -->
    <div v-else class="refund-body none-body">
      <span>旅客下單後未匯定金即取消，無涉金流退費，檔期已物理釋放。</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.refund-card {
  border: 1px solid rgba(212, 175, 55, 0.3) !important;
  background: var(--admin-bg-hover, rgba(212, 175, 55, 0.04));
  border-radius: 8px;
  padding: 1rem 1.25rem;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));

  .head-title {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--admin-text-main, #FFFFFF);
  }

  .cancel-by-tag {
    margin-left: auto;
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }
}

.refund-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  background: rgba(234, 179, 8, 0.15);
  color: #ca8a04;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
}

.bank-details-box {
  background: var(--admin-bg-card, #1e293b);
  border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.85rem;

  .b-row {
    font-size: 0.85rem;
    margin-bottom: 0.35rem;
    &:last-child { margin-bottom: 0; }
    .b-lbl { color: var(--admin-text-muted, #94a3b8); }
    .b-val { color: var(--admin-text-main, #FFFFFF); }
  }
}

.action-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    .lbl { font-size: 0.8rem; color: var(--admin-text-muted, #94a3b8); }
    .input-sm {
      padding: 0.45rem 0.75rem;
      border-radius: 4px;
      border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.15));
      background: var(--admin-bg-body, #0f172a);
      color: var(--admin-text-main, #FFFFFF);
      font-size: 0.85rem;
      &:focus { outline: none; border-color: var(--gold-primary); }
    }
  }

  .btn-mark-refund {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: #10b981;
    border: none;
    border-radius: 4px;
    color: #FFFFFF;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.25rem;
    transition: background-color 0.2s ease;
    &:hover:not(:disabled) { background: #059669; }
  }
}

.completed-msg {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.88rem;
  font-weight: 600;
}

.ref-note {
  font-size: 0.82rem;
  color: var(--admin-text-muted, #94a3b8);
  margin-top: 0.35rem;
}

.forfeited-body, .none-body {
  font-size: 0.84rem;
  color: var(--admin-text-muted, #94a3b8);
}
</style>
