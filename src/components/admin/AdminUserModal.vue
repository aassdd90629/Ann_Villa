<script setup>
import { ref, watch, computed } from 'vue'
import { X, User, KeyRound, AlertCircle, Check } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  user: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => Boolean(props.user && props.user.id))

const username = ref('')
const displayName = ref('')
const password = ref('')
const role = ref('CONCIERGE')
const isLoading = ref(false)
const errorMessage = ref('')

const rolesList = [
  {
    id: 'SUPERADMIN',
    badge: '👑 超級管理員',
    desc: '全權控制：調整房價與連假、新增與管理所有人員帳號、查閱全部審計日誌。'
  },
  {
    id: 'CONCIERGE',
    badge: '🛎️ 駐館管家',
    desc: '日常營運：房態日曆、直訂單定金核銷、手動關房維護。（嚴禁修改房價與人員）'
  },
  {
    id: 'VIEWER',
    badge: '👀 房務唯讀',
    desc: '查閱資訊：即時房態日曆與今日入住旅客名單。（純唯讀，禁止任何點擊修改）'
  }
]

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    if (props.user) {
      username.value = props.user.username || ''
      displayName.value = props.user.displayName || ''
      role.value = props.user.role || 'CONCIERGE'
      password.value = ''
    } else {
      username.value = ''
      displayName.value = ''
      password.value = ''
      role.value = 'CONCIERGE'
    }
  }
})

const handleClose = () => {
  if (isLoading.value) return
  emit('close')
}

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!isEdit.value) {
    if (!username.value.trim()) {
      errorMessage.value = '請填寫管家登入帳號。'
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username.value.trim().toLowerCase())) {
      errorMessage.value = '帳號僅允許 3~30 個英數字或底線。'
      return
    }
    if (!password.value || password.value.length < 6) {
      errorMessage.value = '初始密碼長度不得少於 6 個字元。'
      return
    }
  }

  if (!displayName.value.trim()) {
    errorMessage.value = '請填寫管家姓名或稱謂。'
    return
  }

  isLoading.value = true

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const url = '/api/admin/users'
    const method = isEdit.value ? 'PATCH' : 'POST'

    const payload = isEdit.value
      ? {
          id: props.user.id,
          displayName: displayName.value.trim(),
          role: role.value
        }
      : {
          username: username.value.trim().toLowerCase(),
          displayName: displayName.value.trim(),
          password: password.value,
          role: role.value
        }

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.message || '儲存失敗，請重新再試。')
    }

    emit('saved', data.user || payload)
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
        <!-- 彈窗頂部標題 -->
        <div class="modal-header">
          <div class="header-title-group">
            <User :size="20" class="gold-icon" />
            <h3>{{ isEdit ? '編輯管家資料與權限' : '新增管家工作帳號' }}</h3>
          </div>
          <button type="button" class="btn-close" @click="handleClose" :disabled="isLoading">
            <X :size="18" />
          </button>
        </div>

        <!-- 錯誤提示 -->
        <div v-if="errorMessage" class="modal-alert error">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 表單主體 -->
        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">
              <span>登入帳號 (Username)</span>
              <span v-if="!isEdit" class="label-note">僅允許英文小寫、數字與底線</span>
            </label>
            <input 
              v-if="!isEdit"
              v-model="username" 
              type="text" 
              class="form-input" 
              placeholder="例如：concierge_lee" 
              required 
              autocomplete="off"
            />
            <div v-else class="form-static-value">
              <code>{{ username }}</code>
              <span class="static-note">（帳號建立後不可變更）</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span>管家稱謂 / 顯示姓名</span>
              <span class="label-note">後台頂部與日誌操作者標籤</span>
            </label>
            <input 
              v-model="displayName" 
              type="text" 
              class="form-input" 
              placeholder="例如：管家小李、阿芬" 
              required 
              maxlength="40"
            />
          </div>

          <div v-if="!isEdit" class="form-group">
            <label class="form-label">
              <span>初始登入安全密碼</span>
              <span class="label-note">至少 6 個字元</span>
            </label>
            <div class="input-with-icon">
              <KeyRound :size="16" class="field-icon" />
              <input 
                v-model="password" 
                type="text" 
                class="form-input has-icon" 
                placeholder="請輸入初始登入密碼" 
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span>權限角色 (RBAC Role)</span>
            </label>
            <div class="role-cards-grid">
              <label 
                v-for="r in rolesList" 
                :key="r.id" 
                class="role-card" 
                :class="{ selected: role === r.id }"
              >
                <div class="card-radio-row">
                  <input type="radio" name="modal_user_role" :value="r.id" v-model="role" />
                  <span class="role-badge-text">{{ r.badge }}</span>
                </div>
                <p class="role-card-desc">{{ r.desc }}</p>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">取消</button>
            <button type="submit" class="btn-confirm" :disabled="isLoading">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '資料儲存中...' : (isEdit ? '儲存變更' : '建立帳號') }}</span>
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
  max-width: 520px;
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
    .gold-icon { color: var(--gold-primary, #d4af37); }
    h3 { font-size: 1.15rem; font-weight: 600; color: var(--admin-text-main, #f8fafc); margin: 0; }
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
    &:hover:not(:disabled) { color: var(--admin-text-main, #fff); background: var(--admin-tr-hover, rgba(255, 255, 255, 0.08)); }
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
  &.error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
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

  .form-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--admin-text-sub, #cbd5e1);
    .label-note { font-size: 0.72rem; color: var(--admin-text-muted, #94a3b8); font-weight: normal; }
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
    &:focus { border-color: var(--gold-primary, #d4af37); box-shadow: 0 0 8px rgba(212, 175, 55, 0.25); }
  }

  .form-static-value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 0.9rem;
    background: var(--admin-bg-base, rgba(0, 0, 0, 0.2));
    border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));
    border-radius: 6px;
    code { font-family: monospace; font-weight: 600; color: var(--gold-primary, #d4af37); font-size: 0.95rem; }
    .static-note { font-size: 0.78rem; color: var(--admin-text-muted, #94a3b8); }
  }

  .input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
    .field-icon { position: absolute; left: 0.85rem; color: var(--admin-text-muted, #94a3b8); pointer-events: none; }
    .form-input.has-icon { padding-left: 2.5rem; }
  }
}

.role-cards-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .role-card {
    padding: 0.85rem 1rem;
    background: var(--admin-bg-base, rgba(13, 19, 31, 0.6));
    border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: 6px;
    cursor: pointer;
    transition: border-color 0.2s ease, background-color 0.2s ease;
    &:hover { border-color: rgba(212, 175, 55, 0.35); background: var(--admin-tr-hover, rgba(255, 255, 255, 0.03)); }
    &.selected { border-color: var(--gold-primary, #d4af37); background: rgba(212, 175, 55, 0.1); }

    .card-radio-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.25rem;
      input[type="radio"] { accent-color: var(--gold-primary, #d4af37); cursor: pointer; }
      .role-badge-text { font-size: 0.85rem; font-weight: 600; color: var(--admin-text-main, #f8fafc); }
    }

    .role-card-desc {
      font-size: 0.75rem;
      color: var(--admin-text-muted, #94a3b8);
      margin: 0;
      padding-left: 1.6rem;
      line-height: 1.4;
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
    &:hover:not(:disabled) { background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05)); color: var(--admin-text-main, #fff); }
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
    &:hover:not(:disabled) { background: #dfbc46; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}
</style>
