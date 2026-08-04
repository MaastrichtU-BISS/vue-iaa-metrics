<script setup lang="ts">
import { MetricsPage } from "../index";
import { mockSource } from "./mockSource";

const onError = (message: string) => alert(message);
const onOpenDocument = (doc: { id: string; name: string }) =>
  console.log("open-document", doc);
</script>

<template>
  <MetricsPage
    :source="mockSource"
    report-filename="demo_report.zip"
    @error="onError"
    @open-document="onOpenDocument"
  />
</template>
