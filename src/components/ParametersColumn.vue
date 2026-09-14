<script setup lang="ts">
import { computed } from "vue";
import type { DocumentOption, LabelOption } from "../types";
import FilterSelect from "./FilterSelect.vue";
import Toggle from "./Toggle.vue";
import InfoTooltip from "./InfoTooltip.vue";

const props = defineProps<{
  labelsOptions: LabelOption[];
  documentsOptions: DocumentOption[];
  annotatorsOptions: string[];
  /** Document-level tasks have no span text, so span-matching params don't apply. */
  documentLevel: boolean;
  /** Whether any filter is selected, i.e. metrics cover a subset of the task. */
  hasFilters: boolean;
  computingMetrics: boolean;
  downloading: boolean;
}>();

const emit = defineEmits<{ "compute-metrics": []; "download-all": [] }>();

const selectedLabels = defineModel<string[]>("selectedLabels", { required: true });
const selectedDocuments = defineModel<string[]>("selectedDocuments", { required: true });
const selectedAnnotators = defineModel<string[]>("selectedAnnotators", { required: true });
const criterion = defineModel<"exact" | "contained">("criterion", { required: true });
const granularity = defineModel<"char" | "word">("granularity", { required: true });

const labelFilterOptions = computed(() =>
  props.labelsOptions.map((l) => ({ value: l.name, label: l.name, color: l.color })),
);
const documentFilterOptions = computed(() =>
  props.documentsOptions.map((d) => ({ value: d.value, label: d.label })),
);
const annotatorFilterOptions = computed(() => props.annotatorsOptions.map((a) => ({ value: a, label: a })));

const containedToggle = computed({
  get: () => criterion.value === "contained",
  set: (v: boolean) => {
    criterion.value = v ? "contained" : "exact";
  },
});
const wordToggle = computed({
  get: () => granularity.value === "word",
  set: (v: boolean) => {
    granularity.value = v ? "word" : "char";
  },
});
</script>

<template>
  <div class="params">
    <section>
      <h4 class="params__title">
        Filter
        <InfoTooltip
          placement="bottom"
          align="start"
          text="Applies to both the annotation list and the computed metrics and report. Leave a filter empty to include everything."
        />
      </h4>
      <div class="params__field">
        <label class="params__label">Label(s)</label>
        <FilterSelect v-model="selectedLabels" :options="labelFilterOptions" placeholder="All" />
      </div>
      <div class="params__field">
        <label class="params__label">Document(s)</label>
        <FilterSelect v-model="selectedDocuments" :options="documentFilterOptions" placeholder="All" />
      </div>
      <div class="params__field">
        <label class="params__label">Annotator(s)</label>
        <FilterSelect v-model="selectedAnnotators" :options="annotatorFilterOptions" placeholder="All" />
      </div>
    </section>

    <hr class="params__divider" />

    <section>
      <h4 class="params__title">Agreement</h4>

      <div v-if="!documentLevel" class="params__toggles">
        <div class="params__toggle-row">
          <span class="params__toggle-label params__toggle-label--right">Character</span>
          <Toggle v-model="wordToggle" />
          <span class="params__toggle-label">Word</span>
          <InfoTooltip
            text="Coverage agreement (Krippendorff / Cohen's kappa) is computed over character or word units of the document text."
          />
        </div>
        <div class="params__toggle-row">
          <span class="params__toggle-label params__toggle-label--right">Exact</span>
          <Toggle v-model="containedToggle" />
          <span class="params__toggle-label">Contained</span>
          <InfoTooltip
            text="With 'Exact', span matching requires identical start/end offsets. With 'Contained', one span being fully inside the other counts as a match."
          />
        </div>
      </div>

      <button
        type="button"
        class="params__btn params__btn--primary"
        :disabled="computingMetrics"
        @click="emit('compute-metrics')"
      >
        Compute Metrics
      </button>
      <button
        type="button"
        class="params__btn params__btn--outline"
        :disabled="downloading"
        @click="emit('download-all')"
      >
        {{ hasFilters ? "Download Filtered" : "Download All" }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.params {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.85rem;
}
.params__title {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0 0 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--iaa-muted, #6b7280);
}
.params__field {
  margin-bottom: 0.6rem;
}
.params__label {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
}
.params__divider {
  border: none;
  border-top: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
  margin: 0;
}
.params__toggles {
  margin-bottom: 0.75rem;
}
.params__toggle-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.params__toggle-label {
  font-size: 0.82rem;
  font-weight: 600;
  min-width: 4.2rem;
}
.params__toggle-label--right {
  text-align: right;
}
.params__btn {
  display: block;
  width: 100%;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--iaa-accent, #1e4e79);
  cursor: pointer;
  margin-top: 0.5rem;
}
.params__btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.params__btn--primary {
  background: var(--iaa-accent, #1e4e79);
  color: #fff;
}
.params__btn--outline {
  background: transparent;
  color: var(--iaa-accent, #1e4e79);
}
</style>
