<script setup>
import { ref, watch, computed } from 'vue'
import { X, Layers, Check, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  category: { type: Object, default: null } // 若為 null 則為新增
})

const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => Boolean(props.category && props.category.id))

const id = ref('')
const nameZh = ref('')
const nameEn = ref('')
const tagZh = ref('')
const tagEn = ref('')
const icon = ref('Compass')
const sortOrder = ref(1)
const isActive = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')

const availableIcons = [
  { id: 'Compass', label: '指南針 (Compass - 適合私房景點)' },
  { id: 'UtensilsCrossed', label: '刀叉 (Utensils - 適合在地美食)' },
  { id: 'Trees', label: '森林樹木 (Trees - 適合自然步道)' },
  { id: 'Sparkles', label: '閃耀星星 (Sparkles - 適合精選推薦)' },
  { id: 'Coffee', label: '咖啡杯 (Coffee - 適合下午茶/甜點)' },
  { id: 'Camera', label: '相機 (Camera - 適合網美拍照打卡)' },
  { id: 'MapPin', label: '地圖圖釘 (MapPin - 適合探索導覽)' },
  { id: 'Store', label: '特色小店 (Store - 適合伴手禮/市集)' }
]

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    if (props.category) {
      id.value = props.category.id || ''
      nameZh.value = props.category.nameZh || ''
      nameEn.value = props.category.nameEn || ''
      tagZh.value = props.category.tagZh || ''
      tagEn.value = props.category.tagEn || ''
      icon.value = props.category.icon || 'Compass'
      sortOrder.value = props.category.sortOrder || 1
      isActive.value = props.category.isActive !== false
    } else {
      id.value = ''
      nameZh.value = ''
      nameEn.value = ''
      tagZh.value = ''
      tagEn.value = ''
      icon.value = 'Compass'
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
    errorMessage.value = '請填寫膠囊分類名稱 (繁中)。'
    return
  }

  isLoading.value = true

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const url = '/api/admin/guide'
    const method = isEdit.value ? 'PATCH' : 'POST'

    const payload = isEdit.value
      ? {
          action: 'update_category',
          category: {
            id: props.category.id,
            nameZh: nameZh.value.trim(),
            nameEn: nameEn.value.trim(),
            tagZh: tagZh.value.trim(),
            tagEn: tagEn.value.trim(),
            icon: icon.value,
            sortOrder: Number(sortOrder.value) || 1,
            isActive: isActive.value
          }
        }
      : {
          action: 'create_category',
          category: {
            id: id.value.trim() ? id.value.trim().toLowerCase() : undefined,
            nameZh: nameZh.value.trim(),
            nameEn: nameEn.value.trim(),
            tagZh: tagZh.value.trim(),
            tagEn: tagEn.value.trim(),
            icon: icon.value,
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
      throw new Error(data.message || '儲存膠囊分類失敗')
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
            <Layers :size="20" class="gold-icon" />
            <h3>{{ isEdit ? '編輯周邊導覽膠囊分類' : '新增周邊導覽膠囊分類' }}</h3>
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
              <label class="form-label">
                分類識別代碼 (Slug)
                <span v-if="!isEdit" class="hint-text">(英文小寫，留空自動產生)</span>
              </label>
              <input 
                v-model="id" 
                type="text" 
                class="form-input font-mono" 
                placeholder="例如：farm、nature" 
                :disabled="isEdit"
              />
            </div>

            <div class="form-group">
              <label class="form-label">排序權重</label>
              <input v-model.number="sortOrder" type="number" min="1" max="99" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">膠囊分類名稱 (繁中) <span class="required">*</span></label>
            <input v-model="nameZh" type="text" class="form-input" placeholder="例如：觀光果園・採果體驗" required />
          </div>

          <div class="form-group">
            <label class="form-label">膠囊分類名稱 (英文，選填)</label>
            <input v-model="nameEn" type="text" class="form-input" placeholder="e.g. Tourist Orchards" />
          </div>

          <div class="form-group">
            <label class="form-label">前台區塊副標籤 (繁中)</label>
            <input v-model="tagZh" type="text" class="form-input" placeholder="例如：四季鮮果採收・親子同樂" />
          </div>

          <div class="form-group">
            <label class="form-label">膠囊按鈕代表圖示</label>
            <select v-model="icon" class="form-input">
              <option v-for="opt in availableIcons" :key="opt.id" :value="opt.id">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="isActive" />
              <span>立即啟用顯示於前台膠囊列</span>
            </label>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn-cancel" @click="handleClose" :disabled="isLoading">取消</button>
            <button type="submit" class="btn-confirm" :disabled="isLoading">
              <Check v-if="!isLoading" :size="16" />
              <span>{{ isLoading ? '儲存中...' : (isEdit ? '儲存變更' : '建立分類') }}</span>
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
  width: 100%; max-width: 520px; background: var(--admin-bg-card, #151f32);
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
  padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem;
}

.form-group {
  display: flex; flex-direction: column; gap: 0.4rem;
  .form-label {
    font-size: 0.82rem; font-weight: 500; color: var(--admin-text-sub, #cbd5e1);
    .required { color: #ef4444; margin-left: 0.2rem; }
    .hint-text { font-size: 0.75rem; color: var(--admin-text-muted, #94a3b8); font-weight: normal; margin-left: 0.3rem; }
  }
  .form-input {
    width: 100%; padding: 0.7rem 0.85rem; background: var(--admin-input-bg, rgba(13, 19, 31, 0.8));
    border: 1px solid var(--admin-input-border, rgba(212, 175, 55, 0.25)); border-radius: 6px;
    color: var(--admin-text-main, #fff); font-size: 0.9rem; outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:focus { border-color: var(--gold-primary, #d4af37); box-shadow: 0 0 8px rgba(212, 175, 55, 0.25); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &.font-mono { font-family: monospace; font-size: 0.82rem; }
  }
}

.form-row-2 {
  display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; align-items: center;
}

.checkbox-group {
  padding-top: 0.25rem;
  .checkbox-label {
    display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem;
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
