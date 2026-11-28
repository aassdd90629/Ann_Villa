<script setup>
import { ref, watch, computed } from 'vue'
import { X, MapPin, Check, AlertCircle } from 'lucide-vue-next'
import AdminImageUploadField from '../common/AdminImageUploadField.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  item: { type: Object, default: null }, // 若為 null 則為新增
  categories: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => Boolean(props.item && props.item.id))

const type = ref('attraction')
const nameZh = ref('')
const nameEn = ref('')
const locationZh = ref('苗栗縣卓蘭鎮')
const locationEn = ref('Zhuolan Township, Miaoli')
const tagZh = ref('')
const tagEn = ref('')
const descZh = ref('')
const descEn = ref('')
const noticeZh = ref('')
const noticeEn = ref('')
const image = ref('')
const parking = ref(true)
const sortOrder = ref(1)
const isActive = ref(true)

const isLoading = ref(false)
const errorMessage = ref('')
const defaultSpotImg = '/img/scenery-night/scenery-night-02.webp'

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    imagePreviewError.value = false
    if (props.item) {
      type.value = props.item.type || 'attraction'
      nameZh.value = props.item.nameZh || ''
      nameEn.value = props.item.nameEn || ''
      locationZh.value = props.item.locationZh || ''
      locationEn.value = props.item.locationEn || ''
      tagZh.value = props.item.tagZh || ''
      tagEn.value = props.item.tagEn || ''
      descZh.value = props.item.descZh || ''
      descEn.value = props.item.descEn || ''
      noticeZh.value = props.item.noticeZh || ''
      noticeEn.value = props.item.noticeEn || ''
      image.value = props.item.image || ''
      parking.value = props.item.parking !== false
      sortOrder.value = props.item.sortOrder || 1
      isActive.value = props.item.isActive !== false
    } else {
      type.value = props.categories.length > 0 ? props.categories[0].id : 'attraction'
      nameZh.value = ''
      nameEn.value = ''
      locationZh.value = '苗栗縣卓蘭鎮'
      locationEn.value = 'Zhuolan Township, Miaoli'
      tagZh.value = ''
      tagEn.value = ''
      descZh.value = ''
      descEn.value = ''
      noticeZh.value = ''
      noticeEn.value = ''
      image.value = defaultSpotImg
      parking.value = true
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

  if (!nameZh.value.trim()) {
    errorMessage.value = '請填寫項目名稱 (繁中)。'
    return
  }
  if (!type.value) {
    errorMessage.value = '請選擇所屬膠囊分類。'
    return
  }

  isLoading.value = true

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const url = '/api/admin/guide'
    const method = isEdit.value ? 'PATCH' : 'POST'

    const payload = isEdit.value
      ? {
          action: 'update_item',
          item: {
            id: props.item.id,
            type: type.value,
            nameZh: nameZh.value.trim(),
            nameEn: nameEn.value.trim(),
            locationZh: locationZh.value.trim(),
            locationEn: locationEn.value.trim(),
            tagZh: tagZh.value.trim(),
            tagEn: tagEn.value.trim(),
            descZh: descZh.value.trim(),
            descEn: descEn.value.trim(),
            noticeZh: noticeZh.value.trim(),
            noticeEn: noticeEn.value.trim(),
            image: image.value.trim(),
            parking: parking.value,
            sortOrder: Number(sortOrder.value) || 1,
            isActive: isActive.value
          }
        }
      : {
          action: 'create_item',
          item: {
            type: type.value,
            nameZh: nameZh.value.trim(),
            nameEn: nameEn.value.trim(),
            locationZh: locationZh.value.trim(),
            locationEn: locationEn.value.trim(),
            tagZh: tagZh.value.trim(),
            tagEn: tagEn.value.trim(),
            descZh: descZh.value.trim(),
            descEn: descEn.value.trim(),
            noticeZh: noticeZh.value.trim(),
            noticeEn: noticeEn.value.trim(),
            image: image.value.trim(),
            parking: parking.value,
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
      throw new Error(data.message || '儲存景點項目失敗')
    }

    emit('saved')
    emit('close')
  } catch (err) {
    errorMessage.value = err.message || '儲存失敗，請檢查資料或稍後再試。'
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
            <MapPin :size="20" class="gold-icon" />
            <h3>{{ isEdit ? '編輯周邊推薦項目' : '新增周邊推薦項目' }}</h3>
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
          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">所屬膠囊分類 <span class="required">*</span></label>
              <select v-model="type" class="form-input" required>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.nameZh }} ({{ cat.id }})
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">排序權重</label>
              <input v-model.number="sortOrder" type="number" min="1" max="99" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">景點或美食名稱 (繁中) <span class="required">*</span></label>
            <input v-model="nameZh" type="text" class="form-input" placeholder="例如：卓蘭大峽谷、鵝肉擔客家菜" required />
          </div>

          <div class="form-group">
            <label class="form-label">景點或美食名稱 (英文，選填)</label>
            <input v-model="nameEn" type="text" class="form-input" placeholder="e.g. Zhuolan Grand Canyon" />
          </div>

          <div class="form-row-2">
            <div class="form-group">
              <label class="form-label">地理位置 (例如：苗栗縣卓蘭鎮)</label>
              <input v-model="locationZh" type="text" class="form-input" placeholder="苗栗縣卓蘭鎮" />
            </div>

            <div class="form-group">
              <label class="form-label">特色亮點標籤</label>
              <input v-model="tagZh" type="text" class="form-input" placeholder="例如：地質景觀・壯麗雲海" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">景點詳細介紹 (繁中)</label>
            <textarea v-model="descZh" rows="3" class="form-textarea" placeholder="詳細介紹景點特色、氛圍與必訪體驗..."></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">參觀須知或營業提醒 (Notice)</label>
            <input v-model="noticeZh" type="text" class="form-input" placeholder="例如：需事先電話預約、每週二公休..." />
          </div>

          <AdminImageUploadField 
            v-model="image" 
            category="guide"
            label="封面照片"
            :default-image="defaultSpotImg"
            default-button-text="帶入預設風景美照"
          />

          <div class="form-row-2">
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="parking" />
                <span>🚗 附設貴賓免費停車位</span>
              </label>
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
              <span>{{ isLoading ? '儲存中...' : (isEdit ? '儲存變更' : '新增項目') }}</span>
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
  background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}

