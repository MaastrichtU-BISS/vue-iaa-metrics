<script setup lang="ts">
import { computed } from "vue";

// Read-only star display — the metrics page only ever shows confidence
// ratings, never edits them.
const props = defineProps<{ value: number; max?: number }>();

const stars = computed(() => Array.from({ length: props.max ?? 5 }, (_, i) => i + 1));
const filled = computed(() => Math.round(props.value));
</script>

<template>
  <span class="stars" aria-hidden="true">
    <span v-for="i in stars" :key="i" class="star" :class="{ 'star--on': i <= filled }">★</span>
  </span>
</template>

<style scoped>
.stars {
  display: inline-flex;
  gap: 1px;
  line-height: 1;
}
.star {
  color: var(--iaa-star-empty, #d2cece);
  font-size: 0.9em;
}
.star--on {
  color: var(--iaa-star-on, #f5b301);
}
</style>
