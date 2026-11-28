<script setup>
import { ref, onMounted } from 'vue'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Cloud, 
  X,
  Home,
  BedDouble,
  Coffee
} from 'lucide-vue-next'
import { useAdminAuth } from '../../composables/useAdminAuth'
import { useAdminMediaManager } from '../../composables/useAdminMediaManager'
import AdminHeroMediaTab from '../../components/admin/media/AdminHeroMediaTab.vue'
import AdminRoomMediaTab from '../../components/admin/media/AdminRoomMediaTab.vue'
import AdminFacilityMediaTab from '../../components/admin/media/AdminFacilityMediaTab.vue'
import AdminHeroUploadModal from '../../components/admin/media/AdminHeroUploadModal.vue'
import AdminRoomUploadModal from '../../components/admin/media/AdminRoomUploadModal.vue'
import AdminFacilityUploadModal from '../../components/admin/media/AdminFacilityUploadModal.vue'
import AdminMediaEditModal from '../../components/admin/media/AdminMediaEditModal.vue'
import AdminRoomCategoryModal from '../../components/admin/media/AdminRoomCategoryModal.vue'
import AdminFacilityCategoryModal from '../../components/admin/media/AdminFacilityCategoryModal.vue'

const { isViewer } = useAdminAuth()
const {
  isLoading,
  feedbackMessage,
  feedbackType,
  hasR2,
  counts,
  heroSlides,
  roomAssets,
  facilityAssets,
  dbRooms,
  dbFacilities,
  fetchAllData,
  togglePhotoActive,
  deletePhoto,
  deleteRoom,
  deleteFacility,
  reorderHero
} = useAdminMediaManager()

const currentTab = ref('hero')

// 相片上傳彈窗狀態
const showHeroUploadModal = ref(false)
const showRoomUploadModal = ref(false)
const targetRoomId = ref('')
const showFacilityUploadModal = ref(false)
const targetFacilityId = ref('')

// 圖片說明編輯彈窗
const showEditModal = ref(false)
const selectedMediaForEdit = ref(null)

// 空間規格管理彈窗 (全欄位對齊前台)
const showRoomCategoryModal = ref(false)
const selectedRoomForEdit = ref(null)
const showFacilityCategoryModal = ref(false)
const selectedFacilityForEdit = ref(null)

const tabs = [
  { id: 'hero', name: '首頁 Hero 輪播圖集', icon: Home },
  { id: 'room', name: '五大客房寫真', icon: BedDouble },
  { id: 'facility', name: '園區公設休閒照', icon: Coffee }
]

onMounted(() => {
  fetchAllData()
})

// === 客房空間相關操作 ===
const handleAddRoom = () => {
  selectedRoomForEdit.value = null
  showRoomCategoryModal.value = true
}

const handleEditRoom = (room) => {
  selectedRoomForEdit.value = { ...room }
  showRoomCategoryModal.value = true
}

// === 公設空間相關操作 ===
const handleAddFacility = () => {
  selectedFacilityForEdit.value = null
  showFacilityCategoryModal.value = true
}

const handleEditFacility = (facility) => {
  selectedFacilityForEdit.value = { ...facility }
  showFacilityCategoryModal.value = true
}

// === 照片上傳彈窗開啟 (支援鎖定目標分類) ===
const handleOpenHeroUpload = () => {
  showHeroUploadModal.value = true
}

const handleOpenRoomUpload = (roomId = '') => {
  targetRoomId.value = roomId || ''
  showRoomUploadModal.value = true
}

const handleOpenFacilityUpload = (facilityId = '') => {
  targetFacilityId.value = facilityId || ''
  showFacilityUploadModal.value = true
}

