<script setup>
import { ref, watch } from 'vue'
import {
  X, User, Calendar, MessageSquare, CheckCircle2,
  AlertTriangle, Edit3, RotateCcw, Trash2, Save
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  booking: { type: Object, default: null },
  isSubmitting: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:modelValue',
  'confirm-paid',
  'cancel-booking',
  'save-booking',
  'reopen-booking'
])

const isEditing = ref(false)
const isConfirmingCancel = ref(false)
const editForm = ref({
  guestName: '',
  guestPhone: '',
  guestEmail: '',
  lineId: '',
  guestCount: 14,
  depositStatus: 'UNPAID',
  status: 'PENDING',
  specialRequests: ''
})

watch(
  () => props.booking,
  (b) => {
    isEditing.value = false
    isConfirmingCancel.value = false
    if (b) {
      editForm.value = {
        guestName: b.guest_name || '',
        guestPhone: b.guest_phone || '',
        guestEmail: b.guest_email || '',
        lineId: b.line_id || '',
        guestCount: b.guest_count || 14,
        depositStatus: b.deposit_status || 'UNPAID',
        status: b.status || 'PENDING',
        specialRequests: b.special_requests || ''
      }
    }
  },
  { immediate: true }
)

const closeModal = () => {
  if (!props.isSubmitting) {
    isEditing.value = false
    isConfirmingCancel.value = false
    emit('update:modelValue', false)
  }
}

const handleStartEdit = () => {
  isConfirmingCancel.value = false
  isEditing.value = true
}

const handleCancelEdit = () => {
  isEditing.value = false
}

const handleSaveEdit = () => {
  emit('save-booking', {
    id: props.booking.id,
    data: { ...editForm.value }
  })
}

