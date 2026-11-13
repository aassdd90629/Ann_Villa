<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { login, isLoading, errorMessage } = useAdminAuth()

const username = ref('admin')
const password = ref('')
const localError = ref('')

const handleLogin = async () => {
  localError.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    localError.value = '請完整輸入管家帳號與密碼'
    return
  }

  const success = await login(username.value.trim(), password.value.trim())
  if (success) {
    const redirectUrl = route.query.redirect || '/admin'
    router.push(redirectUrl)
  }
}
</script>

<template>
  <div class="admin-login-wrapper">
    <div class="login-card">
      <div class="brand-header">
        <div class="brand-badge">
          <ShieldCheck :size="14" />
          <span>MANAGEMENT PORTAL</span>
        </div>
        <h1 class="brand-title">山語 Villa</h1>
        <p class="brand-subtitle">尊榮管家與營運管理控制台</p>
      </div>

      <div v-if="localError || errorMessage" class="alert-box error">
        <AlertCircle :size="16" class="flex-shrink-0" />
        <span>{{ localError || errorMessage }}</span>
      </div>

      <div v-if="route.query.expired" class="alert-box warning">
        <AlertCircle :size="16" class="flex-shrink-0" />
        <span>登入時效已過期，請重新登入管理員帳號。</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-item">
          <label class="form-label">管家帳號 / USERNAME</label>
          <div class="input-wrapper">
            <User :size="18" class="input-icon" />
            <input 
              v-model="username" 
              type="text" 
              class="form-input" 
              placeholder="請輸入帳號" 
              autocomplete="username"
              required 
            />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">管理密碼 / PASSWORD</label>
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input 
              v-model="password" 
              type="password" 
              class="form-input" 
              placeholder="請輸入密碼" 
              autocomplete="current-password"
              required 
            />
          </div>
        </div>

        <button 
          type="submit" 
          class="btn-login" 
          :disabled="isLoading"
        >
          <span v-if="!isLoading">驗證並登入後台</span>
          <span v-else>正在校驗身分...</span>
          <ArrowRight v-if="!isLoading" :size="18" />
        </button>
      </form>

      <div class="login-footer">
        <p>山語 Villa 官方管理系統 ｜ 嚴格授權訪問</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #151f32 0%, #0a0e17 100%);
  padding: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: rgba(22, 32, 50, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 20px rgba(212, 175, 55, 0.1);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--gold-primary, #d4af37), transparent);
    border-radius: 12px 12px 0 0;
  }
}

.brand-header {
  text-align: center;
  margin-bottom: 2rem;

  .brand-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.75rem;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.3);
    color: var(--gold-primary, #d4af37);
    font-size: 0.75rem;
    letter-spacing: 1.5px;
    border-radius: 20px;
    margin-bottom: 0.75rem;
  }

  .brand-title {
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: 4px;
    color: var(--gold-light, #f3e5ab);
    margin: 0 0 0.4rem 0;
  }

  .brand-subtitle {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 0;
    letter-spacing: 0.5px;
  }
}

.alert-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  line-height: 1.4;

  &.error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #f87171;
  }

  &.warning {
    background: rgba(234, 179, 8, 0.12);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #facc15;
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .form-label {
      font-size: 0.78rem;
      letter-spacing: 1px;
      color: #cbd5e1;
      font-weight: 500;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 1rem;
        color: #64748b;
        pointer-events: none;
      }

      .form-input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 2.75rem;
        background: rgba(13, 19, 31, 0.8);
        border: 1px solid rgba(212, 175, 55, 0.25);
        border-radius: 6px;
        color: #fff;
        font-size: 0.95rem;
        outline: none;
        transition: all 0.25s ease;

        &:focus {
          border-color: var(--gold-primary, #d4af37);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
          background: rgba(13, 19, 31, 0.95);
        }
      }
    }
  }

  .btn-login {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.9rem;
    margin-top: 0.5rem;
    background: linear-gradient(135deg, #d4af37 0%, #b89327 100%);
    border: none;
    border-radius: 6px;
    color: #0d131f;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 1.5px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #dfbc46 0%, #c49c30 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.35);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.75rem;
  color: #64748b;
  letter-spacing: 0.5px;
}
</style>
