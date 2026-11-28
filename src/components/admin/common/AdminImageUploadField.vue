<script setup>
import { ref } from 'vue'
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  Check, 
  X, 
  AlertCircle 
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '封面照片' },
  category: { type: String, default: 'news' },
  defaultImage: { type: String, default: '' },
  defaultButtonText: { type: String, default: '帶入預設美照' }
})

const emit = defineEmits(['update:modelValue'])

const fileInputRef = ref(null)
const isUploading = ref(false)
const errorMessage = ref('')
const isManualInput = ref(false)
const showGalleryModal = ref(false)
const dragOver = ref(false)

// 內建山莊精選照片庫 (支援管家一鍵點選)
const PRESET_GALLERY = [
  { name: '首頁星夜・全景', path: '/img/homebanner/homebanner-01.webp' },
  { name: '晨曦雲海・露台', path: '/img/homebanner/homebanner-02.webp' },
  { name: '自然山林・田園', path: '/img/homebanner/homebanner-03.webp' },
  { name: '夕陽晚霞・山嵐', path: '/img/homebanner/homebanner-06.webp' },
  { name: '清幽雲霧・私享', path: '/img/cloud-sea/cloud-sea-01.webp' },
  { name: '高山品茗・茶席', path: '/img/outdoor-bbq-tea/outdoor-bbq-tea-03.webp' },
  { name: '星空烤肉・庭院', path: '/img/outdoor-bbq-tea/outdoor-bbq-tea-09.webp' },
  { name: '智能廚房・中島', path: '/img/kitchen-bar/kitchen-bar-01.webp' },
  { name: '私廚饗宴・吧檯', path: '/img/kitchen-bar/kitchen-bar-02.webp' },
  { name: '豪華客廳・KTV', path: '/img/living-ktv/living-ktv-01.webp' },
  { name: '電動麻將・娛樂', path: '/img/living-ktv/living-ktv-04.webp' },
  { name: '卓蘭景致・夜色', path: '/img/scenery-night/scenery-night-02.webp' }
]

const triggerFilePicker = () => {
  if (isUploading.value) return
  errorMessage.value = ''
  fileInputRef.value?.click()
}

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (file) processAndUpload(file)
  e.target.value = ''
}

const handleDrop = (e) => {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processAndUpload(file)
}

// 前端自動將圖片轉為 WebP 並壓縮至合適尺寸 (長邊上限 2000px, 85% 品質)
const processAndUpload = (file) => {
  if (!file.type.startsWith('image/')) {
    errorMessage.value = '請選擇有效的圖片檔案 (JPG, PNG, WebP)。'
    return
  }

  isUploading.value = true
  errorMessage.value = ''

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = async () => {
      let { width: w, height: h } = img
      const maxEdge = 2000
      if (w > maxEdge || h > maxEdge) {
        if (w > h) { h = Math.round((h * maxEdge) / w); w = maxEdge }
        else { w = Math.round((w * maxEdge) / h); h = maxEdge }
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)

      const webpBase64 = canvas.toDataURL('image/webp', 0.85)

      try {
        const token = localStorage.getItem('shanyu_admin_token')
        const res = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            base64: webpBase64,
            filename: file.name.replace(/\.[^/.]+$/, '') + '.webp',
            category: props.category,
            titleZh: file.name.replace(/\.[^/.]+$/, ''),
            width: w,
            height: h,
            fileSize: Math.round((webpBase64.length * 3) / 4),
            mimeType: 'image/webp'
          })
        })

        const data = await res.json()
        if (res.ok && data.success && data.asset?.cdnUrl) {
          emit('update:modelValue', data.asset.cdnUrl)
        } else {
          // 若無 R2 或離線，優雅降級使用 WebP Data URL
          emit('update:modelValue', webpBase64)
        }
      } catch (err) {
        // 離線/測試備援
        emit('update:modelValue', webpBase64)
      } finally {
        isUploading.value = false
      }
    }

    img.onerror = () => {
      errorMessage.value = '圖片解析失敗，請更換其他檔案。'
      isUploading.value = false
    }

    img.src = e.target.result
  }

  reader.onerror = () => {
    errorMessage.value = '讀取檔案失敗。'
    isUploading.value = false
  }

  reader.readAsDataURL(file)
}

const clearImage = () => {
  emit('update:modelValue', '')
  errorMessage.value = ''
}

const selectFromGallery = (path) => {
  emit('update:modelValue', path)
  showGalleryModal.value = false
}

const applyDefault = () => {
  if (props.defaultImage) {
    emit('update:modelValue', props.defaultImage)
  }
}
</script>

