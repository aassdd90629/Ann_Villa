<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useTheme } from '../../composables/useTheme'
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const { login, isLoading, errorMessage } = useAdminAuth()
const { theme, toggleTheme } = useTheme()

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
    <!-- 右上角晨曦/夜景切換鈕 -->
    <button 
      type="button" 
      @click="toggleTheme" 
      class="login-theme-toggle" 
      :title="theme === 'light' ? '切換為夜景模式 (Dark Mode)' : '切換為晨曦模式 (Light Mode)'"
      aria-label="Toggle theme"
    >
      <Moon v-if="theme === 'light'" :size="16" />
      <Sun v-else :size="16" />
      <span>{{ theme === 'light' ? '夜景模式' : '晨曦模式' }}</span>
    </button>

    <div class="login-card">
      <div class="brand-header">
        <div class="brand-badge">
          <ShieldCheck :size="14" />
          <span>MANAGEMENT PORTAL</span>
        </div>
        <h1 class="brand-title">山語 Villa</h1>
        <p class="brand-subtitle">尊榮管家與營運管理控制台</p>
      </div>

      <!-- 錯誤提示條 -->
      <div v-if="localError || errorMessage" class="alert-box error">
        <AlertCircle :size="16" />
        <span>{{ localError || errorMessage }}</span>
      </div>

      <!-- Demo 展示提示 -->
      <div class="alert-box warning">
        <Lock :size="16" />
        <span>展示驗收預設密碼：<code>ryan1123_Ann</code></span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-item">
          <label class="form-label">管家管理員帳號</label>
          <div class="input-wrapper">
            <User :size="18" class="input-icon" />
            <input 
              v-model="username" 
              type="text" 
              class="form-input" 
              placeholder="請輸入管家帳號" 
              required 
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">管理安全密碼</label>
          <div class="input-wrapper">
            <Lock :size="18" class="input-icon" />
            <input 
              v-model="password" 
              type="password" 
              class="form-input" 
              placeholder="請輸入密碼" 
              required 
              autocomplete="current-password"
            />
          </div>
        </div>

        <button type="submit" class="btn-login" :disabled="isLoading">
          <span>{{ isLoading ? '身分驗證中...' : '登入管家後台' }}</span>
          <ArrowRight :size="18" />
        </button>
      </form>

      <div class="login-footer">
        <span>Shan Yu Villa &copy; 2026 Management System</span>
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
  background: var(--admin-bg-base, #0d131f);
  padding: 1.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang TC", "Microsoft JhengHei", sans-serif;
  position: relative;
  transition: background-color 0.3s ease;
}

.login-theme-toggle {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.3));
  color: var(--admin-text-main, #e2e8f0);
  border-radius: 20px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: var(--gold-primary, #d4af37);
    color: var(--gold-primary, #d4af37);
  }
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--admin-bg-card, rgba(22, 32, 50, 0.85));
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.3));
  border-radius: 12px;
  padding: 2.5rem 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(212, 175, 55, 0.08);
  position: relative;
  transition: background-color 0.3s ease, border-color 0.3s ease;

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
    color: var(--gold-primary, #d4af37);
    margin: 0 0 0.4rem 0;
  }

  .brand-subtitle {
    font-size: 0.85rem;
    color: var(--admin-text-muted, #94a3b8);
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
    color: #dc2626;
  }

  &.warning {
    background: rgba(234, 179, 8, 0.12);
    border: 1px solid rgba(234, 179, 8, 0.3);
    color: #ca8a04;

    code {
      background: rgba(0, 0, 0, 0.15);
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
      font-family: monospace;
      font-weight: 600;
    }
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
      color: var(--admin-text-sub, #cbd5e1);
      font-weight: 500;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 1rem;
        color: var(--admin-text-muted, #64748b);
        pointer-events: none;
      }

      .form-input {
        width: 100%;
        padding: 0.85rem 1rem 0.85rem 2.75rem;
        background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
        border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25));
        border-radius: 6px;
        color: var(--admin-text-main, #fff);
        font-size: 0.95rem;
        outline: none;
        transition: all 0.25s ease;

        &:focus {
          border-color: var(--gold-primary, #d4af37);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
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
    background: var(--gold-primary, #d4af37);
    border: none;
    border-radius: 6px;
    color: #121415;
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 1.5px;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover:not(:disabled) {
      background: #dfbc46;
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
  color: var(--admin-text-muted, #64748b);
  letter-spacing: 0.5px;
}

@media (max-width: 640px) {
  .admin-login-wrapper {
    padding: 1rem;
  }

  .login-theme-toggle {
    top: 1rem;
    right: 1rem;
    padding: 0.4rem 0.6rem;

    span {
      display: none;
    }
  }

  .login-card {
    padding: 2rem 1.25rem;
  }
}
</style>
