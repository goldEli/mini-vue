<script setup lang="ts">
console.log("Hello world! child");
defineProps<{ count: number }>();
</script>
<template>
  <div>
    <h1>child:{{ count }}</h1>
  </div>
</template>
<style scoped>
.read-the-docs {
  color: #888;
}
</style>
