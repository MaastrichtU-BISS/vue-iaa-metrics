<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export type FilterOption = { value: string; label: string; color?: string };

// A searchable multi-select, replacing PrimeVue's Multiselect. An empty
// selection means "all" throughout the metrics page, so there's no explicit
// "select all" affordance — clearing back to empty means the same thing.
const props = defineProps<{
  options: FilterOption[];
  placeholder?: string;
}>();

const modelValue = defineModel<string[]>({ required: true });

const open = ref(false);
const query = ref("");
const root = ref<HTMLElement | null>(null);

const filtered = computed(() =>
  props.options.filter((o) => o.label.toLowerCase().includes(query.value.toLowerCase())),
);

const toggle = (value: string) => {
  const set = new Set(modelValue.value);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  modelValue.value = [...set];
};

const selectedOption = computed(() =>
  modelValue.value.length === 1
    ? props.options.find((o) => o.value === modelValue.value[0])
    : undefined,
);

const summary = computed(() => {
  if (!modelValue.value.length) return props.placeholder ?? "All";
  if (selectedOption.value) return selectedOption.value.label;
  return `${modelValue.value.length} items selected`;
});

const onClickOutside = (e: MouseEvent) => {
  if (open.value && root.value && !root.value.contains(e.target as Node)) {
    open.value = false;
  }
};
onMounted(() => document.addEventListener("click", onClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", onClickOutside));
</script>

<template>
  <div ref="root" class="filter-select">
    <button type="button" class="filter-select__control" @click="open = !open">
      <span v-if="selectedOption?.color" class="filter-select__swatch" :style="{ background: selectedOption.color }" />
      <span class="filter-select__summary" :class="{ 'filter-select__summary--placeholder': !modelValue.length }">
        {{ summary }}
      </span>
      <span class="filter-select__caret" aria-hidden="true">▾</span>
    </button>
    <div v-if="open" class="filter-select__panel">
      <input v-model="query" type="text" class="filter-select__filter" placeholder="Filter…" />
      <ul class="filter-select__options">
        <li
          v-for="o in filtered"
          :key="o.value"
          class="filter-select__option"
          @click="toggle(o.value)"
        >
          <input type="checkbox" :checked="modelValue.includes(o.value)" @click.stop="toggle(o.value)" />
          <span v-if="o.color" class="filter-select__swatch" :style="{ background: o.color }" />
          <span class="filter-select__option-label">{{ o.label }}</span>
        </li>
        <li v-if="!filtered.length" class="filter-select__empty">No matches</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.filter-select {
  position: relative;
  width: 100%;
}
.filter-select__control {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  font: inherit;
  font-size: 0.85rem;
  padding: 0.4rem 0.55rem;
  border: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.filter-select__summary {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.filter-select__summary--placeholder {
  color: var(--iaa-muted, #6b7280);
}
.filter-select__caret {
  color: var(--iaa-muted, #6b7280);
  font-size: 0.7rem;
}
.filter-select__swatch {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 3px;
  flex-shrink: 0;
}
.filter-select__panel {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 20;
  background: #fff;
  border: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  max-height: 16rem;
  display: flex;
  flex-direction: column;
}
.filter-select__filter {
  font: inherit;
  font-size: 0.82rem;
  padding: 0.4rem 0.55rem;
  border: none;
  border-bottom: 1px solid var(--iaa-border, rgba(0, 0, 0, 0.15));
}
.filter-select__filter:focus {
  outline: none;
}
.filter-select__options {
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  overflow-y: auto;
}
.filter-select__option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
}
.filter-select__option:hover {
  background: rgba(0, 0, 0, 0.05);
}
.filter-select__option-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.filter-select__empty {
  padding: 0.5rem;
  font-size: 0.8rem;
  color: var(--iaa-muted, #6b7280);
}
</style>