<template>
  <div class="admin-image-upload-field">
    <!-- 標題與快捷按鈕列 -->
    <div class="field-header">
      <label class="form-label">{{ label }}</label>
      <div class="header-actions">
        <button 
          v-if="defaultImage" 
          type="button" 
          class="btn-text-gold" 
          @click="applyDefault"
          title="帶入預設圖片"
        >
          <Sparkles :size="12" />
          <span>{{ defaultButtonText }}</span>
        </button>
        <button 
          type="button" 
          class="btn-text-sub" 
          @click="showGalleryModal = true"
          title="從山莊相簿挑選現有照片"
        >
          <ImageIcon :size="12" />
          <span>山莊圖庫</span>
        </button>
        <button 
          type="button" 
          class="btn-text-sub" 
          @click="isManualInput = !isManualInput"
          :title="isManualInput ? '切換回上傳介面' : '手動輸入自訂網址'"
        >
          <LinkIcon :size="12" />
          <span>{{ isManualInput ? '圖片預覽' : '手動網址' }}</span>
        </button>
      </div>
    </div>

    <!-- 錯誤提示 -->
    <div v-if="errorMessage" class="upload-error">
      <AlertCircle :size="14" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 手動輸入網址模式 -->
    <div v-if="isManualInput" class="manual-input-box">
      <input 
        :value="modelValue" 
        @input="emit('update:modelValue', $event.target.value)"
        type="text" 
        class="form-input font-mono" 
        placeholder="請輸入本地路徑 (/img/...) 或外部網址 (https://...)" 
      />
    </div>

    <!-- 已有圖片：預覽與管理工具列 -->
    <div v-if="modelValue" class="image-preview-card">
      <div class="preview-img-wrapper">
        <img :src="modelValue" :alt="label" />
        <div v-if="isUploading" class="uploading-overlay">
          <RefreshCw :size="20" class="spinning" />
          <span>上傳處理中...</span>
        </div>
      </div>
      <div class="preview-info-row">
        <span class="preview-path" :title="modelValue">{{ modelValue }}</span>
        <div class="preview-btns">
          <button 
            type="button" 
            class="btn-preview-action" 
            @click="triggerFilePicker" 
            :disabled="isUploading"
            title="更換電腦中的其他圖片"
          >
            <UploadCloud :size="13" />
            <span>更換</span>
          </button>
          <button 
            type="button" 
            class="btn-preview-action delete" 
            @click="clearImage" 
            :disabled="isUploading"
            title="移除當前圖片"
          >
            <Trash2 :size="13" />
            <span>移除</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 尚未有圖片：點擊/拖曳上傳 Dropzone -->
    <div 
      v-else 
      class="upload-dropzone"
      :class="{ 'drag-over': dragOver, 'uploading': isUploading }"
      @click="triggerFilePicker"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleDrop"
    >
      <div v-if="isUploading" class="dropzone-inner">
        <RefreshCw :size="28" class="spinning gold-icon" />
        <span class="drop-title">圖片最佳化轉檔上傳中...</span>
      </div>
      <div v-else class="dropzone-inner">
        <div class="upload-icon-circle">
          <UploadCloud :size="22" class="gold-icon" />
        </div>
        <span class="drop-title">點擊或拖曳本機圖片至此處上傳</span>
        <span class="drop-subtitle">支援 JPG、PNG、WebP，系統自動無損壓縮轉檔</span>
      </div>
    </div>

    <!-- 隱藏原生 File Input -->
    <input 
      ref="fileInputRef" 
      type="file" 
      accept="image/*" 
      class="hidden-file-input" 
      @change="handleFileSelect" 
    />

    <!-- 山莊精選圖庫挑選彈窗 -->
    <Teleport to="body">
      <div v-if="showGalleryModal" class="gallery-modal-overlay" @click.self="showGalleryModal = false">
        <div class="gallery-modal-box">
          <div class="gallery-modal-header">
            <div class="header-left">
              <ImageIcon :size="18" class="gold-icon" />
              <h4>從山語精選相簿快速挑選</h4>
            </div>
            <button type="button" class="btn-close-modal" @click="showGalleryModal = false">
              <X :size="16" />
            </button>
          </div>
          <div class="gallery-grid">
            <div 
              v-for="item in PRESET_GALLERY" 
              :key="item.path" 
              class="gallery-item-card"
              :class="{ selected: modelValue === item.path }"
              @click="selectFromGallery(item.path)"
            >
              <img :src="item.path" :alt="item.name" loading="lazy" />
              <div class="gallery-item-meta">
                <span>{{ item.name }}</span>
                <Check v-if="modelValue === item.path" :size="14" class="check-icon" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;

