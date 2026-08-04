<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";

// In-app three-way confirm (Yes / No / dismiss) — used for the "anonymize
// annotators?" prompt before downloading a report.
defineProps<{
  title: string;
  message: string;
  yesLabel?: string;
  noLabel?: string;
}>();

const emit = defineEmits<{ yes: []; no: []; cancel: [] }>();

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") emit("cancel");
};
onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div class="confirm-modal__overlay" @click.self="emit('cancel')">
    <div class="confirm-modal" role="alertdialog" aria-modal="true" :aria-label="title">
      <h3 class="confirm-modal__title">{{ title }}</h3>
      <p class="confirm-modal__message">{{ message }}</p>
      <div class="confirm-modal__actions">
        <button class="confirm-modal__btn confirm-modal__btn--no" @click="emit('no')">
          {{ noLabel ?? "No" }}
        </button>
        <button class="confirm-modal__btn confirm-modal__btn--yes" autofocus @click="emit('yes')">
          {{ yesLabel ?? "Yes" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: system-ui, sans-serif;
}
.confirm-modal {
  background: #fff;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  max-width: 24rem;
  width: calc(100% - 2rem);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
}
.confirm-modal__title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #111;
}
.confirm-modal__message {
  margin: 0 0 1.25rem;
  font-size: 0.88rem;
  color: #4b5563;
  line-height: 1.4;
  white-space: pre-line;
}
.confirm-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.confirm-modal__btn {
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  border: 1px solid transparent;
}
.confirm-modal__btn--no {
  background: transparent;
  border-color: #d1d5db;
  color: #374151;
}
.confirm-modal__btn--yes {
  background: var(--iaa-accent, #1e4e79);
  color: #fff;
}
</style>
