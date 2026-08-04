<script setup lang="ts">
// A plain two-state switch, replacing PrimeVue's ToggleSwitch.
const modelValue = defineModel<boolean>({ required: true });
</script>

<template>
  <button
    type="button"
    class="toggle"
    role="switch"
    :aria-checked="modelValue"
    :class="{ 'toggle--on': modelValue }"
    @click="modelValue = !modelValue"
  >
    <span class="toggle__knob" />
  </button>
</template>

<style scoped>
.toggle {
  position: relative;
  width: 2.2rem;
  height: 1.2rem;
  border-radius: 999px;
  border: none;
  background: var(--iaa-border, rgba(0, 0, 0, 0.15));
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.15s ease;
}
.toggle--on {
  background: var(--iaa-accent, #1e4e79);
}
.toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s ease;
}
.toggle--on .toggle__knob {
  transform: translateX(1rem);
}
</style>