.admin-modal-container {
  width: 100%; max-width: 580px; max-height: 90vh; background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.35));
  border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  display: flex; flex-direction: column; overflow: hidden;
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));
  .header-title-group {
    display: flex; align-items: center; gap: 0.6rem;
    .gold-icon { color: var(--gold-primary, #d4af37); }
    h3 { font-size: 1.15rem; font-weight: 600; color: var(--admin-text-main, #f8fafc); margin: 0; }
  }
  .btn-close {
    background: transparent; border: none; color: var(--admin-text-muted, #94a3b8);
    cursor: pointer; padding: 0.3rem; border-radius: 4px; display: flex; align-items: center;
    &:hover:not(:disabled) { color: var(--admin-text-main, #fff); background: var(--admin-tr-hover, rgba(255, 255, 255, 0.08)); }
  }
}

.modal-alert {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
  margin: 1rem 1.5rem 0; border-radius: 6px; font-size: 0.85rem;
  &.error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
}

.modal-form {
  padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.9rem; overflow-y: auto;
}

.form-group {
  display: flex; flex-direction: column; gap: 0.35rem;
  .form-label {
    font-size: 0.82rem; font-weight: 500; color: var(--admin-text-sub, #cbd5e1);
    .required { color: #ef4444; margin-left: 0.2rem; }
  }
  .form-input, .form-textarea {
    width: 100%; padding: 0.65rem 0.85rem; background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
    border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25)); border-radius: 6px;
    color: var(--admin-text-main, #fff); font-size: 0.88rem; outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:focus { border-color: var(--gold-primary, #d4af37); box-shadow: 0 0 8px rgba(212, 175, 55, 0.25); }
    &.font-mono { font-family: monospace; font-size: 0.8rem; }
  }
  .form-textarea { resize: vertical; line-height: 1.5; }
}

.form-row-2 {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; align-items: center;
}

.checkbox-group {
  padding-top: 0.25rem;
  .checkbox-label {
    display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.82rem;
    color: var(--admin-text-sub, #cbd5e1); cursor: pointer;
    input[type="checkbox"] { accent-color: var(--gold-primary, #d4af37); }
  }
}

.modal-footer {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
  padding-top: 0.75rem; border-top: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.08));
  .btn-cancel {
    padding: 0.65rem 1.25rem; background: transparent;
    border: 1px solid var(--admin-border-subtle, rgba(255, 255, 255, 0.2));
    border-radius: 6px; color: var(--admin-text-sub, #cbd5e1); font-size: 0.85rem; cursor: pointer;
    &:hover:not(:disabled) { background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05)); color: var(--admin-text-main, #fff); }
  }
  .btn-confirm {
    display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.65rem 1.4rem;
    background: var(--gold-primary, #d4af37); border: 1px solid var(--gold-primary, #d4af37);
    border-radius: 6px; color: #121415; font-weight: 600; font-size: 0.85rem; cursor: pointer;
    transition: background-color 0.2s ease;
    &:hover:not(:disabled) { background: #dfbc46; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}
</style>
