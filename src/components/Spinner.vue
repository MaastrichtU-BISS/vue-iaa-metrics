<script setup lang="ts">
defineProps<{ size?: number }>();
</script>

<template>
  <span
    class="spinner"
    role="status"
    aria-label="Loading"
    :style="{ width: `${size ?? 32}px`, height: `${size ?? 32}px` }"
  />
</template>

<style scoped>
.spinner {
  display: inline-block;
  border: 3px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
  border-top-color: var(--iaa-accent, #1e4e79);
  border-radius: 50%;
  animation: iaa-spin 0.7s linear infinite;
}
@keyframes iaa-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
