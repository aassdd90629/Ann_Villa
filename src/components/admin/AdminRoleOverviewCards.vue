<script setup>
// 山語 Villa 後台人員管理 - RBAC 三大角色權限定位說明卡
</script>

<template>
  <div class="role-overview-cards">
    <div class="role-card superadmin">
      <div class="role-card-header">
        <span class="role-badge">👑 超級管理員</span>
        <span class="role-scope">SUPERADMIN</span>
      </div>
      <p class="role-desc">擁有最高控制權，可調整房價政策與連假、新增管理所有人員帳號，並查閱全部安全稽核日誌。</p>
    </div>

    <div class="role-card concierge">
      <div class="role-card-header">
        <span class="role-badge">🛎️ 駐館管家</span>
        <span class="role-scope">CONCIERGE</span>
      </div>
      <p class="role-desc">負責日常營運與接待，可查閱日曆、核銷直訂單 50% 定金、自主關房鎖房。（嚴禁修改房價與人員）</p>
    </div>

    <div class="role-card viewer">
      <div class="role-card-header">
        <span class="role-badge">👀 房務唯讀</span>
        <span class="role-scope">VIEWER</span>
      </div>
      <p class="role-desc">掌握當日房態與旅客名單，僅具備房態日曆與旅客名單查閱權限。（純唯讀，禁止任何點擊修改）</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.role-overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;

  .role-card {
    padding: 1.1rem 1.25rem;
    background: var(--admin-bg-card, #151f32);
    border: 1px solid var(--admin-border, rgba(212, 175, 55, 0.2));
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    .role-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      .role-badge {
        font-size: 0.92rem;
        font-weight: 600;
        color: var(--admin-text-main, #fff);
      }

      .role-scope {
        font-family: monospace;
        font-size: 0.72rem;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        background: var(--admin-bg-base, rgba(0, 0, 0, 0.2));
        color: var(--admin-text-muted, #94a3b8);
      }
    }

    .role-desc {
      font-size: 0.78rem;
      color: var(--admin-text-sub, #cbd5e1);
      margin: 0;
      line-height: 1.45;
    }

    &.superadmin {
      border-color: rgba(212, 175, 55, 0.35);
      .role-badge { color: var(--gold-primary, #d4af37); }
    }
    &.concierge {
      border-color: rgba(56, 189, 248, 0.35);
      .role-badge { color: #38bdf8; }
    }
    &.viewer {
      border-color: rgba(148, 163, 184, 0.35);
      .role-badge { color: #cbd5e1; }
    }
  }
}

@media (max-width: 640px) {
  .role-overview-cards {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
