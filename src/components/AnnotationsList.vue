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
  /** Hybrid tasks: colours for annotations whose `kind` is "document". */
  documentLabels?: LabelOption[];
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

// Hybrid tasks mark every annotation with its kind; say how many of each.
const kindCounts = computed(() => {
  if (!props.annotations.some((a) => a.kind)) return undefined;
  const documents = props.annotations.filter((a) => a.kind === "document").length;
  return { documents, spans: props.annotations.length - documents };
});

// The sentinel only exists in the DOM once loading is false (it's behind the
// v-else below), so it isn't there yet when onMounted runs the first time -
// and it unmounts/remounts as a new element each time loading toggles back
// off (e.g. after a filter change). Watching the ref (rather than observing
// once in onMounted) re-attaches to whichever element is current. The
// observer's root is the scrollable list itself, not the page viewport -
// this component doesn't own how tall its host renders it.
const root = ref<HTMLElement | null>(null);
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && visibleCount.value < props.annotations.length) {
        visibleCount.value += BATCH;
      }
    },
    { root: root.value },
  );
  if (sentinel.value) observer.observe(sentinel.value);
});
watch(sentinel, (el, oldEl) => {
  if (!observer) return;
  if (oldEl) observer.unobserve(oldEl);
  if (el) observer.observe(el);
});
onBeforeUnmount(() => observer?.disconnect());

const isNewDoc = (index: number) =>
  index === 0 || visible.value[index - 1].doc_id !== visible.value[index].doc_id;

// In a hybrid task an annotation is a document annotation by its own kind,
// whatever the task-wide level is.
const isDocumentAnnotation = (item: RichAnnotation) =>
  item.kind ? item.kind === "document" : props.documentLevel;

const labelColor = (item: RichAnnotation) => {
  const options = item.kind === "document" ? (props.documentLabels ?? []) : props.labels;
  return options.find((l) => l.name === item.label)?.color ?? "gray";
};
</script>

<template>
  <div id="iaa-annotations-list" ref="root" class="ann-list">
    <div v-if="loading" class="ann-list__loading">
      <Spinner />
    </div>
    <template v-else>
      <div class="ann-list__count">
        Annotations: {{ annotations.length >= 10000 ? "more than 10000" : annotations.length }}
        <span v-if="kindCounts" class="ann-list__kinds">
          ({{ kindCounts.spans }} span · {{ kindCounts.documents }} document)
        </span>
      </div>
      <template v-for="(item, index) in visible" :key="`${item.kind ?? '-'}_${item.ann_id}_${item.start}_${item.end}`">
        <button
          v-if="isNewDoc(index)"
          type="button"
          class="ann-list__doc-btn"
          @click="emit('open-document', { id: item.doc_id, name: item.doc_name ?? item.doc_id })"
        >
          {{ item.doc_name?.split(".")[0] ?? item.doc_id }}
        </button>
        <AnnotationCard
          :annotation="item"
          :label-color="labelColor(item)"
          :document-level="isDocumentAnnotation(item)"
        />
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
  /* The padding has to come out of the 100%, not be added to it. Without this
     the list stands 1.5rem taller than the cell holding it, and a host that
     bounds this component gets a second scrollbar outside the one here — which
     scrolls the sidebar and its buttons off the screen. */
  box-sizing: border-box;
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
.ann-list__kinds {
  font-weight: 400;
  font-size: 0.85em;
  color: var(--iaa-muted, #6b7280);
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