// 公設別名映射表 (與 AdminFacilityMediaTab 保持一致)
const facilityAliasMap = {
  'ktv-theater': ['living-ktv', 'ktv-theater', 'ktv'],
  'smart-kitchen': ['kitchen', 'smart-kitchen', 'kitchen-bar'],
  'mahjong-room': ['mahjong', 'mahjong-room', 'fac-mahjong-01', 'fac-mahjong-02'],
  'outdoor-bbq': ['bbq', 'outdoor-bbq'],
  'tea-ceremony': ['tea', 'tea-ceremony'],
  'viewing-deck': ['viewing-deck', 'terrace']
}

// === 圖片操作 ===
const handleOpenEditPhoto = (item) => {
  selectedMediaForEdit.value = { ...item }
  showEditModal.value = true
}

const handleDeletePhoto = async (asset) => {
  if (isViewer.value) {
    alert('唯讀人員無權限刪除圖片。')
    return
  }

  if (!confirm(`確定要永久刪除圖片「${asset.titleZh}」嗎？若為雲端 R2 檔案亦將同步清除！`)) {
    return
  }

  // 1. 預先判定該照片是否為該空間分類的「最後一張照片」
  let matchedCategoryType = null // 'room' | 'facility'
  let matchedCategoryItem = null
  let isLastPhotoInCategory = false

  if (asset.category === 'room') {
    const normSub = (asset.subCategory || '').toLowerCase().replace(/^room-0?/, 'room-')
    const matchedRoom = dbRooms.value.find(r => {
      const normId = (r.id || '').toLowerCase().replace(/^room-0?/, 'room-')
      return normId === normSub || r.id === asset.subCategory || (normId === 'room-1' && asset.subCategory === 'room-01-cover')
    })

    if (matchedRoom) {
      const normRoomId = (matchedRoom.id || '').toLowerCase().replace(/^room-0?/, 'room-')
      const remaining = roomAssets.value.filter(p => {
        const pSub = (p.subCategory || '').toLowerCase().replace(/^room-0?/, 'room-')
        return pSub === normRoomId || p.subCategory === matchedRoom.id || (normRoomId === 'room-1' && p.subCategory === 'room-01-cover')
      })
      if (remaining.length === 1 && remaining[0].id === asset.id) {
        matchedCategoryType = 'room'
        matchedCategoryItem = matchedRoom
        isLastPhotoInCategory = true
      }
    }
  } else if (asset.category === 'facility') {
    const matchedFac = dbFacilities.value.find(f => {
      const aliases = facilityAliasMap[f.id] || [f.id]
      return aliases.includes(asset.subCategory)
    })

    if (matchedFac) {
      const aliases = facilityAliasMap[matchedFac.id] || [matchedFac.id]
      const remaining = facilityAssets.value.filter(p => aliases.includes(p.subCategory))
      if (remaining.length === 1 && remaining[0].id === asset.id) {
        matchedCategoryType = 'facility'
        matchedCategoryItem = matchedFac
        isLastPhotoInCategory = true
      }
    }
  }

  // 2. 執行刪除照片
  const photoDeleted = await deletePhoto(asset)
  if (!photoDeleted) return

  // 3. 若為該分類的最後一張照片，依指示詢問使用者是否順便將該空間分類一併刪除
  if (isLastPhotoInCategory && matchedCategoryItem) {
    const categoryName = matchedCategoryType === 'room'
      ? (matchedCategoryItem.titleZh || matchedCategoryItem.name || '此客房')
      : (matchedCategoryItem.titleZh || '此公共設施')
    const typeLabel = matchedCategoryType === 'room' ? '客房空間' : '公共設施空間'

    const shouldRemoveCategory = confirm(
      `此照片為「${categoryName}」${typeLabel}的最後一張照片！\n\n請問您是否要順便將「${categoryName}」空間分類一併刪除？\n\n・點選「確定」：連同此${typeLabel}一併刪除\n・點選「取消」：僅刪除照片，保留空分類方便日後補上傳`
    )

    if (shouldRemoveCategory) {
      if (matchedCategoryType === 'room') {
        await deleteRoom(matchedCategoryItem)
      } else {
        await deleteFacility(matchedCategoryItem)
      }
    }
  }
}

