<script setup>
import { ref, watch } from 'vue'
import { 
  Building2, 
  CreditCard, 
  Phone, 
  MessageCircle, 
  Clock, 
  ShieldAlert, 
  Save, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-vue-next'
import { useAdminAuth } from '../../../composables/useAdminAuth'

const props = defineProps({
  initialData: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['saved'])
const { isViewer } = useAdminAuth()

const form = ref({
  bank_name: '',
  bank_code: '',
  bank_account: '',
  bank_holder: '',
  phone: '',
  line_id: '',
  line_url: '',
  check_in_time: '15:00',
  check_out_time: '11:00',
  deposit_amount: '3000'
})

const isLoading = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref('success')

watch(() => props.initialData, (newVal) => {
  if (newVal) {
    form.value = {
      bank_name: newVal.bank_name || '台灣銀行',
      bank_code: newVal.bank_code || '004',
      bank_account: newVal.bank_account || '123-456-789012',
      bank_holder: newVal.bank_holder || '山語 Villa',
      phone: newVal.phone || '0909-557-400',
      line_id: newVal.line_id || '@209yrich',
      line_url: newVal.line_url || 'https://line.me/R/ti/p/@209yrich',
      check_in_time: newVal.check_in_time || '15:00',
      check_out_time: newVal.check_out_time || '11:00',
      deposit_amount: newVal.deposit_amount || '3000'
    }
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (isViewer.value) {
    alert('您的身分為唯讀人員，無權限儲存修改。')
    return
  }

  isLoading.value = true
  feedbackMessage.value = ''

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'update_basic_info',
        basicInfo: form.value
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '儲存基本營運資訊失敗')
    }

    feedbackMessage.value = '匯款帳號與基本營運資訊已成功儲存！前台直訂彈窗已即時同步更新。'
    feedbackType.value = 'success'
    emit('saved', form.value)
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="admin-basic-info-tab">
    <!-- 提示回饋條 -->
    <div v-if="feedbackMessage" :class="['alert-box', feedbackType]">
      <CheckCircle v-if="feedbackType === 'success'" :size="16" />
      <AlertCircle v-else :size="16" />
      <span>{{ feedbackMessage }}</span>
    </div>

    <form @submit.prevent="handleSubmit" class="info-form">
      <!-- 區塊一：匯款帳號設定 (直訂單定金收款核心) -->
      <div class="form-section-card">
        <div class="section-card-header">
          <div class="title-row">
            <Building2 :size="18" class="gold-icon" />
            <h3>訂金匯款銀行帳戶資訊</h3>
          </div>
          <span class="header-tip">旅客於官網直訂成功時，彈窗與通知信中顯示之指定匯款帳號</span>
        </div>

        <div class="fields-grid-2">
          <div class="form-item">
            <label class="form-label">銀行名稱</label>
            <input 
              v-model="form.bank_name" 
              type="text" 
              class="form-input" 
              placeholder="例如：台灣銀行、中國信託" 
              required 
            />
          </div>

          <div class="form-item">
            <label class="form-label">銀行代碼 (3 碼)</label>
            <input 
              v-model="form.bank_code" 
              type="text" 
              class="form-input" 
              placeholder="例如：004 或 822" 
              required 
              maxlength="5" 
            />
          </div>

          <div class="form-item">
            <label class="form-label">收款帳號</label>
            <input 
              v-model="form.bank_account" 
              type="text" 
              class="form-input font-mono" 
              placeholder="請輸入完整銀行帳號" 
              required 
            />
          </div>

          <div class="form-item">
            <label class="form-label">戶名</label>
            <input 
              v-model="form.bank_holder" 
              type="text" 
              class="form-input" 
              placeholder="例如：山語 Villa 或業主姓名" 
              required 
            />
          </div>
        </div>
      </div>

      <!-- 區塊二：官方聯絡管道與接待資訊 -->
      <div class="form-section-card">
        <div class="section-card-header">
          <div class="title-row">
            <Phone :size="18" class="gold-icon" />
            <h3>官方聯絡管道與線上客服</h3>
          </div>
          <span class="header-tip">顯示於官網頁尾、導航列與直訂完成導引頁面</span>
        </div>

        <div class="fields-grid-2">
          <div class="form-item">
            <label class="form-label">客服諮詢電話</label>
            <input 
              v-model="form.phone" 
              type="text" 
              class="form-input" 
              placeholder="例如：0909-557-400" 
              required 
            />
          </div>

          <div class="form-item">
            <label class="form-label">官方 LINE ID</label>
            <input 
              v-model="form.line_id" 
              type="text" 
              class="form-input" 
              placeholder="例如：@209yrich" 
              required 
            />
          </div>

          <div class="form-item span-2">
            <label class="form-label">官方 LINE 邀請 / 加好友連結</label>
            <input 
              v-model="form.line_url" 
              type="url" 
              class="form-input font-mono" 
              placeholder="例如：https://line.me/R/ti/p/@209yrich" 
              required 
            />
          </div>
        </div>
      </div>

      <!-- 區塊三：入住退房與保證金規範 -->
      <div class="form-section-card">
        <div class="section-card-header">
          <div class="title-row">
            <Clock :size="18" class="gold-icon" />
            <h3>時間規範與現場押金</h3>
          </div>
          <span class="header-tip">同步於方案頁、入住須知與訂房試算明細</span>
        </div>

        <div class="fields-grid-3">
          <div class="form-item">
            <label class="form-label">入住時間 (Check-in)</label>
            <input 
              v-model="form.check_in_time" 
              type="text" 
              class="form-input" 
              placeholder="15:00" 
              required 
            />
          </div>

          <div class="form-item">
            <label class="form-label">退房時間 (Check-out)</label>
            <input 
              v-model="form.check_out_time" 
              type="text" 
              class="form-input" 
              placeholder="11:00" 
              required 
            />
          </div>

          <div class="form-item">
            <label class="form-label">現場保證金 (押金 NT$)</label>
            <input 
              v-model="form.deposit_amount" 
              type="number" 
              class="form-input" 
              placeholder="3000" 
              required 
              min="0" 
              step="500" 
            />
          </div>
        </div>
      </div>

      <!-- 底部儲存列 -->
      <div class="form-action-bar">
        <button type="submit" class="btn-save-primary" :disabled="isLoading || isViewer">
          <Save v-if="!isLoading" :size="16" />
          <span>{{ isLoading ? '儲存同步中...' : '儲存全站基本營運設定' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.admin-basic-info-tab {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.alert-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.25rem;
  border-radius: 6px;
  font-size: 0.88rem;

  &.success {
    background: rgba(34, 197, 94, 0.12);
    border: 1px solid rgba(34, 197, 94, 0.35);
    color: #22c55e;
  }

  &.error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #ef4444;
  }
}

.info-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section-card {
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  padding: 1.5rem 1.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  .section-card-header {
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

    .title-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.35rem;

      .gold-icon { color: var(--gold-primary, #d4af37); }
      h3 { font-size: 1.1rem; font-weight: 600; color: var(--admin-text-main, #f8fafc); margin: 0; }
    }

    .header-tip {
      font-size: 0.78rem;
      color: var(--admin-text-muted, #94a3b8);
    }
  }
}

.fields-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;

  .span-2 {
    grid-column: 1 / -1;
  }
}

.fields-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  .form-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--admin-text-sub, #cbd5e1);
  }

  .form-input {
    width: 100%;
    padding: 0.75rem 0.9rem;
    background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
    border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25));
    border-radius: 6px;
    color: var(--admin-text-main, #fff);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      border-color: var(--gold-primary, #d4af37);
      box-shadow: 0 0 8px rgba(212, 175, 55, 0.25);
    }

    &.font-mono {
      font-family: monospace;
      letter-spacing: 0.5px;
    }
  }
}

.form-action-bar {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 0;

  .btn-save-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.75rem;
    background: var(--gold-primary, #d4af37);
    border: 1px solid var(--gold-primary, #d4af37);
    border-radius: 6px;
    color: #121415;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background: #dfbc46;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>
