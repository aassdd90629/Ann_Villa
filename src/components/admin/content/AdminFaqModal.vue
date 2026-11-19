<script setup>
import { ref, watch, computed } from 'vue'
import { X, HelpCircle, Check, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  faq: { type: Object, default: null } // 若為 null 則為新增模式
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => Boolean(props.faq && props.faq.key))

const qZh = ref('')
const qEn = ref('')
const aZh = ref('')
const aEn = ref('')
const sortOrder = ref(1)
const isActive = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    if (props.faq) {
      qZh.value = props.faq.qZh || ''
      qEn.value = props.faq.qEn || ''
      aZh.value = props.faq.aZh || ''
      aEn.value = props.faq.aEn || ''
      sortOrder.value = props.faq.sortOrder || 1
      isActive.value = props.faq.isActive !== false
    } else {
      qZh.value = ''
      qEn.value = ''
      aZh.value = ''
      aEn.value = ''
      sortOrder.value = 1
      isActive.value = true
    }
  }
})

const handleClose = () => {
  if (isLoading.value) return
  emit('close')
}

const handleSubmit = async () => {
  errorMessage.value = ''

  if (!qZh.value.trim()) {
    errorMessage.value = '請填寫常見問答題目 (繁中)。'
    return
  }
  if (!aZh.value.trim()) {
    errorMessage.value = '請填寫常見問答解答內容 (繁中)。'
    return
  }

  isLoading.value = true

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const url = '/api/admin/content'
    const method = isEdit.value ? 'PATCH' : 'POST'

    const payload = isEdit.value
      ? {
          action: 'update_faq',
          faq: {
            key: props.faq.key,
            qZh: qZh.value.trim(),
            qEn: qEn.value.trim(),
            aZh: aZh.value.trim(),
            aEn: aEn.value.trim(),
            sortOrder: Number(sortOrder.value) || 1,
            isActive: isActive.value
          }
        }
      : {
          category: 'faq',
          faq: {
            qZh: qZh.value.trim(),
            qEn: qEn.value.trim(),
            aZh: aZh.value.trim(),
            aEn: aEn.value.trim(),
            sortOrder: Number(sortOrder.value) || 1,
            isActive: isActive.value
          }
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
      throw new Error(data.message || '儲存 FAQ 失敗')
    }

    emit('saved')
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
            <HelpCircle :size="20" class="gold-icon" />
            <h3>{{ isEdit ? '編輯常見問答 (FAQ)' : '新增常見問答 (FAQ)' }}</h3>
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

        <!-- 表單 -->
        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">問答題目 (繁中) <span class="required">*</span></label>
            <input 
              v-model="qZh" 
              type="text" 
              class="form-input" 
              placeholder="例如：民宿內有提供烤肉設備嗎？" 
              required 
            />
          </div>

          <div class="form-group">
            <label class="form-label">問答題目 (英文，選填)</label>
            <input 
              v-model="qEn" 
              type="text" 
              class="form-input" 
              placeholder="e.g. Do you provide BBQ facilities?" 
            />
          </div>

          <div class="form-group">
            <label class="form-label">解答內容 (繁中) <span class="required">*</span></label>
            <textarea 
              v-model="aZh" 
              rows="4" 
              class="form-textarea" 
              placeholder="請詳細輸入回覆內容..." 
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">解答內容 (英文，選填)</label>
            <textarea 
              v-model="aEn" 
              rows="3" 
              class="form-textarea" 
              placeholder="English answer description..."
            ></textarea>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">排序權重 (越小排越前)</label>
              <input 
                v-model="sortOrder" 
                type="number" 
                class="form-input" 
                min="1" 
                max="999" 
              />
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="isActive" />
                <span>立即啟用顯示於前台</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">取消</button>
            <button type="submit" class="btn-confirm" :disabled="isLoading">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '儲存中...' : (isEdit ? '儲存變更' : '新增問答') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

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
  max-width: 540px;
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
  gap: 1.1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .form-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--admin-text-sub, #cbd5e1);
    .required { color: #ef4444; margin-left: 0.2rem; }
  }

  .form-input, .form-textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
    border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25));
    border-radius: 6px;
    color: var(--admin-text-main, #fff);
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:focus { border-color: var(--gold-primary, #d4af37); box-shadow: 0 0 8px rgba(212, 175, 55, 0.25); }
  }

  .form-textarea { resize: vertical; line-height: 1.5; }
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: center;

  .checkbox-group {
    padding-top: 1.4rem;
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--admin-text-sub, #cbd5e1);
      cursor: pointer;
      input[type="checkbox"] { accent-color: var(--gold-primary, #d4af37); }
    }
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.75rem;
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
