<script setup>
import { ref, watch } from 'vue'
import { 
  X, 
  Edit3, 
  Check, 
  AlertCircle, 
  UploadCloud, 
  RotateCcw, 
  Sparkles, 
  RefreshCw 
} from 'lucide-vue-next'

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
const isActive = ref(true)

const previewUrl = ref('')
const isImageReplaced = ref(false)
const newImagePayload = ref(null)
const isCompressing = ref(false)
const fileInputRef = ref(null)

const isLoading = ref(false)
const errorMessage = ref('')

watch(() => props.show, (newVal) => {
  if (newVal && props.mediaItem) {
    titleZh.value = props.mediaItem.titleZh || ''
    titleEn.value = props.mediaItem.titleEn || ''
    tagZh.value = props.mediaItem.tagZh || ''
    tagEn.value = props.mediaItem.tagEn || ''
    sortOrder.value = props.mediaItem.sortOrder || 1
    isActive.value = props.mediaItem.isActive !== false
    previewUrl.value = props.mediaItem.cdnUrl || ''
    isImageReplaced.value = false
    newImagePayload.value = null
    errorMessage.value = ''
  }
})

const handleClose = () => {
  if (isLoading.value || isCompressing.value) return
  emit('close')
}

const triggerFilePicker = () => {
  if (isLoading.value || isCompressing.value) return
  errorMessage.value = ''
  fileInputRef.value?.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (file) processImageFile(file)
  e.target.value = ''
}

const handleFileDrop = (e) => {
  const file = e.dataTransfer?.files?.[0]
  if (file) processImageFile(file)
}

const processImageFile = (file) => {
  if (!file.type.startsWith('image/')) {
    errorMessage.value = '請選擇有效的圖片檔案 (JPG, PNG, WebP)。'
    return
  }

  isCompressing.value = true
  errorMessage.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      let { width: w, height: h } = img
      const maxEdge = 2560
      if (w > maxEdge || h > maxEdge) {
        if (w > h) { h = Math.round((h * maxEdge) / w); w = maxEdge }
        else { w = Math.round((w * maxEdge) / h); h = maxEdge }
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      const webpBase64 = canvas.toDataURL('image/webp', 0.88)
      previewUrl.value = webpBase64
      isImageReplaced.value = true
      newImagePayload.value = {
        base64: webpBase64,
        filename: file.name.replace(/\.[^/.]+$/, '') + '.webp',
        width: w,
        height: h,
        fileSize: Math.round((webpBase64.length * 3) / 4),
        mimeType: 'image/webp'
      }
      isCompressing.value = false
    }
    img.onerror = () => {
      errorMessage.value = '讀取圖片失敗，請更換其他檔案。'
      isCompressing.value = false
    }
    img.src = e.target.result
  }
  reader.onerror = () => {
    errorMessage.value = '讀取檔案失敗。'
    isCompressing.value = false
  }
  reader.readAsDataURL(file)
}

