<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../../composables/useI18n'
import siteData from '../../data/site.json'
import BookingButton from '../common/BookingButton.vue'
import { 
  Phone, 
  MapPin, 
  Instagram, 
  MessageSquare, 
  ShieldCheck, 
  ArrowUpRight
} from 'lucide-vue-next'

const { isEn, t } = useI18n()

const navLinks = [
  { path: '/', labelKey: 'nav.home' },
  { path: '/rooms', labelKey: 'nav.rooms' },
  { path: '/facilities', labelKey: 'nav.facilities' },
  { path: '/packages', labelKey: 'nav.packages' },
  { path: '/rules', labelKey: 'nav.rules' },
  { path: '/guide', labelKey: 'nav.guide' },
  { path: '/news', labelKey: 'nav.news' }
]

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="footer-wrapper">
    <div class="container footer-content">
      <!-- 品牌與介紹 -->
      <div class="footer-col brand-col">
        <div class="footer-brand">
          <img 
            src="/img/logo-dark.png" 
            :alt="siteData.brandNameZh" 
            class="footer-logo-img logo-dark-version" 
          />
          <img 
            src="/img/logo-white.png" 
            :alt="siteData.brandNameZh" 
            class="footer-logo-img logo-white-version" 
          />
        </div>
        <p class="footer-desc">
          {{ t('footer.aboutText') }}
        </p>
        <div class="license-tag">
          <ShieldCheck :size="15" />
          <span>{{ siteData.licenseNumber }}</span>
        </div>
      </div>

      <!-- 頁面快速導覽 -->
      <div class="footer-col nav-col">
        <h4 class="col-title">{{ isEn ? 'Navigation' : '網站導覽' }}</h4>
        <ul class="footer-links">
          <li v-for="link in navLinks" :key="link.path">
            <RouterLink :to="link.path" class="footer-link">
              {{ t(link.labelKey) }}
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- 聯絡與社群資訊 -->
      <div class="footer-col contact-col">
        <h4 class="col-title">{{ t('footer.contact') }}</h4>
        <div class="contact-list">
          <div class="contact-item">
            <MapPin :size="17" class="item-icon" />
            <span>{{ isEn ? siteData.addressEn : siteData.addressZh }}</span>
          </div>
          <div class="contact-item">
            <Phone :size="17" class="item-icon" />
            <a :href="`tel:${siteData.phone}`" class="contact-link">{{ siteData.phone }}</a>
          </div>
          <div class="contact-item">
            <MessageSquare :size="17" class="item-icon" />
            <span>LINE ID: <strong>{{ siteData.lineId }}</strong></span>
          </div>
        </div>

        <div class="social-links">
          <BookingButton 
            variant="none"
            customClass="social-btn line-btn"
            :showIcon="false"
            roomTitle="全區尊榮包棟"
            title="官方 LINE 諮詢"
          >
            <MessageSquare :size="16" />
            <span>LINE 官方預約</span>
            <ArrowUpRight :size="14" />
          </BookingButton>
          <a 
            :href="siteData.instagramUrl" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="social-btn ig-btn"
            title="官方 Instagram"
          >
            <Instagram :size="16" />
            <span>@{{ siteData.instagram }}</span>
            <ArrowUpRight :size="14" />
          </a>
        </div>
      </div>
    </div>

    <!-- 底部版權宣告 -->
    <div class="footer-bottom">
      <div class="container bottom-container">
        <p class="copyright">
          © {{ currentYear }} {{ isEn ? siteData.brandNameEn : siteData.brandNameZh }}. {{ t('footer.rights') }}
        </p>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.footer-wrapper {
  background-color: var(--bg-card);
  border-top: 1px solid var(--border-color);
  padding-top: 4.5rem;
  padding-bottom: 5.5rem; // 為手機底部常駐列預留呼吸空間

  @media (min-width: $bp-md) {
    padding-bottom: 0;
  }
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  margin-bottom: 3.5rem;

  @media (min-width: $bp-md) {
    grid-template-columns: 2fr 1fr 1.6fr;
    gap: 3.5rem;
  }
}

.footer-col {
  display: flex;
  flex-direction: column;

  .col-title {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    position: relative;
    padding-bottom: 0.5rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 24px;
      height: 2px;
      background: var(--gold-primary);
    }
  }
}

.footer-brand {
  margin-bottom: 1.5rem;

  .footer-logo-img {
    height: 52px;
    width: auto;
    object-fit: contain;
    display: block;

    @media (min-width: $bp-md) {
      height: 60px;
    }
  }

  .logo-white-version {
    display: none;
  }
  .logo-dark-version {
    display: block;
  }
}

:root[data-theme="dark"] .footer-brand {
  .logo-white-version {
    display: block;
  }
  .logo-dark-version {
    display: none;
  }
}

.footer-desc {
  font-size: 0.92rem;
  color: var(--text-sub);
  line-height: 1.8;
  margin-bottom: 1.25rem;
}

.license-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: var(--gold-primary);
  background: var(--badge-bg);
  padding: 0.35rem 0.75rem;
  border-radius: 2px;
  width: fit-content;
}

.footer-links {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;

  .footer-link {
    font-size: 0.95rem;
    color: var(--text-sub);

    &:hover {
      color: var(--gold-primary);
      padding-left: 4px;
    }
  }
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.75rem;

  .contact-item {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    font-size: 0.92rem;
    color: var(--text-sub);

    .item-icon {
      color: var(--gold-primary);
      flex-shrink: 0;
      margin-top: 3px;
    }

    .contact-link:hover {
      color: var(--gold-primary);
    }
  }
}

.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;

  .social-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.9rem;
    border-radius: 3px;
    font-size: 0.85rem;
    border: 1px solid var(--border-color);
    background: var(--bg-card);
    color: var(--text-primary);

    &:hover {
      border-color: var(--gold-primary);
      color: var(--gold-primary);
    }
  }
}

.footer-bottom {
  border-top: 1px solid var(--border-color);
  padding: 1.5rem 0;

  .bottom-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;

    @media (min-width: $bp-sm) {
      flex-direction: row;
    }
  }

  .copyright {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin: 0;
  }
}
</style>
