<script setup lang="ts">
import type { LabelOption } from "../types";

defineProps<{ label: LabelOption }>();
</script>

<template>
  <span
    class="chip"
    :style="{ backgroundColor: `${label.color}26`, borderLeft: `4px solid ${label.color}` }"
  >
    {{ label.name }}
  </span>
</template>

<style scoped>
.chip {
  display: inline-block;
  max-width: 100%;
  padding: 0.15rem 0.55rem;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}
</style>
