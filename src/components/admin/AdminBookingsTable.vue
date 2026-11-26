<script setup>
import { FileText, Eye, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  bookings: {
    type: Array,
    required: true
  },
  totalCount: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['openDetail', 'confirmPaid'])
</script>

<template>
  <div class="table-container">
    <div class="table-bar">
      <div class="bar-title">
        <FileText :size="18" class="text-gold" />
        <span>全部直訂單 (共 {{ totalCount }} 筆)</span>
        <span class="scroll-hint-text">↔ 可左右滑動</span>
      </div>
    </div>

    <div class="table-responsive-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th>訂單編號</th>
            <th>訂房人</th>
            <th>入住 / 退房日期</th>
            <th>晚數 / 人數</th>
            <th>總金額 / 50% 定金</th>
            <th>定金狀態</th>
            <th>訂單狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="8" class="text-center py-4">正在載入訂單資料...</td>
          </tr>
          <tr v-else-if="bookings.length === 0">
            <td colspan="8" class="text-center py-4 text-muted">目前暫無任何直訂預約單</td>
          </tr>
          <tr v-for="b in bookings" :key="b.id">
            <td class="font-mono text-gold-light">{{ b.id }}</td>
            <td>
              <div class="guest-info-cell">
                <div class="name-line-wrap">
                  <span class="guest-name">{{ b.guest_name }}</span>
                  <span v-if="b.line_user_id" class="badge-line" title="已連動 LINE 官方推播">LINE</span>
                </div>
                <span class="guest-phone">{{ b.guest_phone }}</span>
              </div>
            </td>
            <td class="font-mono text-xs">
              {{ b.check_in }} ~ {{ b.check_out }}
            </td>
            <td>{{ b.nights }} 晚・{{ b.guest_count }} 人</td>
            <td>
              <div class="price-cell">
                <span class="total">NT$ {{ Number(b.total_amount).toLocaleString() }}</span>
                <span class="deposit">定金 NT$ {{ Number(b.deposit_amount).toLocaleString() }}</span>
              </div>
            </td>
            <td>
              <div class="deposit-cell">
                <span class="tag-deposit" :class="b.deposit_status === 'PAID' ? 'paid' : 'unpaid'">
                  {{ b.deposit_status === 'PAID' ? '定金已付' : '待付定金' }}
                </span>
                <div v-if="b.bank_last_5" class="last5-report-tag" title="旅客線上回報末五碼">
                  末五碼: <span class="font-mono text-gold-light font-bold">{{ b.bank_last_5 }}</span>
                  <span v-if="b.hasDuplicateBankLast5" class="tag-duplicate-warning" title="注意：此末五碼在其他未取消訂單中重複出現，請核對入帳金額與匯款時間">
                    ⚠️ 撞號提示
                  </span>
                </div>
              </div>
            </td>
            <td>
              <span class="tag-status" :class="b.status?.toLowerCase()">
                {{ b.status === 'CONFIRMED' ? '已確認' : (b.status === 'CANCELLED' ? '已取消' : '待確認') }}
              </span>
              <div v-if="b.refund_status === 'PENDING'" class="tag-refund-sm pending" title="旅客申請退訂，待匯款退費">
                待退 NT${{ Number(b.refund_amount || 0).toLocaleString() }}
              </div>
              <div v-else-if="b.refund_status === 'COMPLETED'" class="tag-refund-sm completed">
                已退款
              </div>
            </td>
            <td class="actions-cell">
              <button 
                v-if="b.deposit_status !== 'PAID' && b.status !== 'CANCELLED'"
                class="btn-pay-sm" 
                @click="emit('confirmPaid', b)"
                title="確認定金入帳"
              >
                <CheckCircle2 :size="13" />
                <span>收定</span>
              </button>
              <button class="btn-view-sm" @click="emit('openDetail', b)" title="查看詳細資料">
                <Eye :size="13" />
                <span>詳情</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分頁插槽 -->
    <slot name="pagination" />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.table-container {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 0.3s ease, border-color 0.3s ease;

  .table-bar {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));

    .bar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: var(--admin-text-main, #f1f5f9);
      font-size: 0.95rem;
      .text-gold { color: var(--gold-primary, #d4af37); }

      .scroll-hint-text {
        display: none;
        font-size: 0.72rem;
        color: var(--gold-primary, #d4af37);
        background: rgba(212, 175, 55, 0.12);
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 500;
      }
    }
  }
}

.table-responsive-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--admin-border, rgba(212, 175, 55, 0.3));
    border-radius: 3px;
  }
}