const handleExecuteCancel = () => {
  emit('cancel-booking', props.booking)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && booking" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-info">
            <span class="badge-order-tag">官網直訂單</span>
            <h3>預訂詳細與檔期管理</h3>
          </div>
          <button class="btn-close" @click="closeModal" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <!-- 頂部明確提示：包含訂單歸屬與意圖詢問 -->
          <div class="booking-inquiry-banner">
            <div class="banner-title">
              此檔期為 <strong>【{{ booking.guest_name }} 貴賓】</strong> 之官網預訂
            </div>
            <div class="banner-dates">
              預訂區間：<span class="font-mono text-gold-bold">{{ booking.check_in }} 至 {{ booking.check_out }}</span>
              （共 {{ booking.nights }} 晚・{{ booking.guest_count }} 位貴賓）
            </div>
            <p class="banner-question">
              💡 請問您是要<strong>取消此訂單以釋放房態</strong>，還是<strong>修改此訂單內容與狀態</strong>？
            </p>
          </div>

          <!-- 取消確認防呆區塊 -->
          <div v-if="isConfirmingCancel" class="cancel-confirm-alert">
            <div class="alert-head">
              <AlertTriangle :size="18" class="text-danger" />
              <strong>確定要取消【{{ booking.guest_name }} 貴賓】的這筆訂單嗎？</strong>
            </div>
            <p class="alert-desc">
              取消後，【{{ booking.check_in }} 至 {{ booking.check_out }}】將立即變更為空房，前台月曆將開放其他旅客預約！
            </p>
            <div class="alert-actions">
              <button type="button" class="btn-danger-confirm" :disabled="isSubmitting" @click="handleExecuteCancel">
                <Trash2 :size="14" />
                <span>{{ isSubmitting ? '正在取消中...' : '確認取消並釋放檔期' }}</span>
              </button>
              <button type="button" class="btn-abort-confirm" :disabled="isSubmitting" @click="isConfirmingCancel = false">
                <span>暫不取消</span>
              </button>
            </div>
          </div>

          <!-- 模式切換：編輯表單 vs 檢視模式 -->
          <div v-if="isEditing" class="edit-form-wrapper">
            <div class="form-title">
              <Edit3 :size="16" class="text-gold" />
              <span>修改訂單資料與狀態</span>
            </div>
            <div class="form-grid">
              <div class="form-item"><label>訂房姓名</label><input v-model="editForm.guestName" type="text" class="form-input" /></div>
              <div class="form-item"><label>聯絡電話</label><input v-model="editForm.guestPhone" type="text" class="form-input" /></div>
              <div class="form-item"><label>電子信箱</label><input v-model="editForm.guestEmail" type="email" class="form-input" /></div>
              <div class="form-item"><label>LINE ID</label><input v-model="editForm.lineId" type="text" class="form-input" /></div>
              <div class="form-item"><label>入住人數</label><input v-model.number="editForm.guestCount" type="number" min="1" max="20" class="form-input" /></div>
              <div class="form-item">
                <label>訂單狀態</label>
                <select v-model="editForm.status" class="form-select">
                  <option value="PENDING">待確認 (PENDING)</option>
                  <option value="CONFIRMED">已確認 (CONFIRMED)</option>
                  <option value="CANCELLED">已取消 (CANCELLED)</option>
                </select>
              </div>
              <div class="form-item">
                <label>定金付款狀態</label>
                <select v-model="editForm.depositStatus" class="form-select">
                  <option value="UNPAID">待付定金 (UNPAID)</option>
                  <option value="PAID">定金已付 (PAID)</option>
                </select>
              </div>
              <div class="form-item full-width">
                <label>旅客特殊需求 / 管家備註</label>
                <textarea v-model="editForm.specialRequests" rows="3" class="form-textarea"></textarea>
              </div>
            </div>
            <div class="edit-form-actions">
              <button type="button" class="btn-save-edit" :disabled="isSubmitting" @click="handleSaveEdit">
                <Save :size="15" />
                <span>{{ isSubmitting ? '儲存中...' : '儲存修改' }}</span>
              </button>
              <button type="button" class="btn-cancel-edit" :disabled="isSubmitting" @click="handleCancelEdit">
                <RotateCcw :size="14" />
                <span>取消編輯</span>
              </button>
            </div>
          </div>

          <div v-else class="view-content-wrapper">
            <div class="status-summary-bar">
              <div class="s-item">
                <span class="s-label">訂單狀態：</span>
                <span class="status-tag" :class="booking.status?.toLowerCase()">
                  {{ booking.status === 'CONFIRMED' ? '已確認' : (booking.status === 'CANCELLED' ? '已取消 (檔期已釋放)' : '待確認') }}
                </span>
              </div>
              <div class="s-item">
                <span class="s-label">定金狀態：</span>
                <span class="deposit-tag" :class="booking.deposit_status === 'PAID' ? 'paid' : 'unpaid'">
                  {{ booking.deposit_status === 'PAID' ? '定金已付 (PAID)' : '待付定金 (UNPAID)' }}
                </span>
              </div>
              <div v-if="booking.bank_last_5" class="s-item">
                <span class="s-label">旅客回報末五碼：</span>
                <span class="font-mono text-gold-light font-bold">{{ booking.bank_last_5 }}</span>
                <span v-if="booking.payment_reported_at" class="text-xs text-muted" style="margin-left: 0.35rem;">
                  ({{ booking.payment_reported_at }})
                </span>
              </div>
              <div v-if="booking.payment_note" class="s-item full-width">
                <span class="s-label">匯款附言備註：</span>
                <span class="text-sub">{{ booking.payment_note }}</span>
              </div>
            </div>

            <div class="info-sections">
              <div class="section-card">
                <h4 class="sec-title"><User :size="16" class="text-gold" /><span>旅客基本聯絡資訊</span></h4>
                <div class="info-grid">
                  <div class="info-row"><span class="lbl">訂房姓名</span><span class="val font-bold">{{ booking.guest_name }} 貴賓</span></div>
                  <div class="info-row"><span class="lbl">聯絡電話</span><span class="val font-mono">{{ booking.guest_phone }}</span></div>
                  <div class="info-row"><span class="lbl">電子信箱</span><span class="val">{{ booking.guest_email || '未填寫' }}</span></div>
                  <div class="info-row"><span class="lbl">LINE ID</span><span class="val">{{ booking.line_id || '未填寫' }}</span></div>
                </div>
              </div>

              <div class="section-card">
                <h4 class="sec-title"><Calendar :size="16" class="text-gold" /><span>預訂入住細節與金額</span></h4>
                <div class="info-grid">
                  <div class="info-row"><span class="lbl">入住 / 退房日期</span><span class="val font-mono">{{ booking.check_in }} ~ {{ booking.check_out }}</span></div>
                  <div class="info-row"><span class="lbl">晚數與人數</span><span class="val">{{ booking.nights }} 晚・{{ booking.guest_count }} 位</span></div>
                  <div class="info-row"><span class="lbl">預估總金額</span><span class="val font-bold">NT$ {{ Number(booking.total_amount).toLocaleString() }}</span></div>
                  <div class="info-row"><span class="lbl">50% 應付定金</span><span class="val text-gold font-bold">NT$ {{ Number(booking.deposit_amount).toLocaleString() }}</span></div>
                </div>
              </div>

              <div v-if="booking.special_requests" class="section-card">
                <h4 class="sec-title"><MessageSquare :size="16" class="text-gold" /><span>旅客特殊需求與備註</span></h4>
                <p class="requests-text">{{ booking.special_requests }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部快捷動作列 -->
        <div class="modal-footer">
          <template v-if="!isEditing">
            <button type="button" class="btn-action btn-edit" @click="handleStartEdit">
              <Edit3 :size="15" /><span>修改訂單</span>
            </button>
            <button v-if="booking.deposit_status !== 'PAID' && booking.status !== 'CANCELLED'" type="button" class="btn-action btn-paid" @click="emit('confirm-paid', booking)">
              <CheckCircle2 :size="15" /><span>確認收定 (PAID)</span>
            </button>
            <button v-if="booking.status !== 'CANCELLED'" type="button" class="btn-action btn-cancel-order" @click="isConfirmingCancel = true">
              <Trash2 :size="15" /><span>取消整筆訂單 (釋放檔期)</span>
            </button>
            <button v-else type="button" class="btn-action btn-reopen" @click="emit('reopen-booking', booking)">
              <CheckCircle2 :size="15" /><span>恢復為已確認訂單</span>
            </button>
          </template>
          <button type="button" class="btn-close-modal" @click="closeModal">關閉視窗</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px); z-index: 9999;
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.modal-card {
  width: 100%; max-width: 600px; background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
  border-radius: 10px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; max-height: 90vh; overflow: hidden;
}
.modal-header {
  padding: 1.15rem 1.5rem; border-bottom: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex; align-items: center; justify-content: space-between;
  .header-info {
    display: flex; align-items: center; gap: 0.75rem;
    .badge-order-tag {
      padding: 0.2rem 0.55rem; background: rgba(59, 130, 246, 0.12);
      border: 1px solid rgba(59, 130, 246, 0.3); color: #1d4ed8;
      border-radius: 4px; font-size: 0.78rem; font-weight: 600;
    }
    h3 { font-size: 1.05rem; margin: 0; color: var(--admin-text-main, #1A1E1F); }
  }
  .btn-close {
    background: transparent; border: none; color: var(--admin-text-muted, #64748b);
    cursor: pointer; padding: 0.25rem; &:hover { color: var(--admin-text-main, #1A1E1F); }
  }
}
.modal-body {
  padding: 1.25rem 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1.15rem;
}
.booking-inquiry-banner {
  background: var(--admin-bg-base, #F5F3EC); border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
  border-radius: 8px; padding: 1rem 1.15rem; display: flex; flex-direction: column; gap: 0.45rem;
  .banner-title { font-size: 0.95rem; color: var(--admin-text-main, #1A1E1F); strong { color: var(--gold-dark, #91754F); } }
  .banner-dates { font-size: 0.88rem; color: var(--admin-text-sub, #475569); }
  .text-gold-bold { color: var(--gold-dark, #91754F); font-weight: 600; }
  .banner-question {
    margin: 0.3rem 0 0 0; font-size: 0.85rem; color: var(--admin-text-main, #1A1E1F);
    background: var(--admin-bg-card, #FFFFFF); padding: 0.5rem 0.75rem; border-radius: 6px;
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));
  }
}
.cancel-confirm-alert {
  background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 8px; padding: 1rem 1.15rem; display: flex; flex-direction: column; gap: 0.6rem;
  .alert-head { display: flex; align-items: center; gap: 0.5rem; strong { color: #b91c1c; font-size: 0.92rem; } }
  .alert-desc { margin: 0; font-size: 0.85rem; color: var(--admin-text-sub, #475569); line-height: 1.4; }
  .alert-actions {
    display: flex; gap: 0.65rem; margin-top: 0.2rem;
    .btn-danger-confirm {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.45rem 0.9rem;
      background: #dc2626; color: #FFFFFF; border: none; border-radius: 5px;
      font-size: 0.82rem; font-weight: 600; cursor: pointer; &:hover:not(:disabled) { background: #b91c1c; }
    }
    .btn-abort-confirm {
      padding: 0.45rem 0.8rem; background: var(--admin-bg-base, #F5F3EC);
      border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3)); color: var(--admin-text-sub, #475569);
      border-radius: 5px; font-size: 0.82rem; cursor: pointer;
    }
  }
}
.status-summary-bar {
  display: flex; gap: 1.25rem; padding: 0.75rem 1rem; background: var(--admin-bg-base, #F5F3EC);
  border-radius: 6px; border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  .s-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; .s-label { color: var(--admin-text-sub, #475569); } }
}
.status-tag, .deposit-tag {
  padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
  &.confirmed, &.paid { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
  &.cancelled, &.unpaid { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
  &.pending { background: rgba(234, 179, 8, 0.15); color: #ca8a04; }
}
.info-sections { display: flex; flex-direction: column; gap: 0.85rem; }
.section-card {
  background: var(--admin-bg-card, #FFFFFF); border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.25));
  border-radius: 6px; padding: 0.85rem 1rem;
  .sec-title {
    display: flex; align-items: center; gap: 0.45rem; margin: 0 0 0.65rem 0; font-size: 0.88rem;
    color: var(--admin-text-main, #1A1E1F); .text-gold { color: var(--gold-dark, #91754F); }
  }
  .info-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem 1rem;
    @media (max-width: 600px) { grid-template-columns: 1fr; }
  }
  .info-row {
    display: flex; justify-content: space-between; font-size: 0.85rem;
    .lbl { color: var(--admin-text-sub, #475569); } .val { color: var(--admin-text-main, #1A1E1F); }
  }
  .requests-text {
    margin: 0; font-size: 0.85rem; color: var(--admin-text-main, #1A1E1F);
    background: var(--admin-bg-base, #F5F3EC); padding: 0.6rem; border-radius: 4px; line-height: 1.4;
  }
}
.edit-form-wrapper {
  background: var(--admin-bg-base, #F5F3EC); border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35));
  border-radius: 8px; padding: 1.15rem; display: flex; flex-direction: column; gap: 1rem;
  .form-title {
    display: flex; align-items: center; gap: 0.45rem; font-weight: 600; font-size: 0.92rem;
    color: var(--admin-text-main, #1A1E1F); .text-gold { color: var(--gold-dark, #91754F); }
  }
  .form-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;
    @media (max-width: 600px) { grid-template-columns: 1fr; }
    .full-width { grid-column: 1 / -1; }
  }
  .form-item {
    display: flex; flex-direction: column; gap: 0.25rem;
    label { font-size: 0.78rem; font-weight: 500; color: var(--admin-text-sub, #475569); }
    .form-input, .form-select, .form-textarea {
      padding: 0.45rem 0.65rem; border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
      border-radius: 5px; background: var(--admin-bg-card, #FFFFFF); color: var(--admin-text-main, #1A1E1F);
      font-size: 0.85rem; outline: none; &:focus { border-color: var(--gold-dark, #91754F); }
    }
  }
  .edit-form-actions {
    display: flex; gap: 0.65rem; justify-content: flex-end;
    .btn-save-edit {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 1rem;
      background: var(--gold-dark, #91754F); color: #FFFFFF; border: none; border-radius: 5px;
      font-size: 0.85rem; font-weight: 600; cursor: pointer; &:hover:not(:disabled) { background: var(--gold-primary, #C5A880); }
    }
    .btn-cancel-edit {
      display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.9rem;
      background: var(--admin-bg-card, #FFFFFF); border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3));
      color: var(--admin-text-sub, #475569); border-radius: 5px; font-size: 0.85rem; cursor: pointer;
    }
  }
}
.modal-footer {
  padding: 1.1rem 1.5rem; border-top: 1px solid var(--admin-border, rgba(197, 168, 128, 0.2));
  display: flex; gap: 0.65rem; justify-content: flex-end; flex-wrap: wrap;
  .btn-action {
    display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.55rem 0.95rem;
    border-radius: 6px; font-size: 0.82rem; font-weight: 600; cursor: pointer;
    &.btn-edit { background: var(--admin-bg-base, #F5F3EC); border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.35)); color: var(--admin-text-main, #1A1E1F); font-weight: 500; }
    &.btn-paid { background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); color: #16a34a; }
    &.btn-cancel-order { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.35); color: #dc2626; }
    &.btn-reopen { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.35); color: #2563eb; }
  }
  .btn-close-modal {
    padding: 0.55rem 0.95rem; background: var(--admin-bg-base, #F5F3EC);
    border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.3)); color: var(--admin-text-sub, #475569);
    border-radius: 6px; font-size: 0.82rem; cursor: pointer;
  }
}
</style>