const handleRevertImage = () => {
  previewUrl.value = props.mediaItem?.cdnUrl || ''
  isImageReplaced.value = false
  newImagePayload.value = null
  errorMessage.value = ''
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
    const payload = {
      action: 'update',
      id: props.mediaItem.id,
      titleZh: titleZh.value.trim(),
      titleEn: titleEn.value.trim(),
      tagZh: tagZh.value.trim(),
      tagEn: tagEn.value.trim(),
      sortOrder: Number(sortOrder.value) || 1,
      isActive: isActive.value
    }

    if (isImageReplaced.value && newImagePayload.value) {
      payload.newImage = newImagePayload.value
    }

    const res = await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
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
        <!-- 頂部標題列 -->
        <div class="modal-header">
          <div class="header-title-group">
            <Edit3 :size="18" class="gold-icon" />
            <h3>編輯圖片資訊與更換圖片</h3>
          </div>
          <button type="button" class="btn-close" @click="handleClose" :disabled="isLoading || isCompressing">
            <X :size="18" />
          </button>
        </div>

        <div v-if="errorMessage" class="modal-alert error">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 圖片縮圖與換圖工具區 -->
        <div 
          class="image-replace-card"
          :class="{ replaced: isImageReplaced }"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <div class="preview-box">
            <img :src="previewUrl" :alt="titleZh || '圖片預覽'" class="main-img" />
            <div v-if="isCompressing" class="overlay-compressing">
              <RefreshCw :size="18" class="spinning" />
              <span>壓縮處理中...</span>
            </div>
            <div v-else-if="isImageReplaced" class="tag-replaced">
              <Sparkles :size="11" />
              <span>新圖片待儲存</span>
            </div>
          </div>

          <div class="replace-info-col">
            <div class="meta-row">
              <span class="media-id font-mono">{{ mediaItem?.id }}</span>
              <span class="media-dim">
                {{ isImageReplaced ? `${newImagePayload.width} × ${newImagePayload.height} px (新圖)` : `${mediaItem?.width || 1920} × ${mediaItem?.height || 1080} px` }}
              </span>
            </div>

            <div class="btn-replace-row">
              <input 
                ref="fileInputRef" 
                type="file" 
                accept="image/*" 
                class="hidden-file-input" 
                @change="handleFileSelect" 
              />
              <button 
                type="button" 
                class="btn-replace" 
                @click="triggerFilePicker"
                :disabled="isLoading || isCompressing"
                title="選擇電腦中的新照片替換此圖"
              >
                <UploadCloud :size="14" />
                <span>{{ isImageReplaced ? '重選其他圖片' : '更換圖片 (換圖)' }}</span>
              </button>

              <button 
                v-if="isImageReplaced" 
                type="button" 
                class="btn-revert" 
                @click="handleRevertImage"
                :disabled="isLoading || isCompressing"
                title="還原回原始圖片"
              >
                <RotateCcw :size="13" />
                <span>還原原圖</span>
              </button>
            </div>
            <span class="hint-text">點擊更換或將新圖片拖曳至此，系統將自動 WebP 最佳化</span>
          </div>
        </div>

        <!-- 表單欄位 -->
        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- 上架狀態切換 -->
          <div class="form-group">
            <label class="form-label">發佈狀態 (Status)</label>
            <div class="status-choice-row">
              <button 
                type="button" 
                class="status-pill-option" 
                :class="{ active: !isActive }"
                @click="isActive = false"
              >
                <span class="dot draft"></span>
                <span class="label">草稿 (暫不上架)</span>
              </button>
              <button 
                type="button" 
                class="status-pill-option" 
                :class="{ active: isActive }"
                @click="isActive = true"
              >
                <span class="dot published"></span>
                <span class="label">上架中 (前台公開)</span>
              </button>
            </div>
          </div>

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

          <!-- 底部控制按鈕 -->
          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading || isCompressing">取消</button>
            <button type="submit" class="btn-confirm" :disabled="isLoading || isCompressing">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '儲存與圖片處理中...' : (isImageReplaced ? '確認更換圖片並儲存' : '儲存變更') }}</span>
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
  position: fixed; inset: 0; z-index: 9999; 
  background: var(--overlay-bg, rgba(18, 20, 21, 0.65));
  backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}

