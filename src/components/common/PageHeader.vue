<script setup>
defineProps({
  tag: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <section class="page-header">
    <div class="container header-container">
      <span v-if="tag" class="section-tag">{{ tag }}</span>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="desc" class="page-desc">{{ desc }}</p>
      <slot />
    </div>
  </section>
</template>

<style lang="scss" scoped>
@use '../../assets/styles/variables' as *;

.page-header {
  padding-top: 8.5rem;
  padding-bottom: 3.5rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  text-align: center;

  .header-container {
    max-width: 800px;
  }

  .page-title {
    font-size: clamp(2rem, 4vw, 3rem);
    margin: 0.8rem 0;
  }

  .page-desc {
    font-size: 1rem;
    color: var(--text-sub);
    line-height: 1.8;
  }
}
</style>
