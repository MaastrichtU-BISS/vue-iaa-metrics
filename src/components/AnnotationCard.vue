<script setup lang="ts">
import { ref } from "vue";
import type { RichAnnotation } from "../types";
import LabelChip from "./LabelChip.vue";
import StarRating from "./StarRating.vue";

const props = defineProps<{
  annotation: RichAnnotation;
  labelColor: string;
  /** Document-level tasks have no span text to show/collapse. */
  documentLevel: boolean;
}>();

const annotated = props.annotation.label !== "NOT ANNOTATED";
const clickable = !props.documentLevel && annotated;
// Span-level: expanded by default once annotated, collapsed otherwise (there's
// nothing meaningful to show yet). Document-level: no body at all.
const collapsed = ref(props.documentLevel || !annotated);
const toggle = () => {
  if (clickable) collapsed.value = !collapsed.value;
};
</script>

<template>
  <div class="ann-card">
    <div
      class="ann-card__header"
      :class="{ 'ann-card__header--clickable': clickable }"
      :role="clickable ? 'button' : undefined"
      :tabindex="clickable ? 0 : undefined"
      @click="toggle"
      @keydown.enter="toggle"
    >
      <template v-if="annotated">
        <LabelChip :label="{ name: annotation.label, color: labelColor }" />
        <span class="ann-card__meta">
          <span>{{ annotation.annotator }}</span>
          <StarRating :value="annotation.confidence" />
          <span v-if="annotation.metadata" class="ann-card__metadata">{{ annotation.metadata }}</span>
        </span>
        <span v-if="!documentLevel" class="ann-card__caret" aria-hidden="true">
          {{ collapsed ? "▸" : "▾" }}
        </span>
      </template>
      <span v-else class="ann-card__not-annotated">Not annotated</span>
    </div>
    <div v-if="!documentLevel && !collapsed" class="ann-card__text">{{ annotation.text }}</div>
  </div>
</template>

<style scoped>
.ann-card {
  border: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
  border-radius: 8px;
  margin-bottom: 0.5rem;
  overflow: hidden;
}
.ann-card__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  font: inherit;
  padding: 0.5rem 0.6rem;
  background: #fff;
  border: none;
  text-align: left;
}
.ann-card__header--clickable {
  cursor: pointer;
}
.ann-card__header--clickable:hover {
  background: rgba(0, 0, 0, 0.03);
}
.ann-card__meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--iaa-muted, #6b7280);
  overflow: hidden;
}
.ann-card__metadata {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ann-card__caret {
  margin-left: auto;
  color: var(--iaa-muted, #6b7280);
  font-size: 0.7rem;
  flex-shrink: 0;
}
.ann-card__not-annotated {
  font-size: 0.8rem;
  font-style: italic;
  color: var(--iaa-muted, #6b7280);
}
.ann-card__text {
  padding: 0.1rem 0.6rem 0.6rem;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.85rem;
}
</style>
