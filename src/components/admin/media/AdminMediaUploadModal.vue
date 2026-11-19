<script setup>
import { ref, watch } from 'vue'
import { X, UploadCloud, Check, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  defaultCategory: { type: String, default: 'hero' }
})

const emit = defineEmits(['close', 'uploaded'])

const category = ref('hero')
const subCategory = ref('banner')
const titleZh = ref('')
const titleEn = ref('')
const tagZh = ref('')
const tagEn = ref('')

const selectedFile = ref(null)
const previewUrl = ref('')
const fileInfo = ref({ width: 0, height: 0, sizeKb: 0 })
const isCompressing = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref(null)

const categoryOptions = [
  { id: 'hero', name: '首頁 Hero 輪播大圖', sub: 'banner' },
  { id: 'room', name: '特色客房寫真', sub: 'room-1' },
  { id: 'facility', name: '園區公設休閒照', sub: 'living-ktv' }
]

watch(() => props.show, (newVal) => {
  if (!newVal) return
  category.value = props.defaultCategory || 'hero'
  subCategory.value = category.value === 'room' ? 'room-1' : category.value === 'facility' ? 'living-ktv' : 'banner'
  titleZh.value = ''; titleEn.value = ''; tagZh.value = ''; tagEn.value = ''
  selectedFile.value = null; previewUrl.value = ''; errorMessage.value = ''
  fileInfo.value = { width: 0, height: 0, sizeKb: 0 }
})

const handleClose = () => { if (!isLoading.value) emit('close') }

const handleFileDrop = (e) => {
  const files = e.dataTransfer?.files
  if (files?.length) processImageFile(files[0])
}

const handleFileSelect = (e) => {
  const files = e.target?.files
  if (files?.length) processImageFile(files[0])
}

