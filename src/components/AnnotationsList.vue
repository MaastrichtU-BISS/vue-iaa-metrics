<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { LabelOption, RichAnnotation } from "../types";
import AnnotationCard from "./AnnotationCard.vue";
import Spinner from "./Spinner.vue";

// The browsable, filtered annotation list — grouped by document. Renders
// eagerly up to a batch, then grows via an IntersectionObserver sentinel as
// the user scrolls, instead of a virtual-scroll dependency.
const props = defineProps<{
  annotations: RichAnnotation[];
  labels: LabelOption[];
  loading: boolean;
  documentLevel: boolean;
}>();

const emit = defineEmits<{ "open-document": [doc: { id: string; name: string }] }>();

const BATCH = 300;
const visibleCount = ref(BATCH);
watch(
  () => props.annotations,
  () => {
    visibleCount.value = BATCH;
  },
);

const visible = computed(() => props.annotations.slice(0, visibleCount.value));

const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && visibleCount.value < props.annotations.length) {
      visibleCount.value += BATCH;
    }
  });
  if (sentinel.value) observer.observe(sentinel.value);
});
onBeforeUnmount(() => observer?.disconnect());

const isNewDoc = (index: number) =>
  index === 0 || visible.value[index - 1].doc_id !== visible.value[index].doc_id;

const labelColor = (label: string) => props.labels.find((l) => l.name === label)?.color ?? "gray";
</script>

<template>
  <div id="iaa-annotations-list" class="ann-list">
    <div v-if="loading" class="ann-list__loading">
      <Spinner />
    </div>
    <template v-else>
      <div class="ann-list__count">
        Annotations: {{ annotations.length >= 10000 ? "more than 10000" : annotations.length }}
      </div>
      <template v-for="(item, index) in visible" :key="`${item.ann_id}_${item.start}_${item.end}`">
        <button
          v-if="isNewDoc(index)"
          type="button"
          class="ann-list__doc-btn"
          @click="emit('open-document', { id: item.doc_id, name: item.doc_name ?? item.doc_id })"
        >
          {{ item.doc_name?.split(".")[0] ?? item.doc_id }}
        </button>
        <AnnotationCard :annotation="item" :label-color="labelColor(item.label)" :document-level="documentLevel" />
      </template>
      <div v-if="!annotations.length" class="ann-list__empty">No annotations match these filters.</div>
      <div ref="sentinel" class="ann-list__sentinel" />
      <a href="#iaa-annotations-list" class="ann-list__up" aria-label="Go up">↑</a>
    </template>
  </div>
</template>

<style scoped>
.ann-list {
  position: relative;
  height: 100%;
  overflow-y: auto;
  padding: 0.75rem;
}
.ann-list__loading {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}
.ann-list__count {
  font-size: 1.1rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.75rem;
}
.ann-list__doc-btn {
  display: block;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--iaa-accent, #1e4e79);
  background: transparent;
  border: 1px solid var(--iaa-accent, #1e4e79);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  margin: 0.75rem 0 0.4rem;
  cursor: pointer;
}
.ann-list__doc-btn:hover {
  background: color-mix(in srgb, var(--iaa-accent, #1e4e79) 8%, transparent);
}
.ann-list__empty {
  text-align: center;
  color: var(--iaa-muted, #6b7280);
  padding: 2rem 0;
}
.ann-list__sentinel {
  height: 1px;
}
.ann-list__up {
  position: sticky;
  bottom: 0.75rem;
  left: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 999px;
  background: var(--iaa-accent, #1e4e79);
  color: #fff;
  text-decoration: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
</style>
