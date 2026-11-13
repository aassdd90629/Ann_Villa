<script setup>
import { ref } from 'vue'
import { createAdminBlock } from '../../services/adminService'
import { X, Calendar, Lock, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'block-created'])

const startDate = ref('')
const endDate = ref('')
const summary = ref('管家手動保留 (包場/清潔)')
const roomId = ref('villa-full')
const isSubmitting = ref(false)
const errorMessage = ref('')

const closeModal = () => {
  emit('update:modelValue', false)
  errorMessage.value = ''
}

const handleCreateBlock = async () => {
  errorMessage.value = ''
  if (!startDate.value || !endDate.value) {
    errorMessage.value = '請選擇起始與結束日期'
    return
  }
  if (startDate.value >= endDate.value) {
    errorMessage.value = '結束日期必須晚於起始日期'
    return
  }

  isSubmitting.value = true
  try {
    await createAdminBlock({
      roomId: roomId.value,
      startDate: startDate.value,
      endDate: endDate.value,
      summary: summary.value
    })
    emit('block-created')
    closeModal()
  } catch (err) {
    errorMessage.value = err.message || '新增鎖房失敗'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <div class="header-title">
            <Lock :size="18" class="text-gold" />
            <h3>手動檔期鎖定 (反灰保留)</h3>
          </div>
          <button class="btn-close" @click="closeModal" aria-label="Close">
            <X :size="18" />
          </button>
        </div>

        <div v-if="errorMessage" class="error-banner">
          <AlertCircle :size="16" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleCreateBlock" class="modal-form">
          <div class="form-group">
            <label class="form-label">鎖定方案</label>
            <select v-model="roomId" class="form-select">
              <option value="villa-full">山語・全區尊榮包棟 (全區鎖定)</option>
              <option value="room-01">1樓 綠意四人景觀套房</option>
              <option value="room-02">2樓 晨光雙人陽台套房</option>
              <option value="room-03">2樓 星空雙人山景套房</option>
              <option value="room-04">2樓 雲霧四人家庭套房</option>
            </select>
          </div>

          <div class="grid-dates">
            <div class="form-group">
              <label class="form-label">起始日期 (Check-in)</label>
              <input v-model="startDate" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">結束日期 (Check-out)</label>
              <input v-model="endDate" type="date" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">鎖定原因說明</label>
            <input 
              v-model="summary" 
              type="text" 
              class="form-input" 
              placeholder="例如：泳池例行消毒 / 屋主親友保留" 
              required 
            />
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="closeModal">取消</button>
            <button type="submit" class="btn-submit" :disabled="isSubmitting">
              {{ isSubmitting ? '正在鎖定中...' : '確認鎖定檔期' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  background: #151f32;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .header-title {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    h3 {
      font-size: 1.1rem;
      margin: 0;
      color: #f1f5f9;
    }

    .text-gold {
      color: var(--gold-primary, #d4af37);
    }
  }

  .btn-close {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.25rem;
    &:hover { color: #fff; }
  }
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.85rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 6px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  .grid-dates {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .form-label {
      font-size: 0.8rem;
      color: #cbd5e1;
      font-weight: 500;
    }

    .form-input, .form-select {
      padding: 0.75rem 0.85rem;
      background: #0d131f;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 6px;
      color: #fff;
      font-size: 0.9rem;
      outline: none;

      &:focus {
        border-color: var(--gold-primary, #d4af37);
      }
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1rem;

    .btn-cancel {
      padding: 0.65rem 1.2rem;
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #94a3b8;
      border-radius: 6px;
      cursor: pointer;
      &:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
    }

    .btn-submit {
      padding: 0.65rem 1.4rem;
      background: var(--gold-primary, #d4af37);
      border: none;
      color: #0d131f;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      &:hover:not(:disabled) { background: #dfbc46; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  }
}
</style>