// 前端自動將圖片轉為 WebP 並壓縮至合適尺寸 (長邊上限 2560px)
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
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      const webpBase64 = canvas.toDataURL('image/webp', 0.88)
      previewUrl.value = webpBase64
      selectedFile.value = file
      fileInfo.value = { width: w, height: h, sizeKb: Math.round((webpBase64.length * 3) / 4096) }
      if (!titleZh.value) titleZh.value = file.name.replace(/\.[^/.]+$/, '')
      isCompressing.value = false
    }
    img.onerror = () => {
      errorMessage.value = '讀取圖片失敗，請更換其他檔案。'
      isCompressing.value = false
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

const handleSubmit = async () => {
  if (!previewUrl.value) return (errorMessage.value = '請先選擇或拖曳欲上傳之圖片。')
  if (!titleZh.value.trim()) return (errorMessage.value = '請填寫圖片標題或描述。')

  isLoading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        base64: previewUrl.value,
        filename: selectedFile.value?.name || 'uploaded-image.webp',
        category: category.value,
        subCategory: subCategory.value,
        titleZh: titleZh.value.trim(),
        titleEn: titleEn.value.trim(),
        tagZh: tagZh.value.trim(),
        tagEn: tagEn.value.trim(),
        width: fileInfo.value.width,
        height: fileInfo.value.height,
        fileSize: fileInfo.value.sizeKb * 1024,
        mimeType: 'image/webp'
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) throw new Error(data.message || '上傳失敗')
    emit('uploaded', data.asset)
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
            <UploadCloud :size="20" class="gold-icon" />
            <h3>上傳圖片至媒體庫</h3>
          </div>
          <button type="button" class="btn-close" @click="handleClose" :disabled="isLoading">
            <X :size="18" />
          </button>
        </div>

        <div v-if="errorMessage" class="modal-alert error">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- 分類選擇 -->
          <div class="form-group">
            <label class="form-label">媒體分類 (Category)</label>
            <div class="category-pills">
              <button 
                v-for="cat in categoryOptions" 
                :key="cat.id"
                type="button"
                class="pill-btn"
                :class="{ active: category === cat.id }"
                @click="category = cat.id; subCategory = cat.sub"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>

          <!-- 拖曳上傳區 -->
          <div 
            class="dropzone-box" 
            :class="{ 'has-file': previewUrl }"
            @dragover.prevent
            @drop.prevent="handleFileDrop"
            @click="fileInputRef?.click()"
          >
            <input 
              ref="fileInputRef" 
              type="file" 
              accept="image/*" 
              class="hidden-input" 
              @change="handleFileSelect" 
            />

            <div v-if="!previewUrl" class="dropzone-empty">
              <UploadCloud :size="38" class="dropzone-icon" />
              <p class="drop-text">點擊或拖曳圖片至此處上傳</p>
              <span class="drop-hint">支援 JPG、PNG、WebP，系統將自動轉換為次世代 WebP 規格</span>
            </div>

            <div v-else class="preview-wrapper">
              <img :src="previewUrl" alt="上傳預覽" class="preview-img" />
              <div class="preview-badge-row">
                <span class="badge-tag">
                  <Sparkles :size="12" />
                  <span>WebP 自動優化</span>
                </span>
                <span class="badge-dim">{{ fileInfo.width }} × {{ fileInfo.height }} px ({{ fileInfo.sizeKb }} KB)</span>
              </div>
            </div>
          </div>

          <!-- 圖片標題與標籤 -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">圖片標題 / 描述 (繁中) <span class="required">*</span></label>
              <input v-model="titleZh" type="text" class="form-input" placeholder="例如：露台晨曦觀景" required />
            </div>

            <div class="form-group">
              <label class="form-label">空間標籤 (Tag 繁中)</label>
              <input v-model="tagZh" type="text" class="form-input" placeholder="例如：壯闊雲海、莊園夜色" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">取消</button>
            <button type="submit" class="btn-confirm" :disabled="isLoading || !previewUrl || isCompressing">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '圖片處理上傳中...' : '確認加入媒體庫' }}</span>
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
    display: flex;
    &:hover:not(:disabled) { color: #fff; }
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

.category-pills {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  .pill-btn {
    padding: 0.35rem 0.8rem;
    background: var(--admin-bg-base, rgba(0, 0, 0, 0.25));
    border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.1));
    border-radius: 20px;
    color: var(--admin-text-sub, #cbd5e1);
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover { border-color: rgba(212, 175, 55, 0.4); color: var(--gold-primary, #d4af37); }
    &.active {
      background: rgba(212, 175, 55, 0.18);
      border-color: var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37);
      font-weight: 600;
    }
  }
}

.dropzone-box {
  border: 2px dashed var(--admin-border, rgba(212, 175, 55, 0.3));
  border-radius: 8px;
  padding: 1.25rem;
  text-align: center;
  cursor: pointer;
  background: var(--admin-bg-base, rgba(0, 0, 0, 0.2));
  transition: all 0.2s ease;

  &:hover { border-color: var(--gold-primary, #d4af37); background: rgba(212, 175, 55, 0.04); }
  &.has-file { padding: 0.4rem; border-style: solid; }
  .hidden-input { display: none; }

  .dropzone-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    .dropzone-icon { color: var(--gold-primary, #d4af37); opacity: 0.8; }
    .drop-text { font-size: 0.88rem; font-weight: 500; color: var(--admin-text-main, #f8fafc); margin: 0; }
    .drop-hint { font-size: 0.75rem; color: var(--admin-text-muted, #94a3b8); }
  }

  .preview-wrapper {
    position: relative;
    border-radius: 6px;
    overflow: hidden;

    .preview-img { width: 100%; height: 160px; object-fit: cover; display: block; }
    .preview-badge-row {
      position: absolute;
      bottom: 0.5rem;
      left: 0.5rem;
      right: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;

      .badge-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        background: rgba(18, 20, 21, 0.85);
        border: 1px solid var(--gold-primary, #d4af37);
        color: var(--gold-primary, #d4af37);
        padding: 0.15rem 0.5rem;
        border-radius: 4px;
        font-size: 0.72rem;
        font-weight: 600;
      }
      .badge-dim { background: rgba(0, 0, 0, 0.75); color: #fff; font-family: monospace; font-size: 0.7rem; padding: 0.15rem 0.5rem; border-radius: 4px; }
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;

  .form-label {
    font-size: 0.82rem;
    font-weight: 500;
    color: var(--admin-text-sub, #cbd5e1);
    .required { color: #ef4444; margin-left: 0.2rem; }
  }

  .form-input {
    width: 100%;
    padding: 0.65rem 0.8rem;
    background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
    border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25));
    border-radius: 6px;
    color: var(--admin-text-main, #fff);
    font-size: 0.88rem;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:focus { border-color: var(--gold-primary, #d4af37); box-shadow: 0 0 8px rgba(212, 175, 55, 0.25); }
  }
}

.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));

  .btn-cancel {
    padding: 0.6rem 1.15rem;
    background: transparent;
    border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.2));
    border-radius: 6px;
    color: var(--admin-text-sub, #cbd5e1);
    font-size: 0.85rem;
    cursor: pointer;
    &:hover:not(:disabled) { background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05)); color: #fff; }
  }

  .btn-confirm {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.3rem;
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
