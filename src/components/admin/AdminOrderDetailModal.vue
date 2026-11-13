<script setup>
import { X, User, Phone, Mail, Calendar, CreditCard, MessageSquare, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  booking: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'confirm-paid', 'cancel-booking'])

const closeModal = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && booking" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-info">
            <span class="badge-order-id">{{ booking.id }}</span>
            <h3>訂單詳細內容</h3>
          </div>
          <button class="btn-close" @click="closeModal" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 狀態列 -->
          <div class="status-summary-bar">
            <div class="s-item">
              <span class="s-label">訂單狀態</span>
              <span class="status-tag" :class="booking.status?.toLowerCase()">
                {{ booking.status === 'CONFIRMED' ? '已確認' : (booking.status === 'CANCELLED' ? '已取消' : '待確認') }}
              </span>
            </div>
            <div class="s-item">
              <span class="s-label">定金付款</span>
              <span class="deposit-tag" :class="booking.deposit_status === 'PAID' ? 'paid' : 'unpaid'">
                {{ booking.deposit_status === 'PAID' ? '定金已付 (PAID)' : '待付定金 (UNPAID)' }}
              </span>
            </div>
          </div>

          <!-- 訂單資訊清單 -->
          <div class="info-sections">
            <div class="section-card">
              <h4 class="sec-title">
                <User :size="16" class="text-gold" />
                <span>旅客基本聯絡資訊</span>
              </h4>
              <div class="info-grid">
                <div class="info-row">
                  <span class="lbl">訂房姓名</span>
                  <span class="val font-bold">{{ booking.guest_name }} 貴賓</span>
                </div>
                <div class="info-row">
                  <span class="lbl">聯絡電話</span>
                  <span class="val">{{ booking.guest_phone }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">電子信箱</span>
                  <span class="val">{{ booking.guest_email }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">LINE ID</span>
                  <span class="val">{{ booking.line_id || '未填寫' }}</span>
                </div>
              </div>
            </div>

            <div class="section-card">
              <h4 class="sec-title">
                <Calendar :size="16" class="text-gold" />
                <span>預訂入住細節</span>
              </h4>
              <div class="info-grid">
                <div class="info-row">
                  <span class="lbl">預訂方案</span>
                  <span class="val">{{ booking.room_name || '山語・全區尊榮包棟' }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">入住日期</span>
                  <span class="val font-mono">{{ booking.check_in }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">退房日期</span>
                  <span class="val font-mono">{{ booking.check_out }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">入住人數</span>
                  <span class="val">{{ booking.guest_count }} 位</span>
                </div>
                <div class="info-row">
                  <span class="lbl">預估總金額</span>
                  <span class="val font-bold">NT$ {{ Number(booking.total_amount).toLocaleString() }}</span>
                </div>
                <div class="info-row">
                  <span class="lbl">50% 應付定金</span>
                  <span class="val text-gold font-bold">NT$ {{ Number(booking.deposit_amount).toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <div v-if="booking.special_requests" class="section-card">
              <h4 class="sec-title">
                <MessageSquare :size="16" class="text-gold" />
                <span>旅客備註 / 特殊需求</span>
              </h4>
              <p class="requests-text">{{ booking.special_requests }}</p>
            </div>
          </div>
        </div>

        <!-- 底部快捷操作 -->
        <div class="modal-footer">
          <button 
            v-if="booking.deposit_status !== 'PAID'"
            class="btn-action-paid"
            @click="emit('confirm-paid', booking)"
          >
            <CheckCircle2 :size="16" />
            <span>標記定金已收到 (PAID)</span>
          </button>
          <button class="btn-close-modal" @click="closeModal">關閉視窗</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 560px;
  background: #151f32;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 10px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .badge-order-id {
      font-family: monospace;
      padding: 0.2rem 0.6rem;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid rgba(212, 175, 55, 0.35);
      color: var(--gold-light, #f3e5ab);
      border-radius: 4px;
      font-size: 0.8rem;
    }

    h3 {
      font-size: 1.1rem;
      margin: 0;
      color: #f8fafc;
    }
  }

  .btn-close {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    &:hover { color: #fff; }
  }
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.status-summary-bar {
  display: flex;
  gap: 1rem;
  padding: 0.85rem 1rem;
  background: #0d131f;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);

  .s-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.85rem;

    .s-label { color: #94a3b8; }
  }
}

.status-tag {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  &.confirmed { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
  &.cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; }
  &.pending { background: rgba(234, 179, 8, 0.15); color: #facc15; }
}

.deposit-tag {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;

  &.paid { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
  &.unpaid { background: rgba(239, 68, 68, 0.15); color: #f87171; }
}

.section-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  padding: 1rem;

  .sec-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #f1f5f9;
    margin: 0 0 0.75rem 0;
    .text-gold { color: var(--gold-primary, #d4af37); }
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem 1rem;
    font-size: 0.85rem;

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.25rem 0;

      .lbl { color: #94a3b8; }
      .val { color: #e2e8f0; }
      .font-mono { font-family: monospace; }
      .font-bold { font-weight: 600; }
      .text-gold { color: var(--gold-primary, #d4af37); }
    }
  }

  .requests-text {
    margin: 0;
    font-size: 0.85rem;
    color: #cbd5e1;
    line-height: 1.5;
    background: #0d131f;
    padding: 0.6rem 0.85rem;
    border-radius: 4px;
  }
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;

  .btn-action-paid {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1rem;
    background: #22c55e;
    color: #0d131f;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    &:hover { background: #16a34a; color: #fff; }
  }

  .btn-close-modal {
    padding: 0.55rem 1rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #cbd5e1;
    border-radius: 6px;
    font-size: 0.85rem;
    cursor: pointer;
    &:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
  }
}
</style>
