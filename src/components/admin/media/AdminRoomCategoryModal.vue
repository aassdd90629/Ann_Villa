<script setup>
import { ref, watch, computed } from 'vue'
import { Save, BedDouble } from 'lucide-vue-next'
import AdminBaseModal from '../common/AdminBaseModal.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  roomItem: { type: Object, default: null }
})

const emit = defineEmits(['close', 'saved'])

const isEditMode = computed(() => Boolean(props.roomItem && props.roomItem.id))
const isSubmitting = ref(false)
const errorMessage = ref('')

const form = ref({
  id: '',
  titleZh: '',
  titleEn: '',
  subtitleZh: '',
  subtitleEn: '',
  floor: '1F',
  capacityZh: '4 人',
  capacityEn: '4 Guests',
  capacityStandard: 4,
  capacityMax: 4,
  bedTypeZh: '',
  bedTypeEn: '',
  size: '',
  basePrice: 8800,
  holidayPrice: 10800,
  descZh: '',
  descEn: '',
  highlightsZhRaw: '',
  isActive: true
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    errorMessage.value = ''
    if (props.roomItem) {
      const item = props.roomItem
      form.value = {
        id: item.id || '',
        titleZh: item.titleZh || item.name || '',
        titleEn: item.titleEn || '',
        subtitleZh: item.subtitleZh || item.subtitle || '',
        subtitleEn: item.subtitleEn || '',
        floor: item.floor || '1F',
        capacityZh: item.capacityZh || '4 人',
        capacityEn: item.capacityEn || '4 Guests',
        capacityStandard: item.capacityStandard ?? 4,
        capacityMax: item.capacityMax ?? 4,
        bedTypeZh: item.bedTypeZh || '',
        bedTypeEn: item.bedTypeEn || '',
        size: item.size || item.sizeInfo || '',
        basePrice: item.basePrice ?? 8800,
        holidayPrice: item.holidayPrice ?? 10800,
        descZh: item.descZh || '',
        descEn: item.descEn || '',
        highlightsZhRaw: Array.isArray(item.highlightsZh) ? item.highlightsZh.join('\n') : '',
        isActive: item.isActive !== undefined ? Boolean(item.isActive) : true
      }
    } else {
      form.value = {
        id: '',
        titleZh: '',
        titleEn: '',
        subtitleZh: '',
        subtitleEn: '',
        floor: '1F',
        capacityZh: '4 人',
        capacityEn: '4 Guests',
        capacityStandard: 4,
        capacityMax: 4,
        bedTypeZh: '',
        bedTypeEn: '',
        size: '',
        basePrice: 8800,
        holidayPrice: 10800,
        descZh: '',
        descEn: '',
        highlightsZhRaw: '',
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
    errorMessage.value = '請輸入房型名稱 (繁中)'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const highlightsZh = form.value.highlightsZhRaw
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      id: form.value.id.trim(),
      titleZh: form.value.titleZh.trim(),
      titleEn: form.value.titleEn.trim(),
      subtitleZh: form.value.subtitleZh.trim(),
      subtitleEn: form.value.subtitleEn.trim(),
      floor: form.value.floor.trim(),
      capacityZh: form.value.capacityZh.trim(),
      capacityEn: form.value.capacityEn.trim(),
      capacityStandard: Number(form.value.capacityStandard),
      capacityMax: Number(form.value.capacityMax),
      bedTypeZh: form.value.bedTypeZh.trim(),
      bedTypeEn: form.value.bedTypeEn.trim(),
      size: form.value.size.trim(),
      basePrice: Number(form.value.basePrice),
      holidayPrice: Number(form.value.holidayPrice),
      descZh: form.value.descZh.trim(),
      descEn: form.value.descEn.trim(),
      highlightsZh,
      isActive: form.value.isActive
    }

    const url = '/api/admin/rooms'
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
      throw new Error(data.message || '儲存客房規格失敗')
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
    :title="isEditMode ? '編輯客房空間規格' : '新增特色獨立客房'"
    subtitle="設定房型中英文名稱、樓層、床型配置、參考定價與特色亮點"
    :icon="BedDouble"
    size="lg"
    :error-message="errorMessage"
    :loading="isSubmitting"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="modal-form">
      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">房型名稱 (繁中) <span class="required">*</span></label>
          <input 
            v-model="form.titleZh" 
            type="text" 
            class="form-input" 
            placeholder="例如：1樓 綠意四人景觀套房" 
            required 
          />
        </div>
        <div class="form-group">
          <label class="form-label">房型英文名稱</label>
          <input 
            v-model="form.titleEn" 
            type="text" 
            class="form-input" 
            placeholder="例如：1F Garden View Quad Suite" 
          />
        </div>
      </div>

      <div class="form-row-3">
        <div class="form-group">
          <label class="form-label">樓層</label>
          <select v-model="form.floor" class="form-select">
            <option value="1F">1F</option>
            <option value="2F">2F</option>
            <option value="3F">3F</option>
            <option value="獨棟">獨棟</option>
            <option value="戶外">戶外</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">客房唯一代碼 (ID)</label>
          <input 
            v-model="form.id" 
            type="text" 
            class="form-input" 
            placeholder="留空系統將自動產生 (如 room-01)" 
            :disabled="isEditMode"
          />
        </div>
        <div class="form-group">
          <label class="form-label">坪數資訊</label>
          <input 
            v-model="form.size" 
            type="text" 
            class="form-input" 
            placeholder="例如：約 12 坪" 
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">空間副標題 / 重點特色簡介</label>
        <input 
          v-model="form.subtitleZh" 
          type="text" 
          class="form-input" 
          placeholder="例如：1樓無障礙動線・大面綠意窗景・獨立乾濕分離衛浴" 
        />
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">床型配置描述 (繁中)</label>
          <input 
            v-model="form.bedTypeZh" 
            type="text" 
            class="form-input" 
            placeholder="例如：加大雙人床 (Queen Size) x 1 + 標準雙人床 x 1" 
          />
        </div>
        <div class="form-group">
          <label class="form-label">容納人數文字</label>
          <input 
            v-model="form.capacityZh" 
            type="text" 
            class="form-input" 
            placeholder="例如：4 人 (或 2-4 人)" 
          />
        </div>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label class="form-label">平日參考定價 (NT$)</label>
          <input 
            v-model.number="form.basePrice" 
            type="number" 
            class="form-input" 
            placeholder="8800" 
          />
        </div>
        <div class="form-group">
          <label class="form-label">假日參考定價 (NT$)</label>
          <input 
            v-model.number="form.holidayPrice" 
            type="number" 
            class="form-input" 
            placeholder="10800" 
          />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">特色亮點清單 (Highlights，每行一項)</label>
        <textarea 
          v-model="form.highlightsZhRaw" 
          rows="3" 
          class="form-textarea" 
          placeholder="輸入房型重點設施，每一行代表一個項目：&#10;位於1樓無障礙友善動線&#10;大面採光觀景窗，盡攬綠意山林晨光&#10;獨立乾濕分離衛浴與草本洗沐備品"
        ></textarea>
      </div>

      <div class="form-group">
        <label class="form-label">房型詳細介紹與空間意境描述 (繁中)</label>
        <textarea 
          v-model="form.descZh" 
          rows="3" 
          class="form-textarea" 
          placeholder="輸入房型的完整介紹文案，呈現於官網客房規格頁面..."
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
          <span>{{ isSubmitting ? '儲存中...' : (isEditMode ? '儲存規格變更' : '建立客房空間') }}</span>
        </button>
      </div>
    </form>
  </AdminBaseModal>
</template>

<style lang="scss" scoped>
@use '../../../assets/styles/variables' as *;
@use '../../../assets/styles/admin-media-modals' as *;
</style>
