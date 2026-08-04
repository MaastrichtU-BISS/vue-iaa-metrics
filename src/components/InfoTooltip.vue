<script setup lang="ts">
// Native title-attribute tooltips are unreliable (inconsistent delay, easy to
// dismiss by moving the mouse a pixel, sometimes just don't appear) - this is
// a plain CSS hover/focus bubble instead, so it's always visible on hover.
// placement="bottom" for icons near the top of a scroll container, where an
// upward-opening bubble would clip against that edge. align="start" for
// icons near the left edge, where a right-anchored (growing-left) bubble
// would clip against that edge instead.
const props = defineProps<{
  text: string;
  placement?: "top" | "bottom";
  align?: "start" | "end";
}>();
</script>

<template>
  <span class="info-tooltip" tabindex="0">
    <span class="info-tooltip__icon" aria-hidden="true">ⓘ</span>
    <span
      class="info-tooltip__bubble"
      :class="{
        'info-tooltip__bubble--bottom': props.placement === 'bottom',
        'info-tooltip__bubble--start': props.align === 'start',
      }"
      role="tooltip"
      >{{ text }}</span
    >
  </span>
</template>

<style scoped>
.info-tooltip {
  position: relative;
  display: inline-flex;
  cursor: help;
}
.info-tooltip__icon {
  color: var(--iaa-muted, #6b7280);
  font-size: 0.8rem;
}
.info-tooltip__bubble {
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.4rem);
  width: max-content;
  max-width: 12rem;
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  background: #1f2937;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 400;
  text-transform: none;
  letter-spacing: normal;
  line-height: 1.4;
  white-space: pre-line;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.12s ease;
  z-index: 30;
}
.info-tooltip__bubble--bottom {
  bottom: auto;
  top: calc(100% + 0.4rem);
}
.info-tooltip__bubble--start {
  right: auto;
  left: 0;
}
.info-tooltip:hover .info-tooltip__bubble,
.info-tooltip:focus .info-tooltip__bubble,
.info-tooltip:focus-visible .info-tooltip__bubble {
  opacity: 1;
  visibility: visible;
}
</style>
