<script setup>
import { ref, onMounted } from 'vue'
import { 
  Image as ImageIcon, 
  UploadCloud, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Cloud, 
  X,
  Home,
  BedDouble,
  Coffee
} from 'lucide-vue-next'
import { useAdminAuth } from '../../composables/useAdminAuth'
import AdminHeroMediaTab from '../../components/admin/media/AdminHeroMediaTab.vue'
import AdminRoomMediaTab from '../../components/admin/media/AdminRoomMediaTab.vue'
import AdminFacilityMediaTab from '../../components/admin/media/AdminFacilityMediaTab.vue'
import AdminMediaUploadModal from '../../components/admin/media/AdminMediaUploadModal.vue'
import AdminMediaEditModal from '../../components/admin/media/AdminMediaEditModal.vue'

const { isViewer } = useAdminAuth()

const currentTab = ref('hero')
const isLoading = ref(false)
const feedbackMessage = ref('')
const feedbackType = ref('success')

const hasR2 = ref(false)
const counts = ref({ hero: 0, room: 0, facility: 0, total: 0 })
const heroSlides = ref([])
const roomAssets = ref([])
const facilityAssets = ref([])

// Modal 狀態
const showUploadModal = ref(false)
const uploadDefaultCategory = ref('hero')

const showEditModal = ref(false)
const selectedMediaForEdit = ref(null)

const tabs = [
  { id: 'hero', name: '首頁 Hero 輪播圖集', icon: Home },
  { id: 'room', name: '五大客房寫真', icon: BedDouble },
  { id: 'facility', name: '園區公設休閒照', icon: Coffee }
]

const fetchMediaList = async () => {
  isLoading.value = true
  feedbackMessage.value = ''
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/media', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '讀取媒體庫失敗')
    }
    hasR2.value = Boolean(data.hasR2)
    counts.value = data.counts || {}
    heroSlides.value = data.hero || []
    roomAssets.value = data.room || []
    facilityAssets.value = data.facility || []
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchMediaList()
})

const handleOpenUpload = (cat = 'hero') => {
  uploadDefaultCategory.value = cat
  showUploadModal.value = true
}

const handleOpenEdit = (item) => {
  selectedMediaForEdit.value = { ...item }
  showEditModal.value = true
}

