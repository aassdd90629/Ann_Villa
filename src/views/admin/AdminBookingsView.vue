<script setup>
import { ref, onMounted } from 'vue'
import { getAdminBookings, updateAdminBooking, clearTestBookings } from '../../services/adminService'
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  RefreshCw, 
  Trash2, 
  AlertTriangle, 
  CreditCard 
} from 'lucide-vue-next'
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal.vue'

const bookings = ref([])
const isLoading = ref(false)
const selectedBooking = ref(null)
const isDetailModalOpen = ref(false)
const statusMessage = ref('')

const fetchBookings = async () => {
  isLoading.value = true
  try {
    const res = await getAdminBookings()
    bookings.value = res.bookings || []
  } catch (err) {
    console.error('取得訂單失敗:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchBookings()
})

const openDetail = (b) => {
  selectedBooking.value = b
  isDetailModalOpen.value = true
}

const handleMarkDepositPaid = async (b) => {
  if (!confirm(`確定已確認收到旅客【${b.guest_name}】的 50% 定金 (NT$ ${Number(b.deposit_amount).toLocaleString()}) 嗎？\n系統將自動把訂單狀態轉為【已確認 (CONFIRMED)】。`)) {
    return
  }

  try {
    await updateAdminBooking(b.id, {
      depositStatus: 'PAID',
      status: 'CONFIRMED'
    })
    statusMessage.value = `訂單 ${b.id} 定金已成功核銷，狀態轉為正式確認！`
    if (selectedBooking.value && selectedBooking.value.id === b.id) {
      selectedBooking.value.deposit_status = 'PAID'
      selectedBooking.value.status = 'CONFIRMED'
    }
    await fetchBookings()
  } catch (err) {
    alert('更新失敗: ' + err.message)
  }
}

const handleClearTestBookings = async () => {
  if (!confirm('⚠️ 警告：這將會清除「所有直訂測試單」並將檔期恢復為空房！\n通常用於 Demo 驗收完畢後還原乾淨日曆，確定要清除嗎？')) {
    return
  }

  try {
    const res = await clearTestBookings()
    statusMessage.value = `測試資料清理成功！已清除 ${res.deletedCount || 0} 筆測試訂單，日曆已全面還原純淨！`
    await fetchBookings()
  } catch (err) {
    alert('清理失敗: ' + err.message)
  }
}
</script>

<template>
  <div class="admin-bookings-view">
    <div class="view-header">
      <div>
        <h1 class="view-title">直訂單管理與定金核銷</h1>
        <p class="view-desc">審核線上預約直訂單、核對匯款後五碼並確認 50% 定金到帳</p>
      </div>

      <div class="header-actions">
        <!-- 專屬 Demo 驗收清理按鈕 -->
        <button class="btn-clear-test" @click="handleClearTestBookings" title="Demo 結束後一鍵清空測試預約">
          <Trash2 :size="15" />
          <span>一鍵清空測試訂單</span>
        </button>

        <button class="btn-refresh" @click="fetchBookings" :disabled="isLoading">
          <RefreshCw :size="15" :class="{ 'spin-anim': isLoading }" />
          <span>重新整理</span>
        </button>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="statusMessage" class="alert-success">
      <CheckCircle2 :size="16" />
      <span>{{ statusMessage }}</span>
    </div>

    <!-- 訂單列表表格 -->
    <div class="table-container">
      <div class="table-bar">
        <div class="bar-title">
          <FileText :size="18" class="text-gold" />
          <span>全部直訂單 (共 {{ bookings.length }} 筆)</span>
        </div>
      </div>

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
            <th class="text-right">操作</th>
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
                <span class="guest-name">{{ b.guest_name }}</span>
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
              <span class="tag-deposit" :class="b.deposit_status === 'PAID' ? 'paid' : 'unpaid'">
                {{ b.deposit_status === 'PAID' ? '定金已付' : '待付定金' }}
              </span>
            </td>
            <td>
              <span class="tag-status" :class="b.status?.toLowerCase()">
                {{ b.status === 'CONFIRMED' ? '已確認' : (b.status === 'CANCELLED' ? '已取消' : '待確認') }}
              </span>
            </td>
            <td class="text-right actions-cell">
              <button 
                v-if="b.deposit_status !== 'PAID'"
                class="btn-pay-sm" 
                @click="handleMarkDepositPaid(b)"
                title="確認定金入帳"
              >
                <CheckCircle2 :size="13" />
                <span>收定</span>
              </button>
              <button class="btn-view-sm" @click="openDetail(b)" title="查看詳細資料">
                <Eye :size="13" />
                <span>詳情</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 訂單詳細彈窗 -->
    <AdminOrderDetailModal 
      v-model="isDetailModalOpen" 
      :booking="selectedBooking" 
      @confirm-paid="handleMarkDepositPaid" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-bookings-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  .view-title {
    font-size: 1.4rem;
    font-weight: 600;
    color: #f8fafc;
    margin: 0 0 0.35rem 0;
  }
  .view-desc {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .btn-clear-test {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 0.95rem;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: rgba(239, 68, 68, 0.25); }
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #e2e8f0;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  }
}

.alert-success {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
  border-radius: 6px;
  font-size: 0.85rem;
}

.table-container {
  background: #151f32;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;

  .table-bar {
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .bar-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #f1f5f9;
      font-size: 0.95rem;
      .text-gold { color: var(--gold-primary, #d4af37); }
    }
  }
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.85rem;

  th {
    padding: 0.85rem 1.25rem;
    background: rgba(0, 0, 0, 0.2);
    color: #94a3b8;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  td {
    padding: 0.9rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }

  tr:hover td { background: rgba(255, 255, 255, 0.02); }

  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-mono { font-family: monospace; }
  .text-gold-light { color: var(--gold-light, #f3e5ab); }
  .text-muted { color: #94a3b8; }
  .text-xs { font-size: 0.78rem; }

  .guest-info-cell {
    display: flex;
    flex-direction: column;
    .guest-name { font-weight: 600; color: #f1f5f9; }
    .guest-phone { font-size: 0.75rem; color: #94a3b8; }
  }

  .price-cell {
    display: flex;
    flex-direction: column;
    .total { font-weight: 600; }
    .deposit { font-size: 0.75rem; color: var(--gold-primary, #d4af37); }
  }

  .tag-deposit {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    &.paid { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    &.unpaid { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
  }

  .tag-status {
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    &.confirmed { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
    &.cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    &.pending { background: rgba(234, 179, 8, 0.15); color: #facc15; }
  }

  .actions-cell {
    display: flex;
    justify-content: flex-end;
    gap: 0.4rem;

    .btn-pay-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.3rem 0.6rem;
      background: #22c55e;
      color: #0d131f;
      font-weight: 600;
      border: none;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      &:hover { background: #16a34a; color: #fff; }
    }

    .btn-view-sm {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.3rem 0.6rem;
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      &:hover { background: rgba(255, 255, 255, 0.15); color: #fff; }
    }
  }
}

.spin-anim {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
