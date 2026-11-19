<script setup>
import { ref, watch } from 'vue'
import { X, Edit3, Check, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  mediaItem: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const titleZh = ref('')
const titleEn = ref('')
const tagZh = ref('')
const tagEn = ref('')
const sortOrder = ref(1)
const isLoading = ref(false)
const errorMessage = ref('')

watch(() => props.show, (newVal) => {
  if (newVal && props.mediaItem) {
    titleZh.value = props.mediaItem.titleZh || ''
    titleEn.value = props.mediaItem.titleEn || ''
    tagZh.value = props.mediaItem.tagZh || ''
    tagEn.value = props.mediaItem.tagEn || ''
    sortOrder.value = props.mediaItem.sortOrder || 1
    errorMessage.value = ''
  }
})

const handleClose = () => {
  if (isLoading.value) return
  emit('close')
}

const handleSubmit = async () => {
  if (!titleZh.value.trim()) {
    errorMessage.value = '請填寫圖片標題或描述。'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'update',
        id: props.mediaItem.id,
        titleZh: titleZh.value.trim(),
        titleEn: titleEn.value.trim(),
        tagZh: tagZh.value.trim(),
        tagEn: tagEn.value.trim(),
        sortOrder: Number(sortOrder.value) || 1
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '更新失敗')
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
        <div class="modal-header">
          <div class="header-title-group">
            <Edit3 :size="18" class="gold-icon" />
            <h3>編輯圖片資訊</h3>
          </div>
          <button type="button" class="btn-close" @click="handleClose" :disabled="isLoading">
            <X :size="18" />
          </button>
        </div>

        <div v-if="errorMessage" class="modal-alert error">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 圖片縮圖卡片 -->
        <div class="preview-mini-card">
          <img :src="mediaItem?.cdnUrl" :alt="mediaItem?.titleZh" class="mini-img" />
          <div class="mini-info">
            <span class="mini-id">{{ mediaItem?.id }}</span>
            <span class="mini-dim">{{ mediaItem?.width }} × {{ mediaItem?.height }} px</span>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label class="form-label">圖片標題 / 描述 (繁中) <span class="required">*</span></label>
            <input v-model="titleZh" type="text" class="form-input" required />
          </div>

          <div class="form-group">
            <label class="form-label">圖片標題 (英文，選填)</label>
            <input v-model="titleEn" type="text" class="form-input" />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">空間標籤 (Tag 繁中)</label>
              <input v-model="tagZh" type="text" class="form-input" placeholder="例如：壯闊雲海" />
            </div>

            <div class="form-group">
              <label class="form-label">排序權重 (數字越小越前)</label>
              <input v-model="sortOrder" type="number" class="form-input" min="1" max="999" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">取消</button>
            <button type="submit" class="btn-confirm" :disabled="isLoading">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '儲存中...' : '儲存變更' }}</span>
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
  max-width: 480px;
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

.preview-mini-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1.5rem;
  background: var(--admin-bg-base, rgba(0, 0, 0, 0.25));
  border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.06));

  .mini-img {
    width: 60px;
    height: 40px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.1));
  }

  .mini-info {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    .mini-id { font-family: monospace; font-size: 0.75rem; color: var(--gold-primary, #d4af37); }
    .mini-dim { font-size: 0.72rem; color: var(--admin-text-muted, #94a3b8); }
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

  .form-input {
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
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
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