const handleReorder = async (items) => {
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'reorder', items })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '順序更新失敗')
    }
    feedbackMessage.value = '輪播播放順序已成功更新！'
    feedbackType.value = 'success'
    fetchMediaList()
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleToggleActive = async (asset) => {
  if (isViewer.value) {
    alert('您的身分為唯讀人員，無權限切換狀態。')
    return
  }

  const nextActive = !asset.isActive
  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'toggle_active',
        id: asset.id,
        isActive: nextActive
      })
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '狀態切換失敗')
    }

    asset.isActive = nextActive
    feedbackMessage.value = `圖片「${asset.titleZh}」已成功${nextActive ? '啟用顯示' : '暫停隱藏'}！`
    feedbackType.value = 'success'
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleDelete = async (asset) => {
  if (isViewer.value) {
    alert('您的身分為唯讀人員，無權限刪除圖片。')
    return
  }

  if (!confirm(`確定要永久刪除圖片「${asset.titleZh}」嗎？若為雲端 R2 檔案亦將同步清除！`)) {
    return
  }

  try {
    const token = localStorage.getItem('shanyu_admin_token')
    const res = await fetch(`/api/admin/media?id=${encodeURIComponent(asset.id)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const data = await res.json()
    if (!res.ok || !data.success) {
      throw new Error(data.message || '刪除失敗')
    }

    feedbackMessage.value = `已成功刪除圖片「${asset.titleZh}」！`
    feedbackType.value = 'success'
    fetchMediaList()
  } catch (err) {
    feedbackMessage.value = err.message
    feedbackType.value = 'error'
  }
}

const handleModalSaved = () => {
  fetchMediaList()
  feedbackMessage.value = '媒體庫已成功更新並同步至前台！'
  feedbackType.value = 'success'
}
</script>

<template>
  <div class="admin-media-view">
    <!-- 頁面標題列 -->
    <div class="admin-page-header">
      <div class="header-left">
        <h1 class="page-title">全站圖片與媒體庫管理後台</h1>
        <p class="page-subtitle">管理首頁 Hero 輪播 11 張大圖、五大客房寫真與公設空間照，支援 Cloudflare R2 雲端儲存與極速 CDN 加速。</p>
      </div>

      <div class="header-actions">
        <!-- 雲端圖床狀態標籤 -->
        <span class="storage-badge" :class="{ r2: hasR2, local: !hasR2 }">
          <Cloud :size="14" />
          <span>{{ hasR2 ? 'Cloudflare R2 雲端儲存 (0元流量費已連線)' : '本機動態媒體儲存模式' }}</span>
        </span>

        <button type="button" class="btn-refresh" @click="fetchMediaList" :disabled="isLoading" title="重新整理">
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
        @upload="handleOpenUpload" 
        @edit="handleOpenEdit" 
        @delete="handleDelete" 
        @toggle-active="handleToggleActive" 
        @reorder="handleReorder" 
      />

      <!-- 2. 客房寫真 -->
      <AdminRoomMediaTab 
        v-else-if="currentTab === 'room'" 
        :rooms="roomAssets" 
        :is-loading="isLoading" 
        @upload="handleOpenUpload" 
        @edit="handleOpenEdit" 
        @delete="handleDelete" 
        @toggle-active="handleToggleActive" 
      />

      <!-- 3. 公設空間照 -->
      <AdminFacilityMediaTab 
        v-else-if="currentTab === 'facility'" 
        :facilities="facilityAssets" 
        :is-loading="isLoading" 
        @upload="handleOpenUpload" 
        @edit="handleOpenEdit" 
        @delete="handleDelete" 
        @toggle-active="handleToggleActive" 
      />
    </div>

    <!-- 彈窗 1：圖片上傳與自動 WebP 壓縮 -->
    <AdminMediaUploadModal 
      :show="showUploadModal" 
      :default-category="uploadDefaultCategory" 
      @close="showUploadModal = false" 
      @uploaded="handleModalSaved" 
    />

    <!-- 彈窗 2：編輯圖片資訊 -->
    <AdminMediaEditModal 
      :show="showEditModal" 
      :media-item="selectedMediaForEdit" 
      @close="showEditModal = false" 
      @saved="handleModalSaved" 
    />
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.admin-media-view { padding-bottom: 3rem; }

.admin-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;

  .page-title {
    font-size: 1.45rem;
    font-weight: 600;
    color: var(--admin-text-main, #f8fafc);
    margin: 0 0 0.4rem 0;
  }

  .page-subtitle { font-size: 0.85rem; color: var(--admin-text-muted, #94a3b8); margin: 0; }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .storage-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;

      &.r2 {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.35);
        color: #22c55e;
      }
      &.local {
        background: rgba(212, 175, 55, 0.15);
        border: 1px solid rgba(212, 175, 55, 0.35);
        color: var(--gold-primary, #d4af37);
      }
    }

    .btn-refresh {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 0.9rem;
      background: var(--admin-bg-card, #151f32);
      border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
      border-radius: 6px;
      color: var(--admin-text-main, #e2e8f0);
      font-size: 0.82rem;
      cursor: pointer;
      &:hover:not(:disabled) { border-color: var(--gold-primary, #d4af37); color: var(--gold-primary, #d4af37); }
    }
  }
}

.alert-feedback {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;

  &.success { background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); color: #22c55e; }
  &.error { background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); color: #ef4444; }

  .btn-dismiss {
    margin-left: auto;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    display: flex;
  }
}

.media-nav-tabs {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.5rem;
  padding: 0.4rem;
  background: var(--admin-bg-card, #151f32);
  border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.25));
  border-radius: 8px;
  overflow-x: auto;

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.15rem;
    border-radius: 6px;
    background: transparent;
    border: 1px solid transparent;
    color: var(--admin-text-sub, #cbd5e1);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;

    .tab-icon { color: var(--admin-text-muted, #94a3b8); }
    .count-badge {
      font-size: 0.7rem;
      background: var(--admin-bg-base, rgba(0, 0, 0, 0.3));
      padding: 0.1rem 0.4rem;
      border-radius: 10px;
      color: var(--admin-text-muted, #94a3b8);
    }

    &:hover { color: #fff; background: var(--admin-tr-hover, rgba(255, 255, 255, 0.05)); }
    &.active {
      background: rgba(212, 175, 55, 0.18);
      border-color: var(--gold-primary, #d4af37);
      color: var(--gold-primary, #d4af37);
      font-weight: 600;
      .tab-icon { color: var(--gold-primary, #d4af37); }
      .count-badge { background: var(--gold-primary, #d4af37); color: #121415; }
    }
  }
}

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .admin-page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;

    .page-title {
      font-size: 1.25rem;
    }

    .header-actions {
      justify-content: space-between;
      width: 100%;
    }
  }

  .media-nav-tabs {
    -webkit-overflow-scrolling: touch;
    padding: 0.35rem;

    .tab-btn {
      padding: 0.5rem 0.85rem;
      font-size: 0.8rem;
    }
  }
}
</style>
