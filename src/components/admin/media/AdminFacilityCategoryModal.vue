<script setup>
import { ref, watch, computed } from 'vue'
import { Save, Coffee } from 'lucide-vue-next'
import AdminBaseModal from '../common/AdminBaseModal.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  facilityItem: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const isEditMode = computed(() => Boolean(props.facilityItem && props.facilityItem.id))
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = ref({
  id: '',
  titleZh: '',
  titleEn: '',
  sortOrder: 1,
  descZh: '',
  descEn: '',
  featuresZhRaw: '',
  isActive: true
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    if (props.facilityItem) {
      const item = props.facilityItem
      form.value = {
        id: item.id || '',
        titleZh: item.titleZh || item.nameZh || '',
        titleEn: item.titleEn || '',
        sortOrder: item.sortOrder ?? 1,
        descZh: item.descZh || '',
        descEn: item.descEn || '',
        featuresZhRaw: Array.isArray(item.featuresZh) ? item.featuresZh.join('\n') : '',
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true
      }
    } else {
      form.value = {
        id: '',
        titleZh: '',
        titleEn: '',
        sortOrder: 1,
        descZh: '',
        descEn: '',
        featuresZhRaw: '',
        isActive: true
      }
    }
  }
})

const handleClose = () => {
  if (isSubmitting.value) return
  emit('close')
}

const handleSubmit = async () => {
  if (!form.value.titleZh.trim()) {
    errorMessage.value = '請輸入公設中文名稱'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const featuresZh = form.value.featuresZhRaw
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      id: form.value.id.trim(),
      titleZh: form.value.titleZh.trim(),
      titleEn: form.value.titleEn.trim(),
      sortOrder: Number(form.value.sortOrder) || 1,
      descZh: form.value.descZh.trim(),
      descEn: form.value.descEn.trim(),
      featuresZh,
      isActive: form.value.isActive
    }

    const url = '/api/admin/facilities'
    const method = isEditMode.value ? 'PATCH' : 'POST'

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
      throw new Error(data.message || '儲存公設規格失敗')
    }

    emit('saved')
    emit('close')
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AdminBaseModal
    :show="show"
    :title="isEditMode ? '編輯公共設施空間規格' : '新增園區公共設施空間'"
    subtitle="設定公共休閒設施的中英文名稱、展示排序與設備亮點清單"
    :icon="Coffee"
    size="lg"
    :error-message="errorMessage"
    :loading="isSubmitting"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="modal-form">
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">設施名稱 (繁中) <span class="required">*</span></label>
          <input 
            v-model="form.titleZh" 
            type="text" 
            class="form-input" 
            placeholder="例如：Grand Lounge 奢華客廳與 KTV 視聽劇院" 
            required 
          />
        </div>
        <div class="form-group">
          <label class="form-label">設施英文名稱</label>
          <input 
            v-model="form.titleEn" 
            type="text" 
            class="form-input" 
            placeholder="例如：Grand Living Hall & Professional KTV" 
          />
        </div>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">設施代碼 (ID)</label>
          <input 
            v-model="form.id" 
            type="text" 
            class="form-input" 
            placeholder="留空系統將自動產生 (如 fac-ktv)" 
            :disabled="isEditMode"
          />
        </div>
        <div class="form-group">
          <label class="form-label">前台排序序號 (數字愈小愈靠前)</label>
          <input 
            v-model.number="form.sortOrder" 
            type="number" 
            min="1" 
            max="99" 
            class="form-input" 
            placeholder="1" 
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">設施與設備亮點清單 (Features，每行一項)</label>
        <textarea 
          v-model="form.featuresZhRaw" 
          rows="4" 
          class="form-textarea" 
          placeholder="輸入該設施的各項亮點配備，每行代表一個項目：&#10;海量最新雲端伴唱歌單&#10;雙支無線抗噪動圈麥克風&#10;高傳真立體環繞音響&#10;寬敞深座舒適真皮大沙發"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">設施詳細介紹與體驗說明 (繁中)</label>
        <textarea 
          v-model="form.descZh" 
          rows="3" 
          class="form-textarea" 
          placeholder="輸入公共設施的詳細介紹文案，呈現於官網公共設施頁面..."
        ></textarea>
      </div>

      <!-- 開放狀態 -->
      <div class="form-group">
        <label class="form-label">開放狀態 (Status)</label>
        <div class="status-choice-row">
          <button 
            type="button" 
            class="status-pill-option" 
            :class="{ active: !form.isActive }"
            @click="form.isActive = false"
          >
            <span class="dot draft"></span>
            <span class="label">暫停開放 (僅後台可見)</span>
          </button>
          <button 
            type="button" 
            class="status-pill-option" 
            :class="{ active: form.isActive }"
            @click="form.isActive = true"
          >
            <span class="dot published"></span>
            <span class="label">正常開放 (前台公開展示)</span>
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-cancel" @click="handleClose" :disabled="isSubmitting">
          取消
        </button>
        <button type="submit" class="btn-confirm" :disabled="isSubmitting">
          <Save :size="16" />
          <span>{{ isSubmitting ? '儲存中...' : (isEditMode ? '儲存規格變更' : '建立公設空間') }}</span>
        </button>
      </div>
    </form>
  </AdminBaseModal>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;
@use '../../../assets/styles/admin-media-modals' as *;
</style>