.admin-table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
  text-align: center;
  font-size: 0.85rem;

  th {
    padding: 0.85rem 1.25rem;
    background: var(--admin-th-bg, rgba(0, 0, 0, 0.2));
    color: var(--admin-text-sub, #94a3b8);
    font-weight: 500;
    text-align: center;
    vertical-align: middle;
    border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.08));
    white-space: nowrap;
  }

  td {
    padding: 0.9rem 1.25rem;
    text-align: center;
    vertical-align: middle;
    border-bottom: 1px solid var(--admin-border, rgba(255, 255, 255, 0.05));
    color: var(--admin-text-main, #e2e8f0);
  }

  tr:hover td { background: var(--admin-tr-hover, rgba(255, 255, 255, 0.02)); }

  .text-center { text-align: center; }
  .font-mono { font-family: monospace; }
  .text-gold-light { color: var(--gold-primary, #f3e5ab); font-weight: 600; }
  .text-muted { color: var(--admin-text-muted, #94a3b8); }
  .text-xs { font-size: 0.78rem; white-space: nowrap; }

  .guest-info-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    .name-line-wrap {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      .badge-line {
        background: #06c755;
        color: #ffffff;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 0.05rem 0.3rem;
        border-radius: 3px;
        line-height: 1.2;
      }
    }
    .guest-name { font-weight: 600; color: var(--admin-text-main, #f1f5f9); }
    .guest-phone { font-size: 0.75rem; color: var(--admin-text-muted, #94a3b8); }
  }

  .price-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin: 0 auto;
    .total { font-weight: 600; color: var(--admin-text-main); white-space: nowrap; }
    .deposit { font-size: 0.75rem; color: var(--gold-primary, #d4af37); white-space: nowrap; }
  }

  .deposit-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    margin: 0 auto;
  }

  .tag-deposit {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
    &.paid { background: rgba(34, 197, 94, 0.15); color: #16a34a; border: 1px solid rgba(34, 197, 94, 0.3); }
    &.unpaid { background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }
  }

  .last5-report-tag {
    margin-top: 0.35rem;
    font-size: 0.72rem;
    color: var(--gold-primary, #d4af37);
    white-space: nowrap;
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.25);
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    display: inline-block;

    .tag-duplicate-warning {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.68rem;
      font-weight: 700;
      color: #dc2626;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      white-space: nowrap;
    }
  }

  .tag-status {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    white-space: nowrap;
    &.confirmed { background: rgba(34, 197, 94, 0.15); color: #16a34a; }
    &.cancelled { background: rgba(239, 68, 68, 0.15); color: #dc2626; }
    &.pending { background: rgba(234, 179, 8, 0.15); color: #ca8a04; }
  }

  .tag-refund-sm {
    margin-top: 0.25rem;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    font-size: 0.68rem;
    font-weight: 600;
    white-space: nowrap;
    &.pending {
      background: rgba(234, 179, 8, 0.18);
      color: #ca8a04;
      border: 1px solid rgba(234, 179, 8, 0.35);
    }
    &.completed {
      background: rgba(34, 197, 94, 0.18);
      color: #16a34a;
    }
  }

  .actions-cell {
    display: flex;
    justify-content: center;
    gap: 0.4rem;

    .btn-pay-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.3rem 0.6rem;
      background: #16a34a;
      color: #ffffff;
      font-weight: 600;
      border: none;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      &:hover { background: #15803d; }
    }

    .btn-view-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.3rem 0.6rem;
      background: var(--admin-btn-secondary-bg, rgba(255, 255, 255, 0.08));
      color: var(--admin-text-main, #cbd5e1);
      border: 1px solid var(--admin-border, rgba(255, 255, 255, 0.15));
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      &:hover { 
        border-color: var(--gold-primary);
        color: var(--gold-primary);
      }
    }
  }
}

@media (max-width: 768px) {
  .table-container .table-bar {
    padding: 0.75rem 1rem;

    .bar-title .scroll-hint-text {
      display: inline-block;
    }
  }
}
</style>