.admin-modal-container {
  width: 100%; max-width: 520px; 
  background: var(--admin-bg-card, #FFFFFF);
  border: 1px solid var(--admin-border, rgba(197, 168, 128, 0.28)); 
  border-radius: $radius-lg;
  box-shadow: var(--shadow-lg, 0 16px 40px rgba(0, 0, 0, 0.15)), 0 0 16px rgba(197, 168, 128, 0.08); 
  display: flex; flex-direction: column; overflow: hidden;
  transition: background-color $transition-fast, border-color $transition-fast;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem;
  background: var(--admin-bg-card, #FFFFFF);
  border-bottom: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.06));
  .header-title-group {
    display: flex; align-items: center; gap: 0.6rem;
    .gold-icon { color: var(--gold-primary, #C5A880); }
    h3 { font-size: 1.15rem; font-weight: 700; color: var(--admin-text-main, #1A1E1F); margin: 0; }
  }
  .btn-close {
    background: transparent; border: none; color: var(--admin-text-muted, #64748b);
    cursor: pointer; padding: 0.35rem; border-radius: $radius-xs; display: inline-flex; align-items: center;
    transition: color $transition-fast, background-color $transition-fast;
    &:hover:not(:disabled) { color: var(--admin-text-main, #1A1E1F); background: var(--admin-tr-hover, rgba(197, 168, 128, 0.12)); }
  }
}

.modal-alert {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 1.25rem; margin: 0.85rem 1.4rem 0;
  border-radius: $radius-sm; font-size: 0.82rem;
  &.error { 
    background: var(--color-danger-bg, rgba(239, 68, 68, 0.12)); 
    border: 1px solid var(--color-danger-border, rgba(239, 68, 68, 0.3)); 
    color: var(--color-danger, #EF4444); 
  }
}

.image-replace-card {
  display: flex; align-items: center; gap: 1rem; padding: 1rem 1.4rem;
  background: var(--admin-bg-base, rgba(197, 168, 128, 0.06));
  border-bottom: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.06));
  transition: border-color $transition-fast, background-color $transition-fast;
  &.replaced { border-bottom-color: var(--gold-primary, #C5A880); background: var(--admin-tr-hover, rgba(197, 168, 128, 0.12)); }

  .preview-box {
    position: relative; width: 110px; height: 70px; flex-shrink: 0; border-radius: $radius-sm;
    overflow: hidden; background: #000; border: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.1));
    .main-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .tag-replaced {
      position: absolute; bottom: 0; left: 0; right: 0; background: var(--gold-primary, #C5A880);
      color: #FFFFFF; font-size: 0.65rem; font-weight: 700; display: flex; align-items: center;
      justify-content: center; gap: 0.2rem; padding: 0.15rem 0.2rem;
    }
    .overlay-compressing {
      position: absolute; inset: 0; background: rgba(0, 0, 0, 0.75); display: flex;
      flex-direction: column; align-items: center; justify-content: center;
      color: var(--gold-primary, #C5A880); font-size: 0.65rem; gap: 0.25rem;
    }
  }

  .replace-info-col {
    flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.45rem;
    .meta-row {
      display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
      .media-id { font-size: 0.72rem; color: var(--gold-primary, #C5A880); font-weight: 600; }
      .media-dim { font-size: 0.72rem; color: var(--admin-text-muted, #64748b); }
    }
    .btn-replace-row {
      display: flex; align-items: center; gap: 0.5rem;
      .hidden-file-input { display: none; }
      .btn-replace {
        display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem;
        background: var(--admin-tr-hover, rgba(197, 168, 128, 0.15)); 
        border: 1px solid var(--gold-primary, #C5A880);
        border-radius: $radius-xs; color: var(--gold-primary, #C5A880); font-size: 0.78rem; font-weight: 600;
        cursor: pointer; transition: background-color $transition-fast;
        &:hover:not(:disabled) { background: var(--gold-primary, #C5A880); color: #FFFFFF; }
      }
      .btn-revert {
        display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.65rem;
        background: transparent; border: 1px solid var(--border-color, #cbd5e1); border-radius: $radius-xs;
        color: var(--admin-text-muted, #64748b); font-size: 0.75rem; cursor: pointer;
        transition: color $transition-fast, border-color $transition-fast;
        &:hover:not(:disabled) { color: var(--admin-text-main, #1A1E1F); border-color: var(--gold-primary, #C5A880); }
      }
    }
    .hint-text { font-size: 0.68rem; color: var(--admin-text-muted, #64748b); }
  }
}

.modal-form { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

.form-group {
  display: flex; flex-direction: column; gap: 0.35rem;
  .form-label {
    font-size: 0.84rem; font-weight: 600; color: var(--admin-text-sub, #475569);
    .required { color: var(--color-danger, #EF4444); margin-left: 0.2rem; }
  }
  .form-input {
    width: 100%; padding: 0.65rem 0.85rem; 
    background: var(--admin-input-bg, #FFFFFF);
    border: 1px solid var(--admin-input-border, rgba(197, 168, 128, 0.4)); 
    border-radius: $radius-sm;
    color: var(--admin-text-main, #1A1E1F); font-size: 0.88rem; outline: none; 
    transition: border-color $transition-fast, box-shadow $transition-fast;
    &:focus { border-color: var(--gold-primary, #C5A880); box-shadow: 0 0 8px rgba(197, 168, 128, 0.25); }
    &::placeholder { color: var(--admin-text-muted, #94a3b8); opacity: 0.75; }
  }
}

.status-choice-row {
  display: flex; gap: 0.6rem;
  .status-pill-option {
    flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
    padding: 0.55rem 0.75rem; border-radius: $radius-sm; 
    background: var(--admin-bg-base, rgba(197, 168, 128, 0.08));
    border: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.08)); 
    color: var(--admin-text-muted, #64748b);
    font-size: 0.82rem; cursor: pointer; transition: all $transition-fast;
    .dot { width: 7px; height: 7px; border-radius: 50%; &.draft { background: #94a3b8; } &.published { background: #16a34a; } }
    &.active {
      background: var(--admin-tr-hover, rgba(197, 168, 128, 0.16)); 
      border-color: var(--gold-primary, #C5A880);
      color: var(--admin-text-main, #1A1E1F); font-weight: 600;
    }
  }
}

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; padding-top: 0.65rem;
  border-top: 1px solid var(--admin-border-subtle, rgba(0, 0, 0, 0.06));
  .btn-cancel {
    padding: 0.55rem 1.15rem; background: transparent; 
    border: 1px solid var(--border-color, #cbd5e1);
    border-radius: $radius-sm; color: var(--admin-text-sub, #475569); font-size: 0.85rem; font-weight: 500; cursor: pointer;
    transition: color $transition-fast, border-color $transition-fast, background-color $transition-fast;
    &:hover:not(:disabled) { color: var(--admin-text-main, #1A1E1F); border-color: var(--gold-primary, #C5A880); background: var(--admin-tr-hover, rgba(197, 168, 128, 0.12)); }
  }
  .btn-confirm {
    display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1.35rem;
    background: var(--gold-primary, #C5A880); border: 1px solid var(--gold-primary, #C5A880); border-radius: $radius-sm;
    color: #FFFFFF; font-weight: 600; font-size: 0.85rem; cursor: pointer; 
    transition: background-color $transition-fast, border-color $transition-fast;
    &:hover:not(:disabled) { background: var(--gold-dark, #91754F); border-color: var(--gold-dark, #91754F); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>