const handleModalSaved = () => {
  fetchAllData()
  feedbackMessage.value = '資料已成功儲存並同步至前台！'
  feedbackType.value = 'success'
}
</script>

<template>
  <div class="admin-media-view">
    <!-- 頁面標題列 -->
    <div class="admin-page-header">
      <div class="header-left">
        <h1 class="page-title">全站圖片與媒體庫管理後台</h1>
        <p class="page-subtitle">管理首頁 Hero 輪播大圖、獨立客房寫真與公設空間照，全欄位對齊前台規格並支援動態分類。</p>
      </div>

      <div class="header-actions">
        <span class="storage-badge" :class="{ r2: hasR2, local: !hasR2 }">
          <Cloud :size="14" />
          <span>{{ hasR2 ? 'Cloudflare R2 雲端儲存 (0元流量費已連線)' : '本機動態媒體儲存模式' }}</span>
        </span>

        <button type="button" class="btn-refresh" @click="fetchAllData" :disabled="isLoading" title="重新整理">
          <RefreshCw :size="15" :class="{ spinning: isLoading }" />
          <span>重新整理</span>
        </button>
      </div>
    </div>

    <!-- 訊息提示 -->
    <div v-if="feedbackMessage" :class="['alert-feedback', feedbackType]">
      <CheckCircle v-if="feedbackType === 'success'" :size="16" />
      <AlertCircle v-else :size="16" />
      <span>{{ feedbackMessage }}</span>
      <button type="button" class="btn-dismiss" @click="feedbackMessage = ''">
        <X :size="14" />
      </button>
    </div>

    <!-- 頂部頁籤列 -->
    <div class="media-nav-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        type="button" 
        class="tab-btn" 
        :class="{ active: currentTab === tab.id }"
        @click="currentTab = tab.id"
      >
        <component :is="tab.icon" :size="16" class="tab-icon" />
        <span>{{ tab.name }}</span>
        <span class="count-badge">{{ counts[tab.id] || 0 }}</span>
      </button>
    </div>

    <!-- 頁籤內容區塊 -->
    <div class="tab-content-area">
      <!-- 1. 首頁 Hero 輪播圖集 -->
      <AdminHeroMediaTab 
        v-if="currentTab === 'hero'" 
        :slides="heroSlides" 
        :is-loading="isLoading" 
        @upload="handleOpenHeroUpload" 
        @edit="handleOpenEditPhoto" 
        @delete="handleDeletePhoto" 
        @toggle-active="togglePhotoActive" 
        @reorder="reorderHero" 
      />

      <!-- 2. 客房寫真 (傳入真實 rooms 與 photos) -->
      <AdminRoomMediaTab 
        v-else-if="currentTab === 'room'" 
        :rooms="dbRooms" 
        :photos="roomAssets" 
        :is-loading="isLoading" 
        @upload="handleOpenRoomUpload" 
        @edit-photo="handleOpenEditPhoto" 
        @delete-photo="handleDeletePhoto" 
        @toggle-photo-active="togglePhotoActive" 
        @add-room="handleAddRoom" 
        @edit-room="handleEditRoom" 
      />

      <!-- 3. 公設空間照 (傳入真實 facilities 與 photos) -->
      <AdminFacilityMediaTab 
        v-else-if="currentTab === 'facility'" 
        :facilities="dbFacilities" 
        :photos="facilityAssets" 
        :is-loading="isLoading" 
        @upload="handleOpenFacilityUpload" 
        @edit-photo="handleOpenEditPhoto" 
        @delete-photo="handleDeletePhoto" 
        @toggle-photo-active="togglePhotoActive" 
        @add-facility="handleAddFacility" 
        @edit-facility="handleEditFacility" 
      />
    </div>

    <!-- 彈窗 1：首頁 Hero 輪播大圖上傳 -->
    <AdminHeroUploadModal 
      :show="showHeroUploadModal" 
      @close="showHeroUploadModal = false" 
      @uploaded="handleModalSaved" 
    />

    <!-- 彈窗 2：客房寫真照片上傳 (鎖定指定房型，傳入真實客房清單防雜訊) -->
    <AdminRoomUploadModal 
      :show="showRoomUploadModal" 
      :target-room-id="targetRoomId" 
      :existing-rooms="dbRooms" 
      @close="showRoomUploadModal = false" 
      @uploaded="handleModalSaved" 
    />

    <!-- 彈窗 3：公設休閒照片上傳 (鎖定指定公設，傳入真實公設清單防雜訊) -->
    <AdminFacilityUploadModal 
      :show="showFacilityUploadModal" 
      :target-facility-id="targetFacilityId" 
      :existing-facilities="dbFacilities" 
      @close="showFacilityUploadModal = false" 
      @uploaded="handleModalSaved" 
    />

    <!-- 彈窗 4：編輯既有圖片資訊 -->
    <AdminMediaEditModal 
      :show="showEditModal" 
      :media-item="selectedMediaForEdit" 
      @close="showEditModal = false" 
      @saved="handleModalSaved" 
    />

    <!-- 彈窗 5：全欄位客房空間規格管理 (新增/編輯) -->
    <AdminRoomCategoryModal 
      :show="showRoomCategoryModal" 
      :room-item="selectedRoomForEdit" 
      @close="showRoomCategoryModal = false" 
      @saved="handleModalSaved" 
    />

    <!-- 彈窗 6：全欄位公設空間規格管理 (新增/編輯) -->
    <AdminFacilityCategoryModal 
      :show="showFacilityCategoryModal" 
      :facility-item="selectedFacilityForEdit" 
      @close="showFacilityCategoryModal = false" 
      @saved="handleModalSaved" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-media-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.admin-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  .header-left {
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
      margin-bottom: 0.25rem;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary, #64748b);
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .storage-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.75rem;
      font-size: 0.8rem;
      border-radius: 999px;
      font-weight: 500;

      &.r2 {
        background: rgba(245, 158, 11, 0.12);
        color: #d97706;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      &.local {
        background: var(--bg-hover, #f1f5f9);
        color: var(--text-secondary, #64748b);
        border: 1px solid var(--border-color, #cbd5e1);
      }
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.85rem;
      font-size: 0.85rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: $radius-sm;
      background: var(--bg-card, #ffffff);
      color: var(--text-primary, #1e293b);
      cursor: pointer;

      &:hover:not(:disabled) {
        background: var(--bg-hover, #f8fafc);
        border-color: var(--gold-primary, #b89047);
      }

      .spinning {
        animation: spin 1s linear infinite;
      }
    }
  }
}

.alert-feedback {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border-radius: $radius-sm;
  font-size: 0.9rem;

  &.success {
    background: #dcfce7;
    border: 1px solid #86efac;
    color: #15803d;
  }

  &.error {
    background: #fee2e2;
    border: 1px solid #fca5a5;
    color: #b91c1c;
  }

  .btn-dismiss {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    padding: 0.2rem;
  }
}

.media-nav-tabs {
  display: flex;
  gap: 0.5rem;
  border-bottom: 2px solid var(--border-color, #e2e8f0);

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-secondary, #64748b);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color $transition-fast, border-color $transition-fast;

    &:hover {
      color: var(--text-primary, #1e293b);
    }

    &.active {
      color: var(--gold-primary, #b89047);
      border-bottom-color: var(--gold-primary, #b89047);
    }

    .count-badge {
      font-size: 0.75rem;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      background: var(--bg-hover, #f1f5f9);
      color: var(--text-secondary, #475569);
    }
  }
}

.tab-content-area {
  min-height: 400px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
