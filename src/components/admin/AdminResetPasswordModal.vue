<script setup>
import { ref, watch } from 'vue'
import { X, KeyRound, Sparkles, AlertCircle, Check } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const copySuccess = ref(false)

watch(() => props.show, (newVal) => {
  if (newVal) {
    password.value = ''
    confirmPassword.value = ''
    errorMessage.value = ''
    copySuccess.value = false
  }
})

const handleClose = () => {
  if (isLoading.value) return
  emit('close')
}

// 快速產生 10 位英數高強度隨機密碼小工具
const handleGenerateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  password.value = result
  confirmPassword.value = result
  copySuccess.value = false
}

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!password.value || password.value.length < 6) {
    errorMessage.value = '新密碼長度不得少於 6 個字元。'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '兩次輸入的新密碼不一致，請重新檢查。'
    return
  }

  isLoading.value = true

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id: props.user.id,
        password: password.value
      })
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.message || '重設密碼失敗，請稍後再試。')
    }

    emit('saved', { id: props.user.id, username: props.user.username })
    emit('close')
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="admin-modal-overlay" @click.self="handleClose">
      <div class="admin-modal-container">
        <!-- 頂部標題 -->
        <div class="modal-header">
          <div class="header-title-group">
            <KeyRound :size="20" class="gold-icon" />
            <h3>重設管家安全密碼</h3>
          </div>
          <button type="button" class="btn-close" @click="handleClose" :disabled="isLoading">
            <X :size="18" />
          </button>
        </div>

        <!-- 提示目標管家 -->
        <div class="target-user-banner">
          <span class="banner-label">目標管家：</span>
          <span class="user-name">{{ user?.displayName }}</span>
          <code class="user-username">(@{{ user?.username }})</code>
        </div>

        <!-- 錯誤提示 -->
        <div v-if="errorMessage" class="modal-alert error">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <div class="label-row">
              <label class="form-label">輸入新密碼</label>
              <button 
                type="button" 
                class="btn-generate" 
                @click="handleGenerateRandomPassword"
                title="自動產生隨機安全密碼"
              >
                <Sparkles :size="13" />
                <span>自動生成安全密碼</span>
              </button>
            </div>
            <input 
              v-model="password" 
              type="text" 
              class="form-input" 
              placeholder="請輸入至少 6 位新密碼" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">再次確認新密碼</label>
            <input 
              v-model="confirmPassword" 
              type="text" 
              class="form-input" 
              placeholder="請再次輸入相同密碼" 
              required 
            />
          </div>

          <!-- 底部按鈕 -->
          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">
              取消
            </button>
            <button type="submit" class="btn-confirm" :disabled="isLoading">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '密碼加密更新中...' : '確認重設密碼' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.admin-modal-container {
  width: 100%;
  max-width: 440px;
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.35));
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

  .header-title-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    .gold-icon {
      color: var(--gold-primary, #d4af37);
    }

    h3 {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--admin-text-main, #f8fafc);
      margin: 0;
    }
  }

  .btn-close {
    background: transparent;
    border: none;
    color: var(--admin-text-muted, #94a3b8);
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      color: var(--admin-text-main, #fff);
      background: var(--admin-tr-hover, rgba(255, 255, 255, 0.08));
    }
  }
}

.target-user-banner {
  padding: 0.85rem 1.5rem;
  background: rgba(212, 175, 55, 0.08);
  border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.06));
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;

  .banner-label {
    color: var(--admin-text-muted, #94a3b8);
  }

  .user-name {
    font-weight: 600;
    color: var(--gold-primary, #d4af37);
  }

  .user-username {
    font-family: monospace;
    color: var(--admin-text-sub, #cbd5e1);
  }
}

.modal-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  margin: 1rem 1.5rem 0;
  border-radius: 6px;
  font-size: 0.85rem;

  &.error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
}

.modal-form {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .btn-generate {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid rgba(212, 175, 55, 0.3);
      color: var(--gold-primary, #d4af37);
      border-radius: 4px;
      padding: 0.2rem 0.5rem;
      font-size: 0.72rem;
      cursor: pointer;

      &:hover {
        background: rgba(212, 175, 55, 0.25);
      }
    }
  }

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
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

  .btn-cancel {
    padding: 0.65rem 1.25rem;
    background: transparent;
    border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.2));
    border-radius: 6px;
    color: var(--admin-text-sub, #cbd5e1);
    font-size: 0.85rem;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05));
      color: var(--admin-text-main, #fff);
    }
  }

  .btn-confirm {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.65rem 1.4rem;
    background: var(--gold-primary, #d4af37);
    border: 1px solid var(--gold-primary, #d4af37);
    border-radius: 6px;
    color: #121415;
    font-weight: 600;
    font-size: 0.85rem;
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