.admin-image-upload-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;

  .form-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--admin-text-sub, #cbd5e1);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.65rem;

    .btn-text-gold {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: none;
      border: none;
      color: var(--gold-primary, #d4af37);
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0;
      &:hover { text-decoration: underline; }
    }

    .btn-text-sub {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: none;
      border: none;
      color: var(--admin-text-muted, #94a3b8);
      font-size: 0.75rem;
      cursor: pointer;
      padding: 0;
      &:hover { color: var(--admin-text-main, #fff); }
    }
  }
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
}

.manual-input-box {
  margin-bottom: 0.35rem;
  .form-input {
    width: 100%;
    padding: 0.45rem 0.75rem;
    background: var(--admin-input-bg, #0d131f);
    border: 1px solid var(--admin-input-border, rgba(255, 255, 255, 0.15));
    border-radius: 6px;
    color: var(--admin-text-main, #fff);
    font-size: 0.82rem;
    &:focus {
      outline: none;
      border-color: var(--gold-primary, #d4af37);
    }
  }
}

.image-preview-card {
  border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.12));
  background: var(--admin-bg-base, #0d131f);
  border-radius: 8px;
  overflow: hidden;

  .preview-img-wrapper {
    position: relative;
    width: 100%;
    height: 160px;
    background: #000;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .uploading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(2px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #fff;
      font-size: 0.82rem;
    }
  }

  .preview-info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    gap: 0.75rem;

    .preview-path {
      font-size: 0.75rem;
      color: var(--admin-text-muted, #94a3b8);
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
    }

    .preview-btns {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;

      .btn-preview-action {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.55rem;
        border-radius: 4px;
        font-size: 0.72rem;
        cursor: pointer;
        background: transparent;
        border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.15));
        color: var(--admin-text-sub, #cbd5e1);
        transition: background-color 0.15s ease, color 0.15s ease;

        &:hover:not(:disabled) {
          background: rgba(212, 175, 55, 0.1);
          color: var(--gold-primary, #d4af37);
          border-color: rgba(212, 175, 55, 0.3);
        }
        &.delete:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
        }
      }
    }
  }
}

.upload-dropzone {
  border: 1.5px dashed var(--admin-border, rgba(212, 175, 55, 0.3));
  background: var(--admin-bg-base, #0d131f);
  border-radius: 8px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover, &.drag-over {
    border-color: var(--gold-primary, #d4af37);
    background: rgba(212, 175, 55, 0.04);
  }

  .dropzone-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;

    .upload-icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(212, 175, 55, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.25rem;
      .gold-icon { color: var(--gold-primary, #d4af37); }
    }

    .drop-title {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--admin-text-main, #fff);
    }
    .drop-subtitle {
      font-size: 0.72rem;
      color: var(--admin-text-muted, #94a3b8);
    }
  }
}

.hidden-file-input {
  display: none;
}

.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.gallery-modal-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}

.gallery-modal-box {
  width: 100%; max-width: 680px; max-height: 85vh;
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.35));
  border-radius: 12px; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);

  .gallery-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem; border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));
    .header-left {
      display: flex; align-items: center; gap: 0.5rem;
      .gold-icon { color: var(--gold-primary, #d4af37); }
      h4 { font-size: 1rem; font-weight: 600; color: var(--admin-text-main, #fff); margin: 0; }
    }
    .btn-close-modal {
      background: none; border: none; color: var(--admin-text-muted, #94a3b8); cursor: pointer;
      &:hover { color: #fff; }
    }
  }

  .gallery-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem;
    padding: 1.25rem; overflow-y: auto; max-height: 60vh;

    .gallery-item-card {
      position: relative; border-radius: 6px; overflow: hidden; cursor: pointer;
      border: 2px solid transparent; background: #000; aspect-ratio: 16 / 10;
      transition: border-color 0.2s ease;

      img { width: 100%; height: 100%; object-fit: cover; display: block; }
      &:hover { border-color: rgba(212, 175, 55, 0.5); }
      &.selected { border-color: var(--gold-primary, #d4af37); }

      .gallery-item-meta {
        position: absolute; bottom: 0; inset-inline: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.85));
        padding: 0.35rem 0.5rem; font-size: 0.68rem; color: #fff;
        display: flex; align-items: center; justify-content: space-between;
        .check-icon { color: var(--gold-primary, #d4af37); }
      }
    }
  }
}
</style>
