<script setup>
import { ref, watch } from 'vue'
import { X, UploadCloud, Check, AlertCircle, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'uploaded'])

const titleZh = ref('')
const titleEn = ref('')
const tagZh = ref('')
const tagEn = ref('')
const isActive = ref(true) // 預設直接上架，使管家上傳後立即可見效果

const selectedFile = ref(null)
const previewUrl = ref('')
const fileInfo = ref({ width: 0, height: 0, sizeKb: 0 })
const isCompressing = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref(null)

watch(() => props.show, (newVal) => {
  if (!newVal) return
  titleZh.value = ''
  titleEn.value = ''
  tagZh.value = ''
  tagEn.value = ''
  isActive.value = true // 預設直接上架
  selectedFile.value = null
  previewUrl.value = ''
  errorMessage.value = ''
  fileInfo.value = { width: 0, height: 0, sizeKb: 0 }
})

const handleClose = () => {
  if (!isLoading.value) emit('close')
}

const handleFileDrop = (e) => {
  const files = e.dataTransfer?.files
  if (files?.length) processImageFile(files[0])
}

const handleFileSelect = (e) => {
  const files = e.target?.files
  if (files?.length) processImageFile(files[0])
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
  if (!previewUrl.value) {
    errorMessage.value = '請先選擇或拖曳欲上傳之圖片。'
    return
  }
  if (!titleZh.value.trim()) {
    errorMessage.value = '請填寫輪播大圖標題或描述。'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        base64: previewUrl.value,
        filename: selectedFile.value?.name || 'hero-slide.webp',
        category: 'hero',
        subCategory: 'banner',
        titleZh: titleZh.value.trim(),
        titleEn: titleEn.value.trim(),
        tagZh: tagZh.value.trim(),
        tagEn: tagEn.value.trim(),
        width: fileInfo.value.width,
        height: fileInfo.value.height,
        fileSize: fileInfo.value.sizeKb * 1024,
        mimeType: 'image/webp',
        isActive: isActive.value
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '輪播大圖上傳失敗')
    }
    emit('uploaded', data.asset)
    emit('close')
  } catch (err) {
    errorMessage.value = err.message || '上傳發生未預期錯誤，請稍後再試。'
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
            <div>
              <h3>上傳首頁 Hero 輪播大圖</h3>
              <p class="header-desc">上傳 16:9 高畫質大圖，系統將自動轉換為次世代 WebP 規格</p>
            </div>
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
              <span class="drop-hint">建議解析度 2560 × 1440 或 1920 × 1080 (JPG, PNG, WebP)</span>
            </div>

            <div v-else class="preview-wrapper">
              <img :src="previewUrl" alt="上傳預覽" class="preview-img" />
              <div class="preview-badge-row">
                <span class="badge-tag">
                  <Sparkles :size="12" />
                  <span>WebP 最佳化</span>
                </span>
                <span class="badge-dim">{{ fileInfo.width }} × {{ fileInfo.height }} px ({{ fileInfo.sizeKb }} KB)</span>
              </div>
            </div>
          </div>

          <!-- 圖片標題與空間標籤 -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">大圖標題 (繁中) <span class="required">*</span></label>
              <input v-model="titleZh" type="text" class="form-input" placeholder="例如：露台晨曦・漫步雲海仙境" required />
            </div>

            <div class="form-group">
              <label class="form-label">空間標籤 (Tag 繁中)</label>
              <input v-model="tagZh" type="text" class="form-input" placeholder="例如：壯闊雲海、莊園夜色" />
            </div>
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">大圖英文標題 (選填)</label>
              <input v-model="titleEn" type="text" class="form-input" placeholder="例如：Panoramic Viewing Deck" />
            </div>

            <div class="form-group">
              <label class="form-label">英文標籤 (選填)</label>
              <input v-model="tagEn" type="text" class="form-input" placeholder="例如：Sea of Clouds" />
            </div>
          </div>

          <!-- 發佈狀態：預設草稿 -->
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
                <span class="label">先存為草稿 (預設，暫不上架)</span>
              </button>
              <button 
                type="button" 
                class="status-pill-option" 
                :class="{ active: isActive }"
                @click="isActive = true"
              >
                <span class="dot published"></span>
                <span class="label">直接上架 (公開展示)</span>
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">取消</button>
            <button type="submit" class="btn-confirm" :disabled="isLoading || !previewUrl || isCompressing">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '處理上傳中...' : (isActive ? '確認直接上架' : '確認存為草稿') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/admin-media-modals' as *;
</style>
