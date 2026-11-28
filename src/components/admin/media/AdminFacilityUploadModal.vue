<script setup>
import { ref, watch, computed } from 'vue'
import { X, UploadCloud, Check, AlertCircle, Coffee, Lock } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  targetFacilityId: { type: String, default: '' },
  existingFacilities: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'uploaded'])

// 是否處於單一空間鎖定模式
const isLocked = computed(() => Boolean(props.targetFacilityId && props.targetFacilityId.trim()))

// 整理乾淨的公設列表 (徹底排除了每張照片 ID 的雜訊，僅放真實公設分類)
const availableFacilities = computed(() => {
  if (!props.existingFacilities || !props.existingFacilities.length) return []
  return props.existingFacilities.map(f => ({
    id: f.id,
    nameZh: f.titleZh || f.title || f.nameZh || f.id
  }))
})

// 鎖定模式下顯示的公設名稱
const lockedFacilityDisplay = computed(() => {
  if (!props.targetFacilityId) return ''
  const found = availableFacilities.value.find(f => f.id === props.targetFacilityId)
  if (found) {
    return found.nameZh
  }
  return props.targetFacilityId
})

const selectedFacilityId = ref('')
const titleZh = ref('')
const titleEn = ref('')
const tagZh = ref('')
const tagEn = ref('')
const isActive = ref(true)

const selectedFile = ref(null)
const previewUrl = ref('')
const fileInfo = ref({ width: 0, height: 0, sizeKb: 0 })
const isCompressing = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref(null)

const updateDefaultTag = () => {
  const currentId = isLocked.value ? props.targetFacilityId : selectedFacilityId.value
  const found = availableFacilities.value.find(f => f.id === currentId)
  if (found && !tagZh.value) {
    tagZh.value = found.nameZh.split(' ')[0] || found.nameZh
  }
}

watch(() => props.show, (newVal) => {
  if (!newVal) return
  if (isLocked.value) {
    selectedFacilityId.value = props.targetFacilityId
  } else if (availableFacilities.value.length > 0) {
    selectedFacilityId.value = availableFacilities.value[0].id
  } else {
    selectedFacilityId.value = ''
  }

  titleZh.value = ''
  titleEn.value = ''
  tagZh.value = ''
  tagEn.value = ''
  isActive.value = true
  selectedFile.value = null
  previewUrl.value = ''
  errorMessage.value = ''
  fileInfo.value = { width: 0, height: 0, sizeKb: 0 }
  updateDefaultTag()
})

watch(selectedFacilityId, () => updateDefaultTag())

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
    errorMessage.value = '請先選擇或拖曳欲上傳之公設照片。'
    return
  }
  if (!titleZh.value.trim()) {
    errorMessage.value = '請填寫公設照片標題或特色說明。'
    return
  }

  const finalSubCategory = isLocked.value ? props.targetFacilityId : selectedFacilityId.value
  if (!finalSubCategory) {
    errorMessage.value = '請選擇所屬公設空間分類。'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const payload = {
      category: 'facility',
      subCategory: finalSubCategory,
      titleZh: titleZh.value.trim(),
      titleEn: titleEn.value.trim(),
      tagZh: tagZh.value.trim(),
      tagEn: tagEn.value.trim(),
      base64Data: previewUrl.value,
      width: fileInfo.value.width,
      height: fileInfo.value.height,
      isActive: isActive.value
    }

    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '公設照片上傳失敗')
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
            <Coffee :size="20" class="gold-icon" />
            <div>
              <h3>上傳公設休閒照片</h3>
              <p class="header-desc">上傳實景照片至目標公共設施圖集，前台休閒設施即時同步呈現</p>
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
          <!-- 情況 A：鎖定指定分類 (完全不給換) -->
          <div v-if="isLocked" class="locked-banner">
            <div class="locked-content">
              <Lock :size="16" class="locked-icon" />
              <span class="locked-tag">目標公設已鎖定</span>
              <strong class="locked-name">{{ lockedFacilityDisplay }}</strong>
            </div>
            <span class="locked-hint">此張照片將直接儲存至此公設相簿中</span>
          </div>

          <!-- 情況 B：未指定分類時，提供乾淨的公設下拉選單 (杜絕每張照片 ID 雜訊) -->
          <div v-else class="form-group">
            <label class="form-label">選擇目標公共設施 <span class="required">*</span></label>
            <select v-model="selectedFacilityId" class="form-select" required>
              <option value="" disabled>請選擇所屬公設空間</option>
              <option v-for="fc in availableFacilities" :key="fc.id" :value="fc.id">
                {{ fc.nameZh }}
              </option>
            </select>
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
              <UploadCloud :size="34" class="dropzone-icon" />
              <p class="drop-text">點擊或拖曳公設實景照片至此</p>
              <span class="drop-hint">自動壓縮優化為次世代 WebP (支援 JPG, PNG, WebP)</span>
            </div>

            <div v-else class="dropzone-preview">
              <img :src="previewUrl" alt="預覽照片" class="preview-img" />
              <div class="preview-overlay">
                <span class="preview-badge">點擊更換圖片</span>
                <span v-if="fileInfo.width" class="preview-meta">
                  {{ fileInfo.width }} × {{ fileInfo.height }} px (約 {{ fileInfo.sizeKb }} KB)
                </span>
              </div>
            </div>
          </div>

          <!-- 照片資訊欄位 (對齊前台) -->
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">照片標題 / 特色說明 (繁中) <span class="required">*</span></label>
              <input 
                v-model="titleZh" 
                type="text" 
                class="form-input" 
                placeholder="例如：頂級過山車麻將桌、海量雲端點歌系統、美式BBQ悶烤爐" 
                required 
              />
            </div>
            <div class="form-group">
              <label class="form-label">空間標籤 (Tag 繁中)</label>
              <input 
                v-model="tagZh" 
                type="text" 
                class="form-input" 
                placeholder="例如：娛樂專區、戶外庭院、品茗茶席" 
              />
            </div>
          </div>

          <!-- 發佈狀態切換 -->
          <div class="form-group">
            <label class="form-label">發佈狀態</label>
            <div class="status-toggle-row">
              <button 
                type="button" 
                class="status-btn" 
                :class="{ active: isActive }" 
                @click="isActive = true"
              >
                <span class="dot active"></span>
                <span>直接上架 (公開展示)</span>
              </button>
              <button 
                type="button" 
                class="status-btn" 
                :class="{ active: !isActive }" 
                @click="isActive = false"
              >
                <span class="dot draft"></span>
                <span>先存為草稿 (暫不上架)</span>
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">
              取消
            </button>
            <button type="submit" class="btn-submit" :disabled="isLoading || isCompressing || !previewUrl">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '處理中...' : (isActive ? '確認上傳並公開' : '儲存為草稿') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;
@use '../../../assets/styles/admin-media-modals' as *;

.locked-banner {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.85rem 1.15rem;
  background: var(--gold-light, rgba(184, 144, 71, 0.08));
  border: 1px solid var(--gold-primary, #b89047);
  border-radius: $radius-sm;

  .locked-content {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.95rem;

    .locked-icon {
      color: var(--gold-primary, #b89047);
      flex-shrink: 0;
    }

    .locked-tag {
      background: var(--gold-primary, #b89047);
      color: #ffffff;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-weight: 600;
    }

    .locked-name {
      color: var(--text-primary, #1e293b);
      font-weight: 600;
    }
  }

  .locked-hint {
    font-size: 0.8rem;
    color: var(--text-secondary, #64748b);
    padding-left: 1.6rem;
  }
}
</style>
